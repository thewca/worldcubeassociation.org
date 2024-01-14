'use strict'

const rule = require('../rules/no-is-array')
const RuleTester = require('eslint').RuleTester

const error = 'Prefer Array#isArray to $.isArray'

const ruleTester = new RuleTester()
ruleTester.run('no-in-array', rule, {
  valid: ['isArray()', '"test".isArray()', '"test".isArray'],
  invalid: [
    {
      code: '$.isArray()',
      errors: [{message: error, type: 'CallExpression'}]
    }
  ]
})
