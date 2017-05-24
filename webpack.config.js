'use strict'

const webpack = require('webpack')
const path = require('path')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin')
const PreloadWebpackPlugin = require('preload-webpack-plugin')
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin')
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin')

const sourcePath = path.join(__dirname, './src')

const paths = require('./conf/paths')
const getClientEnvironment = require('./conf/env')
const clientEnv = getClientEnvironment('')

const stats = {
  assets: true,
  children: false,
  chunks: false,
  hash: false,
  modules: false,
  publicPath: false,
  timings: true,
  version: false,
  warnings: true,
  colors: {
    green: '\u001b[32m'
  }
}

function _isVendor (module) {
  var userRequest = module.userRequest
  if (typeof userRequest !== 'string') {
    return false
  }
  return userRequest.indexOf('/node_modules/') >= 0
}

module.exports = function (env) {
  const nodeEnv = env && env.production ? 'production' : 'development'
  const isProd = nodeEnv === 'production'

  const serviceWorkerBuild = env && env.sw

  let cssLoader

  const plugins = [
    new InterpolateHtmlPlugin(clientEnv.raw),

    new webpack.DefinePlugin(clientEnv.stringified),

    new ExtractTextPlugin('static/css/style-[contenthash:8].css'),

    new HtmlWebpackPlugin({
      template: paths.appHtml,
      inject: true,
      production: isProd,
      minify: isProd && {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true
      }
    }),

    // make sure script tags are async to avoid blocking html render
    new ScriptExtHtmlWebpackPlugin({
      defaultAttribute: 'async'
    }),

    // preload chunks
    new PreloadWebpackPlugin()
  ]

  if (isProd) {
    plugins.push(
      new UglifyJSPlugin({
        compress: {
          warnings: false,
          screw_ie8: true,
          conditionals: true,
          unused: true,
          comparisons: true,
          sequences: true,
          dead_code: true,
          evaluate: true,
          if_return: true,
          join_vars: true
        }
      }),

      new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        chunks: [ 'app' ],
        minChunks: function (module) {
          return _isVendor(module)
        },
        filename: 'static/js/[name].[hash:8].js'
      })
    )

    cssLoader = ExtractTextPlugin.extract({
      fallback: 'style-loader',
      use: [
        {
          loader: 'css-loader',
          options: {
            modules: true,
            importLoader: true,
            localIdentName: '[hash:base64:5]'
          }
        },
        {
          loader: 'less-loader',
          options: {
            outputStyle: 'collapsed',
            sourceMap: true,
            includePaths: [sourcePath]
          }
        }
      ]
    })
  } else {
    plugins.push(
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NamedModulesPlugin(),
      new webpack.NoEmitOnErrorsPlugin(),
      new CaseSensitivePathsPlugin(),
      new WatchMissingNodeModulesPlugin(paths.appNodeModules)
    )

    cssLoader = [
      {
        loader: 'style-loader'
      },
      {
        loader: 'css-loader',
        options: {
          modules: true,
          importLoader: true,
          localIdentName: '[path]___[name]__[local]___[hash:base64:5]'
        }
      },
      {
        loader: 'less-loader',
        options: {
          outputStyle: 'collapsed',
          sourceMap: true,
          includePaths: [sourcePath]
        }
      }
    ]
  }

  if (serviceWorkerBuild) {
    plugins.push(
      new SWPrecacheWebpackPlugin({
        cacheId: 'ngc',
        filename: 'sw.js',
        maximumFileSizeToCacheInBytes: 800000,
        mergeStaticsConfig: true,
        minify: true,
        runtimeCaching: [
          {
            handler: 'cacheFirst',
            urlPattern: /(.*?)/
          }
        ]
      })
    )
  }

  const entryPoint = isProd
    ? paths.appIndexJs
    : [
        // activate HMR for React
      'react-hot-loader/patch',

        // use facebook's dev client because it doesn't spam the console
      require.resolve('react-dev-utils/webpackHotDevClient'),

        // the entry point of our app
      paths.appIndexJs
    ]

  return {
    devtool: isProd ? 'source-map' : 'cheap-module-source-map',
    context: sourcePath,
    entry: {
      app: entryPoint
    },
    output: {
      path: paths.appBuild,
      pathinfo: true,
      publicPath: '/',
      filename: 'static/js/[name]-[hash:8].js',
      chunkFilename: 'static/js/[name]-[chunkhash:8].js'
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          loader: 'eslint-loader',
          enforce: 'pre',
          include: paths.appSrc
        },
        {
          test: /\.(svg|jpe?g|png|ttf|woff2?)$/,
          exclude: [
            /\.html$/,
            /\.(js|jsx)(\?.*)?$/,
            /\.css$/,
            /\.json$/,
            /\.svg$/,
            /node_modules/
          ],
          use: {
            loader: 'url-loader',
            options: {
              limit: 10000,
              name: 'static/media/[name]-[hash:8].[ext]'
            }
          }
        },
        {
          test: /\.less$/,
          include: paths.appSrc,
          exclude: /node_modules/,
          use: cssLoader
        },
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            query: {
              plugins: [
                'transform-react-jsx',
                [
                  'react-css-modules',
                  {
                    context: sourcePath,
                    webpackHotModuleReloading: true,
                    'filetypes': {
                      '.less': 'postcss-less'
                    }
                  }
                ]
              ]
            }
          }
        }
      ]
    },
    resolve: {
      extensions: ['.webpack-loader.js', '.web-loader.js', '.loader.js', '.js', '.jsx'],
      // fallback: paths.nodePaths,
      modules: [path.resolve(__dirname, 'node_modules'), sourcePath]
    },

    plugins,

    performance: isProd && {
      maxAssetSize: 300000,
      maxEntrypointSize: 300000,
      hints: 'warning'
    },

    stats: stats
  }
}
