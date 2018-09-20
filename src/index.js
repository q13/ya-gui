/**
 * The enter process
 */
/* global nw */
nw.Window.open('src/index.html', {
  width: 900,
  height: 600
}, (win) => {
  console.log('Initial create');
});
