'use strict'

const rule = require('../rules/no-ajax-events')
const RuleTester = require('eslint').RuleTester

const ruleTester = new RuleTester()
ruleTester.run('no-ajax-events', rule, {
  valid: [
    '$(document).on("click", function(e){ })',
    '$form.on("submit", function(e){ })',
    '$form.on()',
    'on("ajaxSuccess", ".js-select-menu", function(e){ })',
    'form.on("ajaxSend")'
  ],
  invalid: [
    {
      code: '$(document).on("ajaxSend", function(e){ })',
      errors: [
        {
          message: 'Prefer remoteForm to ajaxSend',
          type: 'CallExpression'
        }
      ]
    },
    {
      code: '$(document).on("ajaxSuccess", function(e){ })',
      errors: [
        {
          message: 'Prefer remoteForm to ajaxSuccess',
          type: 'CallExpression'
        }
      ]
    },
    {
      code: '$form.on("ajaxError", function(e){ })',
      errors: [
        {
          message: 'Prefer remoteForm to ajaxError',
          type: 'CallExpression'
        }
      ]
    },
    {
      code: '$form.on("ajaxComplete", function(e){ })',
      errors: [
        {
          message: 'Prefer remoteForm to ajaxComplete',
          type: 'CallExpression'
        }
      ]
    },
    {
      code: '$form.on("ajaxStart", function(e){ })',
      errors: [
        {
          message: 'Prefer remoteForm to ajaxStart',
          type: 'CallExpression'
        }
      ]
    },
    {
      code: '$form.on("ajaxStop", function(e){ })',
      errors: [
        {
          message: 'Prefer remoteForm to ajaxStop',
          type: 'CallExpression'
        }
      ]
    }
  ]
})
