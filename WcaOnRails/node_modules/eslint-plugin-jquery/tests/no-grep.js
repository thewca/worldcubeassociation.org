'use strict'

const rule = require('../rules/no-grep')
const RuleTester = require('eslint').RuleTester

const error = 'Prefer Array#filter to $.grep'

const ruleTester = new RuleTester()
ruleTester.run('no-in-array', rule, {
  valid: ['grep()', '"test".grep()', '"test".grep'],
  invalid: [
    {
      code: '$.grep()',
      errors: [{message: error, type: 'CallExpression'}]
    }
  ]
})
