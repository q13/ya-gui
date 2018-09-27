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
        label: 'Analyzer',
        icon: 'pie-chart',
        isActive: false,
        Pane: require('./analyzer').Pane
      }]
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
        return e('div', {
          key: pane.key,
          style: {
            display: pane.isActive ? 'block' : 'none',
            height: '100%'
          }
        }, e(pane.Pane, {
          onPanePipe: ({ action }) => {
            if (action === 'analyzerCompleted') {
              this.activePane('analyzer');
            }
          }
        }));
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
