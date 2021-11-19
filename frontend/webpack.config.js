const path = require ('path');
const HTMLPlugin = require ('html-webpack-plugin');
const sveltePreprocess = require("svelte-preprocess");
const { readdirSync, statSync } = require('fs');
const { DefinePlugin } = require('webpack');

// This is the sub path that github uses
const PUBLIC_PATH = '/sjbha-bot/';

const pagesRoot = path.join(__dirname, 'src', 'pages');
const Pages = readdirSync (pagesRoot)
  .filter (file => statSync(pagesRoot +'/' + file).isDirectory());

module.exports = (_, argv) => {
  return {
    entry:   {
      home: './src/home/index.js',

      // Dynamically create a bundle for each page
      ...(Pages.reduce((entries, page) => ({
        ...entries,
        [page]: `./src/pages/${page}/index.js`
      }), {})),
    },

    output: {
      path:       path.resolve (__dirname, 'build'),
      publicPath: PUBLIC_PATH,
      clean:      true,
      filename:   '[name].bundle.js'
    },

    mode: argv.mode,

    ...(argv.mode === 'development') ? {
      devtool:   'inline-source-map',
      devServer: {
        stats: 'errors-only',
        contentBase: path.resolve (__dirname, 'build'),
        contentBasePublicPath: PUBLIC_PATH,
        open: true,
        openPage: PUBLIC_PATH.replace('/', ''),
        disableHostCheck: true
      }
    } : {},

    ...(argv.mode === 'production') ? {
      optimization: {
        minimize: true,
        splitChunks: { chunks: "all" }
      }
    } : {},

    plugins: [
      new HTMLPlugin ({
        template: 'src/index.html',
        filename: 'index.html',
        inject: true,
        chunks: ['home']
      }),

      new DefinePlugin ({
        '__HOST__': JSON.stringify(
          (argv.mode === 'production')
            ? 'https://www.s3bby.com/bored-bot'
            : 'http://localhost:5000'
        )
      }),

      // 
      // This will create a index.html file in the build folder
      // that matches the page name, so we don't have to rely on
      // SPA tactics. Just load the page
      ...(Pages.map(page => new HTMLPlugin ({
        template: 'src/index.html',
        filename: `${page}/index.html`,
        inject: true,
        chunks: [page]
      })))
    ],

    module: {
      rules: [
        {
          test: /\.js?$/,
          exclude: /node_modules/, //don't test node_modules folder
          use: {
              loader: 'babel-loader',
          },
        },

        {
          test:    /\.tsx?$/,
          use:     'ts-loader',
          exclude: /node_modules/
        },

        {
          test: /\.svelte$/,
          use: {
            loader: 'svelte-loader',
            options: {
              emitCss: true,
              preprocess: sveltePreprocess({})
            }
          },
        },

        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },

        {
          test: /\.s[ac]ss$/i,
          use: [
            // Creates `style` nodes from JS strings
            "style-loader",
            // Translates CSS into CommonJS
            "css-loader",
            // Compiles Sass to CSS
            "sass-loader",
          ],
        },
        
        {
          test: /\.(png|jpe?g|gif)$/i,
          type: 'asset/resource'
        }
      ]
    },

    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.svelte']
    }
    
  };
};