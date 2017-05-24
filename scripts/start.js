'use strict'

process.env.NODE_ENV = 'development'

// Load environment variables from .env file. Suppress warnings using silent
// if this file is missing. dotenv will never modify any environment variables
// that have already been set.
// https://github.com/motdotla/dotenv
require('dotenv').config({silent: true})

var chalk = require('chalk')
var webpack = require('webpack')
var WebpackDevServer = require('webpack-dev-server')
var historyApiFallback = require('connect-history-api-fallback')
var httpProxyMiddleware = require('http-proxy-middleware')
var detect = require('detect-port')
var clearConsole = require('react-dev-utils/clearConsole')
var checkRequiredFiles = require('react-dev-utils/checkRequiredFiles')
var formatWebpackMessages = require('react-dev-utils/formatWebpackMessages')
var getProcessForPort = require('react-dev-utils/getProcessForPort')
var openBrowser = require('react-dev-utils/openBrowser')
var prompt = require('react-dev-utils/prompt')
var config = require('../webpack.config')('development')
var paths = require('../conf/paths')
var isInteractive = process.stdout.isTTY

// Warn and crash if required files are missing
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
  process.exit(1)
}

// Tools like Cloud9 rely on this.
var DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000
var compiler
var handleCompile

function setupCompiler (host, port, protocol) {
  compiler = webpack(config, handleCompile)
  compiler.plugin('invalid', function () {
    if (isInteractive) {
      clearConsole()
    }
    console.log('Compiling...')
  })

  var isFirstCompile = true
  compiler.plugin('done', function (stats) {
    if (isInteractive) {
      clearConsole()
    }

    var messages = formatWebpackMessages(stats.toJson({}, true))
    var isSuccessful = !messages.errors.length && !messages.warnings.length
    var showInstructions = isSuccessful && (isInteractive || isFirstCompile)

    if (isSuccessful) {
      console.log(chalk.green('Compiled successfully!'))
    }

    if (showInstructions) {
      console.log()
      console.log('The app is running at:')
      console.log()
      console.log('  ' + chalk.cyan(protocol + '://' + host + ':' + port + '/'))
      console.log()
      isFirstCompile = false
    }

    // If errors exist, only show errors.
    if (messages.errors.length) {
      console.log(chalk.red('Failed to compile.'))
      console.log()
      messages.errors.forEach(message => {
        console.log(message)
        console.log()
      })
      return
    }

    // Show warnings if no errors were found.
    if (messages.warnings.length) {
      console.log(chalk.yellow('Compiled with warnings.'))
      console.log()
      messages.warnings.forEach(message => {
        console.log(message)
        console.log()
      })
    }
  })
}

// We need to provide a custom onError function for httpProxyMiddleware.
// It allows us to log custom error messages on the console.
function onProxyError (proxy) {
  return function (err, req, res) {
    var host = req.headers && req.headers.host
    console.log(
      chalk.red('Proxy error:') + ' Could not proxy request ' + chalk.cyan(req.url) +
      ' from ' + chalk.cyan(host) + ' to ' + chalk.cyan(proxy) + '.'
    )
    console.log(
      'See https://nodejs.org/api/errors.html#errors_common_system_errors for more information (' +
      chalk.cyan(err.code) + ').'
    )
    console.log()

    // And immediately send the proper error response to the client.
    // Otherwise, the request will eventually timeout with ERR_EMPTY_RESPONSE on the client side.
    if (res.writeHead && !res.headersSent) {
      res.writeHead(500)
    }
    res.end('Proxy error: Could not proxy request ' + req.url + ' from ' +
      host + ' to ' + proxy + ' (' + err.code + ').'
    )
  }
}

function addMiddleware (devServer) {
  var proxy = require(paths.appPackageJson).proxy
  devServer.use(historyApiFallback({
    disableDotRule: true,
    htmlAcceptHeaders: proxy
      ? ['text/html']
      : ['text/html', '*/*']
  }))
  if (proxy) {
    if (typeof proxy !== 'string') {
      console.log(chalk.red('When specified, "proxy" in package.json must be a string.'))
      console.log(chalk.red('Instead, the type of "proxy" was "' + typeof proxy + '".'))
      console.log(chalk.red('Either remove "proxy" from package.json, or make it a string.'))
      process.exit(1)
    }

    // Otherwise, if proxy is specified, we will let it handle any request.
    // There are a few exceptions which we won't send to the proxy:
    // - /index.html (served as HTML5 history API fallback)
    // - /*.hot-update.json (WebpackDevServer uses this too for hot reloading)
    // - /sockjs-node/* (WebpackDevServer uses this for hot reloading)
    // Tip: use https://jex.im/regulex/ to visualize the regex
    var mayProxy = /^(?!\/(index\.html$|.*\.hot-update\.json$|sockjs-node\/)).*$/
    var hpm = httpProxyMiddleware(pathname => mayProxy.test(pathname), {
      target: proxy,
      logLevel: 'debug',
      onProxyReq: function (proxyReq) {
        // Browers may send Origin headers even with same-origin
        // requests. To prevent CORS issues, we have to change
        // the Origin to match the target URL.
        if (proxyReq.getHeader('origin')) {
          proxyReq.setHeader('origin', proxy)
        }
      },
      onProxyRes: function (proxyRes, req, res) {
        res.headers = res.headers || {}
        for (var k in proxyRes.headers) {
          var v = proxyRes.headers[k]
          res.headers[k] = v
        }
      },
      onError: onProxyError(proxy),
      secure: false,
      changeOrigin: true,
      ws: true,
      xfwd: true
    })
    devServer.use(mayProxy, hpm)

    devServer.listeningApp.on('upgrade', hpm.upgrade)
  }

  devServer.use(devServer.middleware)
}

function runDevServer (host, port, protocol) {
  var devServer = new WebpackDevServer(compiler, {
    compress: true,
    clientLogLevel: 'none',
    contentBase: paths.appPublic,
    hot: true,
    publicPath: config.output.publicPath,
    quiet: true,
    watchOptions: {
      ignored: /node_modules/
    },
    https: protocol === 'https',
    host: host,
    overlay: {
      warnings: true,
      errors: true
    }
  })

  addMiddleware(devServer)

  // Launch WebpackDevServer.
  devServer.listen(port, err => {
    if (err) {
      return console.log(err)
    }

    if (isInteractive) {
      clearConsole()
    }
    console.log(chalk.cyan('Starting the development server...'))
    console.log()

    openBrowser(protocol + '://' + host + ':' + port + '/')
  })
}

function run (port) {
  var protocol = process.env.HTTPS === 'true' ? 'https' : 'http'
  var host = process.env.HOST || 'localhost'
  setupCompiler(host, port, protocol)
  runDevServer(host, port, protocol)
}

// We attempt to use the default port but if it is busy, we offer the user to
// run on a different port. `detect()` Promise resolves to the next free port.
detect(DEFAULT_PORT).then(port => {
  if (port === DEFAULT_PORT) {
    run(port)
    return
  }

  if (isInteractive) {
    clearConsole()
    var existingProcess = getProcessForPort(DEFAULT_PORT)
    var question =
      chalk.yellow('Something is already running on port ' + DEFAULT_PORT + '.' +
        ((existingProcess) ? ' Probably:\n  ' + existingProcess : '')) +
        '\n\nWould you like to run the app on another port instead?'

    prompt(question, true).then(shouldChangePort => {
      if (shouldChangePort) {
        run(port)
      }
    })
  } else {
    console.log(chalk.red('Something is already running on port ' + DEFAULT_PORT + '.'))
  }
})
