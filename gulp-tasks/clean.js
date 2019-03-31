module.exports = function (gulp, plugins, options) {
    'use strict';
  
    gulp.task('clean', function () {
      plugins.del.sync([
        options.baseDestination
      ]);
      return Promise.resolve();
    });
  };
  