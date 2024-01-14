'use strict'

const rule = require('../rules/no-ready')
const RuleTester = require('eslint').RuleTester

const error = '$.ready is not allowed'

const ruleTester = new RuleTester({parserOptions: {ecmaVersion: 6}})
ruleTester.run('no-ready', rule, {
  valid: [
    'ready(function() { })',
    'ready(() => { })',
    'ready()',
    '[].ready()',
    'div.ready()',
    'div.ready',
    '$("div")',
    '$(document)',
    '$()'
  ],
  invalid: [
    {
      code: '$(function() { })',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(() => { })',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(function init() { })',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(document).ready(function() { })',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(document).ready(() => { })',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$().ready(function() { })',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("img").ready(function() { })',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$div.ready(function() { })',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("img").first().ready(function() { })',
      errors: [{message: error, type: 'CallExpression'}]
    }
  ]
})
