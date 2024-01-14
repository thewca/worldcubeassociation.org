'use strict'

const rule = require('../rules/no-parents')
const RuleTester = require('eslint').RuleTester

const error = 'Prefer closest to $.parents'

const ruleTester = new RuleTester()
ruleTester.run('no-parents', rule, {
  valid: ['parents()', '[].parents()', 'div.parents()', 'div.parents'],
  invalid: [
    {
      code: '$("div").parents()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$div.parents()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().parents()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").parents())',
      errors: [{message: error, type: 'CallExpression'}]
    }
  ]
})
