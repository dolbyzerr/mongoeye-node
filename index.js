const {spawn} = require('child_process')
const {EXECUTABLE_PATH} = require('./lib/executable')

module.exports = (options = {}) => new Promise((resolve, reject) => {
  const args = Object.keys(options).reduce((acc, optionName) => {

    if (options[optionName] === true) {
      return acc.concat(`--${optionName}`)
    }

    return acc.concat(`--${optionName}`, options[optionName])

  }, [])
  const mongoeye = spawn(EXECUTABLE_PATH, args, {encoding: 'utf8'})

  let result = ''
  mongoeye.stdout.on('data', data => {
    result += data.toString()
  })

  let err = ''
  mongoeye.stderr.on('data', data => {
    err += data.toString()
  })

  mongoeye.on('exit', code => {
    if (code === 0) {
      const {format} = options
      if (format === 'json') {
        try {
          resolve(JSON.parse(result))
        } catch(e) {
          reject(e)
        }
      } else {
        resolve(result)
      }
    } else {
      reject(err)
    }
  })
})
