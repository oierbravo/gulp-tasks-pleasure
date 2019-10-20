
/**
 * @file
 * Task: Generate TWIG based pages.
 */
let path = require('path');
let fs = require('fs');
let glob = require('glob');
let _ = require('lodash');
var twigMarkdown = require('twig-markdown');
var twigFunctions = require('./libs/gulp-twig-funcs')

var moment = require('moment');
var MarkdownIt = require('markdown-it'),
md = new MarkdownIt();

 module.exports = function (gulp, plugins, options) {
    'use strict';
    function processNetlifyContent(data,options){
        if(data.date){
            data.dateLong = moment(data.date).format('LL');
            data.dateShort = moment(data.date).format('L');
        }
        _.forEach(options.markdownFields,function(field){
            if(data[field]){
                data[field] = md.render(data[field]);
            }
        })
        return data;
    }
      
    var sources = function() {
        return gulp.src([
            path.join(options.baseDestination, '/assets/js/*.js'),
            path.join(options.baseDestination, '/assets/css/*.css')]
            , {read: false})
     
    }
    var twigConfigs = {
        base:path.join(options.twigPages.baseSrc),
            extend: function(Twig){
                twigMarkdown(Twig);
            },
            functions: twigFunctions,
            namespaces: {
                'base': path.join(process.cwd(), options.twigPages.baseSrc),
                'layouts': path.join(process.cwd(), options.twigPages.baseSrc , '/_layouts'),
                'includes': path.join(process.cwd(), options.twigPages.baseSrc , '/_includes')
            },
            useFileContents: true
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
                description:'Default Description',
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
            let listPath = path.join('tmp/',name + '-list.json');
            if(!fs.existsSync(listPath)){
                return {};
            }
            let listData = JSON.parse(fs.readFileSync(listPath));
            return {
                items: listData
            }
        }))
        .pipe(plugins.data(function(file){

            let name = path.basename(path.dirname(file.path));
            /*if(name == 'pages') {
                name = 'index' 
            };*/
            let contentPath = path.join(options.twigPages.data,name + '.yml');
            if(!fs.existsSync(contentPath)){
                return {};
            }
            let data = require('yaml-reader').read(contentPath);

            if(!data.titleSEO && !file.data.titleSEO){
                data.titleSEO = data.title;
            }
            if(!data.descriptionSEO && !file.data.descriptionSEO){
                data.descriptionSEO = data.description;
            }
            
            return  data;
       
        }))
        
        //Render via Twig plugin
        .pipe(plugins.twig(twigConfigs))
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
      gulp.task('twigPages:dev-guide', function (cb) {
        if(options.production){
            return cb();
        }
        //Define empty variable for page list.
        let pageList = [];
        //Iterate over source files.
        let pageListFiles =  glob.sync(options.twigPages.src);
        pageListFiles.forEach(function(file){
            //Adding entry to the list.
            if(path.basename(path.dirname(file)) !== 'index'){
                pageList.push(path.basename(path.dirname(file)));
            }
            
        });
        let netlifyContents = [];
        _.forEach(options.netlifycms.contentTypes,function(content){
            netlifyContents.push({name:content.name,label:content.label});
        })
        var devGuideFile = path.join(__dirname,'/libs/dev-guide.twig');
        console.log(devGuideFile);
        if(!fs.existsSync(devGuideFile)){
           console.log('DEV_GUIDE not found');
        }
        return gulp.src([devGuideFile],{allowEmpty:true})
            .pipe(plugins.data(function(file){
                return {
                    pageList:pageList,
                    netlifyContents: netlifyContents
                }
            }))
            .pipe(plugins.twig(twigConfigs))
            .on('error', function (err) {
                process.stderr.write(err.message + '\n');
                this.emit('end');
            })
            //Save files.
            //.pipe(plugins.rename('index.html'))
            .pipe(plugins.rename(function (path) {
                path.dirname = '';
                path.basename = 'pleasure';
            }))
            .pipe(gulp.dest(options.twigPages.destination));
            
        
    });
    gulp.task('netlifycms:items', function(cb) {
        let contentTypes = options.netlifycms.contentTypes;
        
        //console.log(contentTypes);
        _.forEach(contentTypes, function(content){
            
            let currentContentSource = path.join(options.netlifycms.baseSource,content.name,'/*.json');
            let currentContentDestination = path.join( options.netlifycms.baseDestination,content.name + '/');
            if(!content.itemTemplateSrc){
                return;
            }
            gulp.src(currentContentSource)
                .pipe(plugins.data(function(file){
                    let contentData = JSON.parse(file.contents.toString());
                    file.data = processNetlifyContent(contentData,content);
                    
                    if(contentData.template){
                        content.itemTemplateSrc = options.templateBaseSrc + contentData.template + '.twig';
                    }

                    if(!content.itemTemplateSrc){
                        gulp.emit('error', new PluginError(TASK_NAME, 'templateSrc missing!'));
                
                    }

                    

                    let templatePath = path.join(process.cwd(),content.itemTemplateSrc);
                    if(!fs.existsSync(templatePath)){
                        gulp.emit('error', new PluginError(TASK_NAME, 'templateSrc "' + templatePath +'" not found!'));
                    }
                    file.contents = new Buffer.from(fs.readFileSync(templatePath));
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
                .pipe(plugins.twig(twigConfigs))
                .pipe(plugins.rename(function (path) {
                    path.dirname = path.basename;
                    path.basename = 'index';
                }))

                .pipe(plugins.inject(sources(),{ignorePath:'/' + options.baseDestination + '/'}))
                .pipe(plugins.inject(gulp.src([path.join(options.baseDestination, '/assets/js/vendors/*.js')], {read: false}), {starttag: '<!-- inject:vendors:{{ext}} -->',ignorePath:'/' + options.baseDestination + '/'}))
                .pipe(options.production ? plugins.htmlmin({ collapseWhitespace: true ,removeComments:true}) : plugins.util.noop())
                .pipe(gulp.dest(currentContentDestination));
        })

           
            

            cb();
      });
      gulp.task('netlifycms:list', function(cb) {
        let contentTypes = options.netlifycms.contentTypes;
        
        _.forEach(contentTypes, function(content){
            if(!content.listTemplateSrc){
                return;
            }
            let currentContentSource = path.join(options.netlifycms.baseSource,content.name,'/*.json');
            return gulp.src(currentContentSource)
            .pipe(plugins.data(function(file){
                let dataContent = JSON.parse(file.contents.toString());
                file.data = dataContent;
                
                if(dataContent.template){
                    content.listTemplateSrc = options.templateBaseSrc + dataContent.template + '.twig';
                }
                if(fs.existsSync(content.listTemplateSrc)){
                    file.contents = new Buffer.from(fs.readFileSync(content.listTemplateSrc));
                }
                
            }))
            .pipe(plugins.data(function(file){
                let currentMenu = content.name
                let general = require('yaml-reader').read(path.join(options.twigPages.data,'site-info.yml'));
                let outputData = _.merge({currentMenu:currentMenu},general);
                return outputData;
            }))
            .pipe(plugins.data(function(file){
                let items = [];
                let contentListFiles =  glob.sync(currentContentSource);
                contentListFiles.forEach(function(file){
                    //Adding entry to the list.
                    var contentData = JSON.parse(fs.readFileSync(file));
    
                    contentData.slug = path.basename(file,'.json');
                    items.push(processNetlifyContent(contentData,content));
                });
                return {items:items};
            }))
            .pipe(plugins.twig(twigConfigs))
            .pipe(plugins.rename(function (path) {
                path.dirname = content.name;
                path.basename = 'index';
              }))
              .on('error', function (err) {
                process.stderr.write(err.message + '\n');
                this.emit('end');
            })
            //Save files.
            .pipe(plugins.inject(sources(),{ignorePath:'/' + options.baseDestination + '/'}))
            .pipe(plugins.inject(gulp.src([path.join(options.baseDestination, '/assets/js/vendors/*.js')], {read: false}), {starttag: '<!-- inject:vendors:{{ext}} -->',ignorePath:'/' + options.baseDestination + '/'}))
            .pipe(options.production ? plugins.htmlmin({ collapseWhitespace: true ,removeComments:true}) : plugins.util.noop())
            .pipe(gulp.dest(options.netlifycms.baseDestination));
        })

           
            

            cb();
      });
      gulp.task('netlifycms',gulp.parallel(
          'netlifycms:items',
          'netlifycms:list'
          ));
    gulp.task('twigPages:index', function () {
        return gulp.src([path.join(options.twigPages.destination , '/index/index.html')],{allowEmpty:true})
        .pipe(plugins.copy(options.twigPages.destination, {prefix:2}))

    });
    gulp.task('twigPages:index:clean', function () {
        return gulp.src([path.join(options.twigPages.destination , '/index/index.html')])
        .pipe(plugins.clean())

    });
    gulp.task('twigPages',gulp.series('netlifycms','twigPages:pages','twigPages:index','twigPages:index:clean','twigPages:dev-guide'));
     /* gulp.task('twigPages', (options.production) ? 
        gulp.series('netlifycms','twigPages:pages','twigPages:index','twigPages:index:clean') : 
        gulp.series('twigPages:pages','twigPages:index','twigPages:dev-guide')
        );*/
  };