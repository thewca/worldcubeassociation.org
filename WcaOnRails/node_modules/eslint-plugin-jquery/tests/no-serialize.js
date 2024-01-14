'use strict'

const rule = require('../rules/no-serialize')
const RuleTester = require('eslint').RuleTester

const serializeError = 'Prefer FormData or URLSearchParams to $.serialize'
const arrayError = 'Prefer FormData or URLSearchParams to $.serializeArray'

const ruleTester = new RuleTester()
ruleTester.run('no-serialize', rule, {
  valid: [
    'serialize()',
    '[].serialize()',
    'div.serialize()',
    'div.serialize',

    'serializeArray()',
    '[].serializeArray()',
    'div.serializeArray()',
    'div.serializeArray'
  ],
  invalid: [
    {
      code: '$("div").serialize()',
      errors: [{message: serializeError, type: 'CallExpression'}]
    },
    {
      code: '$div.serialize()',
      errors: [{message: serializeError, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().serialize()',
      errors: [{message: serializeError, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").serialize())',
      errors: [{message: serializeError, type: 'CallExpression'}]
    },
    {
      code: '$("div").serializeArray()',
      errors: [{message: arrayError, type: 'CallExpression'}]
    },
    {
      code: '$div.serializeArray()',
      errors: [{message: arrayError, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().serializeArray()',
      errors: [{message: arrayError, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").serializeArray())',
      errors: [{message: arrayError, type: 'CallExpression'}]
    }
  ]
})
