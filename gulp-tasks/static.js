/**
 * @file
 * Task: Optimize images.
 */

module.exports = function (gulp, plugins, options) {
  'use strict';

  gulp.task('static', function () {
    return gulp.src(options.static.files)
      .pipe(gulp.dest(options.static.destination))
      .pipe(plugins.notify({message:"Assets estaticos copiados.", onLast: true}))
  });
};
