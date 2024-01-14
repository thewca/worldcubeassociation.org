'use strict'

const utils = require('./utils.js')

module.exports = {
  meta: {
    docs: {},
    schema: []
  },

  create: function(context) {
    return {
      CallExpression: function(node) {
        if (node.callee.type !== 'MemberExpression') return
        if (!utils.isjQuery(node)) return

        const name = node.callee.property.name
        switch (name) {
          case 'data':
          case 'removeData':
            context.report({
              node: node,
              message: 'Prefer WeakMap to $.' + name
            })
        }
      }
    }
  }
}
