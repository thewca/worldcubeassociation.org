'use strict'

const rule = require('../rules/no-map')
const RuleTester = require('eslint').RuleTester

const error = 'Prefer Array#map to $.map'

const ruleTester = new RuleTester()
ruleTester.run('no-map', rule, {
  valid: ['map()', '[].map()', 'div.map()', 'div.map'],
  invalid: [
    {
      code: '$.map()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").map()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$div.map()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().map()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").map())',
      errors: [{message: error, type: 'CallExpression'}]
    }
  ]
})
