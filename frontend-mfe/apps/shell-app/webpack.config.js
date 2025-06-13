const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('@module-federation/webpack');
const { getAllRemotes, MFE_PORTS } = require('@restaurant/mfe-tools/dist/utils');

const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  entry: './src/index.tsx',
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    publicPath: 'auto',
    clean: true,
  },
  
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  },
  
  devServer: {
    port: MFE_PORTS.SHELL,
    historyApiFallback: true,
    hot: true,
    liveReload: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader'
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      remotes: getAllRemotes(isDevelopment),
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18.2.0',
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.2.0',
        },
        'react-router-dom': {
          singleton: true,
          requiredVersion: '^6.8.0',
        },
        '@restaurant/shared-ui': {
          singleton: true,
          requiredVersion: '*',
        },
        '@restaurant/shared-utils': {
          singleton: true,
          requiredVersion: '*',
        },
        '@restaurant/shared-state': {
          singleton: true,
          requiredVersion: '*',
        },
      },
    }),
    
    new HtmlWebpackPlugin({
      template: './public/index.html',
      inject: true,
    }),
  ],
  
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
        },
      },
    },
  },
};