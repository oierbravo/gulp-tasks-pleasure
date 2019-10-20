
 let funcSvgSprite = function(id){
    return '<svg><use xlink:href="/assets/svg/sprite/sprite.svg#' + id + '"></use></svg>';
}
let funcActiveMenu = function(target,current){
    if(target === current){
        return 'active';
    }
    return '';
}
let funcResponsiveImage = function(imageName,alt){
    let output = '<img srcset="'; 
    output += imageName;
    output += '-320w.jpg 320w,';
    output += imageName;
    output += '480w.jpg 480w,';
    output += imageName;
    output += '.jpg 800w"sizes="(max-width: 320px) 280px,(max-width: 480px) 440px,800px" src="';
    output += imageName;
    output += '-800w';
    output += '.jpg" alt="';
    output += alt;
    output += '">';
    return output;
}

module.exports = [
    {
        name: "svgSprite",
        func: funcSvgSprite
        
    },
    {
        name: "activeMenu",
        func: funcActiveMenu
        
    },{

    
        name: "responsiveImage",
        func: funcResponsiveImage
    }
];