const { ModuleFederationPlugin } = require('webpack').container;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.tsx',
  devServer: {
    port: 3005,
    hot: true,
    liveReload: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
    historyApiFallback: true,
    allowedHosts: 'all'
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  require('tailwindcss'),
                  require('autoprefixer'),
                ],
              },
            },
          },
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
      name: 'inventoryMfe',
      filename: 'remoteEntry.js',
      exposes: {
        './Inventory': './src/InventoryApp',
        './InventoryRoutes': './src/routes',
        './InventoryComponents': './src/components',
        './InventoryServices': './src/services',
        './InventoryStore': './src/store'
      },
      remotes: {
        shellApp: 'shellApp@http://localhost:3000/remoteEntry.js',
        menuMfe: 'menuMfe@http://localhost:3001/remoteEntry.js',
        ordersMfe: 'ordersMfe@http://localhost:3002/remoteEntry.js',
        kitchenMfe: 'kitchenMfe@http://localhost:3003/remoteEntry.js',
        reservationsMfe: 'reservationsMfe@http://localhost:3004/remoteEntry.js'
      },
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
        },
        '@restaurant/shared-utils': {
          singleton: true,
        },
        '@restaurant/shared-state': {
          singleton: true,
        }
      },
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      title: 'Inventory MFE - Restaurant Platform'
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        shared: {
          test: /[\\/]packages[\\/]shared/,
          name: 'shared',
          chunks: 'all',
        },
      },
    },
  },
  stats: {
    errorDetails: true,
  },
};