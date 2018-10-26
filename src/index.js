/**
 * The enter process
 */
/* global nw */
nw.Window.open('src/index.html', {
  width: 950,
  height: 600
}, (win) => {
  console.log('Initial create');
});
