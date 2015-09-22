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
    stringFns = require('underscore.string'),
    inquirer = require('inquirer'),
    path = require('path'),
    merge = require('merge-stream'),
    multi = require('./multi'),
    _ = require('lodash'),
    fs = require('fs'),
    iniparser = require('iniparser');

var templatesBase = __dirname + '/templates';
var allTemplateArtifacts = templatesBase + '/**';
var operationFiles = allTemplateArtifacts + '/operation*.js';
var notOperationFiles = '!' + operationFiles;

/**
 * Lowercases and removes spaces on the input
 * @param input input to format
 */
function format(input) {
    var output = input.toLowerCase();
    return output.replace(/\s/g, '');
}

/**
 * Fixes the file if it begins with _ and preprends it with . instead
 * @file the file to be analyzed
 */
function fixHiddenFile(file) {
    if (file.basename[0] === '_') {
        file.basename = '.' + file.basename.slice(1);
    }
}

/**
 * Given a list of operations, produce a processor function that renames the files by replacing the operation
 * placeholder and runs each file through template processing to fill in placeholders in file content
 * @param operations
 * @returns {Function}
 */
function createOperationProcessor(operations) {
    return function process(i, file) {
        var op = operations[i],
            dirname = path.dirname(file.path),
            filename = path.basename(file.path).replace('operation', op);

        file.path = path.join(dirname, filename);
        var compiled = _.template(file.contents.toString());
        file.contents = new Buffer(
            compiled({opName: op}
            )
        );
    };
}

/**
 * Given config object and a list of operations, add the list to the config object
 * @param original
 * @param operationsAnswer
 * @returns {Array.<T>}
 */
function addOperationsList(config, operationsList) {

    if (!config.hasOwnProperty('operations')) {
        config.operations = [];
    }

    config.operations = _.union(config.operations, operationsList).sort();
}

function operationsListFromDelimitedString(operationsAnswer) {
    return operationsAnswer.split(',').map(function (op) {
        return op.trim();
    });

}

/**
 *  Determines home directories based on platform
 *  This is used by the inquire plugin
 */
function determineDirectoriesBasedOnPlatform() {
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

/**
 *  Defaults for the inquire plugin when creating a new base project
 */
function computeDefaults() {
    var workingDirName = path.basename(process.cwd()),
        homeDir, osUserName, configFile, user;

    var result = determineDirectoriesBasedOnPlatform();
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

gulp.task('default', function (done) {
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
        function (answers) {
            if (!answers.moveon) {
                return done();
            }

            var config = {};
            var ops = operationsListFromDelimitedString(answers.operations);
            addOperationsList(config, ops);

            var templateVars = answers;
            templateVars.appNameSlug = stringFns.slugify(answers.appName);
            templateVars.configJSON = JSON.stringify(config, null, '\t');

            var first = gulp.src(operationFiles,
                {base: templatesBase})
                .pipe(multi(ops.length, createOperationProcessor(ops)));

            var second = gulp.src([allTemplateArtifacts,
                notOperationFiles]);

            return merge(first, second)
                .pipe(template(templateVars))
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

gulp.task('add-operation', function (done) {
    var prompts = [{
        name: 'operations',
        message: 'List the lambda operations you wish to add as a comma-delimited string'
    }];

    //Ask
    inquirer.prompt(prompts,
        function (answers) {
            var cwd = process.cwd();
            var configPath = path.join(cwd, 'config.json');
            var config = require(configPath);
            var ops = operationsListFromDelimitedString(answers.operations);
            addOperationsList(config, ops);

            fs.writeFile(configPath, JSON.stringify(config, null, '\t'), function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Updated config.json');
                }

                gulp.src(operationFiles,
                    {base: templatesBase})
                    .pipe(multi(ops.length, createOperationProcessor(ops)))
                    .pipe(conflict('./'))
                    .pipe(gulp.dest('./'))
                    .on('end', done);
            });
        }
    );
});
