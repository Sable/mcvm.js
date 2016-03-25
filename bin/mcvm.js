#!/usr/bin/env node
var fs = require("fs");
var path = require("path");
var McVMJS = require("../lib/main");
var escodegen = require("escodegen");
var _McLib = require('../lib/mclib');

// Default options
var options = {
    prettyPrint : false,
    readMatlabJSON : false,
    jsCodegen : true,
    traceJSAST : false,
    traceMatlabAST : false,
    traceJSCodeGen : false,
    useInlineCaches : false,
    path : null,
    run: false
};

function stringifyJSONThen(cb) {
    return function (jsonObj) {
        cb(options.prettyPrint?JSON.stringify(jsonObj,null,"  "):JSON.stringify(jsonObj));
    };
}

function runJSThen (cb) { 
    return function (jscode) {
        cb(eval(jscode))
    }
}

function compileToJSASTThen(cb) {
    return function (ast) {
        cb(McVMJS.compileMatlabAST(ast,options));
    };
}

function codegenToJSStringThen(cb) {
    var numericSrc = fs.readFileSync(path.join(__dirname, '..', 'lib', 'numeric.js')).toString()
    var matlabSrc = fs.readFileSync(path.join(__dirname, '..', 'lib', 'matlab.js')).toString()
    var mclibSrc = fs.readFileSync(path.join(__dirname, '..', 'lib', 'mclib.js')).toString()
    return function (ast) {
        cb([
            numericSrc, 
            matlabSrc, 
            mclibSrc, 
            escodegen.generate(ast)
        ].join('\n'));
    }; 
}

function readMatlabAstFromJSONFileThen(cb) {
    return function (path) {
        cb(JSON.parse(fs.readFileSync(path)));
    };
}

function readMatlabAstFromFileThen(cb) {
    return function (path) {
        McVMJS.parseMatlabFile(path,cb);
    };
}

function logThen(cb) {
    return function (s) {
        console.log(s);
        cb(s);
    };
}


function doNothing() {}

if (process.argv.length <= 2) {
    var helpString = 
    "mcmv-js OPTIONS FILE\n" +
    "Options:\n" +
    "    --read-matlab-json: FILE will be interpreted as a MATLAB JSON AST\n" +
    "    --pretty-print: The output and traces will be pretty printed\n" + 
    "    --trace-matlab-ast: log the JSON MATLAB AST that was produced by the Natlab parser\n" + 
    "    --trace-js-ast: log the JSON JS AST that was produced from the MATLAB AST\n" + 
    "    --trace-js-codegen: log the JS code that was generated from the JS AST\n" + 
    "    --nouse_ic: do not use run-time type feedback inline caches\n" +
    "    --no-js-codegen: skip the JS code generation phase\n" +
    "    --run: run the generated code\n";
    console.log(helpString);
    process.exit(0);
} else {
    for (var i = 2; i < process.argv.length; ++i) {
        var option = process.argv[i];

        if (option === "--read-matlab-json") {
            options.readMatlabJSON = true;
        } else if (option === "--pretty-print") {
            options.prettyPrint = true;
        } else if (option === "--trace-matlab-ast") {
            options.traceMatlabAST = true;
        } else if (option === "--trace-js-ast") {
            options.traceJSAST = true;
        } else if (option === "--trace-js-codegen") {
            options.traceJSCodeGen = true;
        } else if (option === "--no-js-codegen") {
            options.jsCodegen = false;
        } else if (option === "--nouse_ic") {
            options.useInlineCaches = false;
        } else if (option === "--run") {
            options.run = true;
        } else {
            options.path = option;
        }
    }
}

if (options.path === null) {
    console.log("Error: No file path was provided");
    process.exit(1);
}

function dup(cb1) {
    return function (cb2) {
        return function (value) {
            cb1(value);
            cb2(value);
        }   
    };
}


// Define the sequence of callbacks that will be called
var steps = [];
steps.push(options.readMatlabJSON ? readMatlabAstFromJSONFileThen : readMatlabAstFromFileThen);

if (options.traceMatlabAST === true) {
    steps.push(dup(stringifyJSONThen(console.log)));
}

steps.push(compileToJSASTThen);

if (options.traceJSAST === true) {
    steps.push(dup(stringifyJSONThen(console.log)));
}

if (options.jsCodegen === true) {
    steps.push(codegenToJSStringThen);
    steps.push(logThen);
}

if (options.run) {
    steps.push(runJSThen);
}

// Assemble the callbacks together
var next = doNothing;
for (var i = steps.length-1; i >= 0; --i) {
    next = steps[i](next);
}

// Call the first callback 
next(options.path);
