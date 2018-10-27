/**
 * The enter process
 */
/* global nw */
nw.Window.open('src/index.html', {
  width: 950,
  min_width: 800,
  min_height: 450,
  height: 600
}, (win) => {
  console.log('Initial create');
});
