/**
 * @file
 * Task: Optimize images.
 */

module.exports = function (gulp, plugins, options) {
  'use strict';

  gulp.task('videos', function () {
    return gulp.src(options.videos.files)
      .pipe(gulp.dest(options.videos.destination))
      .pipe(plugins.notify({message:"Videos copiados.", onLast: true}))
  });
};
