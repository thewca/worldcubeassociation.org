'use strict'

const rule = require('../rules/no-in-array')
const RuleTester = require('eslint').RuleTester

const error = 'Prefer Array#indexOf to $.inArray'

const ruleTester = new RuleTester()
ruleTester.run('no-in-array', rule, {
  valid: ['inArray()', '"test".inArray()', '"test".inArray'],
  invalid: [
    {
      code: '$.inArray()',
      errors: [{message: error, type: 'CallExpression'}]
    }
  ]
})
