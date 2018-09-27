/**
 * Create a project
 */
const {
  React,
  ReactDOM,
  e,
  yaCommand,
  escapeLogMessage
} = require('../deps/env');
const {
  Row,
  Col,
  message,
  Upload,
  Button
} = require('antd');
const path = require('path');
const fsExtra = require('fs-extra');
const { spawn } = require('child_process');
const terminate = require('terminate');
const {
  Comp: PkgForm
} = require('../modules/pkg-form');

class Pane extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      outputPath: '',
      status: '', // doing, success, error
      pkgJson: {
        name: '',
        description: ''
      }
    };
  }
  render() {
    const state = this.state;
    const outputPath = state.outputPath;

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
          ref: (cpt) => {
            const elt = ReactDOM.findDOMNode(cpt);
            if (elt) {
              const fileElt = elt.querySelector('[type="file"]');
              if (fileElt) {
                fileElt.setAttribute('nwdirectory', true);
              }
            }
            this.uploadElt = elt;
          },
          beforeUpload: () => {
            return false;
          },
          onChange: (data) => {
            const filePath = data.file.path;
            this.setState({
              outputPath: filePath
            });
            // Polyfill for nwdirectory maintain
            setTimeout(() => {
              if (this.uploadElt) {
                const fileElt = this.uploadElt.querySelector('[type="file"]');
                if (fileElt) {
                  fileElt.setAttribute('nwdirectory', true);
                }
              }
            }, 30);
          }
        }, e(Button, {
        }, 'Select parent directory'))),
        e(Col, {
          style: {
            marginLeft: '8px',
            fontStyle: 'italic',
            color: '#262626',
            textDecoration: 'underline'
          }
        }, outputPath)
      ]),
      e('div', {
        style: {
          paddingRight: '40px',
          marginTop: '16px'
        }
      }, e(PkgForm, {
        pkgActionDisabled: false,
        loading: state.status === 'doing',
        ref: (cpt) => {
          if (cpt) {
            const form = cpt.getForm();
            this.form = form;
          }
        },
        onSubmit: (values) => {
          const {
            outputPath
          } = state;
          const {
            name
          } = values;
          if (!outputPath) {
            message.error('Please select a parent directory first');
          } else {
            const createEngine = this.createEngine;
            const run = () => {
              const projectPath = path.resolve(outputPath, name);
              fsExtra.ensureDirSync(projectPath);
              this.createEngine = spawn('node', [yaCommand, 'create', projectPath, '--force'], {
                // silent: true
                stdio: [ 'pipe', 'pipe', 'pipe', 'ipc' ]
              });
              this.createEngine.on('message', (data) => {
                if (data.action === 'created') {
                  let status = '';
                  if (data.data) {
                    status = 'success';
                    const pkgFilePath = path.resolve(projectPath, 'package.json');
                    const pkgJson = fsExtra.readJsonSync(pkgFilePath);
                    fsExtra.writeJsonSync(pkgFilePath, {
                      ...pkgJson,
                      ...values
                    }, {
                      spaces: 2
                    });
                    if (this.form) {
                      this.form.setFieldsValue({
                        name: '',
                        version: '',
                        description: ''
                      });
                    }
                    message.success(`Create ${name} success`);
                  } else {
                    message.error(`Create ${name} error`);
                    status = 'error';
                  }
                  this.setState({
                    status
                  });
                }
              });
              this.createEngine.stdout.on('data', (data) => {
                /* ... do something with data ... */
                console.log(escapeLogMessage(data));
              });
              this.createEngine.stderr.on('data', (data) => {
                console.error(escapeLogMessage(data));
              });
            }
            this.setState({
              status: 'doing'
            });
            if (createEngine) {
              terminate(createEngine.pid, (err) => {
                if (err) { // you will get an error if you did not supply a valid process.pid
                  console.log('Oopsy: ' + err); // handle errors in your preferred way.
                }
                run();
              });
            } else {
              run();
            }
          }
        }
      }))
    ]);
  }
}

exports.Pane = Pane;
