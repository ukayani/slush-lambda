'use strict';

var operation = require('../operations/<%= opName %>');
var sinon = require('sinon');
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;

describe('<%= opName %> Operation Tests', function () {

  // Create a lambda function context that is being spied on by sinon
  function createLambdaContext() {
    // create a stub succeed function that we will spy on with sinon
    var context = {
      succeed: function (message) {
      }
    };
    sinon.spy(context, 'succeed');
    return context;
  }

  it('Should succeed and return "Hello World"', function () {
    var ctx = createLambdaContext();
    var event = {};
    // run the handler
    operation(event, ctx);

    // check if the handler called succeed with appropriate arg
    ctx.succeed.getCall(0).calledWith('Hello World').should.be.ok;

  });

});
