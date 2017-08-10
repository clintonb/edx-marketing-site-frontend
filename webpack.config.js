const BundleTracker = require('webpack-bundle-tracker');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const glob = require('glob');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const PreloadWebpackPlugin = require('preload-webpack-plugin');
const PurifyCSSPlugin = require('purifycss-webpack');
const S3Plugin = require('webpack-s3-plugin');
const webpack = require('webpack');

const baseTemplatePath = './views/base.html';
const outputPath = './public/bundles/';
const publicPath = 'static/bundles/';

const isProduction = process.env.NODE_ENV === 'production';
const pathsToClean = [
  outputPath,
  baseTemplatePath
];
const config = {
  cache: true,

  context: __dirname,

  devtool: 'source-map',

  entry: {
    'base': './public/js/base.js',
    'main.style': './public/stylesheets/main.scss',
  },

  output: {
    path: path.resolve(outputPath),
    filename: '[name]-[hash].js',
    publicPath: `/${publicPath}`,
  },

  plugins: [
    new CleanWebpackPlugin(pathsToClean, {watch: true}),
    new BundleTracker({filename: './webpack-stats.json'}),
    new ExtractTextPlugin('[name]-[hash].css'),
    // NOTE (CCB): Purify CSS breaks the course cards (probably because they rely on media breakpoints).
    // We cannot enable this plugin until this issue is resolved.
    // new PurifyCSSPlugin({
    //   minimize: false,
    //   moduleExtensions: ['.html'],
    //   paths: glob.sync(path.join(__dirname, 'views/**/!(base.html)*')),
    //   purifyOptions: {
    //     rejected: true,
    //   },
    //   verbose: true,
    // }),
    new HtmlWebpackPlugin({
      filename: path.resolve(baseTemplatePath),
      inject: 'body',
      template: 'views/base.tpl.html'
    }),
    new PreloadWebpackPlugin({
      include: 'all',
      // CSS support is not yet available.
      // See https://github.com/GoogleChrome/preload-webpack-plugin/issues/18 for updates.
      // We do not need to preload map files
      fileBlacklist: [/\.(css|map)/]
    }),
    new FaviconsWebpackPlugin({
      logo: './public/images/favicon.png',
      prefix: 'icons-[hash]/',
      inject: true,
      icons: {
        android: false,
        appleIcon: true,
        appleStartup: false,
        coast: false,
        favicons: true,
        firefox: false,
        opengraph: false,
        twitter: false,
        yandex: false,
        windows: false
      },
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      Tether: 'tether',
      'window.Tether': 'tether',
      Alert: 'exports-loader?Alert!bootstrap/js/dist/alert',
      Button: 'exports-loader?Button!bootstrap/js/dist/button',
      Carousel: 'exports-loader?Carousel!bootstrap/js/dist/carousel',
      Collapse: 'exports-loader?Collapse!bootstrap/js/dist/collapse',
      Dropdown: 'exports-loader?Dropdown!bootstrap/js/dist/dropdown',
      Modal: 'exports-loader?Modal!bootstrap/js/dist/modal',
      Popover: 'exports-loader?Popover!bootstrap/js/dist/popover',
      Scrollspy: 'exports-loader?Scrollspy!bootstrap/js/dist/scrollspy',
      Tab: 'exports-loader?Tab!bootstrap/js/dist/tab',
      Tooltip: 'exports-loader?Tooltip!bootstrap/js/dist/tooltip',
      Util: 'exports-loader?Util!bootstrap/js/dist/util',
    }),
  ],

  module: {
    rules: [
      {
        test: /\.s?css$/,
        use: ExtractTextPlugin.extract({
          use: [
            {
              loader: 'css-loader',
              options: {
                minimize: isProduction,
                sourceMap: true,
              }
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: isProduction
              }
            }
          ]
        })
      },
      {
        test: /\.woff2?$/,
        // Inline small woff files and output them below font
        loader: 'url-loader',
        query: {
          name: 'font/[name]-[hash].[ext]',
          limit: 5000,
          mimetype: 'application/font-woff'
        }
      },
      {
        test: /\.(ttf|eot|svg)$/,
        loader: 'file-loader',
        query: {
          name: 'font/[name]-[hash].[ext]'
        }
      },
      {
        test: /bootstrap\/dist\/js\/umd\//,
        use: 'imports-loader?jQuery=jquery'
      },
    ]
  },
  resolve: {
    modules: ['./node_modules'],
    extensions: ['.js', '.css', '.scss']
  }
};

if (isProduction) {
  config.output.publicPath = `${process.env.CDN_ROOT}/${publicPath}`;
  config.plugins.push(
    new S3Plugin({
      basePath: publicPath,
      include: /.*\.(css|js|map|ico|png)/,
      s3Options: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      s3UploadOptions: {
        Bucket: process.env.S3_BUCKET_NAME,
        // Instruct browsers to cache the assets for 1 year
        CacheControl: 'max-age=31556926'
      }
    }));
}

module.exports = config;
