'use strict'

const rule = require('../rules/no-submit')
const RuleTester = require('eslint').RuleTester

const error = 'Prefer dispatchEvent + form.submit() to $.submit'

const ruleTester = new RuleTester()
ruleTester.run('no-submit', rule, {
  valid: ['submit()', '[].submit()', 'form.submit()', 'form.submit'],
  invalid: [
    {
      code: '$("form").submit()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$form.submit()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("form").first().submit()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("form").append($("input").submit())',
      errors: [{message: error, type: 'CallExpression'}]
    }
  ]
})
