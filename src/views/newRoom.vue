<template>
  <v-card>
    <v-card-title class="grey lighten-4 pa-0 pl-2 pr-2">
      Agregar sala
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <v-flex>
        <v-text-field
          label="Nombre de la sala"
          v-model="sala.nombre"
        ></v-text-field>
        <v-layout row class="mb-2">
          <span>Imagen:</span>
          <img
            :src="sala.imagen"
            alt="Click para cambiar imagen"
            width="100"
            height="100"
            class="elevation-2 ml-2 mr-2"
            @click="selectImg()"
            style="cursor: pointer"
          />
          <div>Seleccionados: {{ sala.integrantes.length }}</div>
        </v-layout>
        <v-simple-table
          dense
          fixed-header
          height="200"
          class="elevation-2 mt-2"
        >
          <thead>
            <tr>
              <th></th>
              <th></th>
              <th>Nombre</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(usuario, i) in $store.state.usuarios"
              :key="i"
              @click="agregarIntegrante(usuario)"
            >
              <td>
                <input
                  type="checkbox"
                  :checked="
                    sala.integrantes.findIndex((u) => {
                      return u.id == usuario.id;
                    }) >= 0
                      ? true
                      : false
                  "
                />
              </td>
              <td>
                <v-avatar width="22" height="22"
                  ><img
                    :src="
                      usuario.imagen
                        ? usuario.imagen
                        : $store.state.defaultUserImage
                    "
                /></v-avatar>
              </td>
              <td v-text="usuario.nombre"></td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-flex>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="primary" @click="save()">Guardar</v-btn>
      <v-btn @click="$emit('cerrar')">Cancelar</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  data() {
    return {
      sala: { nombre: "", imagen: "", integrantes: [], creada_por: 0 },
    };
  },
  methods: {
    save: function () {
      let mv = this;
      let data = Object.assign({}, mv.sala);
      data.integrantes = data.integrantes
        .map((i) => {
          return i.id;
        })
        .join(",");
      let options = {
        method: "post",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      };
      fetch(`${mv.$store.state.server}/addRoom`, options)
        .then((res) => {
          return res.json();
        })
        .then((json) => {
          console.log(json);
          //if(json.errno)return;
        });
    },
    agregarIntegrante: function (usuario) {
      let mv = this;
      let idx = mv.sala.integrantes.findIndex((u) => {
        return u.id == usuario.id;
      });
      if (idx >= 0) {
        mv.quitarIntegrante(usuario.id);
      } else {
        mv.sala.integrantes.push(usuario);
      }
    },
    quitarIntegrante: function (id) {
      let mv = this;
      let idx = mv.sala.integrantes.findIndex((item) => {
        return item.id == id;
      });
      if (idx >= 0) {
        mv.sala.integrantes.splice(idx, 1);
      }
    },
    selectImg: function () {
      let mv = this;
      let input = document.createElement("input");
      input.setAttribute("type", "file");
      input.setAttribute("accept", "image/jpg, image/png, image/bmp");
      input.setAttribute("multiple", "false");
      input.onchange = (e) => {
        let files = e.target.files;
        if (files) {
          let rdr = new FileReader();
          rdr.onload = () => {
            let img = new Image();
            img.onload = () => {
              let canvas = document.createElement("canvas");
              let ctx = canvas.getContext("2d");
              canvas.width = 128;
              canvas.height = 128;
              ctx.drawImage(img, 0, 0, 128, 128);
              mv.sala.imagen = canvas.toDataURL();
            };
            img.src = rdr.result;
          };
          rdr.readAsDataURL(files[0]);
        }
      };
      input.click();
    },
  },
};
</script>

<style scoped>
.selected {
  background-color: dodgerblue;
}
tr {
  cursor: pointer;
}
</style>
