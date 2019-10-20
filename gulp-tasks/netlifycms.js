let path = require('path');
let fs = require('fs');
var PluginError = require('plugin-error');
var twigPipe = require('gulp-twig-pipe');
var twigMarkdown = require('twig-markdown');
let glob = require('glob');

var _ = require('lodash');
var twigFunctions = require('./libs/gulp-twig-funcs');
moment = require('moment');
var MarkdownIt = require('markdown-it'),
    md = new MarkdownIt();

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

module.exports = function (gulp, plugins, options) {
    var TASK_NAME = 'netlifyCMS';
    moment.locale('es');
    var sources = function() {
        return gulp.src([
            path.join(options.baseDestination, '/assets/js/*.js'),
            path.join(options.baseDestination, '/assets/css/*.css')]
            , {read: false})
     
    }
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
                .pipe(plugins.twig({
                    base:path.join(process.cwd(), options.twigPages.baseSrc),
                    extend: function(Twig){
                        twigMarkdown(Twig);
                    },
                    useFileContents: true,
                    namespaces: {
                        'base': path.join(process.cwd(), options.twigPages.baseSrc),
                        'layouts': path.join(process.cwd(), options.twigPages.baseSrc , '/_layouts'),
                        'includes': path.join(process.cwd(), options.twigPages.baseSrc , '/_includes')
                    },
                    functions: twigFunctions,
                }))
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
        
        //console.log(contentTypes);
        _.forEach(contentTypes, function(content){
            
            let currentContentSource = path.join(options.netlifycms.baseSource,content.name,'/*.json');
            return gulp.src(currentContentSource)
            //.pipe(netlifycms(content,options.twigPages.baseSrc))
            .pipe(plugins.data(function(file){
                let dataContent = JSON.parse(file.contents.toString());
                file.data = dataContent;
                
                if(dataContent.template){
                    content.listTemplateSrc = options.templateBaseSrc + dataContent.template + '.twig';
                }
                if(!content.listTemplateSrc){
                    gulp.emit('error', new PluginError(TASK_NAME, 'listTemplateSrc missing!'));
            
                }
                let templatePath = path.join(process.cwd(),content.listTemplateSrc);
                if(!fs.existsSync(templatePath)){
                    gulp.emit('error', new PluginError(TASK_NAME, 'listTemplateSrc "' + templatePath +'" not found!'));
                }
                file.contents = new Buffer.from(fs.readFileSync(templatePath));
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
                    contentData = JSON.parse(fs.readFileSync(file));
    
                    contentData.slug = path.basename(file,'.json');
                    items.push(processNetlifyContent(contentData,content));
                });
                return {items:items};
            }))
            .pipe(plugins.twig({
                base:path.join(process.cwd(), options.twigPages.baseSrc),
                extend: function(Twig){
                    twigMarkdown(Twig);
                },
                useFileContents: true,
                namespaces: {
                    'base': path.join(process.cwd(), options.twigPages.baseSrc),
                    'layouts': path.join(process.cwd(), options.twigPages.baseSrc , '/_layouts'),
                    'includes': path.join(process.cwd(), options.twigPages.baseSrc , '/_includes')
                },
                functions: twigFunctions,
            }))
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
          'netlifycms:list',
          'netlifycms:admin'
          ));
}