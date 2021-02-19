const path = require("path")
module.exports = {
  transpileDependencies: ["vuetify"],
  configureWebpack:{
    target:"electron-renderer"
  }
      
};
