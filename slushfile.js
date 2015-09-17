/*
 * slush-lambda
 * Licensed under the MIT license.
 */

'use strict';

var gulp = require('gulp'),
    install = require('gulp-install'),
    conflict = require('gulp-conflict'),
    template = require('gulp-template'),
    rename = require('gulp-rename'),
    _ = require('underscore.string'),
    inquirer = require('inquirer'),
    path = require('path'),
    merge = require('merge-stream'),
    multi = require('./multi'),
    lodash = require('lodash');

function format(input) {
    var output = input.toLowerCase();
    return output.replace(/\s/g, '');
}

// Set up defaults for prompts
var defaults = (function () {
    var workingDirName = path.basename(process.cwd()),
        homeDir, osUserName, configFile, user;

    if (process.platform === 'win32') {
        homeDir = process.env.USERPROFILE;
        osUserName = process.env.USERNAME || path.basename(homeDir).toLowerCase();
    }
    else {
        homeDir = process.env.HOME || process.env.HOMEPATH;
        osUserName = homeDir && homeDir.split('/').pop() || 'root';
    }

    configFile = path.join(homeDir, '.gitconfig');
    user = {};

    if (require('fs').existsSync(configFile)) {
        user = require('iniparser').parseSync(configFile).user;
    }

    return {
        appName: workingDirName,
        userName: osUserName || format(user.name || ''),
        authorName: user.name || '',
        authorEmail: user.email || ''
    };
})();

gulp.task('default', function (done) {
    var prompts = [{
        name: 'appName',
        message: 'What is the name of your project?',
        default: defaults.appName
    }, {
        name: 'appDescription',
        message: 'What is the description?'
    }, {
        name: 'appVersion',
        message: 'What is the version of your project?',
        default: '0.1.0'
    }, {
        name: 'authorName',
        message: 'What is the author name?',
        default: defaults.authorName
    }, {
        name: 'authorEmail',
        message: 'What is the author email?',
        default: defaults.authorEmail
    }, {
        name: 'userName',
        message: 'What is the github username?',
        default: defaults.userName
    }, {
        name: 'operations',
        message: 'List your lambda operations as a comma-delimited string',
        default: 'get,post'
    }
        , {
            type: 'confirm',
            name: 'moveon',
            message: 'Continue?'
        }];

    //Ask
    inquirer.prompt(prompts,
                    function (answers) {
                        if (!answers.moveon) {
                            return done();
                        }
                        answers.appNameSlug = _.slugify(answers.appName);

                        var ops = answers.operations.split(',').map(function (op) {
                            return op.trim()
                        });

                        answers.operationsList = JSON.stringify(ops);

                        var first = gulp.src(__dirname + '/templates/**/operation*.js',
                            {base: __dirname + '/templates'})
                            .pipe(multi(ops.length, createOperationProcessor(ops)));

                        var second = gulp.src([__dirname + '/templates/**',
                                               '!' + __dirname + '/templates/**/operation*.js']);

                        return merge(first, second)
                            .pipe(template(answers))
                            .pipe(rename(function (file) {
                                      fixHiddenFile(file);
                                  }))
                            .pipe(conflict('./'))
                            .pipe(gulp.dest('./'))
                            .pipe(install())
                            .on('end', function () {
                                    done();
                                });
                    });
});


function fixHiddenFile(file) {
    if (file.basename[0] === '_') {
        file.basename = '.' + file.basename.slice(1);
    }
}

function createOperationProcessor(operations) {

    return function process(i, file) {
        var op = operations[i];
        var dirname = path.dirname(file.path);
        var filename = path.basename(file.path).replace('operation', op);
        file.path = path.join(dirname, filename);
        var compiled = lodash.template(file.contents.toString());
        file.contents = new Buffer(compiled({'opName': op}));
    }
}
