<template>
  <div class="flex pa-4 pt-3 pb-4">
    <v-layout
      class="bubble-inner"
      :class="`${colors[msg.to != $store.state.user.id ? 0 : 1]}--text`"
    >
      <v-layout row class="pa-2 pt-3 pl-3">
        <v-avatar width="22" height="22" min-width="22"
          ><img
            :src="user.imagen ? user.imagen : $store.state.defaultUserImage"
            :alt="user.nombre"
        /></v-avatar>
        <span class="small-text">{{
          `--> ${
            user.id != $store.state.user.id ? user.nombre : "Tu"
          } - ${new Date(msg.fecha).toLocaleString()}`
        }}</span>
      </v-layout>
      <div
        v-if="msg.to != $store.state.user.id && msg.userType==0"
        v-html="
          `<div class='layout row ml-4 mt-1 mb-1'>${msg.texto.replace(
            /\n/g,
            '<br>'
          )}<i class='v-icon mdi mdi-check-all ml-2' style='${
            msg.estado > 0
              ? 'color:#1e90ff;float:right;font-size:12px'
              : 'color:grey;float:right;font-size:12px'
          }'></i></div>`
        "
        :class="msg.to != $store.state.user.id ? 'bold ml-2' : 'ml-2'"
      ></div>
      <div
        v-else
        v-html="
          `<div class='layout row ml-4 mt-1 mb-1'>${msg.texto.replace(
            /\n/g,
            '<br>'
          )}</div>`
        "
        :class="msg.to != $store.state.user.id ? 'bold ml-2' : 'ml-2'"
      ></div>
      <div v-if="JSON.parse(msg.files).length > 0" class="pa-1">
        <ul>
          <li
            v-for="(file, i) in msg.files.length > 0
              ? JSON.parse(msg.files)
              : []"
            :key="i"
          >
            <a
              target="_blank"
              :href="`${$store.state.server + file.link}`"
              :download="file.name"
              v-text="file.name"
            ></a>
          </li>
        </ul>
      </div>
      <!--<div width="40" v-if="msg.to==$store.state.user.id">{{ user.imagen }}</div>-->
    </v-layout>
  </div>
</template>

<script>
export default {
  props: {
    colors: Array,
    msg: Object,
  },
  computed: {
    user: function () {
      let mv = this;
      let idx = mv.$store.state.usuarios.findIndex((u) => {
        return u.id == mv.msg.from;
      });
      return mv.$store.state.usuarios[idx];
    },
  },
};
</script>

<style scoped>
.bold {
  font-weight: bold !important;
}
.bubble-inner {
  display: inline-block;
  border-radius: 10px;
  background: #eeeeee;
  padding: 4px;
  padding-right: 10px;
  padding-left: 4px !important;
  font-size: 14px;
  box-shadow: 0 1px 5px rgb(49, 49, 49);
}
.small-text {
  font-size: 9px;
  color: gray;
}
</style>
