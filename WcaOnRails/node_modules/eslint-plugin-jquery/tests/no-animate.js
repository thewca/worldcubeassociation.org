'use strict'

const rule = require('../rules/no-animate')
const RuleTester = require('eslint').RuleTester

const error = '$.animate is not allowed'

const ruleTester = new RuleTester()
ruleTester.run('no-animate', rule, {
  valid: ['animate()', '[].animate()', 'div.animate()', 'div.animate'],
  invalid: [
    {
      code: '$("div").animate()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$div.animate()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().animate()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").animate())',
      errors: [{message: error, type: 'CallExpression'}]
    }
  ]
})
