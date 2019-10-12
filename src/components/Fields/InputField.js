import Field from './Field'

export default class InputField extends Field {
  constructor (parent, options) {
    super(parent, options)
    this.component = 'u-input'
    this.events = ['input', 'on-blur'] //记录哪些事件要抛出
  }
}
