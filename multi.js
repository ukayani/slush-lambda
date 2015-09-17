var through2 = require('through2');
var gutil = require('gulp-util');

function multi(times, processFn){
    return through2.obj(function(file, enc, cb){

        if (file.isNull()) {
            this.push(file);
            return cb();
        }

        if (file.isStream()) {
            this.emit('error', new gutil.PluginError('multi', 'Streaming not supported'));
            return cb();
        }

        for(var i=0; i < times; i++){

            var clonedFile = file.clone();
            try {
                processFn(i, clonedFile);
            } catch (err) {
                this.emit('error', new gutil.PluginError('multi', err, {fileName: file.path}));
            }

            this.push(clonedFile);
        }

        cb();
    });
}

module.exports = multi;