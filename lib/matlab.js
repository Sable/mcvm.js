var esmatcher = require("esmatcher");

var matlabGenericTraverser = esmatcher.createInplaceTraverser(esmatcher.matchFailed, [
    {
        type: "CompilationUnits",
        programs: ["matchAll"]
    },
    {
        type: "Script",
        body: ["matchAll"]
    },
    {
        type: "FunctionList",
        functions: ["matchAll"]
    },
    {
        type: "Function",
        body: ["matchAll"],
        nested_functions: ["matchAll"] 
    },
    {
        type: "ExprStmt",
        expression: ["match"]
    },
    {
        type: "NameExpr",
        name: ["match"]
    },
    {
        type: "Name"
    },
    {
        type: "PlusExpr",
        lhs: ["match"],
        rhs: ["match"]
    },
    {
        type: "ParameterizedExpression",
        target: ["match"],
        args: ["matchAll"]
    }   
]);

function binops(ops) {
    var patterns = [];

    for (var i = 0; i < ops.length; i+=2) {
        patterns.push({
            type: ops[i],
            lhs: /lhs/,
            rhs: /rhs/
        }); // -->
        patterns.push({
            type: "BinaryExpression",
            operator: ops[i+1],
            left: ["match", /lhs/],
            right: ["match", /rhs/]
        });
    }
    
    return patterns;
}

function paramExprToJS(kind,target, args) {
    if (args.length > 1) { throw new Error("Unsupported parameterized expression with more than one argument"); }

    if (kind === "FUN") {
        return {
            type: "CallExpression",
            callee: target,
            "arguments": args
        }
    } else if (kind === "ARR") {
        return {
            type: "MemberExpression",
            computed: true,
            object: target,
            property: {
                type: "BinaryExpression",
                operator: "-",
                left: args[0],
                right: {
                    type: "Literal",
                    value: 1,
                    raw: "1"
                }
            }
        }
    }

    return {
        type:"ConditionalExpression",
        test: {
            type: "BinaryExpression",
            operator: "===",
            left: {
                type: "UnaryExpression",
                operator: "typeof",
                argument: target,
                prefix: true
            },
            right: {
                type: "Literal",
                value: "function",
                raw: "\"function\""
            } 
        },
        consequent: {
            type: "CallExpression",
            callee: target, 
            "arguments": args
        },
        alternate: {
            type: "MemberExpression",
            computed: true,
            object: target,
            property: {
                type: "BinaryExpression",
                operator: "-",
                left: args[0],
                right: {
                    type: "Literal",
                    value: 1,
                    raw: "1"
                }
            }
        }
    }
}




