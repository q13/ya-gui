/**
 * Sidebar
 */
const {
  React,
  e
} = require('../deps/env');
const {
  Menu,
  Icon
} = require('antd');

const MenuItem = Menu.Item;

class Pane extends React.Component {
  constructor(props) {
    super(props);
    this.handleMenuClick = this.handleMenuClick.bind(this);
  }
  render() {
    const props = this.props;
    return e(Menu, {
      mode: 'inline',
      theme: 'dark',
      style: {
        height: '100vh'
      },
      selectedKeys: [props.selectedKey],
      onClick: this.handleMenuClick
    }, [
      e(MenuItem, {
        key: 'deploy'
      }, ...[ // array形式传递children会导致react提示输入key值
        e(Icon, {
          type: 'desktop'
        }),
        e('span', {
        }, 'Deploy & Build')
      ]),
      e(MenuItem, {
        key: 'analyzer'
      }, ...[
        e(Icon, {
          type: 'pie-chart'
        }),
        e('span', {
        }, 'Build analyzer')
      ])
    ]);
  }
  handleMenuClick({
    key
  }) {
    this.props.onMenuClick.call(this, key);
  }
}
exports.Pane = Pane;
