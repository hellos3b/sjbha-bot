const path = require("path");
const HTMLPlugin = require("html-webpack-plugin");

const __www = path.resolve(__dirname, "webpack")

// Load the config, and create a hashmap of all the entry files 
const frontends = require("./@app/webpack-bundle");
const entry = {};
frontends.forEach(module => {
  entry[module.name] = module.entry;
});

// Webpack config
module.exports = {
  entry,
  devtool: "cheap-source-map",
  
  output: {
    path: path.resolve(__dirname, 'build/public'),
    filename: '[id].js'
  },

  plugins: [
    new HTMLPlugin({
      template: path.resolve(__www, "index.html")
    })
  ],

  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.md$/i,
        use: 'raw-loader',
      }
    ]
  },

  resolve: {
    extensions: ['.ts', '.tsx']
  }
  
}