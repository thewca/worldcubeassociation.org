'use strict'

const utils = require('./utils.js')

module.exports = {
  meta: {
    docs: {},
    schema: []
  },

  create: function(context) {
    const forbidden = ['serialize', 'serializeArray']

    return {
      CallExpression: function(node) {
        if (node.callee.type !== 'MemberExpression') return
        if (forbidden.indexOf(node.callee.property.name) === -1) return

        if (utils.isjQuery(node)) {
          context.report({
            node: node,
            message:
              'Prefer FormData or URLSearchParams to $.' +
              node.callee.property.name
          })
        }
      }
    }
  }
}
