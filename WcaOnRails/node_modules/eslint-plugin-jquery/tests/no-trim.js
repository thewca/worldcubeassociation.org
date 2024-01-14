'use strict'

const rule = require('../rules/no-trim')
const RuleTester = require('eslint').RuleTester

const error = 'Prefer String#trim to $.trim'

const ruleTester = new RuleTester()
ruleTester.run('no-trim', rule, {
  valid: ['trim()', '"test".trim()', '"test".trim'],
  invalid: [
    {
      code: '$.trim()',
      errors: [{message: error, type: 'CallExpression'}]
    }
  ]
})
