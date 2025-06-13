const { ModuleFederationPlugin } = require('@module-federation/webpack');
const baseConfig = require('./webpack.base');

const createMfeConfig = (options) => {
  const {
    name,
    dirname,
    port = 3000,
    exposes = {},
    remotes = {},
    shared = {},
    isDevelopment = true
  } = options;

  const config = {
    ...baseConfig(dirname, isDevelopment),
    
    entry: './src/index',
    
    devServer: {
      port,
      historyApiFallback: true,
      hot: true,
      liveReload: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    },
    
    plugins: [
      ...baseConfig(dirname, isDevelopment).plugins,
      new ModuleFederationPlugin({
        name,
        filename: 'remoteEntry.js',
        exposes,
        remotes,
        shared: {
          react: {
            singleton: true,
            requiredVersion: '^18.2.0',
          },
          'react-dom': {
            singleton: true,
            requiredVersion: '^18.2.0',
          },
          '@restaurant/shared-ui': {
            singleton: true,
          },
          '@restaurant/shared-utils': {
            singleton: true,
          },
          '@restaurant/shared-state': {
            singleton: true,
          },
          ...shared,
        },
      }),
    ],
  };

  return config;
};

module.exports = { createMfeConfig };