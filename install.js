const path = require('path')
const https = require('https')
const {URL} = require('url')
const fs = require('fs')
const os = require('os')
const extract = require('extract-zip')
const {mongoeye} = require('./package.json')
const {
  DOWNLOADS_FOLDER,
  EXECUTABLE_PATH
} = require('./lib/executable')

const MONGOEYE_REPO = 'mongoeye/mongoeye'
const GITHUB_RELEASES_URL = `https://api.github.com/repos/${MONGOEYE_REPO}/releases`
const RELEASE_FILE = 'mongoeye.zip'
const GITHUB_API_HEADERS = {
  'User-Agent': 'mongoeye-downloader'
}

const setHeaders = (req, headers) => Object.keys(headers).forEach(header => req.setHeader(header, headers[header]))

const downloadReleasesInfo = () => new Promise((resolve, reject) => {
  const req = https.request(GITHUB_RELEASES_URL, (res) => {
    let jsonString = ''
    if (res.statusCode !== 200) {
      reject(new Error(`Error fetching github releases from: ${GITHUB_RELEASES_URL} (statusCode: ${res.statusCode})`))
    }
    res.on('data', d => jsonString += d)
    res.on('end', () => {
      try {
        resolve(JSON.parse(jsonString))
      } catch(e) {
        reject(new Error(`Error parsing response from github: ${jsonString}`))
      }
    })
  })
  setHeaders(req, GITHUB_API_HEADERS)
  req.on('error', reject)
  req.end()
})

const getLastRelease = async (tagName) => {
  const releases = await downloadReleasesInfo()

  let lastRelease
  if (tagName) {
    lastRelease = releases.find(release => release['tag_name'] === tagName)
  } else {
    lastRelease = releases
      .filter(release =>
        release.prerelease !== true && release.assets && release.assets.some(asset => asset.name === RELEASE_FILE)
      )
      .sort((a, b) => new Date(a['published_at']) < new Date(b['published_at']) ? 1 : -1)
  }

  if (!lastRelease) {
    throw new Error('Cant find mongoeye release. Please file an issue: https://github.com/dolbyzerr/mongoeye-node/issues')
  }

  return lastRelease.assets.find(asset => asset.name === RELEASE_FILE)
}

const downloadRelease = (url, destination) => new Promise((resolve, reject) => {
  const req = https.request(url, resp => {
    if ([301, 302, 307].includes(resp.statusCode)) {
      resolve(downloadRelease(resp.headers['location'], destination))
      return
    }
    if (resp.statusCode !== 200) {
      resp.resume()
      reject(new Error(`Download failed: ${resp.statusCode}`))
      return
    }
    if (!fs.existsSync(DOWNLOADS_FOLDER)) fs.mkdirSync(DOWNLOADS_FOLDER)
    const file = fs.createWriteStream(destination)
    file.on('finish', resolve)
    file.on('error', reject)
    resp.pipe(file)
  })
  setHeaders(req, GITHUB_API_HEADERS)
  req.on('error', reject)
  req.end()
})

const extractZip = (zipPath, folderPath) => new Promise(resolve => extract(zipPath, {dir: folderPath}, resolve))

const install = async () => {
  const {browser_download_url: releaseUrl} = await getLastRelease(mongoeye['tag_name'])
  const zipPath = path.join(DOWNLOADS_FOLDER, RELEASE_FILE)
  await downloadRelease(releaseUrl, zipPath)
  await extractZip(zipPath, DOWNLOADS_FOLDER)
  // Delete zip archive
  fs.unlinkSync(zipPath)
  if (!fs.existsSync(EXECUTABLE_PATH)) {
    throw new Error(`Your platform "${os.platform()} (${os.arch()})" is not supported yet.`)
  }

  return EXECUTABLE_PATH
}

console.log(`Downloading Mongoeye...`)
install()
  .then(path => console.log(`Mongoeye downloaded to ${path}`))
  .catch(e => {
    console.log('Error downloading mongoeye!')
    console.error(e)
  })
