/**
 * API
 */
const {
  React,
  e
} = require('../deps/env');
const {
  Button,
  Row,
  Col
} = require('antd');

class Pane extends React.Component {
  componentDidUpdate() {
    this.reload();
  }
  render() {
    const props = this.props;
    const {
      apiPath = ''
    } = props;
    return e('div', {}, ...[
      e(Row, {
        type: 'flex',
        align: 'middle',
        justify: 'space-between',
        style: {
          marginBottom: '8px'
        }
      }, ...[
        e(Col, {}, ...[
          e(Button, {
            onClick: () => {
              this.reload();
            }
          }, 'Reload')
        ]),
        e(Col, {}, ...[
          e('span', {
            style: {
              marginLeft: '8px',
              fontStyle: 'italic',
              color: '#262626',
              textDecoration: 'underline'
            }
          }, `${apiPath}`)
        ])
      ]),
      e('div', {
        style: {
          border: '1px solid #d9d9d9'
        }
      }, ...[
        e('iframe', {
          src: `${apiPath}`,
          ref: 'frame',
          frameBorder: 0,
          scrolling: 'no',
          style: {
            width: '100%',
            height: 'calc(100vh - 64px)'
          },
          onLoad: () => {
            const ifrDoc = this.refs.frame.contentWindow.document.documentElement;
            const ifrBody = this.refs.frame.contentWindow.document.body;
            // iframe内部加入滚动条
            ifrDoc.style.overflow = 'auto';
            ifrBody.style.overflow = 'auto';
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
