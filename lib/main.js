var exec = require('child_process').exec
var compiler = require('./compiler')
var shelljs = require('shelljs')

exports.parseMatlabFiles = function (paths, cb) {
  var natlabPath = (__dirname + '/../deps/McLabCore.jar').replace(/ /g, '\\ ')
  var silentState = shelljs.config.silent
  shelljs.config.silent = true

  var asts = paths.map(function (path) {
    var cmd = 'java -jar ' + natlabPath + ' --json ' + path
    var status = shelljs.exec(cmd)
    if (status.code !== 0) {
      throw new Error('Error while parsing ' + path + ':\n' + status.output)
    }
    try {
      return JSON.parse(status.output)
    } catch (e) {
      throw new Error('Invalid JSON output for ' + path + ':\n' + status.output)
    }
  })
  shelljs.config.silent = silentState

  if (asts.length === 1) {
    cb(asts[0])
  } else {
    var combinedAsts = {
      type: 'CompilationUnits',
      position: {},
      programs: []
    }

    asts.forEach(function (ast) {
      combinedAsts.programs.push.apply(combinedAsts.programs, ast.programs)
    })
    cb(combinedAsts)
  }
}

exports.compileMatlabAST = function (ast, options) {
  return compiler.matlab2JS(ast, options)
}
