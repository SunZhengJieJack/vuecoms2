import Field from './Field'

export default class CheckboxField extends Field {
  constructor (parent, options) {
    super(parent, options)
    this.component = 'checkbox'
  }

  getStaticValue (value) {
    let v = ''
    if (value) {
      v = '<i class="ivu-icon ivu-icon-ios-checkbox-outline"></i>'
    } else {
      v = '<i class="ivu-icon ivu-icon-ios-square-outline"></i>'
    }
    return v
  }
}
