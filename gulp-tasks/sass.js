/**
 * @file
 * Task: Compile: Sass.
 */

 /* global module */
 const postcssCriticalSplit = require('postcss-critical-split')

module.exports = function (gulp, plugins, options) {
  'use strict';

  gulp.task('sass:compile', function () {
    return gulp.src([
      options.sass.file
    ])
      .pipe(plugins.plumber({ errorHandler: plugins.notify.onError('Error compilando SASS') }))
      .pipe(plugins.sourcemaps.init())
      .pipe(plugins.sassGlob())
      .pipe(plugins.sass({
        errLogToConsole: true,
        includePaths: [ './node_modules/' ],
        outputStyle: 'expanded'
      }).on('error', plugins.sass.logError))
      .pipe(plugins.autoprefixer({
        browsers: options.sass.AUTOPREFIXER_BROWSERS,
        cascade: false
      }))
      .pipe(plugins.sourcemaps.write())
      //.pipe(options.production ? plugins.cleanCSS({compatibility: 'ie8'}) : plugins.util.noop())
      .pipe(plugins.flatten())
      .pipe(gulp.dest(options.sass.destination))
      .pipe(plugins.notify("Compilación CSS terminada"));
  });
  gulp.task('sass:split:critical', function () {
    var splitOptions = {
      'start': 'critical:start',
      'stop': 'critical:end',
      'suffix': '-critical',
      'output':postcssCriticalSplit.output_types.CRITICAL_CSS
    };
    return gulp.src([
      options.css.file
    ])
      .pipe(plugins.plumber({ errorHandler: plugins.notify.onError('Error critical css split') }))
     // .pipe(plugins.sourcemaps.write())
      .pipe(plugins.postcss([postcssCriticalSplit(splitOptions)]))
      .pipe(plugins.rename({'suffix': splitOptions.suffix}))

      .pipe(options.production ? plugins.cleanCSS({compatibility: 'ie8'}) : plugins.util.noop())
      .pipe(gulp.dest(options.css.destination))
      .pipe(plugins.notify("Minificacion CSS terminada"));



    });

    gulp.task('sass:split:main', function () {
      var splitOptions = {
        'start': 'critical:start',
        'stop': 'critical:end',
        'suffix': '-critical',
        'output':postcssCriticalSplit.output_types.REST_CSS
      };
      return gulp.src([
        options.css.file
      ])
        .pipe(plugins.plumber({ errorHandler: plugins.notify.onError('Error critical css split') }))
       // .pipe(plugins.sourcemaps.write())
        .pipe(plugins.postcss([postcssCriticalSplit(splitOptions)]))
        .pipe(options.production ? plugins.cleanCSS({compatibility: 'ie8'}) : plugins.util.noop())
        .pipe(gulp.dest(options.css.destination))
        .pipe(plugins.notify("Minificacion CSS terminada"));
  
  
  
      });
      gulp.task('sass:split', gulp.series(
        'sass:split:critical',
        'sass:split:main'
        ));
        gulp.task('sass', gulp.series(
          'sass:compile',
          'sass:split:critical',
          'sass:split:main'
          ));
};
