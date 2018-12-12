/**
 * The enter process
 */
/* global nw */
nw.Window.open('src/index.html', {
  width: 1080,
  min_width: 1080,
  min_height: 600,
  height: 600
}, (win) => {
  console.log('Initial create');
});
