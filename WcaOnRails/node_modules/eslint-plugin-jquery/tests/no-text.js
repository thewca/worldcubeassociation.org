'use strict'

const rule = require('../rules/no-text')
const RuleTester = require('eslint').RuleTester

const error = 'Prefer textContent to $.text'

const ruleTester = new RuleTester()
ruleTester.run('no-text', rule, {
  valid: ['text()', '[].text()', 'div.text()', 'div.text'],
  invalid: [
    {
      code: '$("div").text()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$div.text()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().text()',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").text())',
      errors: [{message: error, type: 'CallExpression'}]
    }
  ]
})
