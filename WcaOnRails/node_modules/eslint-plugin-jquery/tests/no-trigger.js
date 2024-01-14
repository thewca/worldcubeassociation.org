'use strict'

const rule = require('../rules/no-trigger')
const RuleTester = require('eslint').RuleTester

const error = 'Prefer dispatchEvent to $.trigger'

const ruleTester = new RuleTester()
ruleTester.run('no-trigger', rule, {
  valid: ['trigger()', '[].trigger()', 'div.trigger()', 'div.trigger'],
  invalid: [
    {
      code: '$("div").trigger()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$div.trigger()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().trigger()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").trigger())',
      errors: [{message: error, type: 'CallExpression'}]
    }
  ]
})
