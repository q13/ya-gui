/**
 * Help utils
 */
const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const request = require('request');
const {
  remotePkgUrl
} = require('./config');
const {
  message
} = require('antd');

module.exports = {
  /**
   * 判断是否处于开发态
   */
  isDev() {
    return !fs.existsSync(path.resolve(__dirname, '../../credits.html'));
  },
  /**
   * Escape log message
   */
  escapeLogMessage(data) {
    return data.toString('utf8').replace(/\\/g, '\\\\').replace(/`/g, '\\`');
  },
  /**
   * Get remote package.json info
   * @param {Function} callback - callback
   */
  fetchRemotePkgJson(callback) {
    request(remotePkgUrl, function (err, response, body) {
      if (!err) {
        if (response && response.statusCode === 200) {
          const data = JSON.parse(body);
          callback({ // eslint-disable-line
            flag: true,
            data: data
          });
        } else {
          message.error('Check upgrade failure, you may block by a wall');
        }
      } else {
        message.error('Check upgrade failure, you may block by a wall');
      }
    });
  },
  /**
   * Save package.json info
   */
  savePkgJson(data) {
    const pkgJsonPath = path.resolve(__dirname, '../../package.json');
    const pkgData = fsExtra.readJsonSync(pkgJsonPath);
    fsExtra.writeJsonSync(pkgJsonPath, {
      ...pkgData,
      ...(data || {})
    }, {
      spaces: 2
    });
  }
};
