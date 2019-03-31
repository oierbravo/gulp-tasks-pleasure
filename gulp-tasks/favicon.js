/**
 * @file
 * Task: Optimize images.
 */

module.exports = function (gulp, plugins, options) {
  'use strict';

  gulp.task('favicon', function () {
    return gulp.src(options.favicon.files)
      .pipe(plugins.favicon(options.favicon.options))
      .pipe(gulp.dest(options.favicon.destination))
      .pipe(plugins.notify({message:"Favicons generados."}))
  });
};
