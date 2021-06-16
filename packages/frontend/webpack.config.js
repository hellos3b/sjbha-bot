const path = require("path");
const HTMLPlugin = require("html-webpack-plugin");

const __www = path.resolve(__dirname, "webpack")

// Webpack config
module.exports = {
  entry: path.resolve(__dirname, '@frontend/router.ts'),
  devtool: "inline-source-map",
  
  output: {
    path: path.resolve(__dirname, 'public'),
    publicPath: "/",
    filename: '[name].js'
  },

  plugins: [
    new HTMLPlugin()
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