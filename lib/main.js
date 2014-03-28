var esmatcher = require("esmatcher");
var esprima = require("esprima");
var escodegen = require("escodegen");
var mclib = require("./mclib");
var exec = require("child_process").exec;
var fs = require("fs");

exports.compileMatlabFile = function (path, cb) {
    var natlabPath = (__dirname + "/../deps/Natlab.jar").replace(/ /g, "\\ ");
    var child = exec(
        "java -jar " + natlabPath + " -json " + path,
        function (error, stdout, stderr) {
            if (error !== null) {
                throw new Error(error);
            } else {
                var ast = JSON.parse(stdout.toString());
                cb(exports.compileMatlabAST(ast));
            }
        }
    );
};

exports.compileMatlabAST = function (ast) {
    return JSON.stringify(ast,null,"  ");
};

exports.runMatlabFile = function (path, cb) {
    return true;
};

exports.runMatlabAST = function (ast) {
    return true;
};
