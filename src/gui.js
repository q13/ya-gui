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
// const terminate = require('terminate');
const {
  withTopBarProvider
} = require('./modules/top-bar.js');
const {
  fetchRemotePkgJson,
  getDriverPids,
  terminatePids
} = require('./deps/helper');
const {
  notification
} = require('antd');
const pkgJson = require('../package.json');

let win = nw.Window.get();
win.on('close', function () {
  win = null;
  const pids = getDriverPids();
  terminatePids(pids, () => {
    this.close(true); // really close
  });
  // terminate(process.pid, (err) => {
  //   if (err) { // you will get an error if you did not supply a valid process.pid
  //     console.error(`Something is wrong, may you kill nw process manually`);
  //   } else {
  //     console.log('done'); // terminating the Processes succeeded.
  //   }
  //   this.close(true); // really close
  // });
});
enableDevMode(win);

class App extends React.Component {
  componentDidMount() {
    // Check version
    fetchRemotePkgJson(({
      flag,
      data
    }) => {
      if (flag) {
        if (data.version !== pkgJson.version) { // Need upgrade
          notification.info({
            message: 'A new version available',
            description: 'Click Help -> Upgrade menu to upgrade'
          });
        }
      }
    });
  }
  render() {
    // theme.
    return e(LocaleProvider, {
    }, e(portal.Pane));
  }
}
ReactDOM.render(e(withTopBarProvider(App)), document.getElementById('app'));
