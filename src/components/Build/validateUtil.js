import AsyncValidator from 'async-validator';
import AsyncValidatorLang from '../locale/async-validator'

export const validateRule = function (value, fieldname, validateResult) {
  let result = validateResult[fieldname]
  if (!result) return
  if (result.rule.length > 0) {
    result.validateState = 'validating'
    const validator = new AsyncValidator({[fieldname]: result.rule})
    validator.messages(AsyncValidatorLang)
    validator.validate(value, { firstFields: true }, (errors, fields) => {
        result.validateState = !errors ? 'success' : 'error'
        result.error = errors ? errors[0].message : ''
    }) /* .then(() => {
      result.validateState = 'success'
      result.error = ''
    }).catch(({errors, fields}) => {
      result.validateState = 'error'
      result.error = errors[0].message
    }) */
  }
}
