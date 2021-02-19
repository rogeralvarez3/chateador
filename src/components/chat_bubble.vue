<template>
  <div class="flex pa-4 pt-3 pb-3">
    <v-layout row class="bubble-inner" :class="`${colors[msg.to!=$store.state.user.id?0:1]}--text`">
      <div width="24" v-if="true">
        <v-avatar width="24" height="24" min-width="24"
          ><img
            :src="user.imagen ? user.imagen : $store.state.defaultUserImage"
            :alt="user.nombre"
        /></v-avatar>
      </div>
      <div
        v-html="msg.texto.replace(/\n/g, '<br>')"
        :class="msg.to!=$store.state.user.id ? 'bold ml-2' : 'ml-2'"
      >
      </div>
      <div v-if="msg.files.length>0" style="margin-left:-50px">
        <br>
        <ul>
          <li v-for="(file,i) in msg.files.length>0?JSON.parse(msg.files):[]" :key="i" >
            <a target="_blank" :href="`${$store.state.server+file.link}`" :download="file.name" v-text="file.name" ></a>
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
  display:inline-flex;border-radius:10px;background: #eeeeee;padding:4px;padding-right: 10px;padding-left: 4px !important;font-size: 14px;box-shadow: 0 1px 5px rgb(49, 49, 49);
}
</style>