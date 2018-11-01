/**
 * Fix build bugs and compress
 * .svgo.yml lose problem
 */
const os = require('os');
const path = require('path');
const fsExtra = require('fs-extra');
const fs = require('fs');
const compressing = require('compressing');
const pkgJson = require('../package.json');

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
const svgoTargetPath = path.resolve(__dirname, `../dist/${pkgName}-${version}-${platformName}/${distSourcesPath}/node_modules/svgo/.svgo.yml`);

// Copy and rename
fsExtra.copySync(svgoSrcPath, svgoTargetPath);

const isSvgoExist = fs.existsSync(svgoTargetPath);
if (isSvgoExist) {
  console.log('Generate .svgo.yml file');
  const distAppDir = path.resolve(__dirname, `../dist/${pkgName}-${version}-${platformName}`);
  const distPkgFile = path.resolve(__dirname, `../dist/${pkgName}-${version}-${platformName}.zip`);
  compressing.zip.compressDir(distAppDir, distPkgFile).then(() => {
    console.log('Compress done.');
  }).catch((evt) => {
    console.error('Compress error', evt);
  });
} else {
  console.error('Can\'t find .svgo.yml file');
}
