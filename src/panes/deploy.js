/**
 * Deploy & Build
 */
const {
  React,
  e,
  yaCommand,
  isDev,
  escapeLogMessage,
  profilePath
  // topToolbar
} = require('../deps/env');
const { spawn } = require('child_process');
const {
  Upload,
  Button,
  Row,
  Col,
  message
} = require('antd');
const {
  capitalize
} = require('lodash');
const path = require('path');
const fsExtra = require('fs-extra');
const terminate = require('terminate');
const {
  Comp: PkgForm
} = require('../modules/pkg-form');

class Pane extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pkgFilePath: '',
      pkgFields: {
        name: '',
        version: '',
        description: ''
      },
      deployStatus: '', // doing, success, error
      buildStatus: '',
      accStatus: '',
      eslintStatus: ''
    };
  }
  shouldComponentUpdate(nextProps, nextState) {
    if (JSON.stringify(nextProps) === JSON.stringify(this.props) && this.state === nextState) {
      return false;
    }
    return true;
  }
  componentDidMount() {
    this.initLogger();
    this.initMenu();
    const profile = fsExtra.readJsonSync(profilePath, { throws: false }) || {};
    if (profile.lastPkgPath) {
      this.setPkgJson(profile.lastPkgPath);
    }
  }
  render() {
    const state = this.state;
    const pkgFields = state.pkgFields;
    const pkgActionDisabled = this.pkgActionDisabled;
    const {
      pkgFilePath
    } = state;
    return e('div', {
      style: {
        position: 'relative',
        height: '100%'
      }
    }, ...[
      e(Row, {
        type: 'flex',
        align: 'middle',
        justify: 'space-between'
      }, ...[
        e(Col, {}, e(Upload, {
          showUploadList: false,
          beforeUpload() {
            return false;
          },
          onChange: (data) => {
            const filePath = data.file.path;
            const basename = path.basename(filePath);
            if (basename !== 'package.json') {
              message.error('You need select a package.json file in project');
            } else {
              this.setPkgJson(filePath);
              // Save the last package.json path
              const profile = fsExtra.readJsonSync(profilePath, { throws: false }) || {};
              fsExtra.writeJsonSync(profilePath, {
                ...profile,
                lastPkgPath: filePath
              }, {
                spaces: 2
              });
            }
          }
        }, e(Button, {
          disabled: pkgActionDisabled
        }, 'Select package.json'))),
        e(Col, {
          style: {
            marginLeft: '8px',
            fontStyle: 'italic',
            color: '#262626',
            textDecoration: 'underline'
          }
        }, pkgFilePath)
      ]),
      e('div', {
        style: {
          paddingRight: '40px',
          marginTop: '16px'
        }
      }, e(PkgForm, {
        pkgActionDisabled,
        onSubmit: (values) => {
          const {
            pkgFilePath
          } = state;
          if (!pkgFilePath) {
            message.error('Please select a package.json first');
          } else {
            const pkgJson = fsExtra.readJsonSync(pkgFilePath);
            fsExtra.writeJsonSync(pkgFilePath, {
              ...pkgJson,
              ...values
            }, {
              spaces: 2
            });
            message.success('Upgrade package.json success');
          }
        },
        ref: (ctor) => {
          // this.pkgForm = form;
          if (ctor) {
            const form = ctor.getForm();
            form.setFieldsValue({
              ...pkgFields
            });
            // this.pkgForm = form;
          }
        }
      })),
      e('div', {
        style: {
          position: 'absolute',
          bottom: '0',
          left: '0',
          width: '100%'
        }
      }, ...[ // footer
        e('div', {
          style: {
            marginBottom: '8px'
          }
        }, 'For Below log output, please click context menu choose relevant item.'),
        e(Row, {
          type: 'flex',
          justify: 'space-between'
        }, ...[
          e(Col, {
          }, ...[
            e(Button, {
              type: 'primary',
              loading: state.accStatus === 'doing',
              onClick: () => {
                this.handleDriver('acc');
              },
              style: {
                marginRight: '8px'
              }
            }, 'Accelerate'),
            e(Button, {
              type: 'primary',
              loading: state.deployStatus === 'doing',
              onClick: () => {
                this.handleDriver('deploy');
              },
              style: {
                marginRight: '8px'
              }
            }, 'Deploy'),
            e(Button, {
              type: 'primary',
              loading: state.buildStatus === 'doing',
              onClick: () => {
                this.handleDriver('build');
              },
              style: {
                marginRight: '8px'
              }
            }, 'Build test'),
            e(Button, {
              type: 'primary',
              loading: state.eslintStatus === 'doing',
              onClick: () => {
                this.handleDriver('eslint');
              }
            }, 'ESLint setup')
          ]),
          e(Col, {}, ...[
            e(Button, {
              type: 'danger',
              ghost: true,
              onClick: () => {
                this.setState({
                  deployStatus: '',
                  buildStatus: '',
                  accStatus: ''
                });
                // 尝试终止driver
                ['deploy', 'build', 'acc', 'eslint'].forEach((type) => {
                  const driver = this[`${type}Driver`];
                  if (driver) {
                    terminate(driver.pid, function (err) {
                      if (err) { // you will get an error if you did not supply a valid process.pid
                        console.log('Oopsy: ' + err); // handle errors in your preferred way.
                      }
                    });
                  }
                });
              }
            }, 'Kill')
          ])
        ])
      ])
    ]);
  }
  initLogger() {
    const deployPath = path.resolve(__dirname, '../deploy.html');
    const buildPath = path.resolve(__dirname, '../build.html');
    const accPath = path.resolve(__dirname, '../acc.html');
    const eslintPath = path.resolve(__dirname, '../eslint.html');
    let webviewContainerElt = document.getElementById('webview-container');
    if (!webviewContainerElt) {
      webviewContainerElt = document.createElement('div');
      webviewContainerElt.id = 'webview-container';
      Object.assign(webviewContainerElt.style, {
        position: 'absolute',
        top: '-10000px',
        left: '-10000px'
      });
      document.body.appendChild(webviewContainerElt);
    }
    let htmlStr = '';
    [{
      id: 'deploy',
      filePath: deployPath
    }, {
      id: 'build',
      filePath: buildPath
    }, {
      id: 'acc',
      filePath: accPath
    }, {
      id: 'eslint',
      filePath: eslintPath
    }].forEach(({
      id,
      filePath
    }) => {
      htmlStr += `<webview id="${id}" src="file:///${filePath}" partition="trusted"></webview>`;
    });
    webviewContainerElt.innerHTML = htmlStr;
    const deploy = document.getElementById('deploy');
    const build = document.getElementById('build');
    const acc = document.getElementById('acc');
    const eslint = document.getElementById('eslint');

    this.deploy = deploy;
    this.build = build;
    this.acc = acc;
    this.eslint = eslint;
  }
  initMenu() {
    const props = this.props;
    const dev = isDev();
    const menu = dev ? props.topBar : new nw.Menu({
      type: 'contextmenu'
    });
    menu.append(new nw.MenuItem({
      label: 'Open deploy log',
      click: () => {
        this.deploy.showDevTools(true);
      }
    }));
    menu.append(new nw.MenuItem({
      label: 'Open build log',
      click: () => {
        this.build.showDevTools(true);
      }
    }));
    menu.append(new nw.MenuItem({
      label: 'Open accelerate log',
      click: () => {
        this.acc.showDevTools(true);
      }
    }));
    menu.append(new nw.MenuItem({
      label: 'Open eslint log',
      click: () => {
        this.eslint.showDevTools(true);
      }
    }));
    if (!dev) {
      document.body.addEventListener('contextmenu', function (evt) {
        evt.preventDefault();
        menu.popup(evt.x, evt.y);
      });
    } else {
      // Need assign
      nw.Window.get().menu = menu;
    }
    this.menu = menu;
  }
  setPkgJson(filePath) {
    let pkgJson = fsExtra.readJsonSync(filePath, { throws: false });
    if (!pkgJson) {
      filePath = '';
      pkgJson = {
        name: '',
        version: '',
        description: ''
      };
    }
    this.setState({
      pkgFilePath: filePath,
      pkgFields: {
        name: pkgJson.name,
        version: pkgJson.version,
        description: pkgJson.description
      }
    });
  }
  /**
   * Handle driver run
   * @param {String} type - deploy & build
   */
  handleDriver(type) {
    const logger = this[type];
    let driver = this[`${type}Driver`];
    const state = this.state;
    const driverStatus = state[`${type}Status`];
    if (!this.projectPath) {
      message.error(`Please choose a package.json first`);
      return;
    }
    if (driverStatus === 'doing') {
      message.error(`${capitalize(type)} is running, please waiting`);
    } else {
      if (driver) {
        terminate(driver.pid, function (err) {
          if (err) { // you will get an error if you did not supply a valid process.pid
            console.log('Oopsy: ' + err); // handle errors in your preferred way.
          }
        });
      }
      // Auto open dev tools
      logger.showDevTools(true);
      this.setState({
        [`${type}Status`]: 'doing'
      });
      if (type === 'deploy') {
        driver = spawn('node', [yaCommand, 'serve', this.projectPath, '--mock'], {
          // silent: true
          stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ]
        });
      } else if (type === 'build') {
        driver = spawn('node', [yaCommand, 'build', this.projectPath, '--app-env', 'local'], {
          // silent: true
          stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ]
        });
      } else if (type === 'acc') {
        driver = spawn('node', [yaCommand, 'acc', this.projectPath], {
          // silent: true
          stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ]
        });
      } else if (type === 'eslint') {
        driver = spawn('node', [yaCommand, 'eslint', this.projectPath], {
          // silent: true
          stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ]
        });
      }
      driver.on('message', (data) => {
        if (data.action === 'compiled' || data.action === 'complete') { // eslint send complete action
          this.setState({
            [`${type}Status`]: 'success'
          });
          if (type === 'build') {
            this.props.onPanePipe({
              action: 'analyzerCompleted'
            });
          }
        }
      });
      driver.stdout.on('data', (data) => {
        /* ... do something with data ... */
        logger.executeScript({
          code: `console.log(\`${escapeLogMessage(data)}\`)`
        });
      });
      driver.stderr.on('data', (data) => {
        /* ... do something with data ... */
        // TODO: 不能区分中断是否影响到compile正常进行，暂时加延时kill
        // this.setState({
        //   [`${type}Status`]: 'error'
        // });
        logger.executeScript({
          code: `console.log(\`${escapeLogMessage(data)}\`)`
        });
      });
      this[`${type}Driver`] = driver;
    }
  }
  get projectPath() {
    const state = this.state;
    const pkgFilePath = state.pkgFilePath;
    if (pkgFilePath) {
      return path.dirname(pkgFilePath);
    } else {
      return '';
    }
  }
  get pkgActionDisabled() {
    const state = this.state;
    return state.deployStatus === 'doing' || state.buildStatus === 'doing' || state.accStatus === 'doing';
  }
}

exports.Pane = Pane;
