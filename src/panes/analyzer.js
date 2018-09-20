/**
 * Build analyzer
 */
const {
  React,
  e
} = require('../deps/env');
const {
  Row,
  Col
} = require('antd');

class Pane extends React.Component {
  render() {
    return e('div', {}, ...[
      e(Row, {}, ...[
        e(Col, {}, `Analyzer`)
      ])
    ]);
  }
}
exports.Pane = Pane;
