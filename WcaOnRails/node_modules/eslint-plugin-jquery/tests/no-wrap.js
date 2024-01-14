'use strict'

const rule = require('../rules/no-wrap')
const RuleTester = require('eslint').RuleTester

const wrapError = '$.wrap is not allowed'
const wrapAllError = '$.wrapAll is not allowed'
const wrapInnerError = '$.wrapInner is not allowed'
const unwrapError = '$.unwrap is not allowed'

const ruleTester = new RuleTester()
ruleTester.run('no-wrap', rule, {
  valid: [
    'wrap()',
    '[].wrap()',
    'div.wrap()',
    'div.wrap',

    'wrapAll()',
    '[].wrapAll()',
    'div.wrapAll()',
    'div.wrapAll',

    'wrapInner()',
    '[].wrapInner()',
    'div.wrapInner()',
    'div.wrapInner',

    'unwrap()',
    '[].unwrap()',
    'div.unwrap()',
    'div.unwrap'
  ],
  invalid: [
    {
      code: '$("div").wrap()',
      errors: [{message: wrapError, type: 'CallExpression'}]
    },
    {
      code: '$div.wrap()',
      errors: [{message: wrapError, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().wrap()',
      errors: [{message: wrapError, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").wrap())',
      errors: [{message: wrapError, type: 'CallExpression'}]
    },
    {
      code: '$("div").wrapAll()',
      errors: [{message: wrapAllError, type: 'CallExpression'}]
    },
    {
      code: '$div.wrapAll()',
      errors: [{message: wrapAllError, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().wrapAll()',
      errors: [{message: wrapAllError, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").wrapAll())',
      errors: [{message: wrapAllError, type: 'CallExpression'}]
    },
    {
      code: '$("div").wrapInner()',
      errors: [{message: wrapInnerError, type: 'CallExpression'}]
    },
    {
      code: '$div.wrapInner()',
      errors: [{message: wrapInnerError, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().wrapInner()',
      errors: [{message: wrapInnerError, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").wrapInner())',
      errors: [{message: wrapInnerError, type: 'CallExpression'}]
    },
    {
      code: '$("div").unwrap()',
      errors: [{message: unwrapError, type: 'CallExpression'}]
    },
    {
      code: '$div.unwrap()',
      errors: [{message: unwrapError, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().unwrap()',
      errors: [{message: unwrapError, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").unwrap())',
      errors: [{message: unwrapError, type: 'CallExpression'}]
    }
  ]
})
