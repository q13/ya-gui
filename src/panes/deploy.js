/**
 * Deploy & Build
 */
const {
  React,
  e,
  yaCommand
} = require('../deps/env');
const {
  exec
} = require('shelljs');
const {
  Menu,
  Icon,
  Upload,
  Button,
  Row,
  Col,
  message,
  Form,
  Input
} = require('antd');
const path = require('path');
const fsExtra = require('fs-extra');
const terminate = require('terminate');
const {
  Terminal
} = require('xterm');

const fit = require('xterm/lib/addons/fit/fit');
Terminal.applyAddon(fit); // Apply the `fit` addon

const FormItem = Form.Item;
const { TextArea } = Input;

class PkgForm extends React.Component {
  render() {
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
        htmlType: 'submit'
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
      }
    };
  }
  shouldComponentUpdate(nextProps, nextState) {
    if (JSON.stringify(nextProps) === JSON.stringify(this.props) && this.state === nextState) {
      return false;
    }
    return true;
  }
  componentDidMount() {
    const xterm = new Terminal({
    });
    xterm.open(document.getElementById('terminal'));
    xterm.fit();
    this.terminal = xterm;
  }
  render() {
    const state = this.state;
    const pkgFields = state.pkgFields;
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
        }, e(Button, {}, 'Select package.json'))),
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
        id: 'terminal',
        style: {
          height: '220px'
        }
      }),
      e('div', {
        style: {
          position: 'absolute',
          bottom: '0',
          left: '0'
        }
      }, ...[ // footer
        e(Button, {
          type: 'primary',
          onClick: () => {
            if (this.childProcess) {
              // this.childProcess.kill('SIGHUP'); // 先干掉
              // this.childProcess.kill('SIGSTOP'); // 先干掉
              // this.childProcess.kill('SIGCHLD'); // 先干掉
              console.log('pid', this.childProcess.pid);
              console.log('kill');
              // this.childProcess.kill('SIGINT');
              terminate(this.childProcess.pid, function (err) {
                if (err) { // you will get an error if you did not supply a valid process.pid
                  console.log('Oopsy: ' + err); // handle errors in your preferred way.
                }
                else {
                  console.log('done'); // terminating the Processes succeeded.
                }
              });

              // process.kill(this.childProcess.pid);
            }
            const childProcess = exec(`node ${yaCommand} serve ${this.projectPath}`, {
              async: true
            });
            childProcess.stdout.on('data', (data) => {
              /* ... do something with data ... */
              console.log(data);
              this.terminal.write(data);
            });
            childProcess.stderr.on('data', function (data) {
              /* ... do something with data ... */
              console.log(data);
            });
            this.childProcess = childProcess;
          }
        }, 'Deploy')
      ])
    ]);
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
}
exports.Pane = Pane;
