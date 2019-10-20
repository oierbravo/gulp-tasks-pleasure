var path = require('path');
var fs = require('fs');

var util = require('gulp-util');
var _ = require('lodash');

module.exports = function (gulp) {
    'use strict';
// Setting pattern this way allows non gulp- plugins to be loaded as well.
var plugins = require('gulp-load-plugins')({
    pattern: '*',
    rename: {
      'node-sass-import-once': 'importOnce',
      'gulp-sass-glob': 'sassGlob',
      'run-sequence': 'runSequence',
      'gulp-clean-css': 'cleanCSS',
      'gulp-stylelint': 'gulpStylelint',
      'gulp-eslint': 'gulpEslint',
      'gulp-babel': 'babel',
      'gulp-util': 'gutil',
      'gulp-notify': 'notify',
      'gulp-concat': 'concat',
      'gulp-uglify': 'uglify',
      'gulp-imagemin': 'imagemin',
      'gulp-twig' : 'twig',
      'gulp-data' : 'data',
      'glob': 'glob',
      'flatten': 'gulp-flatten',
      'gulp-svg-sprite': 'svgsprite',
      'gulp-util':'util',
      'gulp-inject': 'inject',
      'gulp-front-matter':'frontmatter',
      'gulp-htmlmin':'htmlmin',
      'gulp-postcss':'postcss',
      'gulp-copy': 'copy',
      'gulp-clean':'clean',
      'gulp-rename': 'rename'
        }
    });

    //Default paths.
    var paths = {
      baseSrc: '',
      baseDestination: !!util.env.production ? 'build' : 'build-dev',
      styles: {
        source: 'src/assets/scss/',
        destination: 'assets/css/'
      },
      scripts: {
        source: 'src/assets/js/',
        destination: 'assets/js',
        
      },
      jsVendorFiles: [
      ],
      images: {
        source: 'src/assets/images/',
        destination: 'assets/images/'
      },
      fonts: {
        source: 'src/assets/fonts/',
        destination: 'assets/fonts/'
      },
      videos: {
        source: 'src/assets/videos/',
        destination: 'assets/videos/'
      },
      static: {
        source: 'src/static/',
        destination: '/'
      },
      twigPages: {
        src: 'src/pages/' ,
        componentsSrc: 'src/pages/_components/' ,
        data: 'src/pages/_data/',
        destination: '/',
        componentsDestination:'components'
      },
      svg : {
        source: 'src/assets/svg',
        destination: 'assets/svg'
      }
    };
    let customPaths = require(path.join(process.cwd(), '/config.vendors.js'));
    //Mezclamos los custom paths con los defaults.
    Object.assign(paths,customPaths );

    //Default options.
    var options = {
        baseDestination: path.join(paths.baseDestination),
        // ----- Browsersync ----- //
        browserSync: {
          // Put your local site URL here to prevent Browsersync
          // from prompting you to add additional scripts to your page.
          // open: 'external',
          //xip: true,
          //logConnections: true
      
          server: {baseDir: [!!util.env.production ? 'build' : 'build-dev']},
          startPath: "/pleasure.html",
          port: 3005,
          online: false,
      
          open: true,
          //ghostMode: false,
          logConnections: true,
        },

        // ----- CSS ----- //
      
        css: {
          files: path.join(paths.styles.destination, '**/*.css'),
          file: path.join(paths.baseDestination,paths.styles.destination, '/styles.css'),
          destination: path.join(paths.baseDestination, paths.styles.destination)
        },
      
        // ----- Sass ----- //
      
        sass: {
          files: path.join(paths.styles.source, '**/*.scss'),
          file: path.join(paths.styles.source, 'styles.scss'),
          destination: path.join(paths.baseDestination, paths.styles.destination),
          AUTOPREFIXER_BROWSERS: [
            'ie >= 10',
            'ie_mob >= 10',
            'ff >= 30',
            'chrome >= 34',
            'safari >= 9',
            'opera >= 23',
            'ios >= 8',
            'android >= 4.4',
            'bb >= 10'
          ]
        },
      
        // ----- JS ----- //
        js: {
          files: path.join(paths.scripts.source, '**/*.js'),
          compiledFiles: path.join(paths.scripts.destination, '**/*.js'),
          vendorFiles: paths.jsVendorFiles,
          destination: path.join(paths.baseDestination, paths.scripts.destination),
          vendorDestination: path.join(paths.baseDestination, paths.scripts.destination,'vendors')
        },
      
        // ----- eslint ----- //
        jsLinting: {
          files: {
            theme: [
              paths.scripts.source + '**/*.js',
              '!' + paths.scripts.source + '**/*.min.js'
            ],
            gulp: [
              'gulpfile.js',
              'gulp-tasks/**/*'
            ]
          }
      
        },
        // ----- Fonts ----- //
        fonts: {
          files: paths.fonts.source + '**/*.{ttf,woff,otf,eot,svg,woff2}',
          destination: path.join(paths.baseDestination,paths.fonts.destination)
        },
        // ----- Videos ----- //
        videos: {
          files: paths.videos.source + '**/*.*',
          destination: path.join(paths.baseDestination, paths.videos.destination)
        },
        // ----- Static Assets ----- //
        static: {
          files: paths.static.source + '**/*.*',
          destination: path.join(paths.baseDestination,paths.static.destination)
        },
        // ----- Images ----- //
        images: {
          files: paths.images.source + '**/*.{png,gif,jpg,svg,xml,webmanifest}',
          destination: path.join(paths.baseDestination,paths.images.destination)
        },
        // ----- TWIG pages ---- //
        twigPages: {
          baseSrc: path.join(paths.twigPages.src),
          src: path.join(paths.twigPages.src, '/**/index.twig'),
          componentsSrc: path.join(paths.twigPages.componentsSrc, '/**/*.twig'),
          allSrc: path.join(paths.twigPages.src, '/**/*'), //Needed for watch task
          data:path.join(paths.twigPages.data),
          destination: path.join(paths.baseDestination, paths.twigPages.destination),
          componentsDestination: path.join(paths.baseDestination,paths.twigPages.componentsDestination)
        },
        svg: {
          files: path.join(paths.svg.source, '**/*.svg'),
          destination: path.join(paths.baseDestination, paths.svg.destination),
          mode: {
            symbol: { // symbol mode to build the SVG
              dest: 'sprite', // destination folder
              prefix: '.svg--%s', // BEM-style prefix if styles rendered
              sprite: 'sprite.svg', //generated sprite name
              example: !!util.env.production ? false : {template: path.join(__dirname,'/gulp-tasks/libs/svg-sprite/svg-symbols.tmpl')}// Build a sample page, please!
            }
          },
        },
        netlifycms: {
          baseSource: path.join('content/'),
          baseDestination: path.join(paths.baseDestination),
          contentTypes: []
        }
    }

    if(fs.existsSync('./src/static/admin/config.yml')){
      var netlifyCMSConfigData = require('yaml-reader').read('./src/static/admin/config.yml');
      _.forEach(netlifyCMSConfigData.collections,function(content,index){
        var contentType = {
          name: content.name.toLowerCase(),
          label: content.label,
          markdownFields:[]
        }
        content.fields.map(function(field){
            if(field.widget === 'markdown'){
              contentType.markdownFields.push(field.name);
            }
        });
        var itemTwig = path.join(options.twigPages.baseSrc,contentType.name + '/item.twig');
        if(fs.existsSync(itemTwig)){
          contentType.itemTemplateSrc = itemTwig;
        }
        var listTwig = path.join(options.twigPages.baseSrc,contentType.name + '/list.twig');
        if(fs.existsSync(listTwig)){
          contentType.listTemplateSrc = listTwig;
        }
        options.netlifycms.contentTypes.push(contentType);
      });
    }
    //Asignamos las opciones custom.
    //Object.assign(options,customOptions );

    options.production = !!util.env.production;
    if(options.production){
      console.log('-=PRODUCTION MODE=-');
      console.log('DESTINATION:',options.baseDestination);
    }
    //Cargamos las task del gulp.
    require('./gulp-tasks/javascript')(gulp, plugins, options);
    require('./gulp-tasks/svg')(gulp, plugins, options);
    require('./gulp-tasks/twigpages')(gulp, plugins, options);
    require('./gulp-tasks/browser-sync')(gulp, plugins, options);
    require('./gulp-tasks/images')(gulp, plugins, options);
    require('./gulp-tasks/videos')(gulp, plugins, options);
    require('./gulp-tasks/static')(gulp, plugins, options);
    require('./gulp-tasks/clean')(gulp, plugins, options);
    require('./gulp-tasks/fonts')(gulp, plugins, options);
    require('./gulp-tasks/sass')(gulp, plugins, options);
    require('./gulp-tasks/build')(gulp, plugins, options);
    require('./gulp-tasks/watch')(gulp, plugins, options);
    require('./gulp-tasks/serve')(gulp, plugins, options);
    require('./gulp-tasks/default')(gulp, plugins, options);
  };
