<template>
  <v-app>
    <v-app-bar color="primary" app clipped-left dark>
      <v-app-bar-nav-icon
        v-if="!drawer"
        @click="drawer = true"
      ></v-app-bar-nav-icon>
      <v-app-bar-title>CHATEADOR</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-menu offset-y open-on-hover>
        <template v-slot:activator="{ on, attrs }">
          <v-avatar
            class="elevation-3"
            width="42"
            height="42"
            v-on="on"
            v-bind="attrs"
          >
            <img
              width="42"
              height="42"
              :src="
                $store.state.user.imagen
                  ? $store.state.user.imagen
                  : $store.state.defaultUserImage
              "
              :alt="$store.state.user.nombre"
            />
          </v-avatar>
        </template>
        <v-card>
          <v-card-title class="pa-0 pl-2 pr-2 grey lighten-4">
            {{ $store.state.user.nombre }}
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-0">
            <table width="400">
              <tr>
                <td colspan="2">
                  <img
                    width="380"
                    height="280"
                    :src="
                      $store.state.user.imagen
                        ? $store.state.user.imagen
                        : $store.state.defaultUserImage
                    "
                  />
                </td>
              </tr>
              <tr v-for="item in Object.keys(userInfo)" :key="item">
                <th class="text-left pl-2" v-text="item"></th>
                <td
                  class="pr-2"
                  v-html="
                    item.toString().toLowerCase() == 'correo'
                      ? `<a href=mailto:'${userInfo[item]}'>${userInfo[item]}</a>`
                      : userInfo[item]
                  "
                ></td>
              </tr>
            </table>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="msgbox('Hola')"
              >Cambiar imagen</v-btn
            >
            <v-btn color="warning" @click="logout()">Cerrar sesión</v-btn>
          </v-card-actions>
        </v-card>
      </v-menu>
      <v-btn
        v-if="isElectron()"
        fab
        small
        dark
        color="error"
        @click="salir()"
        class="ml-1"
        ><v-icon>mdi-exit-run</v-icon>
      </v-btn>
    </v-app-bar>
    <v-navigation-drawer width="300" app clipped v-model="drawer">
      <v-list dense>
        <v-list-item>
          <v-row>
            <h3>USUARIOS Y SALAS</h3>
            <v-spacer></v-spacer>
            <v-btn fab small dark color="success" @click="dlgNewRoom = true"
              ><v-icon>mdi-account-multiple-plus</v-icon></v-btn
            >
          </v-row>
        </v-list-item>

        <v-list-item>
          <v-text-field
            dense
            hide-details
            outlined
            placeholder="Buscar..."
            prepend-inner-icon="mdi-magnify"
            v-model="buscar"
          ></v-text-field>
        </v-list-item>
        <v-list-item
          v-for="(sala, i) in salas"
          :key="'sala' + i"
          @click="
            sala.userType = 1;
            setTo(sala);
          "
        >
          <v-list-item-icon
            ><v-img
              width="32"
              height="32"
              :src="sala.imagen ? sala.imagen : $store.state.defaultRoomImage"
              :alt="sala.nombre"
            />
          </v-list-item-icon>
          <v-list-item-title>{{ `Sala ${sala.nombre}` }}</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-for="(item, i) in usuarios"
          :key="i"
          @click="
            item.userType = 0;
            setTo(item);
          "
        >
          <v-list-item-icon>
            <v-img
              width="32"
              height="32"
              :src="item.imagen ? item.imagen : $store.state.defaultUserImage"
              :alt="item.nombre"
            />
          </v-list-item-icon>
          <v-list-item-title
            :class="item.online ? 'blue--text' : 'grey--text'"
            >{{ item.nombre }}</v-list-item-title
          >
          <v-badge
            color="primary"
            v-if="
              $store.state.mensajes.filter((m) => {
                return m.from == item.id && !m.estado && m.userType == 0;
              }).length > 0
            "
            :content="
              $store.state.mensajes.filter((m) => {
                return m.from == item.id && !m.estado && m.userType == 0;
              }).length
            "
          ></v-badge>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-main class="fullHeight">
      <v-container class="fullHeight">
        <chat :to="to" v-if="to.id" v-on:cerrar="cerrarChat()" />
      </v-container>
    </v-main>
    <v-dialog v-model="dlgLogin" persistent width="500">
      <iframe id="login" width="100%" height="500"></iframe>
    </v-dialog>
    <v-dialog width="500" v-model="dlgNewRoom">
      <new-room v-on:cerrar="dlgNewRoom = false" />
    </v-dialog>
  </v-app>
