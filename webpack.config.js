const BundleTracker = require('webpack-bundle-tracker');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const glob = require('glob');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const PreloadWebpackPlugin = require('preload-webpack-plugin');
const PurifyCSSPlugin = require('purifycss-webpack');
const S3Plugin = require('webpack-s3-plugin');

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
    'app': './public/js/app.js',
  },

  mode: 'development',

  output: {
    path: path.resolve(outputPath),
    filename: '[name]-[hash].js',
    publicPath: `/${publicPath}`,
  },

  plugins: [
    new CleanWebpackPlugin(pathsToClean, {watch: true}),
    new BundleTracker({filename: './webpack-stats.json'}),
    new MiniCssExtractPlugin('[name]-[hash].css'),
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
      include: 'allChunks',
    }),
    // FIXME The 64x64 .ico file is 32KB. This is unnaceptable. Until this is resolved, we will manually handle
    // these files.
    // new FaviconsWebpackPlugin({
    //   logo: './public/images/favicon.png',
    //   prefix: 'icons-[hash]/',
    //   inject: true,
    //   icons: {
    //     android: false,
    //     appleIcon: true,
    //     appleStartup: false,
    //     coast: false,
    //     favicons: true,
    //     firefox: false,
    //     opengraph: false,
    //     twitter: false,
    //     yandex: false,
    //     windows: false
    //   },
    // }),
  ],

  module: {
    rules: [
      {
        test: /\.s?css$/,
        use: [
          MiniCssExtractPlugin.loader,
          // Translates CSS into CommonJS
          'css-loader',
          // Compiles Sass to CSS
          'sass-loader',
        ],
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
      }
    ]
  },
  resolve: {
    modules: ['./node_modules'],
    extensions: ['.js', '.css', '.scss'],
    alias: {
      bootstrap: path.resolve(__dirname, 'node_modules/bootstrap')
    }
  }
};

if (isProduction) {
  config.mode = 'production';
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
