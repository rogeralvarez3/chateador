const mysql = require("mysql");
const options = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "Cc123456@",
  database: "chat"
};
const connection = mysql.createConnection(options);
connection.on("error", () => {
  connection.connect(options);
});

const list = (data, handler) => {
  if (!data.campos) {
    data.campos = "*";
  }
  let sql = `select ${data.campos} from ${data.tabla} ${
    data.condición ? "where " + data.condición : ""
  }`;
  data.tabla=="salas"?console.log(sql):()=>{}
  connection.query(sql, (err, rows) => {
    if (err) {
      handler(err);
    } else {
      handler(rows);
    }
  });
};

const save = (data, handler) => {
  let sql = ``;
  if ( data.data.id > 0 || data.condición ) {
    let updateParams = [];
    Object.keys(data.data).forEach(key => {
      if (key != "id") {
        updateParams.push(`\`${key}\`='${data.data[key]}'`);
      }
    });
    sql = `update ${data.tabla} set ${updateParams.join(",")} where ${data.data.id>0?'id = \''+
      data.data.id+'\'':data.condición};`;
  } else {
    delete data.data.id;
    let keys = `\`${Object.keys(data.data).join("`,`")}\``;
    let values = `'${Object.values(data.data).join("','")}'`;
    sql = `insert into ${data.tabla} (${keys}) values(${values});`;
  }
  connection.query(sql, (err, rows) => {
    if (err) {
      handler(err);
    } else {
      handler(rows);
    }
  });
};


const remove = (data, handler) => {
  let sql = `delete from ${data.tabla} where ${data.condición};`;
  connection.query(sql, (err, result) => {
    if (err) {
      handler(err);
    } else {
      handler(result);
    }
  });
};

module.exports = { list, save, remove };
