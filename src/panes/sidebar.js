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
    const menus = props.menus;
    return e(Menu, {
      mode: 'inline',
      theme: 'dark',
      style: {
        height: '100vh'
      },
      selectedKeys: [props.selectedKey],
      onClick: this.handleMenuClick
    }, ...menus.map(({
      key,
      label,
      icon
    }) => {
      return e(MenuItem, {
        key
      }, ...[
        e(Icon, {
          type: icon
        }),
        e('span', {
        }, label)
      ])
    }));
  }
  handleMenuClick({
    key
  }) {
    this.props.onMenuClick.call(this, key);
  }
}
exports.Pane = Pane;
