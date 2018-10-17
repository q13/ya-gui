/**
 * Menu navigation
 */
const {
  React,
  ReactDOM,
  e
} = require('../deps/env');
const gitDownloader = require('download-git-repo');
const os = require('os');
const path = require('path');
const {
  fetchRemotePkgJson,
  isDev,
  savePkgJson
} = require('../deps/helper');
const {
  gitRepUri
} = require('../deps/config');
const {
  message,
  Modal,
  Progress
} = require('antd');
const fsExtra = require('fs-extra');
const fs = require('fs');
const { execSync } = require('child_process');
const pkgJson = require('../../package.json');
const upgradeSuccessFilePath = path.resolve(__dirname, '../../upgrade.txt');

/**
 * Init menu
 */
function init() {
  if (fs.existsSync(upgradeSuccessFilePath)) {
    message.success('Upgrade success!');
    fsExtra.removeSync(upgradeSuccessFilePath);
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
                  const progressValue = Math.floor(99 / 60 * (diff / 1000));
                  setUpgradeProgress(progressValue);
                  if (progressValue < 99) {
                    handler = window.requestAnimationFrame(step);
                  }
                });
                const rootPath = path.resolve(__dirname, '../../');
                const upgradePath = path.resolve(rootPath, 'upgrade.txt');
                // Download
                gitDownloader(gitRepUri, rootPath, function (err) {
                  if (err) {
                    message.error(`From github download package failure.`);
                  } else {
                    // 直接取消干到100
                    window.cancelAnimationFrame(handler);
                    setUpgradeProgress(100);
                    const newPkgJson = fsExtra.readJsonSync(path.resolve(rootPath, 'package.json'), {
                      throws: false
                    });
                    if (JSON.stringify(pkgJson.dependencies) !== JSON.stringify(newPkgJson.dependencies) || JSON.stringify(pkgJson.devDependencies) !== JSON.stringify(newPkgJson.devDependencies)) {
                      try {
                        execSync('yarn upgrade', {
                          cwd: rootPath
                        });
                        // Set upgrade success flag
                        fsExtra.outputFileSync(upgradePath, 'success');
                        savePkgJson({
                          version: result.data.version
                        });
                        message.success(`Please restart application apply new features`);
                        console.log('Upgrade success');
                      } catch (evt) {
                        message.error(`Install dependencies failure, try close application and run yarn install manually`);
                        console.log('Upgrade failure');
                      }
                    } else {
                      // Set upgrade success flag
                      fsExtra.outputFileSync(upgradePath, 'success');
                      savePkgJson({
                        version: result.data.version
                      });
                      message.success(`Please restart application apply new features`);
                      console.log('Upgrade success');
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
  helpSubmenu.append(new nw.MenuItem({
    label: 'Support',
    click: () => {
      Modal.info({
        title: 'Support contacts',
        content: 'DingTalk @qishuxu',
        okText: 'Got it',
        onOk() { }
      });
    }
  }));

  menu.append(new nw.MenuItem({
    label: 'Help',
    submenu: helpSubmenu
  }));
  nw.Window.get().menu = menu;

  return menu;
}

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
// Set default value
const topBarContext = React.createContext(null);
let topBarMenu = null; // Need dynamic create

/**
 * Consumer HOC
 * @param {React} Component - React component
 */
function withTopBarConsumer(Component) {
  return React.forwardRef((props, ref) => {
    return e(topBarContext.Consumer, {}, (menu) => {
      return e(Component, {
        ...props,
        topBar: menu,
        ref
      });
    });
  });
}

function withTopBarProvider(Component) {
  return (props) => {
    if (!topBarMenu) {
      topBarMenu = init();
    }
    return e(topBarContext.Provider, {
      value: topBarMenu
    }, e(Component, {
      ...props
    }));
  };
}

module.exports.withTopBarConsumer = withTopBarConsumer;
module.exports.withTopBarProvider = withTopBarProvider;
