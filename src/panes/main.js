/**
 * Main pane
 */
const {
  React,
  e
} = require('../deps/env');
const Button = require('react-uwp/Button');

console.log(Button.default);

class Main extends React.Component {
  render() {
    return e('div', {
    }, e(Button.default, {
    }, 'Hello world'));
  }
}

exports.Pane = Main;
