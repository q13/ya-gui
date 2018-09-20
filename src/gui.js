/**
 * Base on React
 */
const {
  React,
  ReactDOM,
  e,
  LocaleProvider,
  enableDevMode
} = require('./deps/env');
const portal = require('./panes/portal');
const terminate = require('terminate');

let win = nw.Window.get();
win.on('close', function () {
  win = null;
  terminate(process.pid, (err) => {
    if (err) { // you will get an error if you did not supply a valid process.pid
      console.error(`Something is wrong, may you kill nw process manually`);
    } else {
      console.log('done'); // terminating the Processes succeeded.
    }
    this.close(true); // really close
  });
});
enableDevMode(win);

class App extends React.Component {
  render() {
    // theme.
    return e(LocaleProvider, {
    }, e(portal.Pane));
  }
}
ReactDOM.render(e(App), document.getElementById('app'));
