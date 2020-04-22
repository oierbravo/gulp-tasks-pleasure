/**
 * @file
 * Task: Generate TWIG based pages.
 */
let path = require ('path');
let fs = require ('fs');
let glob = require ('glob');
let _ = require ('lodash');
var twigMarkdown = require ('twig-markdown');
var twigFunctions = require ('./libs/gulp-twig-funcs');

var moment = require ('moment');
var MarkdownIt = require ('markdown-it'), md = new MarkdownIt ();

module.exports = function (gulp, plugins, options) {
  'use strict';
  function processNetlifyContent (data, options) {
    if (data.date) {
      data.dateLong = moment (data.date).format ('LL');
      data.dateShort = moment (data.date).format ('L');
    }
    _.forEach (options.markdownFields, function (field) {
      if (data[field]) {
        data[field] = md.render (data[field]);
      }
    });
    return data;
  }

  var sources = function () {
    return gulp.src (
      [
        path.join (options.baseDestination, '/assets/js/app.js'),
        path.join (options.baseDestination, '/assets/css/styles.css'),
      ],
      {read: false}
    );
  };
  var twigConfigs = {
    base: path.join (options.twigPages.baseSrc),
    extend: function (Twig) {
      twigMarkdown (Twig);
    },
    functions: twigFunctions,
    namespaces: {
      base: path.join (process.cwd (), options.twigPages.baseSrc),
      layouts: path.join (
        process.cwd (),
        options.twigPages.baseSrc,
        '/_layouts'
      ),
      includes: path.join (
        process.cwd (),
        options.twigPages.baseSrc,
        '/_includes'
      ),
    },
    useFileContents: true,
  };
  require ('./twigpages.pages') (gulp, plugins, options, sources, twigConfigs);
  require ('./twigpages.devguide') (gulp, plugins, options, sources, twigConfigs);
  require ('./twigpages.netlify') (gulp, plugins, options, sources, twigConfigs);

  gulp.task (
    'twigPages',
    gulp.series (
      'netlifycms',
      'twigPages:pages',
      'twigPages:index',
      'twigPages:index:clean',
      'twigPages:dev-guide'
    )
  );
};
