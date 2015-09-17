'use strict';
// Entry point lambda for <%= appName %>

var config = require('./config.json');
var bootstrap = require('aws-lambda-bootstrap');
var operationsFolder = __dirname + '/operations';

module.exports = bootstrap.getHandlersMap(operationsFolder, config);