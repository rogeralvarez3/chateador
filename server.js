const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const db = require("./db");
const fetch = require("node-fetch");
const fileUpload = require("express-fileupload");
const authServer = "http://coopefacsa.coop:3100";
const io = require("socket.io");

/*const credenciales = {
  key: fs.readFileSync("./certificados/server.key"),
  cert: fs.readFileSync("./certificados/server.crt"),
};*/
const app = express();
app.use("/fileUploads",express.static(path.resolve(__dirname,"fileUploads")))
app.use(express.static(path.resolve(__dirname,"dist")))
app.use(fileUpload({tempFileDir:'/temp',useTempFiles:false}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.get("/", (req, res) => {
  res.send(`<h1>SERVIDOR SEGURO FUNCIONANDO</h1>`);
});

let onlineUsers = [];

app.post("/uploadFile", (req, res) => {

  verificarToken(req.body.token, result => {
    if (result.id) {
      if (req.files) {
        let file = req.files.myFile;
        let newName = new Date().toLocaleString().replace(/:/g, '').replace(/-/g, '').replace(/ /g, '') + '___' + file.name
        let mypath = path.resolve(__dirname, 'fileUploads', newName);
        fs.writeFileSync(mypath, file.data)
        delete file.data
        file.link = `/fileUploads/${newName}`;
        res.send(file)
      }
    } else {
      res.send(result)
    }
  })

})
app.post("/deleteFile", (req, res) => {
  let data = req.body;
  let host = __dirname
  let mypath = path.join(host, data.link);
  verificarToken(data.token, (result) => {
    if (result.id) {
      fs.unlinkSync(mypath)
      res.send({ deleted: true, link: data.link })
    } else {
      res.send(result)
    }

  })

})
app.post("/getData", (req, res) => {
  let data = req.body
  let options = {
    method: 'post',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      token: data.token
    })
  }
  //console.log(data)
  fetch(`${authServer}/verify`, options)
    .then(res => { return res.json() })
    .then(json => {
      if (json.id) {
        db.list(data, result => {
          res.send(result)
        })
      }
    })
})
app.post("/getMessages", (req, res) => {
  let data = req.body

  let options = {
    method: 'post',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      token: data.token
    })
  }

  fetch(`${authServer}/verify`, options)
    .then(res => { return res.json() })
    .then(json => {
      if (json.id) {
        data.tabla = "mensajes";
        data.condición = `((\`from\`=${json.id} or \`to\`=${json.id}) and userType=0) or (find_in_set(\`to\`,'${data.salas}')>=0 && userType=1)`
        db.list(data, result => {
         res.send(result)
        })
      }
    })
})
app.post("/mensaje", (req, res) => {
  let data = req.body;
  data.tabla="mensajes";
  db.save(data, (result) => {
    if (!result.errno) {
      if (data.data.userType == 0) {
        let userFilter = onlineUsers.filter(u=>{return u.userId==data.data.to || u.userId==data.data.from})
        userFilter.forEach(user=>{socketServer.to(user.socketId).emit("mensaje",data.data);console.log("enviando mensaje a "+user.userName)})
      }else{
        //console.log("es una sala")
        let params={tabla:'salas',condición:`id=${data.data.to}`}
        db.list(params,(result)=>{
          if(result.errno){console.log(result);return;}
          if(result.length==0){return;}
          let usersInRoom = result[0].integrantes
          if(usersInRoom=='*'){
            socketServer.emit("mensaje",data.data)
          }else{
            onlineUsers.forEach(user=>{
              if(usersInRoom.split(",").includes(user.userId.toString())){
                socketServer.to(user.socketId).emit("mensaje",data.data);console.log("enviando mensaje a "+user.userName)
              }
            })
          }
        })
      }

    }
    res.send(result);
  });
});

let httpServer = app.listen("3000",()=>{
  console.log("servidor seguro corriendo en el puerto 3000");

});


const socketServer = require("socket.io")(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});
socketServer.on("connection",client=>{
  let userId = client.handshake.query.userId;
  let userName = client.handshake.query.userName;
  let browserId = client.handshake.query.browserId;
  if(userId){
    //console.log("se ha conectado el usuario "+userName+" con id "+userId+"socketId "+client.id +" y browser "+browserId);
    let idx = onlineUsers.findIndex(u=>{return u.userId==userId && u.browserId==browserId});
    if(idx>=0){
      onlineUsers[idx].socket=client;
    }else{
      onlineUsers.push({userId:client.handshake.query.userId,socketId:client.id,browserId:browserId,userName:userName})
    }
  }
  
})

function verificarToken(token, handler) {
  let options = {
    method: 'post',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      token: token
    })
  }
  fetch(`${authServer}/verify`, options)
    .then(res => { return res.json() })
    .then(json => {
      handler(json)
    })
}