var matlab2JS = esmatcher.createMatcher(matlabGenericTraverser, [
    // Compilation Units
    {
        type: "CompilationUnits",
        programs: /ps/
    }, // -->
    {
        type: "Program",
        body: ["matchAll", /ps/]
    },
    // Script
    {
        type: "Script",
        body: /stmts/ 
    }, // -->
    {
        type: "BlockStatement",
        body: ["matchAll", /stmts/]
    },
    // FunctionList
    {
        type: "FunctionList",
        functions: /fs/
    }, // -->
    {
        type: "BlockStatement",
        body: ["matchAll", /fs/]
    },
    // Function
    {
        type: "Function",
        inputs: /inputs/,
        outputs: /outputs/,
        name: /name/,
        body: /stmts/,
        nested_functions: /fns/
    }, // -->
    {
        type: "VariableDeclaration",
        declarations: ["array", {
            type: "VariableDeclarator",
            id: {
                type: "Identifier",
                name: /name/
            },
            init: {
                type: "FunctionExpression",
                id: null,
                params: function (inputs) {
                    return inputs.map(function (param) {
                        return {
                            type: "Identifier",
                            name: param.name
                        };
                    });
                },
                defaults: ["array"],
                body: {
                    type: "BlockStatement",
                    body: function (stmts,outputs,match) {
                        if (outputs.length > 1) {
                            throw new Error("Functions with multiple return values are not supported.");
                        }

                        var jsStmts = [];
                        jsStmts.push({
                            type: "VariableDeclaration",
                            declarations: [
                                {
                                    type: "VariableDeclarator",
                                    id: {
                                        type: "Identifier",
                                        name: outputs[0].name
                                    },
                                    init: null
                                }
                            ],
                            kind: "var"
                        });
                
                        jsStmts = jsStmts.concat(stmts.map(function (node) { return match(node); }));

                        jsStmts.push({
                            type: "ReturnStatement",
                            argument: {
                                type: "Identifier",
                                name: outputs[0].name
                            }
                        });
                        return jsStmts;
                    }
                },
                rest: null,
                generator: false,
                expression: false
            }
        }],
        kind: "var"
    },
    // ExprStmt
    {
        type: "ExprStmt",
        expression: /e/
    }, // -->
    {
        type: "ExpressionStatement",
        expression: ["match", /e/]
    },
    // NamedExpr
    {
        type: "NameExpr",
        name: {
            type: "Name",
            name: /n/
        }
    }, // -->
    {
        type: "Identifier",
        name: /n/
    },  
    // AssignStmt to ParameterizedExpr
    {
        type: "AssignStmt",
        lhs: {
            type: "ParameterizedExpr",
            target: /target/,
            args: /args/ 
        },
        rhs: /rhs/
    }, // -->
    {
        type: "ExpressionStatement",
        expression: {
            type: "AssignmentExpression",
            operator: "=",
            left: function (target, args, match) {
                return paramExprToJS("ARR", match(target), args.map(match));
            },
            right: ["match", /rhs/]
        }
    },
    // AssignStmt
    {
        type: "AssignStmt",
        lhs: /lhs/,
        rhs: /rhs/
    }, // -->
    {
        type: "ExpressionStatement",
        expression: {
            type: "AssignmentExpression",
            operator: "=",
            left: ["match", /lhs/],
            right: ["match", /rhs/]
        }
    },
    // IntLiteralExpr
    {
        type: "IntLiteralExpr",
        value: /value/,
        raw: /raw/
    }, // -->
    {
        type: "Literal",
        value: /value/,
        raw: /raw/
    },
    // ParameterizedExpr
    {
        type: "ParameterizedExpr",
    }, // -->
    function (node,match) {
        return paramExprToJS(node.target.kind,match(node.target), node.args.map(match));
    },
    // ForStmt
    {
        type: "ForStmt",
        header: {
            type: "AssignStmt",
            lhs: /lhs/,
            rhs: {
                type: "RangeExpr",
                start: /start/,
                stop: /stop/,
                step: {}
            }
        },
        body: /body/
    },
    {
        type: "ForStatement",
        init: {
            type: "VariableDeclaration",
            declarations: ["array",
                {
                    type: "VariableDeclarator",
                    id: ["match", /lhs/],
                    init: ["match", /start/]
                }
            ],
            kind: "var"
        },
        test: {
            type: "BinaryExpression",
            operator: "<=",
            left: ["match", /lhs/],
            right: ["match", /stop/]
        },
        update: {
            type: "UpdateExpression",
            operator: "++",
            argument: ["match", /lhs/],
            prefix: true
        },
        body: {
            type: "BlockStatement",
            body: ["matchAll", /body/]
        }
    },
    // IfStmt
    {
        type: "IfStmt",
    }, // -->
    function (ifStatement, match) {
        var elseBlock = ifStatement.else_block;

        if (elseBlock.type === undefined) {
            var node = null;
        } else {
            var node = {
                    type: "BlockStatement",
                    body: ifStatement.else_block.body.map(match)
            };
        }
        var ifBlocks = ifStatement.if_blocks;

        for (var i = ifBlocks.length-1; i >= 0; --i) {
            var ifBlock = ifBlocks[i];
            node = {
                type: "IfStatement",
                test: match(ifBlock.condition),
                consequent: {
                    type: "BlockStatement",
                    body: ifBlock.body.map(match),
                },
                alternate:node
            };
        }
        return node;
    }
].concat(binops([
    "PlusExpr",     "+",
    "MinusExpr",    "-",
    "GTExpr",       ">",
    "LTExpr",       "<",
    "GEExpr",       ">=",
    "LEExpr",       "<="
])));

exports.matlabGenericTraverser = matlabGenericTraverser;
exports.matlab2JS = matlab2JS;
