/**
 * Create package.json form
 */
const {
  React,
  e
} = require('../deps/env');
const {
  Button,
  Form,
  Input
} = require('antd');
const FormItem = Form.Item;
const { TextArea } = Input;

class PkgForm extends React.Component {
  render() {
    const {
      pkgActionDisabled,
      loading = false
    } = this.props;
    const { getFieldDecorator } = this.props.form;
    // console.log(this.props.form.setFieldsValue);
    const formItemLayout = {
      labelCol: {
        xs: { span: 4 },
        sm: { span: 4 }
      },
      wrapperCol: {
        xs: { span: 20 },
        sm: { span: 20 }
      }
    };
    return e(Form, {
      onSubmit: (evt) => {
        evt.preventDefault();
        this.props.form.validateFieldsAndScroll((err, values) => {
          if (!err) {
            console.log('Received values of form: ', values);
            this.props.onSubmit(values);
          }
        });
      }
    }, ...[
      e(FormItem, {
        ...formItemLayout,
        label: 'Name'
      }, getFieldDecorator('name', {
        rules: [{
          required: true,
          message: 'Please input the project name'
        }]
      })(e(Input))),
      e(FormItem, {
        ...formItemLayout,
        label: 'Description'
      }, getFieldDecorator('description', {
        rules: [{
          required: true,
          message: 'Please input the project description'
        }]
      })(e(TextArea, {
        rows: 4
      }))),
      e(FormItem, {
        style: {
          textAlign: 'right'
        }
      }, e(Button, {
        type: 'primary',
        htmlType: 'submit',
        disabled: pkgActionDisabled,
        loading
      }, 'Save'))
    ]);
  }
}

exports.Comp = Form.create({})(PkgForm);
