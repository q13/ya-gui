/**
 * Main pane
 */
const {
  React,
  e
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

class Pane extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      panes: [{
        key: 'create',
        label: 'Create',
        icon: 'file-add',
        isActive: false,
        Pane: require('./create').Pane
      }, {
        key: 'deploy',
        label: 'Deploy',
        icon: 'desktop',
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
        icon: 'pie-chart',
        isActive: false,
        Pane: require('./coverage').Pane
      }].map((item) => {
        return {
          ...item,
          Pane: withTopBarConsumer(item.Pane)
        }
      }),
      codeCoverageReporterPath: '' // current code coverage reporter path
    };
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
            }
          }
        };
        if (pane.key === 'coverage') {
          paneProps.reportPath = state.codeCoverageReporterPath;
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
