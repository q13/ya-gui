/**
 * Help utils
 */
const fs = require('fs');
const os = require('os');
const fsExtra = require('fs-extra');
const path = require('path');
const request = require('request');
const {
  spawnSync
} = require('child_process');
const terminate = require('terminate');
const {
  remotePkgUrl
} = require('./config');
const {
  message
} = require('antd');

const osType = os.type();
const systermNodeBin = (osType === 'Darwin' ? '/usr/local/bin/node' : 'node');
const systermNodeVersion = spawnSync(systermNodeBin, ['-v']).stdout.toString().trim(); // 获取系统命令node版本号
const arch = os.arch();

const getNodeLibName = () => {
  let name = ''
  if (osType === 'Windows_NT') {
    name = `node-${systermNodeVersion}-win-${arch}`;
  } else if (osType === 'Darwin') {
    name = `node-${systermNodeVersion}-darwin-${arch}`;
  }
  return name;
};
const getNodeLibUri = () => {
  let uri = '';
  const libName = getNodeLibName();
  if (osType === 'Windows_NT') {
    uri = `https://nodejs.org/dist/${systermNodeVersion}/${libName}.zip`;
  } else if (osType === 'Darwin') {
    uri = `https://nodejs.org/dist/${systermNodeVersion}/${libName}.tar.gz`;
  }
  return uri;
};
const getNodeLibBin = () => {
  let bin = '';
  // const libName = getNodeLibName();
  const nodeLibParentPath = path.resolve(__dirname, `../../lib/nodejs`);
  const nodeJson = fsExtra.readJsonSync(path.resolve(nodeLibParentPath, './node.json'), {
    throws: false
  });
  if (nodeJson) {
    const libName = nodeJson.libName;
    if (osType === 'Windows_NT') {
      bin = path.resolve(__dirname, `../../lib/nodejs/${libName}/node.exe`);
    } else if (osType === 'Darwin') {
      bin = path.resolve(__dirname, `../../lib/nodejs/${libName}/bin/node`);
    }
  }
  if (!fs.existsSync(bin)) {
    bin = systermNodeBin; // 默认使用系统node命令
  }
  return bin;
};

var driverPids = []; // Storage driver pid
const getDriverPids = () => {
  return driverPids.map(v => v);
};
const pushDriverPids = (pid) => {
  driverPids.push(pid);
};
const terminatePids = (pids, callback) => {
  pids = [].concat(pids || []);
  if (pids.length) {
    Promise.all(pids.map((pid) => {
      return new Promise((resolve) => {
        terminate(pid, () => {
          resolve(true);
        });
      });
    })).then(() => {
      callback && callback();
    });
  } else {
    callback && callback();
  }
};

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
  },
  /**
   * Get API template uri
   * @param {string} pkgJsonPath - API template uri
   */
  getApiTemplateUri(pkgJsonPath) {
    const pkgJson = fsExtra.readJsonSync(pkgJsonPath);
    if (pkgJson) {
      const apiOutputName = ((pkgJson.application || {}).jsdoc || {}).destination || 'api';
      return path.resolve(path.dirname(pkgJsonPath), `./${apiOutputName}/${pkgJson.name}/${pkgJson.version}/index.html`);
    }
    return '';
  },
  /**
   * Get the dev mode access url
   * @param {string} projectPath - Project path
   */
  getDevUri(projectPath) {
    const pkgJson = fsExtra.readJsonSync(path.resolve(projectPath, './package.json'));
    if (pkgJson) {
      const devPort = (pkgJson.application || {}).devPort || 8080;
      return `http://127.0.0.1:${devPort}/${pkgJson.name}/${pkgJson.version}/#/`;
    }
    return '';
  },
  systermNodeVersion,
  getNodeLibName,
  getNodeLibUri,
  getNodeLibBin,
  getDriverPids,
  pushDriverPids,
  terminatePids
};
