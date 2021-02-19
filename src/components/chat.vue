<template>
  <v-card :height="cardHeight">
    <v-card-title class="grey lighten-4 pa-1 pl-2 pr-2">
      <v-menu offset-x open-on-hover>
        <template v-slot:activator="{ on }">
          <v-avatar class="mr-2" v-on="on"
            ><v-img
              :src="
                to.userType == 0
                  ? to.imagen
                    ? to.imagen
                    : $store.state.defaultUserImage
                  : to.imagen
                  ? to.imagen
                  : $store.state.defaultRoomImage
              "
              :alt="to.nombre"
          /></v-avatar>
        </template>
        <v-card width="330">
          <v-card-title class="pa-0 pl-2 pr-2 grey lighten-4"
            ><h5>{{ to.nombre }}</h5></v-card-title
          >
          <v-divider></v-divider>
          <v-card-text>
            <table>
              <tr>
                <td colspan="2" class="text-center">
                  <v-img
                    width="280"
                    height="280"
                    :src="
                      to.type == 0
                        ? to.imagen
                          ? to.imagen
                          : $store.state.defaultUserImage
                        : to.imagen
                        ? to.imagen
                        : $store.state.defaultRoomImage
                    "
                  ></v-img>
                </td>
              </tr>
              <tr class="text-left pt-1">
                <th>Dirección:</th>
                <td>{{ to.dirección }}</td>
              </tr>
              <tr class="text-left">
                <th>Correo:</th>
                <td>{{ to.correo }}</td>
              </tr>
              <tr class="text-left">
                <th>Teléfono:</th>
                <td>{{ to.teléfono }}</td>
              </tr>
            </table>
          </v-card-text>
        </v-card>
      </v-menu>
      {{ to.userType == 0 ? to.nombre : `Sala ${to.nombre}` }}<v-spacer></v-spacer>
      <v-btn fab dark small color="error" @click="$emit('cerrar')"
        ><v-icon>mdi-close</v-icon></v-btn
      ></v-card-title
    >
    <v-divider></v-divider>
    <v-card-text>
      <div
        :style="`height:${cardTextHeight}px;overflow-y:auto;scroll-top:${cardTextHeight}px;`"
        id="chatWindow"
      >
        <div>
          <chat-bubble
            v-for="(m, i) in msgs"
            :key="i"
            :colors="['red', 'blue']"
            :msg="m"
          />
        </div>
      </div>
    </v-card-text>
    <v-divider></v-divider>
    <v-card-actions class="grey lighten-4" height="90">
      <v-row class="pa-4">
        <v-textarea
          ref="textChat"
          no-resize
          outlined
          dense
          hide-details
          height="75"
          placeholder="Escriba aquí el mensaje"
          append-icon="mdi-send"
          @click:append="
            $store.commit('addMessage', {
              userType: 0,
              user: $store.state.user.id,
              text: msg,
              to: to.id,
            });
            msg = '';
            $forceUpdate;
          "
          v-model="msg"
          @keydown.enter.prevent="send"
        ></v-textarea>
        <v-card
          :loading="fileUploadLoading"
          class="ml-1"
          width="400"
          v-if="files.length > 0"
        >
          <v-card-text class="pa-0">
            <v-simple-table dense height="75" style="overflow-y: scroll">
              <tbody>
                <tr v-for="(file, i) in files" :key="i">
                  <td v-text="file.name"></td>
                  <td>
                    <v-btn small text color="red" @click="removeFile(file)"
                      ><v-icon small>mdi-close</v-icon></v-btn
                    >
                  </td>
                </tr>
              </tbody>
            </v-simple-table>
          </v-card-text>
        </v-card>

        <div>
          <div>
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <v-btn
                  icon
                  small
                  class="ml-1"
                  color="primary"
                  v-on="on"
                  @click="$refs.inputFile.click()"
                  ><v-icon>mdi-paperclip</v-icon></v-btn
                >
              </template>
              <span>Adjuntar archivo</span>
            </v-tooltip>
            <v-menu offset-y open-on-hover :close-on-content-click="false" top>
              <template v-slot:activator="{ on }">
                <v-btn icon color="warning" small v-on="on" class="ml-1"
                  ><v-icon>mdi-face</v-icon></v-btn
                >
              </template>
              <v-emoji-picker
                :i18n="i18n"
                @select="insertarEmoji"
              ></v-emoji-picker>
            </v-menu>
          </div>
        </div>
      </v-row>
    </v-card-actions>
    <input
      type="file"
      style="display: none"
      ref="inputFile"
      id="inputFile"
      multiple="false"
      @change="uploadFile"
    />
  </v-card>
