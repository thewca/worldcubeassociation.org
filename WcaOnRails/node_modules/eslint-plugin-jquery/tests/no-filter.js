'use strict'

const rule = require('../rules/no-filter')
const RuleTester = require('eslint').RuleTester

const error = 'Prefer Array#filter to $.filter'

const ruleTester = new RuleTester()
ruleTester.run('no-filter', rule, {
  valid: ['filter()', '[].filter()', 'div.filter()', 'div.filter'],
  invalid: [
    {
      code: '$("div").filter()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$div.filter()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().filter()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").filter())',
      errors: [{message: error, type: 'CallExpression'}]
    }
  ]
})
