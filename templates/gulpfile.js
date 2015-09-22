'use strict';
// Tasks for <%= appName %>

var del = require('del');
var gulp = require('gulp');
var mocha = require('gulp-mocha');
var install = require('gulp-install');
var istanbul = require('gulp-istanbul');
var jshint = require('gulp-jshint');
var _ = require('lodash');
var complexity = require('gulp-complexity');
var jscs = require('gulp-jscs-with-reporter');
var nsp = require('gulp-nsp');
var zip = require('gulp-zip');
var gutil = require('gulp-util');
var stylish = require('jshint-stylish');
var runSequence = require('run-sequence');
var pkg = require('./package.json');

var sourceFiles = ['app.js', 'operations/**/*.js', 'lib/**/*.js'];
var testSourceFiles = ['test/**/**.spec.js'];
var allSourceFiles = sourceFiles.concat(testSourceFiles);
var otherFiles = ['config.json', 'package.json'];
var prodFiles = sourceFiles.concat(otherFiles);

function getIncludes() {
    var files = sourceFiles;
    var pkg = require('./package.json');
    files.push('config.json');
    Object.keys(pkg.dependencies).forEach(function (mod) {
        files.push('node_modules/' + mod + "/**/*.*");
    });

    return files;
}

gulp.task('test', function (done) {

    gulp.src(sourceFiles)
        .pipe(istanbul()) // Covering files
        .pipe(istanbul.hookRequire()) // Force `require` to return covered files
        .on('finish', function () {
            return gulp.src(testSourceFiles)
                .pipe(mocha())
                .on('error', gutil.log)
                .pipe(istanbul.writeReports()) // Creating the reports after tests ran
                .pipe(istanbul.enforceThresholds({thresholds: {global: 100}})) // Enforce a coverage of at least 100%
                .on('end', done);

        })
        .on('error', gutil.log);
});

gulp.task('style', function () {

    return gulp.src(allSourceFiles)
        .pipe(jscs())
        .pipe(jscs.reporter('inline'))
        .pipe(jscs.reporter('gulp-jscs-html-reporter', {
            filename: __dirname + '/style.html',
            createMissingFolders: false
        }))
        .pipe(jscs.reporter('fail'));
});

gulp.task('lint', function () {

    return gulp.src(allSourceFiles)
        .pipe(jshint())
        .pipe(jshint.reporter(stylish))
        .pipe(jshint.reporter('gulp-jshint-html-reporter', {
            filename: __dirname + '/lint.html',
            createMissingFolders: false
        }))
        .pipe(jshint.reporter('fail'));
});

gulp.task('complexity', function () {
    return gulp.src(sourceFiles)
        .pipe(complexity())
});

gulp.task('security', function (done) {
    nsp('./package.json', done);
});

// Packaging tasks

gulp.task('dist', function () {
    return gulp.src(prodFiles, {base: '.'})
        .pipe(gulp.dest('./dist/'));
});

gulp.task('npm', function(){
    return gulp.src('./dist/package.json')
        .pipe(install({production: true}));
});

gulp.task('zip', function(){
    var archiveName = pkg.name + '-' + pkg.version + '.zip';
    return gulp.src(['dist/**/*', '!dist/' + archiveName])
        .pipe(zip(archiveName))
        .pipe(gulp.dest('./dist'));
});

gulp.task('clean', function (cb) {
    return del('./dist', cb);
});

// Package up your application
gulp.task('package', function (cb) {
    return runSequence(['clean'], ['dist'], ['npm'], ['zip'], cb);
});

gulp.task('default', ['test', 'lint', 'style', 'complexity']);
