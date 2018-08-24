/**
 * Environment for app
 */
const React = require('react');
const e = React.createElement;
const ReactDOM = require('react-dom');
const { Theme, getTheme } = require('react-uwp/Theme');
const Gaze = require('gaze').Gaze;
const path = require('path');

const enableDevMode = function (frontWin) {
  // 监控文件改变重新reload
  const nwFlavor = process.versions['nw-flavor'];
  // 开发态下才开启
  if (nwFlavor === 'sdk') {
    const gaze = new Gaze('**/*', {
      cwd: path.resolve(__dirname, '../../src')
    });
    gaze.on('all', function (event, filepath) {
      // win.reloadDev();
      frontWin.reloadIgnoringCache();
      // if (location) {
      //   location.reload();
      // }
    });
  }
};

module.exports = {
  React,
  ReactDOM,
  e,
  Theme,
  getTheme,
  enableDevMode
};
