/**
 * @file
 * Task: Serve.
 */

/* global module */

module.exports = function (gulp, plugins, options) {
  'use strict';

  gulp.task('serve', 
    gulp.series('build',
    'twigPages:dev-guide',
    'browser-sync',
    'watch'
  ));
};
