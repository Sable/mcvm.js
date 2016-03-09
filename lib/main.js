var exec = require('child_process').exec
var compiler = require('./compiler')

exports.parseMatlabFile = function (path, cb) {
  var natlabPath = (__dirname + '/../deps/McLabCore.jar').replace(/ /g, '\\ ')
  exec(
    'java -jar ' + natlabPath + ' --json ' + path,
    function (error, stdout, stderr) {
      if (error !== null) {
        throw new Error(error)
      } else {
        var ast = JSON.parse(stdout.toString())
        cb(ast)
      }
    }
  )
}

exports.compileMatlabAST = function (ast, options) {
  return compiler.matlab2JS(ast, options)
}
