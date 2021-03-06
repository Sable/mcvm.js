var esmatcher = require('esmatcher')
var esprima = require('esprima')

function hashString (s) {
  // Taken from: http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
  var hash = 0
  var i, chr, len
  if (s.length === 0) return hash
  for (i = 0, len = s.length; i < len; i++) {
    chr = s.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash & 0x7ffffff // Remove sign-bit
}

function binopMatch (ops) {
  var patterns = []

  for (var i = 0; i < ops.length; ++i) {
    patterns.push({
      type: ops[i],
      lhs: ['match'],
      rhs: ['match']
    })
  }

  return patterns
}

function binops (ops) {
  var patterns = []

  for (var i = 0; i < ops.length; i += 2) {
    patterns.push({
      type: ops[i],
      lhs: /lhs/,
      rhs: /rhs/
    }) // -->
    patterns.push({
      type: 'PrimitiveExpression',
      name: ops[i + 1],
      'arguments': function (lhs, rhs, match) {
        return [match(lhs), match(rhs)]
      }
    })
  }

  return patterns
}

function paramExprToJS (kind, target, args) {
  if (args.length > 1) {
    throw new Error('Unsupported parameterized expression with more than one argument')
  }

  if (kind === 'FUN') {
    return {
      type: 'CallExpression',
      callee: target,
      'arguments': args
    }
  } else if (kind === 'ARR') {
    return {
      type: 'MemberExpression',
      computed: true,
      object: target,
      property: {
        type: 'BinaryExpression',
        operator: '-',
        left: args[0],
        right: {
          type: 'Literal',
          value: 1,
          raw: '1'
        }
      }
    }
  }

  return {
    type: 'ConditionalExpression',
    test: {
      type: 'BinaryExpression',
      operator: '===',
      left: {
        type: 'UnaryExpression',
        operator: 'typeof',
        argument: target,
        prefix: true
      },
      right: {
        type: 'Literal',
        value: 'function',
        raw: '"function"'
      }
    },
    consequent: {
      type: 'CallExpression',
      callee: target,
      'arguments': args
    },
    alternate: {
      type: 'MemberExpression',
      computed: true,
      object: target,
      property: {
        type: 'BinaryExpression',
        operator: '-',
        left: args[0],
        right: {
          type: 'Literal',
          value: 1,
          raw: '1'
        }
      }
    }
  }
}

var isMatlabPrimitive = (function () {
  var primitives = {
    'length': true,
    'zeros': true,
    'ones': true,
    'mod': true,
    'plus': true,
    'minus': true,
    'mrdivide': true,
    'gt': true,
    'ge': true,
    'lt': true,
    'le': true,
    'eq': true,
    'ne': true
  }

  return function (name) {
    return Object.prototype.hasOwnProperty.call(primitives, name)
  }
})()

function varDeclarations (names) {
  if (names.length < 1) {
    throw new Error('VariableDeclaration should have at least one variable name')
  }

  return {
    type: 'VariableDeclaration',
    declarations: names.map(function (name) {
      return {
        type: 'VariableDeclarator',
        id: {
          type: 'Identifier',
          name: name
        },
        init: null
      }
    }),
    kind: 'var'
  }
}

var matlabGenericTraverser = esmatcher.createInplaceTraverser(esmatcher.matchFailed, [
  {
    type: 'CompilationUnits',
    programs: ['matchAll']
  },
  {
    type: 'Script',
    body: ['matchAll']
  },
  {
    type: 'FunctionList',
    functions: ['matchAll']
  },
  {
    type: 'Function',
    body: ['matchAll'],
    nested_functions: ['matchAll']
  },
  {
    type: 'ExprStmt',
    expression: ['match']
  },
  {
    type: 'NameExpr',
    name: ['match']
  },
  {
    type: 'Name'
  },
  {
    type: 'ParameterizedExpr',
    target: ['match'],
    args: ['matchAll']
  },
  {
    type: 'AssignStmt',
    lhs: ['match'],
    rhs: ['match']
  },
  {
    type: 'IntLiteralExpr'
  },
  {
    type: 'StringLiteralExpr'
  },
  {
    type: 'FPLiteralExpr'
  },
  {
    type: 'ShortCircuitAndExpr'
  },
  {
    type: 'ShortCircuitOrExpr'
  },
  {
    type: 'ForStmt',
    header: ['match'],
    body: ['matchAll']
  },
  {
    type: 'WhileStmt',
    condition: ['match'],
    body: ['matchAll']
  },
  {
    type: 'IfStmt',
    if_blocks: ['matchAll'],
    else_block: ['match']
  },
  {
    type: 'IfBlock',
    condition: ['match'],
    body: ['matchAll']
  },
  {
    type: 'ElseBlock',
    body: ['matchAll']
  },
  {
    type: 'BreakStmt'
  },
  {
    type: 'RangeExpr',
    start: ['match'],
    stop: ['match'],
    step: ['match']
  },
  {
    type: 'UMinusExpr',
    operand: ['match']
  },
  {
    type: 'MatrixExpr',
    rows: ['matchAll']
  },
  {
    type: 'Row',
    elements: ['matchAll']
  }
].concat(binopMatch([
  'PlusExpr',
  'MinusExpr',
  'MTimesExpr',
  'MDivExpr',
  'GTExpr',
  'LTExpr',
  'GEExpr',
  'LEExpr',
  'EQExpr',
  'NEExpr'
])))

var jsGenericTraverser = esmatcher.createInplaceTraverser(esmatcher.matchFailed, [
  {
    type: 'Program',
    body: ['matchAll']
  },
  {
    type: 'BlockStatement',
    body: ['matchAll']
  },
  {
    type: 'VariableDeclaration',
    declarations: ['matchAll']
  },
  {
    type: 'VariableDeclarator',
    id: ['match'],
    init: ['match']
  },
  {
    type: 'FunctionExpression',
    body: ['match']
  },
  {
    type: 'ReturnStatement',
    argument: ['match']
  },
  {
    type: 'Identifier'
  },
  {
    type: 'ExpressionStatement',
    expression: ['match']
  },
  {
    type: 'AssignmentExpression',
    left: ['match'],
    right: ['match']
  },
  {
    type: 'Literal'
  },
  {
    type: 'CallExpression',
    callee: ['match'],
    'arguments': ['matchAll']
  },
  {
    type: 'ForStatement',
    init: ['match'],
    test: ['match'],
    update: ['match'],
    body: ['match']
  },
  {
    type: 'WhileStatement',
    test: ['match'],
    body: ['match']
  },
  {
    type: 'BinaryExpression',
    left: ['match'],
    right: ['match']
  },
  {
    type: 'UpdateExpression',
    argument: ['match']
  },
  {
    type: 'IfStatement',
    test: ['match'],
    consequent: ['match'],
    alternate: ['match']
  },
  {
    type: 'FunctionDeclaration',
    id: ['match'],
    params: ['matchAll'],
    body: ['match']
  },
  {
    type: 'UnaryExpression',
    'argument': ['match']
  },
  {
    type: 'LogicalExpression',
    left: ['match'],
    right: ['match']
  },
  {
    type: 'MemberExpression',
    object: ['match'],
    property: ['match']
  },
  // ForIn Statement
  {
    'type': 'ForInStatement',
    'left': ['match'],
    'right': ['match'],
    'body': ['match']
  },
  {
    type: 'BreakStatement'
  },
  {
    type: 'ArrayExpression',
    elements: ['matchAll']
  },
  // JavaScript Node Types extensions, to better serve as an IR
  {
    type: 'PrimitiveExpression',
    'arguments': ['matchAll']
  },
  {
    type: 'FunctionCallOrArrayAccessExpression',
    target: ['match'],
    'arguments': ['matchAll']
  }
])

var matlab2JS = esmatcher.createMatcher(matlabGenericTraverser, [
  // Compilation Units
  {
    type: 'CompilationUnits',
    programs: /ps/
  }, // -->
  {
    type: 'Program',
    body: ['matchAll', /ps/]
  },
  // Script
  {
    type: 'Script',
    body: /stmts/
  }, // -->
  {
    type: 'BlockStatement',
    body: ['matchAll', /stmts/]
  },
  // FunctionList
  {
    type: 'FunctionList',
    functions: /fs/
  }, // -->
  {
    type: 'BlockStatement',
    body: ['matchAll', /fs/]
  },
  // Function
  {
    type: 'Function',
    inputs: /inputs/,
    outputs: /outputs/,
    name: /name/,
    body: /stmts/,
    nested_functions: /fns/
  }, // -->
  {
    type: 'VariableDeclaration',
    declarations: ['array', {
      type: 'VariableDeclarator',
      id: {
        type: 'Identifier',
        name: function (name) {
          return name.name
        }
      },
      init: {
        'type': 'ExpressionStatement',
        'expression': {
          'type': 'CallExpression',
          'callee': {
            'type': 'MemberExpression',
            'computed': false,
            'object': {
              'type': 'Identifier',
              'name': 'matlab'
            },
            'property': {
              'type': 'Identifier',
              'name': 'Function'
            }
          },
          'arguments': ['array',
            {
              type: 'FunctionExpression',
              id: null,
              params: function (inputs) {
                return inputs.map(function (param) {
                  return {
                    type: 'Identifier',
                    name: param.name
                  }
                })
              },
              defaults: ['array'],
              body: {
                type: 'BlockStatement',
                body: function (stmts, inputs, outputs, match) {
                  if (outputs.length > 1) {
                    throw new Error('Functions with multiple return values are not supported.')
                  }

                  var $newCtxt = {}
                  var jsStmts = stmts.map(function (ast) { return match(ast, $newCtxt) })
                  var decls = []
                  var inputIds = {}
                  for (var i = 0; i < inputs.length; ++i) {
                    inputIds[inputs[i]] = true
                  }
                  for (var id in $newCtxt) {
                    if (Object.prototype.hasOwnProperty.call($newCtxt, id) &&
                      !Object.prototype.hasOwnProperty.call(inputIds, id)) {
                      decls.push(id)
                    }
                  }
                  outputs.forEach(function (o) {
                    decls.push(o.name)
                  })

                  // Copy inputs

                  var vars = decls.length > 0 ? varDeclarations(decls) : []

                  jsStmts = inputs.map(function (n) {
                    return {
                      'type': 'ExpressionStatement',
                      'expression': {
                        'type': 'AssignmentExpression',
                        'operator': '=',
                        'left': {
                          'type': 'Identifier',
                          'name': n.name
                        },
                        'right': {
                          'type': 'CallExpression',
                          'callee': {
                            'type': 'MemberExpression',
                            'computed': false,
                            'object': {
                              'type': 'Identifier',
                              'name': n.name
                            },
                            'property': {
                              'type': 'Identifier',
                              'name': 'copy'
                            }
                          },
                          'arguments': []
                        }
                      }
                    }
                  }).concat(vars, jsStmts)

                  outputs.forEach(function (o) {
                    jsStmts.push({
                      type: 'ReturnStatement',
                      argument: {
                        type: 'Identifier',
                        name: outputs[0].name
                      }
                    })
                  })
                  return jsStmts
                }
              },
              rest: null,
              generator: false,
              expression: false
            }
          ]
        }
      }

    }],
    kind: 'var'
  },
  // ExprStmt
  {
    type: 'ExprStmt',
    expression: /e/
  }, // -->
  {
    type: 'ExpressionStatement',
    expression: ['match', /e/]
  },
  // NamedExpr
  {
    type: 'NameExpr',
    name: {
      type: 'Name',
      name: /n/
    }
  }, // -->
  {
    type: 'Identifier',
    name: /n/
  },
  // AssignStmt to ParameterizedExpr
  {
    type: 'AssignStmt',
    lhs: {
      type: 'ParameterizedExpr',
      target: /target/,
      args: /args/
    },
    rhs: /rhs/
  }, // -->
  {
    type: 'ExpressionStatement',
    expression: {
      'type': 'CallExpression',
      'callee': {
        'type': 'MemberExpression',
        'computed': false,
        'object': ['match', /target/],
        'property': {
          'type': 'Identifier',
          'name': function (args) {
            return args.length < 2 ? 'set_' + (args.length) : 'set'
          }
        }
      },
      'arguments': function (rhs, args, match) {
        return [match(rhs)].concat(args.map(match))
      }
    }
  },
  // AssignStmt between variable ids
  {
    type: 'AssignStmt',
    lhs: {
      type: 'NameExpr',
      name: {
        type: 'Name',
        name: /name1/
      }
    },
    rhs: {
      type: 'NameExpr',
      name: {
        type: 'Name',
        name: /name2/
      }
    }
  }, // -->
  {
    'type': 'ExpressionStatement',
    'expression': {
      'type': 'AssignmentExpression',
      'operator': '=',
      'left': {
        'type': 'Identifier',
        'name': /name1/
      },
      'right': {
        'type': 'CallExpression',
        'callee': {
          'type': 'MemberExpression',
          'computed': false,
          'object': {
            'type': 'Identifier',
            'name': /name2/
          },
          'property': {
            'type': 'Identifier',
            'name': 'copy'
          }
        },
        'arguments': ['array']
      }
    }
  },
  // AssignStmt to variable id
  {
    type: 'AssignStmt',
    lhs: {
      type: 'NameExpr',
      name: {
        type: 'Name',
        name: /name/
      }
    }
  },
  function (node, match, $context) {
    $context[node.lhs.name.name] = true
    return {
      type: 'ExpressionStatement',
      expression: {
        type: 'AssignmentExpression',
        operator: '=',
        left: match(node.lhs),
        right: match(node.rhs)
      }
    }
  },
  // AssignStmt
  {
    type: 'AssignStmt',
    lhs: /lhs/,
    rhs: /rhs/
  }, // -->
  {
    type: 'ExpressionStatement',
    expression: {
      type: 'AssignmentExpression',
      operator: '=',
      left: ['match', /lhs/],
      right: ['match', /rhs/]
    }
  },
  // IntLiteralExpr
  {
    type: 'IntLiteralExpr',
    value: /value/,
    raw: /raw/
  }, // -->
  {
    type: 'Literal',
    value: /value/,
    raw: /raw/
  },
  // StringLiteralExpr
  {
    type: 'StringLiteralExpr',
    value: /value/
  }, // -->
  {
    type: 'Literal',
    value: /value/
  },
  // FPLiteralExpr
  {
    type: 'FPLiteralExpr',
    value: /value/,
    raw: /raw/
  }, // -->
  {
    type: 'Literal',
    value: /value/,
    raw: /raw/
  },
  // ParameterizedExpr (call to primitive)
  {
    type: 'ParameterizedExpr',
    target: {
      type: 'NameExpr',
      name: {
        type: 'Name',
        name: /name/
      },
      kind: 'FUN'
    },
    args: /args/
  }, // -->
  {
    type: 'CallExpression',
    callee: {
      type: 'Identifier',
      name: /name/
    },
    'arguments': ['matchAll', /args/]
  },
  // ParameterizedExpr
  {
    type: 'ParameterizedExpr',
    target: /target/,
    args: /args/
  }, // -->
  {
    type: 'FunctionCallOrArrayAccessExpression',
    target: ['match', /target/],
    'arguments': ['matchAll', /args/]
  },
  // ShortCircuitAndExpr
  {
    type: 'ShortCircuitAndExpr',
    lhs: /lhs/,
    rhs: /rhs/
  }, // -->
  {
    type: 'LogicalExpression',
    operator: '&&',
    left: ['match', /lhs/],
    right: ['match', /rhs/]
  },
  // ShortCircuitOrExpr
  {
    type: 'ShortCircuitOrExpr',
    lhs: /lhs/,
    rhs: /rhs/
  }, // -->
  {
    type: 'LogicalExpression',
    operator: '||',
    left: ['match', /lhs/],
    right: ['match', /rhs/]
  },
  // ForStmt
  {
    type: 'ForStmt',
    header: {
      type: 'AssignStmt',
      lhs: /lhs/,
      rhs: {
        type: 'RangeExpr',
        start: /start/,
        stop: /stop/,
        step: null
      }
    },
    body: /body/
  },
  {
    type: 'ForStatement',
    init: {
      type: 'VariableDeclaration',
      declarations: ['array',
        {
          type: 'VariableDeclarator',
          id: ['match', /lhs/],
          init: ['match', /start/]
        }
      ],
      kind: 'var'
    },
    test: {
      type: 'BinaryExpression',
      operator: '<=',
      left: ['match', /lhs/],
      right: ['match', /stop/]
    },
    update: {
      type: 'UpdateExpression',
      operator: '++',
      argument: ['match', /lhs/],
      prefix: true
    },
    body: {
      type: 'BlockStatement',
      body: ['matchAll', /body/]
    }
  },
  // WhileStmt
  {
    type: 'WhileStmt',
    condition: /condition/,
    body: /body/
  }, // -->
  {
    type: 'WhileStatement',
    test: ['match', /condition/],
    body: {
      type: 'BlockStatement',
      body: ['matchAll', /body/]
    }
  },
  // IfStmt
  {
    type: 'IfStmt'
  }, // -->
  function (ifStatement, match, $context) {
    var elseBlock = ifStatement.else_block
    var node
    if (elseBlock === null) {
      node = null
    } else {
      node = {
        type: 'BlockStatement',
        body: ifStatement.else_block.body.map(match)
      }
    }
    var ifBlocks = ifStatement.if_blocks

    for (var i = ifBlocks.length - 1; i >= 0; --i) {
      var ifBlock = ifBlocks[i]
      node = {
        type: 'IfStatement',
        test: match(ifBlock.condition),
        consequent: {
          type: 'BlockStatement',
          body: ifBlock.body.map(match)
        },
        alternate: node
      }
    }
    return node
  },
  // BreakStmt
  {
    type: 'BreakStmt'
  }, // -->
  {
    type: 'BreakStatement',
    label: null
  },
  // UMinusExpr
  {
    type: 'UMinusExpr',
    operand: /operand/
  }, // -->
  {
    type: 'PrimitiveExpression',
    name: 'uminus',
    arguments: function (operand, match) {
      return [match(operand)]
    }
  },
  // MatrixExpr
  {
    type: 'MatrixExpr',
    rows: /rows/
  }, // -->
  {
    'type': 'CallExpression',
    'callee': {
      'type': 'MemberExpression',
      'computed': false,
      'object': {
        'type': 'MemberExpression',
        'computed': false,
        'object': {
          'type': 'Identifier',
          'name': 'matlab'
        },
        'property': {
          'type': 'Identifier',
          'name': 'Array'
        }
      },
      'property': {
        'type': 'Identifier',
        'name': 'fromJSArray'
      }
    },
    'arguments': ['array',
      {
        'type': 'ArrayExpression',
        'elements': ['matchAll', /rows/]
      }
    ]
  },
  // Row
  {
    type: 'Row',
    elements: /elements/
  }, // -->
  {
    type: 'ArrayExpression',
    elements: ['matchAll', /elements/]
  }
].concat(binops([
  'PlusExpr', 'plus',
  'MinusExpr', 'minus',
  'MTimesExpr', 'mtimes',
  'MDivExpr', 'mrdivide',
  'GTExpr', 'gt',
  'LTExpr', 'lt',
  'GEExpr', 'ge',
  'LEExpr', 'le',
  'EQExpr', 'eq',
  'NEExpr', 'ne'
])))

var jsIR2ConservativeJS = esmatcher.createMatcher(jsGenericTraverser, [
  // PrimitiveExpression
  {
    type: 'PrimitiveExpression',
    name: /name/,
    'arguments': /args/
  }, // -->
  {
    type: 'CallExpression',
    callee: {
      type: 'Identifier',
      name: /name/
    },
    'arguments': ['matchAll', /args/]
  },
  // FunctionCallOrArrayAccessExpression
  {
    type: 'FunctionCallOrArrayAccessExpression',
    target: /target/,
    'arguments': /args/
  },
  {
    'type': 'CallExpression',
    'callee': {
      'type': 'MemberExpression',
      'computed': false,
      'object': ['match', /target/],
      'property': {
        'type': 'Identifier',
        'name': function (args) {
          return args.length < 2 ? 'call_' + (args.length) : 'call'
        }
      }
    },
    'arguments': ['matchAll', /args/]
  }
])

// ------------ Inline Caching Transformation -----------------------------
// Inline cache functions
function genCacheStateFunctions (ops) {
  var preamble = ''

  for (var i = 0; i < ops.length; i += 2) {
    var name = ops[i]
    var Name = ops[i][0].toUpperCase() + ops[i].slice(1)
    var scalarOp = ops[i + 1]
    preamble +=
      'function init' + Name + '(name,x,y) {\n' +
      "    if ((typeof x) === 'number' && (typeof y) === 'number') {\n" +
      '        global[name] = scalar' + Name + ';\n' +
      '    }\n' +
      '    return _McLib.' + name + '(x,y);\n' +
      '}\n' +
      'function scalar' + Name + '(name,x,y) {\n' +
      "    if ((typeof x) === 'number' && (typeof y) === 'number') {\n" +
      '        return x ' + scalarOp + ' y;\n' +
      '    }\n' +
      '     \n' +
      '    global[name] = generic' + Name + ';\n' +
      '    return _McLib.' + name + '(x,y);\n' +
      '}\n' +
      'function generic' + Name + '(name,x,y) {\n' +
      '    return _McLib.' + name + '(x,y);\n' +
      '}\n'
  }

  function genArgs (nb) {
    var id = 'x'
    var args = []
    for (var i = 0; i < nb; ++i) {
      args.push(id + i)
    }
    return args
  }

  function genFnCallWithArgs (name, args) {
    return name + '(' + args.join(',') + ')'
  }

  function genArrayAccessWithArgs (name, args) {
    if (args.length < 1) {
      return name
    }
    args = args.map(function (x) { return x + '-1' })
    return name + '[' + args.join('][') + ']'
  }

  var exprType = 'ParamExpr'
  for (var argNb = 0; argNb < 2; ++argNb) {
    Name = exprType + argNb + '_'
    var args = genArgs(argNb)
    var argsStr = ['name', 'target'].concat(args).join(',')
    preamble +=
      'function init' + Name + '(' + argsStr + ') {\n' +
      "    if ((typeof target) === 'function') {\n" +
      '        global[name] = fn' + Name + ';\n' +
      '        return ' + genFnCallWithArgs('target', args) + ';\n' +
      '    } else {\n' +
      '        global[name] = array' + Name + ';\n' +
      '        return ' + genArrayAccessWithArgs('target', args) + ';\n' +
      '    }\n' +
      '}\n' +
      'function fn' + Name + '(' + argsStr + ') {\n' +
      "    if ((typeof target) === 'function') {\n" +
      '        return ' + genFnCallWithArgs('target', args) + ';\n' +
      '    }\n' +
      '     \n' +
      '    global[name] = generic' + Name + ';\n' +
      '    return generic' + Name + '(' + argsStr + ');\n' +
      '}\n' +
      'function array' + Name + '(' + argsStr + ') {\n' +
      "    if ((typeof target) !== 'function') {\n" +
      '        return ' + genArrayAccessWithArgs('target', args) + ';\n' +
      '    }\n' +
      '     \n' +
      '    global[name] = generic' + Name + ';\n' +
      '    return generic' + Name + '(' + argsStr + ');\n' +
      '}\n' +
      'function generic' + Name + '(name,target' + args + ') {\n' +
      "    if ((typeof target) === 'function') {\n" +
      '        return ' + genFnCallWithArgs('target', args) + ';\n' +
      '    } else {\n' +
      '        return ' + genArrayAccessWithArgs('target', args) + ';\n' +
      '    }\n' +
      '}\n'
  }
  return preamble
}

function CacheGenerator (hash) {
  this.hash = hash
  this.preamble = []
  this.nameIds = {}
}
CacheGenerator.prototype.cacheCall = function (name, args) {
  if (!Object.prototype.hasOwnProperty.call(this.nameIds, name)) {
    this.nameIds[name] = 0
  }

  var id = this.nameIds[name]++
  var Name = name[0].toUpperCase() + name.slice(1)
  var cacheId = '_' + this.hash + '_ic' + Name + id

  this.preamble.push({
    type: 'ExpressionStatement',
    expression: {
      type: 'AssignmentExpression',
      operator: '=',
      left: {
        type: 'Identifier',
        name: cacheId
      },
      right: {
        type: 'Identifier',
        name: 'init' + Name
      }
    }
  })
  return {
    type: 'CallExpression',
    callee: {
      type: 'Identifier',
      name: cacheId
    },
    'arguments': [{
      type: 'Literal',
      value: cacheId,
      raw: "'" + cacheId + "'"
    }].concat(args)
  }
}

var cacheGen = null

var _jsIR2InlineCached = esmatcher.createMatcher(jsGenericTraverser, [
  // Primitive Expressions
  {
    type: 'PrimitiveExpression',
    name: /name/,
    'arguments': /args/
  }, // -->
  function (node, match) {
    return cacheGen.cacheCall(node.name, node.arguments.map(match))
  },
  // FunctionCallOrArrayAccessExpression
  {
    type: 'FunctionCallOrArrayAccessExpression',
    target: /target/,
    'arguments': /args/
  },
  function (node, match) {
    var name = 'ParamExpr' + node.arguments.length + '_'
    return cacheGen.cacheCall(
      name,
      [match(node.target)]
        .concat(node.arguments.map(match))
    )
  }
])

function jsIR2InlineCached (program) {
  var programHash = hashString(JSON.stringify(program))
  cacheGen = new CacheGenerator(programHash)
  program = _jsIR2InlineCached(program)
  program.body = exports.jsPreamble()
    .concat(cacheGen.preamble)
    .concat(program.body)
  return program
}

exports.jsPreamble = function () {
  return esprima.parse(genCacheStateFunctions([
    'minus', '-',
    'plus', '+',
    'mtimes', '*',
    'mrdivide', '/',
    'gt', '>',
    'geq', '>=',
    'lt', '<',
    'leq', '<=',
    'eq', '===',
    'ne', '!=='
  ])).body
}

var cleanUpEmptyNodes = esmatcher.createMatcher(matlabGenericTraverser, [
  {
    type: 'RangeExpr',
    start: /start/,
    stop: /stop/,
    step: /step/
  }, // -->
  {
    type: 'RangeExpr',
    start: ['match', /start/],
    stop: ['match', /stop/],
    step: function (step, match) {
      if (step === null || step.type === undefined) {
        return null
      }
      return match(step)
    }
  },
  {
    type: 'IfStmt',
    if_blocks: /ifBlocks/,
    else_block: /elseBlock/
  },
  {
    type: 'IfStmt',
    if_blocks: ['matchAll', /ifBlocks/],
    else_block: function (elseBlock, match) {
      if (elseBlock === null || elseBlock.type === undefined) {
        return null
      }
      elseBlock.body = elseBlock.body.map(match)
      return elseBlock
    }
  }
])

exports.matlabGenericTraverser = matlabGenericTraverser
exports.matlab2JS = function (ast, options) {
  var defaultOptions = {
    useInlineCaches: false
  }
  if (options === undefined) {
    options = defaultOptions
  }
  for (var o in defaultOptions) {
    if (options[o] === undefined) {
      options[o] = defaultOptions[o]
    }
  }

  ast = cleanUpEmptyNodes(ast)
  var program = matlab2JS(ast)

  if (options.useInlineCaches !== true) {
    program = jsIR2ConservativeJS(program)
  } else {
    program = jsIR2InlineCached(program)
  }
  return program
}
