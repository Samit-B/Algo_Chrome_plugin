const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const fs = require('fs');

// Helper function to check if directory exists and has files
const hasFiles = (dir) => {
  try {
    return fs.existsSync(dir) && fs.readdirSync(dir).length > 0;
  } catch (e) {
    return false;
  }
};

module.exports = (env) => ({
  mode: 'production',
  entry: {
    popup: './src/popup.js',
    content: './src/content.js',
    background: './src/background.js',
  },
  output: {
    path: path.resolve(__dirname, env.firefox ? 'dist/firefox' : 'dist/chrome'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader'
        ]
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext]'
        }
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name][ext]'
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/popup.html',
      filename: 'popup.html',
      chunks: ['popup']
    }),
    new MiniCssExtractPlugin({
      filename: 'styles.css'
    }),
    new CopyPlugin({
      patterns: [
        // Always copy browser-polyfill for Firefox
        env.firefox ? { 
          from: 'node_modules/webextension-polyfill/dist/browser-polyfill.min.js',
          to: 'browser-polyfill.js'
        } : { from: 'src/empty.js', to: 'browser-polyfill.js' },
        
        // Copy manifest based on target browser
        {
          from: env.firefox ? 'manifest.firefox.json' : 'manifest.json',
          to: 'manifest.json'
        },
        
        // Copy other assets if they exist
        ...(hasFiles(path.join(__dirname, 'src/assets')) ? [{
          from: 'src/assets',
          to: 'assets',
          noErrorOnMissing: true
        }] : [])
      ].filter(Boolean)
    })
  ],
  resolve: {
    extensions: ['.js', '.css']
  },
  optimization: {
    runtimeChunk: false,
    splitChunks: false
  },
  performance: {
    hints: false
  },
  cache: false
});