</template>

<script>
import Chat from "./components/chat.vue";
import io from "socket.io/client-dist/socket.io";
import NewRoom from "./views/newRoom";
export default {
  name: "App",
  components: {
    Chat,
    NewRoom,
  },
  data: () => ({
    dlgLogin: true,
    dlgNewRoom: false,
    buscar: "",
    to: {},
    drawer: undefined,
    socketIo: null,
  }),
  methods: {
    login: function (handler) {
      let mv = this;
      let remoteUrl = "http://coopefacsa.coop:3100";
      let iframe = document.getElementById("login");
      iframe.setAttribute("src", remoteUrl);
      iframe.addEventListener("load", () => {
        iframe.contentWindow.postMessage("loaded", remoteUrl);
      });
      window.addEventListener("message", (e) => {
        if (e.origin != remoteUrl) {
          return;
        }
        mv.dlgLogin = false;
        handler(e.data);
      });
    },
    initData: function (user) {
      let mv = this;
      let data = { variable: "user", data: user };
      mv.$store.commit("setVar", data);
      mv.$store.dispatch("getUsers", (users) => {
        let urlParams = new URL(document.location).searchParams;
        let to = urlParams.get("to");
        let type = urlParams.get("type");
        if (to && users.length > 0 && type == 0) {
          let idx = users.findIndex((u) => {
            return u.id == to;
          });
          mv.to = users[idx];
          mv.to.userType = 0;
        }
        mv.$store.dispatch("getSalas", (rooms) => {
          let urlParams = new URL(document.location).searchParams;
          let to = urlParams.get("to");
          let type = urlParams.get("type");
          if (to && rooms.length > 0 && type == 1) {
            let idz = rooms.findIndex((s) => {
              return s.id == to;
            });
            mv.to = mv.$store.state.salas[idz];
            mv.to.userType = 1;
          }
          mv.$store.dispatch("getMessages");
        });
      });
    },
    setTo: function (user) {
      let mv = this;
      mv.to = user;
      mv.$store.state.socketIo.emit("mensajesLeidos", {
        from: user.id,
        to: mv.$store.state.user.id,
        userType: user.userType,
      });
      let currentUser = new URL(document.location).searchParams.get("to");
      let type = new URL(document.location).searchParams.get("type");
      if (user.id != currentUser || user.userType != type) {
        let ruta =
          mv.$router.history.current.path +
          "?to=" +
          user.id +
          "&type=" +
          user.userType;
        mv.$router.push(ruta).catch(() => {});
      }
    },
    cerrarChat: function () {
      this.to = {};
      window.history.pushState({}, document.title, "/");
    },
    logout: function () {
      let mv = this;
      let remoteUrl = "http://coopefacsa.coop:3100";
      let iframe = document.getElementById("login");
      iframe.contentWindow.postMessage("signOut", remoteUrl);
      localStorage.clear();
      mv.$store.commit("setVar", { variable: "user", valor: { id: 0 } });
      mv.$store.commit("setVar", { variable: "usuarios", valor: [] });
      mv.$store.commit("setVar", { variable: "mensajes", valor: [] });
      mv.$store.commit("setVar", { variable: "salas", valor: [] });
      mv.dlgLogin = true;
      //localStorage.removeItem("browserId");
    },
    salir: function () {
      if (window.ipcRenderer) {
        window.ipcRenderer.send("minimizar");
      } else {
        console.log("no hay ipcRenderer");
      }
    },
    openChat: function (data) {
      let mv = this;
      let user = {};
      if (data.msg.userType == 0) {
        user = mv.$store.state.usuarios.filter((u) => {
          return (u.id = data.msg.from);
        })[0];
        user.userType = 0;
      } else {
        user = mv.$store.state.salas.filter((s) => {
          return s.id == data.msg.to;
        })[0];
        user.userType = 1;
      }
      mv.setTo(user);
    },
    isElectron: function () {
      if (window.ipcRenderer) {
        return true;
      } else {
        return false;
      }
    },
  },
  computed: {
    usuarios: function () {
      let mv = this;
      return mv.$store.state.usuarios.filter((u) => {
        return (
          u.id != mv.$store.state.user.id &&
          u.nombre
            .toString()
            .toLowerCase()
            .indexOf(mv.buscar.toString().trim().toLowerCase()) >= 0 &&
          u.activo == 0
        );
      });
    },
    salas: function () {
      let mv = this;
      return mv.$store.state.salas.filter((s) => {
        return (
          s.nombre
            .toString()
            .toLowerCase()
            .indexOf(mv.buscar.toString().trim().toLowerCase()) >= 0
        );
      });
    },
    userInfo: function () {
      let mv = this;
      let u = mv.$store.state.user;
      let result = {
        Dirección: u.dirección,
        Correo: u.correo,
        Teléfono: u.teléfono,
      };
      return result;
    },
  },
  mounted: function () {
    let mv = this;
    mv.login((res) => {
      let user = JSON.parse(res);
      mv.initData(user);
      let browserId = localStorage.getItem("browserId");
      if (!browserId) {
        browserId = (new Date().toLocaleString() + Math.random(100)).replace(
          /[/ ,:.]/g,
          ""
        );
        localStorage.setItem("browserId", browserId);
      }
      let socketIo = io(mv.$store.state.server, { reconnect: true });
      socketIo.emit("updateUserData", {
        userId: user.id,
        userName: user.nombre,
        browserId: browserId,
      });
      socketIo.on("requestUserData", () => {
        socketIo.emit("updateUserData", {
          userId: user.id,
          userName: user.nombre,
          browserId: browserId,
        });
      });
      socketIo.on("mensaje", (data) => {
        console.log(data);
        if (mv.to.id == data.from) {
          socketIo.emit("mensajesLeidos", { from: data.from, to: data.to });
        }
        mv.$store.commit("addMessage", data);
        if (window.ipcRenderer && data.from != mv.$store.state.user.id) {
          let grupo = data.userType == 0 ? "usuarios" : "salas";
          let user = mv.$store.state[grupo].findIndex((u) => {
            return data.from == u.id;
          });
          let notifyOptions = {
            title: mv.$store.state[grupo][user].nombre,
            body: data.texto,
            msg: data,
          };
          console.log(notifyOptions);
          window.ipcRenderer.send("mensaje", notifyOptions);
          window.ipcRenderer.on("openChat", (event, args) => {
            console.log(event);
            mv.openChat(args);
          });
        }
      });
      socketIo.on("mensajesLeidos", (data) => {
        //console.log("se leyeron los mensajes de ",data)
        mv.$store.commit("mensajesLeidos", data);
      });
      socketIo.on("error", (data) => {
        console.log(data);
      });
      socketIo.on("cambiarEstadoDeUsuarios", (data) => {
        mv.$store.commit("updateUser", data);
      });
      socketIo.on("onlineUsers", (data) => {
        mv.$store.state.usuarios.forEach((u) => {
          if (data.includes(u.id)) {
            mv.$store.commit("updateUser", { id: u.id, online: true });
          }
        });
      });
      mv.$store.commit("setVar", { variable: "socketIo", data: socketIo });
    });
  },
};
</script>
<style scoped>
th {
  vertical-align: text-top !important;
}
iframe {
  border: 0;
}
.fullHeight {
  height: 100%;
}
.online {
  border: 4px solid rgb(109, 255, 109);
}
</style>
