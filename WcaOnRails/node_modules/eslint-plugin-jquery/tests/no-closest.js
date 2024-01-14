'use strict'

const rule = require('../rules/no-closest')
const RuleTester = require('eslint').RuleTester

const error = 'Prefer closest to $.closest'

const ruleTester = new RuleTester()
ruleTester.run('no-closest', rule, {
  valid: ['closest()', '[].closest()', 'div.closest()', 'div.closest'],
  invalid: [
    {
      code: '$("div").closest()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$div.closest()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().closest()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").closest())',
      errors: [{message: error, type: 'CallExpression'}]
    }
  ]
})
