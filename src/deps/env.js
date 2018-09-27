/**
 * Environment for app
 */
const React = require('react');
const e = React.createElement;
const ReactDOM = require('react-dom');
const { LocaleProvider } = require('antd');
const Gaze = require('gaze').Gaze;
const path = require('path');
const fs = require('fs');
const fsExtra = require('fs-extra');
const os = require('os');

const zhCN = require('antd/lib/locale-provider/zh_CN');

const enableDevMode = function (frontWin) {
  // 开发态下才开启
  if (isDev()) {
    const gaze = new Gaze('**/*', {
      cwd: path.resolve(__dirname, '../../src')
    });
    gaze.on('all', function (event, filepath) {
      for (let i in require.cache) {
        delete require.cache[i]; // Delete cache
      }
      frontWin.reloadIgnoringCache();
    });
  }
};

/**
 * 判断是否处于开发态
 */
function isDev() {
  return !fs.existsSync(path.resolve(__dirname, '../../credits.html'));
}

/**
 * Escape log message
 */
function escapeLogMessage(data) {
  return data.toString('utf8').replace(/\\/g, '\\\\').replace(/`/g, '\\`');
}

const profilePath = path.resolve(os.homedir(), '\.ya-gui/profile.json'); // eslint-disable-line
fsExtra.ensureFileSync(profilePath);

module.exports = {
  React,
  ReactDOM,
  e,
  LocaleProvider: (props) => {
    return e(LocaleProvider, {
      locale: zhCN
    }, props.children);
  },
  enableDevMode,
  yaCommand: path.resolve(__dirname, '../../node_modules/ya-driver/bin/ya2.js'),
  isDev,
  escapeLogMessage,
  profilePath
};
