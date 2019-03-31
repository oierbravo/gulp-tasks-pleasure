
module.exports = function (gulp, plugins, options) {
    'use strict';
  
    gulp.task('js:app', function () {
  
      return gulp.src([
        options.js.files
      ])
        .pipe(plugins.plumber({ errorHandler: plugins.notify.onError('Error compilando JS') }))
        .pipe(plugins.sourcemaps.init())
       
        .pipe(plugins.sourcemaps.write())
        .pipe(plugins.plumber.stop())
        .pipe(options.production ? plugins.uglify({ output: { comments: 'some' } }): plugins.util.noop())

        .pipe(plugins.concat('app.js'))
        .pipe(gulp.dest(options.js.destination))
        .pipe(plugins.notify("Compilación JS terminada"));
  
    });
  
    gulp.task('js:vendors', function () {
      if(options.js.vendorFiles.length === 0){
  
        plugins.notify("Sin VENDORS JS que compilar.");
        return Promise.resolve('Vendors ignored');
      }
      return gulp.src(
        options.js.vendorFiles
      )
        .pipe(plugins.plumber({ errorHandler: plugins.notify.onError('Error compilando VENDORS JS') }))
        .pipe(options.production ? plugins.uglify({ output: { comments: 'some' } }) : plugins.util.noop())
        //.pipe(options.production ? plugins.concat('vendors.js') : plugins.util.noop())
        .pipe(plugins.concat('vendors.js')) //por ahora lo dejo asi. Revisar si podemos controlar el orden cuando estan sueltos.
        .pipe(gulp.dest(options.js.vendorDestination))
        .pipe(plugins.notify("Compilación VENDORS JS terminada"));
    });

    gulp.task('js', gulp.parallel('js:app', 'js:vendors'));
  };