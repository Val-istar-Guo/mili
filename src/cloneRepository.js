const fs = require('fs')
const git = require('simple-git/promise')
const { join } = require('path')
const paths = require('./paths')
const { promisify } = require('util')
const throwError = require('./throwError')
const semver = require('semver')
const log = require('./log')


const access = promisify(fs.access)


module.exports = async (repository, version) => {
  const templatePath = join(paths.templates, repository)

  try {
    await access(templatePath, fs.constants.F_OK)
    await git(templatePath).pull()
  } catch(err) {
    // BUG: need delete folder
    await git().clone(repository, templatePath)
  }

  const gitT = git(templatePath)
  let tags = await gitT.tags()
  tags = tags.all
    .filter(semver.valid)
    .sort(semver.compare)
    .reverse()

  const branchSummary = await gitT.branch()
  const currentBranch = branchSummary.current

  if (version) {
    version = `v${version}`
    if (!tags.includes(version)) {
      throwError([
        'No corresponding template version was found',
        'Please confirm that the version number exists in the tags of the template repository.',
        `Expected template version: ${version}`
      ].join('\n'))
    }

    await gitT.checkout(version)
    log.info(`switch to template version: ${version}`)
  } else if (tags.length) {
    await gitT.checkout(tags[0])
    log.info(`switch to template version: ${tags[0]}`)
  }

  return { templatePath, currentBranch }
}
