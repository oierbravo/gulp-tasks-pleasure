/**
 * @file
 * Task: Watch.
 */

 /* global module */

module.exports = function (gulp, plugins, options) {
  'use strict';



  gulp.task('watch:js'
    , function () {
        return gulp.watch(options.js.files,gulp.series(
              'js',
              'browser-sync:reload'
            ));

    });

  gulp.task('watch:sass', function (cb) {
    gulp.watch(
      options.sass.files
    , gulp.series(
        'sass',
        'browser-sync:reload'
      ));
      cb();
    });

  gulp.task('watch:images', function () {
    return gulp.watch( options.images.files,gulp.series('images','browser-sync:reload'));
  });
  gulp.task('watch:fonts', function () {
    return gulp.watch( options.fonts.files,gulp.series('fonts','browser-sync:reload'));
  });
  gulp.task('watch:videos', function () {
    return gulp.watch( options.videos.files,gulp.series('videos','browser-sync:reload'));
  });
  gulp.task('watch:static', function () {
    return gulp.watch( options.static.files,gulp.series('static','browser-sync:reload'));
  });
  gulp.task('watch:svg', function () {
    return gulp.watch( options.svg.files,gulp.series('svg','browser-sync:reload'));
  });
  gulp.task('watch:twigPages', function () {
    return gulp.watch(options.twigPages.allSrc,gulp.series('twigPages','browser-sync:reload'));
  });
  gulp.task('watch:content', function () {
    return gulp.watch(options.netlifycms.baseSource + '/**/*.json',gulp.series('twigPages','browser-sync:reload'));
  });
  gulp.task('watch:vendorJsConfig', function () {
    return gulp.watch('./config.vendors.js',gulp.series('js','browser-sync:reload'));
  });

  gulp.task('watch', gulp.parallel('watch:sass','watch:content', 'watch:js', 'watch:fonts', 'watch:images','watch:twigPages','watch:videos','watch:static','watch:svg'));
};
