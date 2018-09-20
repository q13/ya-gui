/**
 * Environment for app
 */
const React = require('react');
const e = React.createElement;
const ReactDOM = require('react-dom');
const { LocaleProvider } = require('antd');
const Gaze = require('gaze').Gaze;
const path = require('path');

const zhCN = require('antd/lib/locale-provider/zh_CN');

const enableDevMode = function (frontWin) {
  // 监控文件改变重新reload
  const nwFlavor = process.versions['nw-flavor'];
  // 开发态下才开启
  if (nwFlavor === 'sdk') {
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
  yaCommand: path.resolve(__dirname, '../../node_modules/ya-driver/bin/ya.js')
};
