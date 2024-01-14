'use strict'

const rule = require('../rules/no-size')
const RuleTester = require('eslint').RuleTester

const error = 'Prefer length to $.size'

const ruleTester = new RuleTester()
ruleTester.run('no-size', rule, {
  valid: ['size()', '[].size()', 'div.size()', 'div.size'],
  invalid: [
    {
      code: '$("div").size()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$div.size()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().size()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").size())',
      errors: [{message: error, type: 'CallExpression'}]
    }
  ]
})
