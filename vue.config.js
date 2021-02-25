module.exports = {
  transpileDependencies: ["vuetify"],
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        appId:"coop.coopefacsa.chatx",
        extends:null,
        win:{
          target:"msi",
          icon:"public/favicon.ico"
        }
      },
      preload: "src/preload.js", // this one
    }
  }
};
