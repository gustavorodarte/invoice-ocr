const TerserPlugin = require('terser-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (options, webpack) => {
  const lazyImports = [
    '@nestjs/microservices/microservices-module',
    '@nestjs/websockets/socket-module',
  ];

  return {
    ...options,
    externals: [
      {
        ...nodeExternals(),
        '/opt/prisma': '/opt/prisma',
        '/opt/invoice': '/opt/invoice',
      },
    ],
    plugins: [
      ...options.plugins,
      new webpack.IgnorePlugin({
        checkResource(resource) {
          if (lazyImports.includes(resource)) {
            try {
              require.resolve(resource);
            } catch (err) {
              return true;
            }
          }
          return false;
        },
      }),
      new CopyPlugin({
        patterns: [
          {
            from: './node_modules/.prisma/client/schema.prisma',
            to: './layers/prisma',
          },
          {
            from: './layers/prisma/migrations',
            to: './lambdas/migration/prisma/migrations',
          },
          {
            from: './layers/prisma/schema.prisma',
            to: './lambdas/migration/prisma',
          },
          {
            from: './node_modules/prisma',
            to: './lambdas/migration/prisma-cli',
          },
          {
            from: './layers/prisma/migrations',
            to: '../../lib/migrations',
          },
        ],
      }),
    ],
    optimization: {
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            keep_classnames: true,
          },
        }),
      ],
    },
    output: {
      ...options.output,
      libraryTarget: 'commonjs2',
    },
  };
};
