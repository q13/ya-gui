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
const request = require('request');
const gitDownloader = require('download-git-repo');
const { execSync } = require('child_process');
const {
  notification,
  message,
  Progress
} = require('antd');
const pkgJson = require('../../package.json');
const upgradeSuccessFilePath = path.resolve(__dirname, '../../upgrade.txt');

const zhCN = require('antd/lib/locale-provider/zh_CN');

if (fs.existsSync(upgradeSuccessFilePath)) {
  message.success('Upgrade success!');
  fsExtra.removeSync(upgradeSuccessFilePath);
}

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
// Set profile file
const profilePath = path.resolve(os.homedir(), '\.ya-gui/profile.json'); // eslint-disable-line
fsExtra.ensureFileSync(profilePath);

/**
 * Show upgrade progress
 * @param {Number} value - 进度值
 */
function setUpgradeProgress(value) {
  let containerElt = document.getElementById('upgrade-progress-container');
  if (!containerElt) {
    containerElt = document.createElement('div');
    containerElt.id = 'upgrade-progress-container';
    Object.assign(containerElt.style, {
      position: 'fixed',
      width: '100%',
      height: '100%',
      top: 0,
      left: 0,
      zIndex: 10000,
      background: 'rgba(0, 0, 0, 0.25)'
    });
    document.body.appendChild(containerElt);
  }
  if (value === -1) {
    containerElt.style.display = 'none';
  } else {
    containerElt.style.display = 'block';
    ReactDOM.render(e(Progress, {
      type: 'circle',
      style: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: '-60px',
        marginTop: '-60px'
      },
      percent: value
    }), containerElt);
  }
}

// Global menu toolbar
const menu = new nw.Menu({
  type: 'menubar'
});
const helpSubmenu = new nw.Menu();
helpSubmenu.append(new nw.MenuItem({
  label: 'Upgrade',
  click: () => {
    if (!isDev()) {
      const osType = os.type();
      if (osType === 'Windows_NT') {
        fetchRemotePkgJson((result) => {
          if (result.flag) {
            if (result.data.version !== pkgJson.version) {
              setUpgradeProgress(0);
              const t0 = new Date() / 1;
              let handler = window.requestAnimationFrame(function step() {
                const diff = (new Date() / 1) - t0;
                const progressValue = Math.floor(99 / 30 * (diff / 1000));
                setUpgradeProgress(progressValue);
                if (progressValue < 99) {
                  handler = window.requestAnimationFrame(step);
                }
              });
              gitDownloader('q13/ya-gui', path.resolve(__dirname, '../../'), function (err) {
                if (err) {
                  message.error(`From github download package failure.`);
                } else {
                  // 直接取消干到100
                  window.cancelAnimationFrame(handler);
                  setUpgradeProgress(100);
                  const newPkgJson = fsExtra.readJsonSync(path.resolve(__dirname, '../../package.json'), {
                    throws: false
                  });
                  if (JSON.stringify(pkgJson.dependencies) !== JSON.stringify(newPkgJson.dependencies) || JSON.stringify(pkgJson.devDependencies) !== JSON.stringify(newPkgJson.devDependencies)) {
                    try {
                      execSync('yarn upgrade', {
                        cwd: path.resolve(__dirname, '../../')
                      });
                      // Set upgrade success flag
                      fsExtra.outputFileSync(path.resolve(__dirname, '../../upgrade.txt'), 'success');
                      message.success(`Please restart application apply new features`);
                      console.log('Upgrade success');
                    } catch (evt) {
                      message.error(`Install dependencies failure, try close application and run yarn install manually`);
                      console.log('Upgrade failure');
                    }
                  }
                }
              });
            } else {
              message.info(`You are already have the newest version`);
            }
          }
        });
      } else {
        message.info('Sorry, the feature on road...');
      }
    }
  }
}));

menu.append(new nw.MenuItem({
  label: 'Help',
  submenu: helpSubmenu
}));
nw.Window.get().menu = menu;

function fetchRemotePkgJson(callback) {
  request('https://raw.githubusercontent.com/q13/ya-gui/master/package.json', function (err, response, body) {
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
}

fetchRemotePkgJson(({
  flag,
  data
}) => {
  if (flag) {
    if (data.version !== pkgJson.version) { // Need upgrade
      notification.info({
        message: 'A new version available',
        description: 'Click Help -> Upgrade menu to upgrade'
      });
    }
  }
});

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
  profilePath,
  topToolbar: menu
};
