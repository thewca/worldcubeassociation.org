'use strict'

const rule = require('../rules/no-html')
const RuleTester = require('eslint').RuleTester

const error = 'Prefer innerHTML to $.html'

const ruleTester = new RuleTester()
ruleTester.run('no-html', rule, {
  valid: ['html()', '[].html()', 'div.html()', 'div.html'],
  invalid: [
    {
      code: '$("div").html()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$div.html()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().html()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").html())',
      errors: [{message: error, type: 'CallExpression'}]
    }
  ]
})
