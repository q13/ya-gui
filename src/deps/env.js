/**
 * Environment for app
 */
const React = require('react');
const e = React.createElement;
const ReactDOM = require('react-dom');
const { LocaleProvider } = require('antd');
const Gaze = require('gaze').Gaze;
const path = require('path');
const fsExtra = require('fs-extra');
const os = require('os');
const {
  isDev,
  escapeLogMessage
} = require('./helper');
const {
  yaCommand
} = require('./config');

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
// Set profile file
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
  yaCommand,
  isDev,
  escapeLogMessage,
  profilePath
  // topToolbar: menu
};
