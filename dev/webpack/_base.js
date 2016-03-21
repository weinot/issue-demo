import webpack from 'webpack'
import cssnano from 'cssnano'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import config from '../config'
import _debug from 'debug'

const { utils_paths: paths, dir_client: app, globals: {__DEV__} } = config
const debug = _debug('app:webpack:_base')

debug('Create configuration.')

const webpackConfig = {
  name: 'client',
  target: 'web',
  devtool: config.compiler_devtool,
  resolve: {
    root: paths.base(app),
    extensions: ['', '.js', '.jsx', '.css', '.json'],
    alias: config.aliases
  },
  entry: {
    app: [
      paths.client('entry.jsx')
    ],
    vendor: config.compiler_vendor
  },
  output: {
    filename: `[name].[${config.compiler_hash_type}].js`,
    chunkFilename: `[id].[chunkhash].js`,
    path: paths.base(config.dir_dist),
    publicPath: config.compiler_public_path
  },
  plugins: [
    new webpack.DefinePlugin(config.globals),
    new webpack.ContextReplacementPlugin(/moment[\\\/]locale$/, /^\.\/(zh-cn|zh-tw)$/),
    new HtmlWebpackPlugin({
      title: 'Web IM',
      template: paths.client('index.html'),
      hash: false,
      favicon: paths.client('static/favicon.png'),
      filename: 'index.html',
      inject: 'body',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true
      }
    })
  ],
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          cacheDirectory: true,
          plugins: ['transform-runtime', 'add-module-exports', 'transform-decorators-legacy'],
          presets: ['es2015', 'react', 'stage-0'],
          env: {
            development: {
              plugins: [
                ['react-transform', {
                  transforms: [{
                    transform: 'react-transform-hmr',
                    imports: ['react'],
                    locals: ['module']
                  }, {
                    transform: 'react-transform-catch-errors',
                    imports: ['react', 'redbox-react']
                  }]
                }]
              ]
            },
            production: {
              plugins: [
                'transform-react-remove-prop-types',
                'transform-react-constant-elements'
              ]
            }
          }
        }
      },
      {
        test: /\.json$/,
        loader: 'json'
      },
      {
        test: /\.css$/,
        include: /app/,
        loaders: [
          'style',
          `css?${JSON.stringify({
            sourceMap: __DEV__,
            modules: true,
            importLoaders: 1,
            localIdentName: __DEV__ ? '[name]_[local]_[hash:base64:3]' : '[hash:base64:5]',
            minimize: false
          })}`,
          'postcss'
        ]
      },
      {
        test: /\.(png|jpe?g|gif|ico)$/,
        loaders: [`file?name=images/[name]_[hash:base64:5].[ext]`]
      },
      {
        test: /\.mp3$/,
        loaders: [`file?name=media/[hash].[ext]`]
      },
      {
        test: /\.(woff|woff2|ttf|eot|svg)(\?.*)?$/,
        loader: `file?name=fonts/[name]_[hash:base64:5].[ext]`
      }
    ]
  },
  postcss: function plugins(webpack) {
    return [
      require('postcss-easy-import')({
        glob: true,
        addDependencyTo: webpack
      }),
      require('postcss-sprites')['default']({
        spritePath: paths.client('theme/images'),
        relativeTo: 'rule',
        filterBy: image => {
          return /sprites\/.*\.png$/.test(image.url) ? Promise.resolve() : Promise.reject()
        },
        groupBy: image => {
          return Promise.resolve(image.url.split('/').reverse()[1])
        }
      }),
      require('postcss-url'),
      require('precss')(),
      require('postcss-browser-reporter'),
      require('postcss-reporter'),
      cssnano({
        filterPlugins: false,
        sourcemap: true,
        autoprefixer: {
          add: true,
          remove: true,
          browsers: ['last 2 versions']
        },
        safe: true,
        discardComments: {
          removeAll: true
        }
      })
    ]
  },
  eslint: {
    configFile: paths.base('.eslintrc')
  }
}

export default webpackConfig
