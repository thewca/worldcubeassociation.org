'use strict'

const rule = require('../rules/no-has')
const RuleTester = require('eslint').RuleTester

const error = '$.has is not allowed'

const ruleTester = new RuleTester()
ruleTester.run('no-has', rule, {
  valid: ['has()', '[].has()', 'div.has()', 'div.has'],
  invalid: [
    {
      code: '$("div").has()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$div.has()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().has()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").has())',
      errors: [{message: error, type: 'CallExpression'}]
    }
  ]
})
