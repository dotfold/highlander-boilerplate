'use strict'

var version = require('./version')

function getClientEnvironment (publicUrl) {
  var raw = Object
    .keys(process.env)
    .reduce((env, key) => {
      env[key] = process.env[key]
      return env
    }, {
      'NODE_ENV': process.env.NODE_ENV || 'development',
      'PUBLIC_URL': publicUrl,
      'APP_VERSION': version() || ''
    })
  // Stringify all values so we can feed into Webpack DefinePlugin
  var stringified = {
    'process.env': Object
      .keys(raw)
      .reduce((env, key) => {
        env[key] = JSON.stringify(raw[key])
        return env
      }, {})
  }

  return { raw, stringified }
}

module.exports = getClientEnvironment
