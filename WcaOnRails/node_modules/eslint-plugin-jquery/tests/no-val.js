'use strict'

const rule = require('../rules/no-val')
const RuleTester = require('eslint').RuleTester

const error = 'Prefer value to $.val'

const ruleTester = new RuleTester()
ruleTester.run('no-val', rule, {
  valid: ['val()', '[].val()', 'div.val()', 'div.val'],
  invalid: [
    {
      code: '$("div").val()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$div.val()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().val()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").val())',
      errors: [{message: error, type: 'CallExpression'}]
    }
  ]
})
