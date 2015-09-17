'use strict';
// Lambda handler for <%= opName %>

function handler(event, context){
    context.succeed('Hello World');
}

module.exports = handler;