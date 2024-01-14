'use strict'

module.exports = {
  meta: {
    docs: {},
    schema: []
  },

  create: function(context) {
    return {
      CallExpression: function(node) {
        if (node.callee.type !== 'MemberExpression') return
        if (node.callee.object.name !== '$') return
        if (node.callee.property.name !== 'when') return

        context.report({
          node: node,
          message: 'Prefer Promise.all to $.when'
        })
      }
    }
  }
}
