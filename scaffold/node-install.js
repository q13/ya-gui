/**
 * Install node binary lib
 */
const path = require('path');
const os = require('os');
const fsExtra = require('fs-extra');
const {
  spawnSync
} = require('child_process');
const download = require('download');
const {
  getNodeLibUri,
  getNodeLibName
} = require('../src/deps/helper');

const osType = os.type();

const uri = getNodeLibUri();
const libName = getNodeLibName();
const distPath = path.resolve(__dirname, '../lib/nodejs');
console.log('Node download url is', uri);
// Remove old pkg
fsExtra.removeSync(path.resolve(distPath, `./${libName}`));
download(uri, distPath, {
  extract: true
}).then(() => {
  console.log('Download done');
  // macOS下设置权限777
  if (osType === 'Darwin') {
    const nodeLib = path.resolve(distPath, `./${libName}/bin`);
    const output = spawnSync('chmod', ['-R', '777', nodeLib]);
    if (output.status === 0) {
      console.log(`Node bin permission set to 777`);
    }
  }
}).catch((evt) => {
  console.error('Download error', evt);
});
