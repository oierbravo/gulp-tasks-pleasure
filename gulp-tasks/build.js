/**
 * @file
 * Task: Build.
 */

 /* global module */

module.exports = function (gulp, plugins, options) {
  'use strict';
  gulp.task('build', gulp.series(
    'sass',
    'js',
    'images',
    'fonts',
    'svg',
    'videos',
    'static',
    'twigPages')

  );

  
};
