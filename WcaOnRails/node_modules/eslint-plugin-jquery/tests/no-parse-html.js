'use strict'

const rule = require('../rules/no-parse-html')
const RuleTester = require('eslint').RuleTester

const error = 'Prefer createHTMLDocument to $.parseHTML'

const ruleTester = new RuleTester()
ruleTester.run('no-parse-html', rule, {
  valid: ['parseHTML()', '"test".parseHTML()', '"test".parseHTML'],
  invalid: [
    {
      code: '$.parseHTML()',
      errors: [{message: error, type: 'CallExpression'}]
    }
  ]
})
