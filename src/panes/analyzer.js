/**
 * Build analyzer
 */
const {
  React,
  e
} = require('../deps/env');
const {
  Button
} = require('antd');

class Pane extends React.Component {
  componentDidUpdate() {
    this.reload();
  }
  render() {
    return e('div', {}, ...[
      e('div', {
        style: {
          marginBottom: '8px'
        }
      }, ...[
        e(Button, {
          onClick: () => {
            this.reload();
          }
        }, 'Reload')
      ]),
      e('div', {
        style: {
          border: '1px solid #d9d9d9'
        }
      }, ...[
        e('iframe', {
          src: `http://127.0.0.1:8888`,
          ref: 'frame',
          frameborder: 0,
          scrolling: 'no',
          style: {
            width: '100%',
            height: 'calc(100vh - 64px)'
          }
        })
      ])
    ]);
  }
  reload() {
    this.refs.frame.contentWindow.location.reload();
  }
}
exports.Pane = Pane;
