/**
 * Fix build bugs and compress
 * .svgo.yml lose problem
 */
const os = require('os');
const path = require('path');
const fsExtra = require('fs-extra');
const fs = require('fs');
const {
  spawnSync
} = require('child_process');
const compressing = require('compressing');
const pkgJson = require('../package.json');
const {
  getNodeLibName
} = require('../src/deps/helper');

const osType = os.type();
const version = pkgJson.version;
const pkgName = pkgJson.name;
let platformName = '';
let distSourcesPath = ''; // 区分平台的dist源码路径
let svgoSrcPath = path.resolve(__dirname, '../node_modules/ya-driver/config/svgo');
if (osType === 'Windows_NT') {
  platformName = 'win-x64';
  distSourcesPath = './';
} else if (osType === 'Darwin') { // macOS
  platformName = 'mac-x64';
  distSourcesPath = './ya-gui.app/Contents/Resources/app.nw/';
}
const pkgDirName = `${pkgName}-${version}-${platformName}`;
const svgoTargetPath = path.resolve(__dirname, `../dist/${pkgDirName}/${distSourcesPath}/node_modules/svgo/.svgo.yml`);

// Copy and rename
fsExtra.copySync(svgoSrcPath, svgoTargetPath);

const isSvgoExist = fs.existsSync(svgoTargetPath);
if (isSvgoExist) {
  console.log('Generate .svgo.yml file');
  const distAppDir = path.resolve(__dirname, `../dist/${pkgDirName}`);
  const distPkgFile = path.resolve(__dirname, `../dist/${pkgDirName}.zip`);
  // 重设权限
  if (osType === 'Darwin') {
    const nodeLib = path.resolve(distAppDir, `./${distSourcesPath}/lib/nodejs/${getNodeLibName()}/bin`);
    const output = spawnSync('chmod', ['-R', '777', nodeLib]);
    if (output.status === 0) {
      console.log(`Node bin permission set to 777`);
    } else {
      console.error('Assign permission error', output.stderr.toString());
    }
  }
  compressing.zip.compressDir(distAppDir, distPkgFile).then(() => {
    console.log('Compress done.');
  }).catch((evt) => {
    console.error('Compress error', evt);
  });
} else {
  console.error('Can\'t find .svgo.yml file');
}
