var gitRevSync = require('git-rev-sync')
module.exports = function () {
  try {
    return `${gitRevSync.short()}`
  } catch (err) {
    return 'dev'
  }
}
