'use strict'

const utils = require('./utils.js')

const methodName = 'on'
const disallowedEvents = {
  ajaxStart: true,
  ajaxSend: true,
  ajaxSuccess: true,
  ajaxError: true,
  ajaxComplete: true,
  ajaxStop: true
}

const MemberExpression = 'MemberExpression'
const Literal = 'Literal'

module.exports = {
  meta: {
    docs: {},
    schema: []
  },

  create: function(context) {
    return {
      CallExpression: function(node) {
        if (
          node.callee.type === MemberExpression &&
          node.callee.property.name === methodName &&
          node.arguments.length >= 1
        ) {
          const arg = node.arguments[0]
          if (
            arg.type === Literal &&
            arg.value in disallowedEvents &&
            utils.isjQuery(node)
          ) {
            context.report({
              node: node,
              message: `Prefer remoteForm to ${arg.value}`
            })
          }
        }
      }
    }
  }
}
