const path = require("path")

module.exports = {
  mode: "production",
  entry: "./extension.js", // Your main entry point
  target: "node", // Target node because VS Code extensions run in a Node.js context
  resolve: {
    extensions: [".js"], // Resolve JavaScript files
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"], // Transpile to compatible JavaScript
          },
        },
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, "out"),
    filename: "extension.js", // The bundled output file
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: "../[resource-path]",
  },
  externals: {
    vscode: "commonjs vscode", // Tells Webpack not to bundle the 'vscode' module
  },
  devtool: "source-map", // Enable sourcemaps for debugging
}
