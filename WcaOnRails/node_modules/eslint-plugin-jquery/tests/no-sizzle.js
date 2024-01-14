'use strict'

const rule = require('../rules/no-sizzle')
const RuleTester = require('eslint').RuleTester

const error = 'Selector extensions are not allowed'

const ruleTester = new RuleTester()
ruleTester.run('no-sizzle', rule, {
  valid: [
    'find(":input")',
    'div.find(":input")',
    '$(this).on("custom:input")',
    '$(this).on("custom:selected")',
    '$(this).find(".selected")',
    '$(this).find(":checked")',
    '$(this).find("input")',
    '$(this).find(":first-child")',
    '$(this).find(":first-child div")',
    '$(this).find(":last-child")',
    '$(this).find(":last-child div")',
    '$(this).find($())',
    '$(this).find(function() {})',
    '$(this).find()',
    '$(function() {})'
  ],
  invalid: [
    {
      code: '$(":animated")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(":button")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(":checkbox")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(":eq")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(":even")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(":file")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(":first")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(":gt")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(":has")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(":header")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(":hidden")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(":image")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(":input")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(":last")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(":lt")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(":odd")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(":parent")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(":password")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(":radio")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(":reset")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(":selected")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(":submit")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(":text")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$(":visible")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").children(":first")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").closest(":first")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").filter(":first")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").find(":first")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").has(":first")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").is(":first")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").next(":first")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").nextAll(":first")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").nextUntil(":first")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").not(":first")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").parent(":first")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").parents(":first")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").parentsUntil(":first")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").prev(":first")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").prevAll(":first")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").prevUntil(":first")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").siblings(":first")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div:first")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div:first").find("p")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").find("p:first").addClass("test").find("p")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").find(":first")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$("div").find("div:animated")',
      errors: [{message: error, type: 'CallExpression'}]
    },
    {
      code: '$div.find("form input:checkbox")',
      errors: [{message: error, type: 'CallExpression'}]
    }
  ]
})
