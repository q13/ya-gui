/**
 * Main pane
 */
const {
  React,
  e,
  profilePath
} = require('../deps/env');
const {
  Row,
  Col
} = require('antd');
const {
  Pane: Sidebar
} = require('./sidebar');
const {
  withTopBarConsumer
} = require('../modules/top-bar.js');
const {
  getApiTemplateUri
} = require('../deps/helper');
const fsExtra = require('fs-extra');
const path = require('path');

class Pane extends React.Component {
  constructor(props) {
    super(props);
    const state = {
      panes: [{
        key: 'create',
        label: 'Create',
        icon: 'project',
        isActive: false,
        Pane: require('./create').Pane
      }, {
        key: 'deploy',
        label: 'Deploy',
        icon: 'build',
        isActive: true,
        Pane: require('./deploy').Pane
      }, {
        key: 'analyzer',
        label: 'Build analyzer',
        icon: 'pie-chart',
        isActive: false,
        Pane: require('./analyzer').Pane
      }, {
        key: 'coverage',
        label: 'Code coverage',
        icon: 'deployment-unit',
        isActive: false,
        Pane: require('./coverage').Pane
      }, {
        key: 'api',
        label: 'API documentation',
        icon: 'read',
        isActive: false,
        Pane: require('./api').Pane
      }].map((item) => {
        return {
          ...item,
          Pane: withTopBarConsumer(item.Pane)
        }
      }),
      codeCoverageReporterPath: '', // current code coverage reporter path
      apiPath: '', // API documentation
      projectPath: '' // Current project path
    };
    // 设置默认api path
    if (profilePath) {
      const profile = fsExtra.readJsonSync(profilePath, { throws: false });
      if (profile) {
        const lastPkgPath = profile.lastPkgPath;
        state.apiPath = getApiTemplateUri(lastPkgPath);
        state.projectPath = path.dirname(lastPkgPath);
      }
    }
    this.state = state;
  }
  render() {
    const state = this.state;
    const panes = state.panes;
    const selectedKey = state.panes.find((item) => {
      return item.isActive;
    }).key;
    return e(Row, {
      type: 'flex'
    }, ...[
      e(Col, {
        span: 4
      }, e(Sidebar, {
        selectedKey,
        menus: panes.map(({
          key,
          label,
          icon
        }) => {
          return {
            key,
            label,
            icon
          };
        }),
        onMenuClick: (paneName) => {
          this.activePane(paneName);
        }
      })),
      e(Col, {
        span: 20,
        style: {
          padding: '8px'
        }
      }, panes.map((pane) => {
        let paneProps = {
          ref: pane.key,
          onPanePipe: ({ action, data }) => {
            if (action === 'analyzerCompleted') {
              this.activePane('analyzer');
            } else if (action === 'testCompleted') {
              const {
                projectPath
              } = data;
              this.activePane('coverage');
              this.setState({
                codeCoverageReporterPath: `file://${encodeURI(projectPath.replace(/\\/g, '/'))}/coverage/report/index.html`
              });
            } else if (action === 'apiInitialized') {
              const {
                projectPath,
                templateUri
              } = data;
              this.activePane('api');
              this.setState({
                projectPath,
                apiPath: `file://${encodeURI(templateUri.replace(/\\/g, '/'))}`
              });
            } else if (action === 'apiCompleted') {
              const {
                projectPath,
                templateUri
              } = data;
              this.setState({
                projectPath,
                apiPath: `file://${encodeURI(templateUri.replace(/\\/g, '/'))}`
              });
            }
          }
        };
        if (pane.key === 'coverage') {
          paneProps.reportPath = state.codeCoverageReporterPath;
        } else if (pane.key === 'api') {
          paneProps.apiPath = state.apiPath;
          paneProps.projectPath = state.projectPath;
        }
        return e('div', {
          key: pane.key,
          style: {
            display: pane.isActive ? 'block' : 'none',
            height: '100%'
          }
        }, e(pane.Pane, paneProps));
      }))
    ]);
  }
  activePane(paneName) {
    this.setState((state) => {
      return {
        ...state,
        panes: state.panes.map((item) => {
          return {
            ...item,
            isActive: paneName === item.key
          };
        })
      };
    });
  }
}

exports.Pane = Pane;
