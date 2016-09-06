var exec = require('child_process').exec
var compiler = require('./compiler')
var shelljs = require('shelljs')
var path = require('path')

exports.parseMatlabFiles = function (paths, cb) {
  var mclabCorePath = (path.join(__dirname, '..', 'McLabCore', 'McLabCore.jar')).replace(/ /g, '\\ ')
  var silentState = shelljs.config.silent
  shelljs.config.silent = true

  var asts = paths.map(function (p) {
    var cmd = 'java -jar ' + mclabCorePath + ' --json ' + p
    var status = shelljs.exec(cmd)
    if (status.code !== 0) {
      throw new Error('Error while parsing ' + p + ':\n' + status.stdout)
    }
    try {
      return JSON.parse(status.stdout)
    } catch (e) {
      throw new Error('Invalid JSON output for ' + p + ':\n' + status.stdout)
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
