/**
 * Deploy & Build
 */
const {
  React,
  e,
  yaCommand,
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
const {
  getNodeLibBin
} = require('../deps/helper');

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
      eslintStatus: '',
      testStatus: ''
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
        }, 'For Below log output, please click relevant item from top toolbar.'),
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
              },
              style: {
                marginRight: '8px'
              }
            }, 'ESLint setup'),
            e(Button, {
              type: 'primary',
              loading: state.testStatus === 'doing',
              onClick: () => {
                this.handleDriver('test');
              }
            }, 'Unit testing')
          ]),
          e(Col, {}, ...[
            e(Button, {
              type: 'danger',
              ghost: true,
              onClick: () => {
                this.setState({
                  deployStatus: '',
                  buildStatus: '',
                  accStatus: '',
                  eslintStatus: '',
                  testStatus: ''
                });
                // 尝试终止driver
                ['deploy', 'build', 'acc', 'eslint', 'test'].forEach((type) => {
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
    const testPath = path.resolve(__dirname, '../test.html');
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
    }, {
      id: 'test',
      filePath: testPath
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
    const test = document.getElementById('test');

    this.deploy = deploy;
    this.build = build;
    this.acc = acc;
    this.eslint = eslint;
    this.test = test;
  }
  initMenu() {
    const props = this.props;
    const menu = props.topBar;
    const logSubmenu = new nw.Menu(); // Create log sub menu
    logSubmenu.append(new nw.MenuItem({
      label: 'Deploy',
      click: () => {
        this.deploy.showDevTools(true);
      }
    }));
    logSubmenu.append(new nw.MenuItem({
      label: 'Build',
      click: () => {
        this.build.showDevTools(true);
      }
    }));
    logSubmenu.append(new nw.MenuItem({
      label: 'Accelerate',
      click: () => {
        this.acc.showDevTools(true);
      }
    }));
    logSubmenu.append(new nw.MenuItem({
      label: 'ESLint',
      click: () => {
        this.eslint.showDevTools(true);
      }
    }));
    logSubmenu.append(new nw.MenuItem({
      label: 'Unit testing',
      click: () => {
        this.test.showDevTools(true);
      }
    }));
    // Need assign
    menu.append(new nw.MenuItem({
      label: 'Log',
      submenu: logSubmenu
    }));
    nw.Window.get().menu = menu;
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
    const nodeLibBin = getNodeLibBin();
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
        driver = spawn(nodeLibBin, [yaCommand, 'serve', this.projectPath, '--mock'], {
          // silent: true
          stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ]
        });
      } else if (type === 'build') {
        driver = spawn(nodeLibBin, [yaCommand, 'build', this.projectPath, '--app-env', 'local'], {
          // silent: true
          stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ]
        });
      } else if (type === 'acc') {
        driver = spawn(nodeLibBin, [yaCommand, 'acc', this.projectPath], {
          // silent: true
          stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ]
        });
      } else if (type === 'eslint') {
        driver = spawn(nodeLibBin, [yaCommand, 'eslint', this.projectPath], {
          // silent: true
          stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ]
        });
      } else if (type === 'test') {
        driver = spawn(nodeLibBin, [yaCommand, 'test', this.projectPath], {
          cwd: this.projectPath, // TODO://!important: babel-plugin-istanbul依赖process.cwd()获取正确的cwd地址，参见ya-driver/node_modules/babel-plugin-istanbul/lib/index.js 第30行
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
          if (type === 'test') {
            this.props.onPanePipe({
              action: 'testCompleted',
              data: {
                projectPath: this.projectPath
              }
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
