'use strict'

const rule = require('../rules/no-fade')
const RuleTester = require('eslint').RuleTester

const inError = '$.fadeIn is not allowed'
const outError = '$.fadeOut is not allowed'
const toError = '$.fadeTo is not allowed'
const toggleError = '$.fadeToggle is not allowed'

const ruleTester = new RuleTester()
ruleTester.run('no-fade', rule, {
  valid: [
    'fadeIn()',
    '[].fadeIn()',
    'div.fadeIn()',
    'div.fadeIn',

    'fadeOut()',
    '[].fadeOut()',
    'div.fadeOut()',
    'div.fadeOut',

    'fadeTo()',
    '[].fadeTo()',
    'div.fadeTo()',
    'div.fadeTo',

    'fadeToggle()',
    '[].fadeToggle()',
    'div.fadeToggle()',
    'div.fadeToggle'
  ],
  invalid: [
    {
      code: '$("div").fadeIn()',
      errors: [{message: inError, type: 'CallExpression'}]
    },
    {
      code: '$div.fadeIn()',
      errors: [{message: inError, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().fadeIn()',
      errors: [{message: inError, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").fadeIn())',
      errors: [{message: inError, type: 'CallExpression'}]
    },

    {
      code: '$("div").fadeOut()',
      errors: [{message: outError, type: 'CallExpression'}]
    },
    {
      code: '$div.fadeOut()',
      errors: [{message: outError, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().fadeOut()',
      errors: [{message: outError, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").fadeOut())',
      errors: [{message: outError, type: 'CallExpression'}]
    },

    {
      code: '$("div").fadeTo()',
      errors: [{message: toError, type: 'CallExpression'}]
    },
    {
      code: '$div.fadeTo()',
      errors: [{message: toError, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().fadeTo()',
      errors: [{message: toError, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").fadeTo())',
      errors: [{message: toError, type: 'CallExpression'}]
    },

    {
      code: '$("div").fadeToggle()',
      errors: [{message: toggleError, type: 'CallExpression'}]
    },
    {
      code: '$div.fadeToggle()',
      errors: [{message: toggleError, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().fadeToggle()',
      errors: [{message: toggleError, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").fadeToggle())',
      errors: [{message: toggleError, type: 'CallExpression'}]
    }
  ]
})
