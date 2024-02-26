const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = (env, argv) => ({
  mode: "development",
  target: "node",
  devtool: false,
  entry: "./src/index.js",
  output: {
    filename: "injector.js",
    path: path.resolve(__dirname, "..", "dist")
  },
  externals: {
    electron: `require("electron")`,
    fs: `require("fs")`,
    path: `require("path")`,
    request: `require("request")`,
    events: `require("events")`,
    rimraf: `require("rimraf")`,
    yauzl: `require("yauzl")`,
    mkdirp: `require("mkdirp")`,
    module: `require("module")`,
    child_process: `require("child_process")`,
  },
  resolve: {
    extensions: [".js"],
    alias: {
      common: path.resolve(__dirname, "..", "common")
    }
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {drop_debugger: false},
          keep_classnames: true
        }
      })
    ]
  }
});