var through2 = require('through2');
var gutil = require('gulp-util');

/**
 * For each incoming file, clone the file, run a processor on it and push it
 * @param times - number of times to clone incoming file
 * @param processFn - (index, file) -> void - Responsible for processing each file.
 * Note: processFn should rename incoming files based on their to avoid overwriting files when they are written to a
 * dest
 */
function multi(times, processFn) {
  return through2.obj(function (file, enc, cb) {

    if (file.isNull()) {
      this.push(file);
      return cb();
    }

    if (file.isStream()) {
      this.emit('error', new gutil.PluginError('multi', 'Streaming not supported'));
      return cb();
    }

    for (var i = 0; i < times; i++) {

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
