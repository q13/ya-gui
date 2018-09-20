/**
 * Main pane
 */
const {
  React,
  e
} = require('../deps/env');
const {
  Icon,
  Upload,
  Button,
  Row,
  Col
} = require('antd');
const {
  Pane: Sidebar
} = require('./sidebar');

/**
 * 获取pane constructor
 * @param {String} name - pane name
 */
const getMainPane = (name) => {
  return require(`./${name}.js`).Pane;
};
class Pane extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      panes: [{
        key: 'deploy',
        isActive: true,
        Pane: require('./deploy').Pane
      }, {
        key: 'analyzer',
        isActive: false,
        Pane: require('./analyzer').Pane
      }]
    };
  }
  render() {
    const state = this.state;
    const panes = state.panes;
    return e(Row, {
      type: 'flex'
    }, ...[
      e(Col, {
        span: 4
      }, e(Sidebar, {
        onMenuClick: (paneName) => {
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
        }, e(pane.Pane));
      }))
    ]);
  }
}

exports.Pane = Pane;
