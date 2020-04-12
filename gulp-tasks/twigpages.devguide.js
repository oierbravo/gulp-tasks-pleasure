/**
 * @file
 * Task: Generate TWIG based pages. Dev-Guide
 * 
 */
let path = require ('path');
let fs = require ('fs');
let glob = require ('glob');
let _ = require ('lodash');

module.exports = function (gulp, plugins, options, sources, twigConfigs) {
  'use strict';
  gulp.task ('twigPages:dev-guide', function (cb) {
    if (options.production) {
      return cb ();
    }
    //Define empty variable for page list.
    let pageList = [];
    //Iterate over source files.
    let pageListFiles = glob.sync (options.twigPages.src);
    pageListFiles.forEach (function (file) {
      //Adding entry to the list.
      if (path.basename (path.dirname (file)) !== 'index') {
        pageList.push (path.basename (path.dirname (file)));
      }
    });
    let netlifyContents = [];
    _.forEach (options.netlifycms.contentTypes, function (content) {
      netlifyContents.push ({name: content.name, label: content.label});
    });
    var devGuideFile = path.join (__dirname, '/libs/dev-guide.twig');
    console.log (devGuideFile);
    if (!fs.existsSync (devGuideFile)) {
      console.log ('DEV_GUIDE not found');
    }
    return (gulp
        .src ([devGuideFile], {allowEmpty: true})
        .pipe (
          plugins.data (function (file) {
            return {
              pageList: pageList,
              netlifyContents: netlifyContents,
            };
          })
        )
        .pipe (plugins.twig (twigConfigs))
        .on ('error', function (err) {
          process.stderr.write (err.message + '\n');
          this.emit ('end');
        })
        //Save files.
        //.pipe(plugins.rename('index.html'))
        .pipe (
          plugins.rename (function (path) {
            path.dirname = '';
            path.basename = 'pleasure';
          })
        )
        .pipe (gulp.dest (options.twigPages.destination)) );
  });
};
