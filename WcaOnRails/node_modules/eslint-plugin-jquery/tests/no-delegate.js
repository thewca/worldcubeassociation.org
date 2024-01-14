'use strict'

const rule = require('../rules/no-delegate')
const RuleTester = require('eslint').RuleTester

const error = 'Prefer addEventListener to $.delegate'

const ruleTester = new RuleTester()
ruleTester.run('no-delegate', rule, {
  valid: ['delegate()', '[].delegate()', 'div.delegate()', 'div.delegate'],
  invalid: [
    {
      code: '$("div").delegate()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$div.delegate()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().delegate()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").delegate())',
      errors: [{message: error, type: 'CallExpression'}]
    }
  ]
})
