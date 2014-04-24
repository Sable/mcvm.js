var esmatcher = require("esmatcher");
var esprima = require("esprima");
var escodegen = require("escodegen");
var mclib = require("./mclib");
var exec = require("child_process").exec;
var fs = require("fs");
var matlab = require("./matlab");

exports.parseMatlabFile = function (path, cb) {
    var natlabPath = (__dirname + "/../deps/Natlab.jar").replace(/ /g, "\\ ");
    var child = exec(
        "java -jar " + natlabPath + " -json " + path,
        function (error, stdout, stderr) {
            if (error !== null) {
                throw new Error(error);
            } else {
                var ast = JSON.parse(stdout.toString());
                cb(ast);
            }
        }
    );
}

exports.compileMatlabAST = function (ast, options) {
    return matlab.matlab2JS(ast, options);
};

exports.runMatlabAST = function (ast) {
    return true;
};
