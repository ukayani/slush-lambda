'use strict';

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var jshint = require('gulp-jshint');
var complexity = require('gulp-complexity');
var jscs = require('gulp-jscs-with-reporter');
var nsp = require('gulp-nsp');
var zip = require('gulp-zip');
var gutil = require('gulp-util');

//test myself
var sourceFiles = ['slushfile.js'];

function getIncludes() {
  var files = sourceFiles;
  var pkg = require('./package.json');

  Object.keys(pkg.dependencies).forEach(function (mod) {
    files.push('node_modules/' + mod + "**/*.*");
  });

  return files;
}

gulp.task('test', function (done) {

  gulp.src(['lib/**/*.js', 'operations/**/*.js'])
    .pipe(istanbul()) // Covering files
    .pipe(istanbul.hookRequire()) // Force `require` to return covered files
    .on('finish', function () {
      return gulp.src(['test/**/*.spec.js'])
        .pipe(mocha())
        .on('error', gutil.log)
        .pipe(istanbul.writeReports()) // Creating the reports after tests ran
        .pipe(istanbul.enforceThresholds({thresholds: {global: 100}})) // Enforce a coverage of at least 100%
        .on('end', done);

    })
    .on('error', gutil.log);
});

gulp.task('style', function () {
  var jscsConfig = require('./jscs.json');

  return gulp.src(sourceFiles)
    .pipe(jscs(jscsConfig))
    .pipe(jscs.reporter('inline'))
    .pipe(jscs.reporter('gulp-jscs-html-reporter', {
      filename: __dirname + '/style.html',
      createMissingFolders: false
    }))
    .pipe(jscs.reporter('fail'));
});

gulp.task('lint', function () {
  var jshintConfig = require('./jshint.json');
  return gulp.src(sourceFiles)
    .pipe(jshint(jshintConfig))
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('gulp-jshint-html-reporter',
      {
        filename: __dirname + '/lint.html',
        createMissingFolders: false
      }))
    .pipe(jshint.reporter('fail'));
});

gulp.task('complexity', function () {
  return gulp.src(sourceFiles)
    .pipe(complexity(
      {
        cyclomatic: 10,
        halstead: 15,
        maintainability: 100,
        breakOnErrors: true
      }
    ));
});

gulp.task('nsp', function (done) {
  nsp('./package.json', done);
});

gulp.task('package', function () {
  return gulp.src(getIncludes(), {base: './'})
    .pipe(zip('service.zip'))
    .pipe(gulp.dest('.'));
});

gulp.task('default', ['test', 'lint', 'style', 'complexity']);
