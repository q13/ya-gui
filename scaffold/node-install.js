/**
 * Install node binary lib
 */
const path = require('path');
const os = require('os');
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
const distPath = path.resolve(__dirname, '../lib/nodejs');
console.log('Node download url is', uri);
download(uri, distPath, {
  extract: true
}).then(() => {
  console.log('Download done');
  // macOS下设置权限777
  if (osType === 'Darwin') {
    const libName = getNodeLibName();
    const libDir = path.resolve(distPath, `./${libName}/bin`);
    const output = spawnSync('chmod', ['-R', '777', libDir]);
    if (output.status === 0) {
      console.log(`Node bin permission set to 777`);
    }
  }
}).catch((evt) => {
  console.error('Download error', evt);
});
