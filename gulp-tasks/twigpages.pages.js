/**
 * @file
 * Task: Generate TWIG based pages.
 */
let path = require ('path');
let fs = require ('fs');

let _ = require ('lodash');
module.exports = function (gulp, plugins, options, sources, twigConfigs) {
  'use strict';
  gulp.task ('twigPages:pages', function () {
    return (gulp
        .src ([options.twigPages.src])
        //Stay live and reload on error.
        .pipe (
          plugins.plumber ({
            handleError: function (err) {
              console.log (err);
              this.emit ('end');
            },
          })
        )
        //Setting default data.
        .pipe (
          plugins.data (function (file) {
            return {
              title: 'Default Title',
              description: 'Default Description',
            };
          })
        )
        .pipe (
          plugins.data (function (file) {
            let currentMenu = path.basename (path.dirname (file.path));

            if (currentMenu === 'pages') {
              currentMenu = 'index';
            }
            let general = require ('yaml-reader').read (
              path.join (options.twigPages.data, 'site-info.yml')
            );
            let outputData = _.merge ({currentMenu: currentMenu}, general);
            return outputData;
          })
        )
        //Getting json data.
        .pipe (
          plugins.data (function (file) {
            let name = path.basename (path.dirname (file.path));
            let listPath = path.join ('tmp/', name + '-list.json');
            if (!fs.existsSync (listPath)) {
              return {};
            }
            let listData = JSON.parse (fs.readFileSync (listPath));
            return {
              items: listData,
            };
          })
        )
        .pipe (
          plugins.data (function (file) {
            let name = path.basename (path.dirname (file.path));
            /*if(name == 'pages') {
                name = 'index' 
            };*/
            let contentPath = path.join (options.twigPages.data, name + '.yml');
            if (!fs.existsSync (contentPath)) {
              return {};
            }
            let data = require ('yaml-reader').read (contentPath);

            if (!data.titleSEO && !file.data.titleSEO) {
              data.titleSEO = data.title;
            }
            if (!data.descriptionSEO && !file.data.descriptionSEO) {
              data.descriptionSEO = data.description;
            }

            return data;
          })
        )
        //Render via Twig plugin
        .pipe (plugins.twig (twigConfigs))
        .on ('error', function (err) {
          process.stderr.write (err.message + '\n');
          this.emit ('end');
        })
        //Save files.
        .pipe (
          plugins.inject (
            gulp.src (
              [path.join (options.baseDestination, '/assets/js/vendors.js')],
              {read: false}
            ),
            {
              removeTags: true,
              starttag: '<!-- inject:vendors:{{ext}} -->',
              ignorePath: '/' + options.baseDestination + '/',
            }
          )
        )
        .pipe (
          plugins.inject (sources (), {
            ignorePath: '/' + options.baseDestination + '/',
            removeTags: true,
          })
        )
        .pipe (
          plugins.inject (
            gulp.src ([
              path.join (
                options.baseDestination,
                '/assets/css/styles-critical.css'
              ),
            ]),
            {
              starttag: '/* inject:styles-critical:{{ext}} */',
              endtag: '/* endinject */',
              removeTags: true,
              transform: function (filePath, file) {
                // return file contents as string
                return file.contents.toString ('utf8');
              },
            }
          )
        )
        .pipe (
          options.production
            ? plugins.htmlmin ({collapseWhitespace: true, removeComments: true})
            : plugins.util.noop ()
        )
        .pipe (gulp.dest (options.twigPages.destination)) );
  });
  gulp.task ('twigPages:index', function () {
    return gulp
      .src ([path.join (options.twigPages.destination, 'index' , 'index.html')], {
        allowEmpty: true,
      })
      .pipe (plugins.copy (options.twigPages.destination, {prefix: 2}));
  });
  gulp.task ('twigPages:index:clean', function () {
    return gulp
      .src ([path.join (options.twigPages.destination, 'index' , 'index.html')])
      .pipe (plugins.clean ());
  });
};
