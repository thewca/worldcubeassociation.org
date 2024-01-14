'use strict'

const rule = require('../rules/no-is-function')
const RuleTester = require('eslint').RuleTester

const error = 'Prefer typeof to $.isFunction'

const ruleTester = new RuleTester()
ruleTester.run('no-function', rule, {
  valid: ['isFunction()', 'myClass.isFunction()'],
  invalid: [
    {
      code: '$.isFunction()',
      errors: [{message: error, type: 'CallExpression'}]
    }
  ]
})
