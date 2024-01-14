'use strict'

const rule = require('../rules/no-param')
const RuleTester = require('eslint').RuleTester

const error = 'Prefer FormData or URLSearchParams to $.param'

const ruleTester = new RuleTester()
ruleTester.run('no-param', rule, {
  valid: ['param()', '"test".param()', '"test".param'],
  invalid: [
    {
      code: '$.param()',
      errors: [{message: error, type: 'CallExpression'}]
    }
  ]
})