</template>

<script>
import { VEmojiPicker } from "v-emoji-picker";
import ChatBubble from "./chat_bubble.vue";
export default {
  components: { VEmojiPicker, ChatBubble },
  props: {
    to: Object,
  },
  data() {
    return {
      msg: "",
      i18n: {
        search: "Buscar...",
        categories: {
          Activity: "Atividades",
          Flags: "Bandeiras",
          Foods: "Comida",
          Frequently: "Frequentes",
          Objects: "Objetos",
          Nature: "Natureza",
          Peoples: "Pessoas",
          Symbols: "Símbolos",
          Places: "Locais",
        },
      },
      cardHeight: "100%",
      cardTextHeight: "",
      scrollHeight: 0,
      files: [],
      fileUploadLoading: false,
    };
  },
  watch: {
    to() {
      this.msg = "";
    },
  },
  methods: {
    removeFile: function (file) {
      let mv = this;
      let options = {
        method: "post",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: mv.$store.state.user.token,
          link: file.link,
        }),
      };
      fetch(`${mv.$store.state.server}/deleteFile`, options)
        .then((res) => {
          return res.json();
        })
        .then((json) => {
          if (json.deleted) {
            let idx = mv.files.findIndex((f) => {
              return f.link == json.link;
            });
            mv.files.splice(idx, 1);
          }
        });
    },
    uploadFile: function (e) {
      let mv = this;
      mv.fileUploadLoading = true;
      if (e.target.files) {
        let formData = new FormData();
        formData.append("myFile", e.target.files[0]);
        formData.append("token", mv.$store.state.user.token);
        let options = {
          method: "post",
          body: formData,
        };
        fetch(`${mv.$store.state.server}/uploadFile`, options)
          .then((res) => {
            return res.json();
          })
          .then((json) => {
            if (json.link) {
              mv.files.push(json);
              document.getElementById("inputFile").value = "";
              mv.$refs.textChat.focus()
            }
          });
        mv.fileUploadLoading = false;
      }
    },
    insertarEmoji(emoji) {
      this.msg += emoji.data;
    },
    send: function (e) {
      let mv = this;
      if (e.ctrlKey) {
        mv.msg += "\n";
        e.pre;
      } else {
        if(mv.msg.toString().trim().length==0 && mv.files.length==0){return;}
        let data ={
              to: mv.to.id,
              from: mv.$store.state.user.id,
              texto: mv.msg,
              files: JSON.stringify(mv.files),
              userType: mv.to.userType,
            }
        let options = {
          method: "post",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            token: mv.$store.state.user.token,
            data: data,
          }),
        };
        fetch(`${mv.$store.state.server}/mensaje`, options)
          .then((res) => {
            return res.json;
          })
          
        mv.msg = "";
        mv.files=[]
        mv.$forceUpdate;
      }
    },
    updateScroll: function () {
      let chatWindow = document.getElementById("chatWindow");
      chatWindow.scrollTop = chatWindow.scrollHeight;
    },
  },
  computed: {
    msgs: function () {
      let mv = this;
      return mv.$store.state.mensajes.filter((m) => {
        if(mv.to.userType == 0){
          return (m.to == mv.to.id && m.from==mv.$store.state.user.id) || (m.from==mv.to.id && m.to==mv.$store.state.user.id);
        }else{
          return m.to==mv.to.id && m.userType==mv.to.userType
        }
        
      });
    },
  },
  updated: function () {
    this.updateScroll();
  },
  mounted: function () {
    let mv = this;
    mv.cardTextHeight = window.innerHeight - 272;
    window.onresize = () => {
      mv.cardTextHeight = window.innerHeight - 272;
      mv.updateScroll();
    };
  },
};
</script>

<style scoped>
</style>