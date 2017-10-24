const os = require('os')
const path = require('path')

const platform = () => {
  const platform = os.platform()
  switch (platform) {
    case 'win32':
      return 'windows'
    default:
      return platform
  }
}

const arch = () => {
  const arch = os.arch()
  switch (arch) {
    case 'x64':
      // amd? Oh, ok
      return 'amd64'
    default:
      return arch
  }
}

const DOWNLOADS_FOLDER = path.join(__dirname, '..', '.local-mongoeye')
const EXECUTABLE_PATH = path.join(DOWNLOADS_FOLDER, 'mongoeye', platform(), arch(), 'mongoeye')

module.exports = {
  DOWNLOADS_FOLDER,
  EXECUTABLE_PATH
}
