/**
 * Install node binary lib
 */
const path = require('path');
const download = require('download');
const {
  getNodeLibUri
} = require('../src/deps/helper');

const uri = getNodeLibUri();
const distPath = path.resolve(__dirname, '../lib/nodejs');
console.log('Node download url is', uri);
download(uri, distPath, {
  extract: true
}).then(() => {
  console.log('Download done');
}).catch((evt) => {
  console.error('Download error', evt);
});
