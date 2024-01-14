'use strict'

const rule = require('../rules/no-ajax')
const RuleTester = require('eslint').RuleTester

const ajaxError = 'Prefer fetch to $.ajax'
const getError = 'Prefer fetch to $.get'
const jsonError = 'Prefer fetch to $.getJSON'
const scriptError = 'Prefer fetch to $.getScript'
const postError = 'Prefer fetch to $.post'

const ruleTester = new RuleTester()
ruleTester.run('no-ajax', rule, {
  valid: [
    'ajax()',
    'div.ajax()',
    'div.ajax',

    'get()',
    'div.get()',
    'div.get',

    'getJSON()',
    'div.getJSON()',
    'div.getJSON',

    'getScript()',
    'div.getScript()',
    'div.getScript',

    'post()',
    'div.post()',
    'div.post'
  ],
  invalid: [
    {
      code: '$.ajax()',
      errors: [{message: ajaxError, type: 'CallExpression'}]
    },
    {
      code: '$.get()',
      errors: [{message: getError, type: 'CallExpression'}]
    },
    {
      code: '$.getJSON()',
      errors: [{message: jsonError, type: 'CallExpression'}]
    },
    {
      code: '$.getScript()',
      errors: [{message: scriptError, type: 'CallExpression'}]
    },
    {
      code: '$.post()',
      errors: [{message: postError, type: 'CallExpression'}]
    }
  ]
})
