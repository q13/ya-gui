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
const fsExtra = require('fs-extra');
const path = require('path');
const {
  getDevUri
} = require('../deps/helper');

class Pane extends React.Component {
  componentDidUpdate() {
    this.reload();
  }
  shouldComponentUpdate(nextProps) {
    if (this.props.apiPath !== nextProps.apiPath) {
      return true;
    } else {
      this.reload();
      return false;
    }
  }
  render() {
    const props = this.props;
    const iframeKey = new Date() / 1;
    const {
      apiPath = '',
      projectPath = ''
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
          key: iframeKey,
          src: `${apiPath}?v=${iframeKey}`,
          ref: 'frame',
          frameBorder: 0,
          scrolling: 'no',
          style: {
            width: '100%',
            height: 'calc(100vh - 64px)'
          },
          onLoad: () => {
            const ifrWin = this.refs.frame.contentWindow;
            const ifrDoc = ifrWin.document.documentElement;
            const ifrBody = ifrWin.document.body;
            // iframe内部加入滚动条
            ifrDoc.style.overflow = 'auto';
            ifrBody.style.overflow = 'auto';
            ifrBody.addEventListener('click', (evt) => {
              const elts = [evt.target, evt.target.parentNode];
              if (elts.some((elt) => {
                if (elt.tagName.toLowerCase() === 'a') {
                  const href = elt.getAttribute('href');
                  if (href.slice(0, 9) === 'http://#/') {
                    ifrWin.open(getDevUri(projectPath) + href.slice(9));
                    return true;
                  } else if (href.slice(0, 7) === 'http://' || href.slice(0, 8) === 'https://') {
                    ifrWin.open(href);
                    return true;
                  }
                }
              })) {
                evt.preventDefault();
              }
            });
          }
        })
      ])
    ]);
  }
  /**
   * Get project path
   * @param {string} projectPath - Project path
   */
  getProjectPkgJson(projectPath) {
    if (projectPath) {
      const pkgJson = fsExtra.readJsonSync(path.resolve(projectPath, './package.json'), { throws: false });
      return pkgJson;
    }
    return null;
  }
  reload() {
    this.refs.frame.contentWindow.location.reload();
  }
}
exports.Pane = Pane;
