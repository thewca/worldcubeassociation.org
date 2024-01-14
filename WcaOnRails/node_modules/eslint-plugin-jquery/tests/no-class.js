'use strict'

const rule = require('../rules/no-class')
const RuleTester = require('eslint').RuleTester

const addError = 'Prefer classList to $.addClass'
const hasError = 'Prefer classList to $.hasClass'
const removeError = 'Prefer classList to $.removeClass'
const toggleError = 'Prefer classList to $.toggleClass'

const ruleTester = new RuleTester()
ruleTester.run('no-class', rule, {
  valid: [
    'addClass()',
    '[].addClass()',
    'div.addClass()',
    'div.addClass',

    'hasClass()',
    '[].hasClass()',
    'div.hasClass()',
    'div.hasClass',

    'removeClass()',
    '[].removeClass()',
    'div.removeClass()',
    'div.removeClass',

    'toggleClass()',
    '[].toggleClass()',
    'div.toggleClass()',
    'div.toggleClass'
  ],
  invalid: [
    {
      code: '$("div").addClass()',
      errors: [{message: addError, type: 'CallExpression'}]
    },
    {
      code: '$div.addClass()',
      errors: [{message: addError, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().addClass()',
      errors: [{message: addError, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").addClass())',
      errors: [{message: addError, type: 'CallExpression'}]
    },
    {
      code: '$("div").hasClass()',
      errors: [{message: hasError, type: 'CallExpression'}]
    },
    {
      code: '$div.hasClass()',
      errors: [{message: hasError, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().hasClass()',
      errors: [{message: hasError, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").hasClass())',
      errors: [{message: hasError, type: 'CallExpression'}]
    },
    {
      code: '$("div").removeClass()',
      errors: [{message: removeError, type: 'CallExpression'}]
    },
    {
      code: '$div.removeClass()',
      errors: [{message: removeError, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().removeClass()',
      errors: [{message: removeError, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").removeClass())',
      errors: [{message: removeError, type: 'CallExpression'}]
    },
    {
      code: '$("div").toggleClass()',
      errors: [{message: toggleError, type: 'CallExpression'}]
    },
    {
      code: '$div.toggleClass()',
      errors: [{message: toggleError, type: 'CallExpression'}]
    },
    {
      code: '$("div").first().toggleClass()',
      errors: [{message: toggleError, type: 'CallExpression'}]
    },
    {
      code: '$("div").append($("input").toggleClass())',
      errors: [{message: toggleError, type: 'CallExpression'}]
    }
  ]
})
