/**
 * Deploy & Build
 */
const {
  React,
  e,
  yaCommand,
  isDev
} = require('../deps/env');
const { spawn } = require('child_process');
const {
  Upload,
  Button,
  Row,
  Col,
  message,
  Form,
  Input
} = require('antd');
const {
  capitalize
} = require('lodash');
const path = require('path');
const fsExtra = require('fs-extra');
const terminate = require('terminate');

const FormItem = Form.Item;
const { TextArea } = Input;

class PkgForm extends React.Component {
  render() {
    const {
      pkgActionDisabled
    } = this.props;
    const { getFieldDecorator } = this.props.form;
    // console.log(this.props.form.setFieldsValue);
    const formItemLayout = {
      labelCol: {
        xs: { span: 4 },
        sm: { span: 4 }
      },
      wrapperCol: {
        xs: { span: 20 },
        sm: { span: 20 }
      }
    };
    return e(Form, {
      onSubmit: (evt) => {
        evt.preventDefault();
        this.props.form.validateFieldsAndScroll((err, values) => {
          if (!err) {
            console.log('Received values of form: ', values);
            this.props.onSubmit(values);
          }
        });
      }
    }, ...[
      e(FormItem, {
        ...formItemLayout,
        label: 'Name'
      }, getFieldDecorator('name', {
        rules: [{
          required: true,
          message: 'Please input the project name'
        }]
      })(e(Input))),
      e(FormItem, {
        ...formItemLayout,
        label: 'Description'
      }, getFieldDecorator('description', {
        rules: [{
          required: true,
          message: 'Please input the project description'
        }]
      })(e(TextArea, {
        rows: 4
      }))),
      e(FormItem, {
        style: {
          textAlign: 'right'
        }
      }, e(Button, {
        type: 'primary',
        htmlType: 'submit',
        disabled: pkgActionDisabled
      }, 'Save'))
    ]);
  }
}

class Pane extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pkgFilePath: '',
      pkgFields: {
        name: '',
        description: ''
      },
      deployStatus: '', // doing, success, error
      buildStatus: '',
      accStatus: ''
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
              const pkgJson = fsExtra.readJsonSync(filePath);
              this.setState({
                pkgFilePath: filePath,
                pkgFields: {
                  name: pkgJson.name,
                  description: pkgJson.description
                }
              });
            }
          }
        }, e(Button, {
          disabled: pkgActionDisabled
        }, 'Select package.json'))),
        e(Col, {
          style: {
            marginLeft: '8px'
          }
        }, pkgFilePath)
      ]),
      e('div', {
        style: {
          paddingRight: '32px',
          marginTop: '16px'
        }
      }, e(Form.create({
      })(PkgForm), {
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
        id: 'deploy-container',
        style: {
          position: 'absolute',
          top: '-10000px',
          left: '-10000px'
        }
      }),
      e('div', {
        id: 'build-container',
        style: {
          position: 'absolute',
          top: '-10000px',
          left: '-10000px'
        }
      }),
      e('div', {
        id: 'acc-container',
        style: {
          position: 'absolute',
          top: '-10000px',
          left: '-10000px'
        }
      }),
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
              }
            }, 'Build test')
          ]),
          e(Col, {}, ...[
            e(Button, {
              onClick: () => {
                this.setState({
                  deployStatus: '',
                  buildStatus: '',
                  accStatus: ''
                });
                // 尝试终止driver
                ['deploy', 'build', 'acc'].forEach((type) => {
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
    document.getElementById('deploy-container').innerHTML = `<webview id="deploy" src="file:///${deployPath}" partition="trusted"></webview>`;
    document.getElementById('build-container').innerHTML = `<webview id="build" src="file:///${buildPath}" partition="trusted"></webview>`;
    document.getElementById('acc-container').innerHTML = `<webview id="acc" src="file:///${accPath}" partition="trusted"></webview>`;
    const deploy = document.getElementById('deploy');
    const build = document.getElementById('build');
    const acc = document.getElementById('acc');
    this.deploy = deploy;
    this.build = build;
    this.acc = acc;
  }
  initMenu() {
    const dev = isDev();
    const menu = new nw.Menu({
      type: dev ? 'menubar' : 'contextmenu'
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
    if (dev) {
      nw.Window.get().menu = menu;
    } else {
      document.body.addEventListener('contextmenu', function (evt) {
        evt.preventDefault();
        menu.popup(evt.x, evt.y);
      });
    }
    this.menu = menu;
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
        driver = spawn('node', [yaCommand, 'serve', this.projectPath], {
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
      }
      driver.on('message', (data) => {
        if (data.action === 'compiled') {
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

/**
 * Escape log message
 */
function escapeLogMessage(data) {
  return data.toString('utf8').replace(/\\/g, '\\\\').replace(/`/g, '\\`');
}
exports.Pane = Pane;
