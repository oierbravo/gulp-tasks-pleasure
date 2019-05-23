/**
 * @file
 * Task: Generate TWIG based pages.
 */

 module.exports = function (gulp, plugins, options) {
    'use strict';
    let path = require('path');
    let fs = require('fs');
    let glob = require('glob');
    let _ = require('lodash');

    let funcSvgSprite = function(id){
        return '<svg><use xlink:href="/assets/svg/sprite/sprite.svg#' + id + '"></use></svg>';
    }
    let funcActiveMenu = function(target,current){
        if(target === current){
            return 'active';
        }
        return '';
    }
    var sources = function() {
        return gulp.src([
            path.join(options.baseDestination, '/assets/js/*.js'),
            path.join(options.baseDestination, '/assets/css/*.css')]
            , {read: false})
     
    }
 
      
    gulp.task('twigPages:pages', function () {
        return gulp.src([options.twigPages.src])
        //Stay live and reload on error.
        .pipe(plugins.plumber({
            handleError: function (err) {
                console.log(err);
                this.emit('end');
            }
        }))
        //Setting default data.
        .pipe(plugins.data(function(file){
            return {
                title:'Default Title',
            }
        }))
        .pipe(plugins.data(function(file){
            let currentMenu = path.basename(path.dirname(file.path));
            
            if(currentMenu === 'pages') {
                currentMenu = 'index' 
            };
            let general = require('yaml-reader').read(path.join(options.twigPages.data,'site-info.yml'));
            let outputData = _.merge({currentMenu:currentMenu},general);
            return outputData;
        }))
        //Getting json data.
        .pipe(plugins.data(function(file){

            let name = path.basename(path.dirname(file.path));
            /*if(name == 'pages') {
                name = 'index' 
            };*/
            let contentPath = path.join(options.twigPages.data,name + '.yml');
            if(!fs.existsSync(contentPath)){
                return {};
            }
            return  require('yaml-reader').read(contentPath);
       
        }))
        
        //Render via Twig plugin
        .pipe(plugins.twig({
          
            base:path.join(options.twigPages.baseSrc),
            functions:[
                {
                    name: "svgSprite",
                    func: funcSvgSprite
                    
                },
                {
                    name: "activeMenu",
                    func: funcActiveMenu
                    
                }
            ],
          //  debug:true,
           // useFileContents:true
        }))
        .on('error', function (err) {
            process.stderr.write(err.message + '\n');
            this.emit('end');
        })
        //Save files.
        .pipe(plugins.inject(sources(),{ignorePath:'/' + options.baseDestination + '/'}))
        .pipe(plugins.inject(gulp.src([path.join(options.baseDestination, '/assets/js/vendors/*.js')], {read: false}), {starttag: '<!-- inject:vendors:{{ext}} -->',ignorePath:'/' + options.baseDestination + '/'}))
        .pipe(options.production ? plugins.htmlmin({ collapseWhitespace: true ,removeComments:true}) : plugins.util.noop())
        .pipe(gulp.dest(options.twigPages.destination));
    });
    gulp.task('twigPages:components', function () {
        return gulp.src([options.twigPages.componentsSrc])
            .pipe(plugins.plumber({
                handleError: function (err) {
                    console.log(err);
                    this.emit('end');
                }
            }))
            .pipe(plugins.twig({
              //  useFileContents:true,
                base:path.join(options.twigPages.baseSrc),
                functions:[
                    {
                        name: "svgSprite",
                        func: function (args) {
                            return '<svg><use xlink:href="/assets/svg/sprite/sprite.svg#' + args + '"></use></svg>';
                        }
                    }
                ]
            }))
            .on('error', function (err) {
                process.stderr.write(err.message + '\n');
                this.emit('end');
            })
            //Save files.
            .pipe(gulp.dest(options.twigPages.componentsDestination));
      });
      gulp.task('twigPages:dev-guide', function () {
        //Define empty variable for page list.
        let pageList = [];
        //Iterate over source files.
        let pageListFiles =  glob.sync(options.twigPages.src);
        pageListFiles.forEach(function(file){
            //If index exits
            if(path.parse(file)['name'] !== "index") {
                return;
            }
            //Adding entry to the list.
            pageList.push(path.basename(file,'.twig'));
        });
        let componentList = [];

        let componentListFiles =  glob.sync(options.twigPages.componentsSrc);
        componentListFiles.forEach(function(file){
            //Adding entry to the list.
           componentList.push(path.basename(file,'.twig'));
        });
        return gulp.src([path.join(options.twigPages.baseSrc,'dev-guide.twig')])
            .pipe(plugins.data(function(file){
                return {
                    pageList:pageList,
                    componentList:componentList
                }
            }))
            .pipe(plugins.twig({
                base:path.join(options.twigPages.baseSrc),
                functions:[
                    {
                        name: "svgSprite",
                        func: funcSvgSprite
                    }
                ]
            }))
            .on('error', function (err) {
                process.stderr.write(err.message + '\n');
                this.emit('end');
            })
            //Save files.
            .pipe(plugins.inject(sources()))
            .pipe(gulp.dest(options.twigPages.destination));
        
    });
    gulp.task('twigPages:index', function () {
        return gulp.src([path.join(options.twigPages.destination , '/index/index.html')])
        .pipe(plugins.copy(options.twigPages.destination, {prefix:2}))

    });
      gulp.task('twigPages', gulp.parallel(
         // 'twigPages:dev-guide',
          
          'twigPages:pages',
          'twigPages:index'));
  };