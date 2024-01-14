'use strict'

const rule = require('../rules/no-slide')
const RuleTester = require('eslint').RuleTester

const downError = '$.slideDown is not allowed'
const toggleError = '$.slideToggle is not allowed'
const upError = '$.slideUp is not allowed'

const ruleTester = new RuleTester()
ruleTester.run('no-slide', rule, {
  valid: [
    'slideDown()',
    '[].slideDown()',
    'div.slideDown()',
    'div.slideDown',

    'slideToggle()',
    '[].slideToggle()',
    'div.slideToggle()',
    'div.slideToggle',

    'slideUp()',
    '[].slideUp()',
    'div.slideUp()',
    'div.slideUp'
  ],
  invalid: [
    {
      code: '$("div").slideDown()',
      errors: [{message: downError, type: 'CallExpression'}]
    },
    {
      code: '$div.slideDown()',
      errors: [{message: downError, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().slideDown()',
      errors: [{message: downError, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").slideDown())',
      errors: [{message: downError, type: 'CallExpression'}]
    },

    {
      code: '$("div").slideToggle()',
      errors: [{message: toggleError, type: 'CallExpression'}]
    },
    {
      code: '$div.slideToggle()',
      errors: [{message: toggleError, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().slideToggle()',
      errors: [{message: toggleError, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").slideToggle())',
      errors: [{message: toggleError, type: 'CallExpression'}]
    },

    {
      code: '$("div").slideUp()',
      errors: [{message: upError, type: 'CallExpression'}]
    },
    {
      code: '$div.slideUp()',
      errors: [{message: upError, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().slideUp()',
      errors: [{message: upError, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").slideUp())',
      errors: [{message: upError, type: 'CallExpression'}]
    }
  ]
})
