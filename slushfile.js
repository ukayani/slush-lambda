'use strict';

/**
 * slush-lambda
 * Licensed under the MIT license.
 */

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
    stringify = require('json-stringify'),
    lodash = require('lodash'),
    fs = require('fs'),
    iniparser = require('iniparser');

function format(input) {
    var output = input.toLowerCase();
    return output.replace(/\s/g, '');
}

function fixHiddenFile(file) {
    if (file.basename[0] === '_') {
        file.basename = '.' + file.basename.slice(1);
    }
}

function createOperationProcessor(operations) {
    return function process(i, file) {
        var op = operations[i],
            dirname = path.dirname(file.path),
            filename = path.basename(file.path).replace('operation', op);

        file.path = path.join(dirname, filename);
        var compiled = lodash.template(file.contents.toString());
        file.contents = new Buffer(
            compiled({opName: op}
            )
        );
    };
}

function determinePlatform() {
    var homeDir, osUserName;

    if (process.platform === 'win32') {
        homeDir = process.env.USERPROFILE;
        osUserName = process.env.USERNAME || path.basename(homeDir).toLowerCase();
    } else {
        homeDir = process.env.HOME || process.env.HOMEPATH;
        osUserName = homeDir && homeDir.split('/').pop() || 'root';
    }

    return {
        homeDir: homeDir,
        osUserName: osUserName
    };
}

function computeDefaults() {
    var workingDirName = path.basename(process.cwd()),
        homeDir, osUserName, configFile, user;

    var result = determinePlatform();
    homeDir = result.homeDir;
    osUserName = result.osUserName;

    configFile = path.join(homeDir, '.gitconfig');
    user = {};

    if (fs.existsSync(configFile)) {
        user = iniparser.parseSync(configFile).user;
    }

    return {
        appName: workingDirName,
        userName: osUserName || format(user.name || ''),
        authorName: user.name || '',
        authorEmail: user.email || ''
    };
}

// Set up defaults for prompts
var defaults = computeDefaults();

gulp.task('default', function(done) {
    var prompts = [{
        name: 'appName',
        message: 'What is the name of your project?',
        'default': defaults.appName
    }, {
        name: 'appDescription',
        message: 'What is the description?'
    }, {
        name: 'appVersion',
        message: 'What is the version of your project?',
        'default': '0.1.0'
    }, {
        name: 'authorName',
        message: 'What is the author name?',
        'default': defaults.authorName
    }, {
        name: 'authorEmail',
        message: 'What is the author email?',
        'default': defaults.authorEmail
    }, {
        name: 'userName',
        message: 'What is the github username?',
        'default': defaults.userName
    }, {
        name: 'operations',
        message: 'List your lambda operations as a comma-delimited string',
        'default': 'get,post'
    }, {
        type: 'confirm',
        name: 'moveon',
        message: 'Continue?'
    }];

    //Ask
    inquirer.prompt(prompts,
        function(answers) {
            if (!answers.moveon) {
                return done();
            }
            answers.appNameSlug = _.slugify(answers.appName);

            var ops = answers.operations.split(',').map(function(op) {
                return op.trim();
            });

            answers.operationsList = stringify(ops);

            var first = gulp.src(__dirname + '/templates/**/operation*.js',
                    {base: __dirname + '/templates'})
                    .pipe(multi(ops.length, createOperationProcessor(ops))),

                second = gulp.src([__dirname + '/templates/**',
                    '!' + __dirname + '/templates/**/operation*.js']);

            return merge(first, second)
                .pipe(template(answers))
                .pipe(rename(function(file) {
                    fixHiddenFile(file);
                }))
                .pipe(conflict('./'))
                .pipe(gulp.dest('./'))
                .pipe(install())
                .on('end', function() {
                    done();
                });
        });
});
