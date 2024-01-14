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

        const name = node.callee.property.name
        switch (name) {
          case 'ajax':
          case 'get':
          case 'getJSON':
          case 'getScript':
          case 'post':
            context.report({
              node: node,
              message: 'Prefer fetch to $.' + name
            })
        }
      }
    }
  }
}
