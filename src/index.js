/**
 * The enter process
 */
/* global nw */
nw.Window.open('src/index.html', {}, (win) => {
  console.log('Initial create');
});
