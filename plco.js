console.log('plco.js loaded')

plco={
    date:new Date()

}

plco.loadScript=async(url,host)=>{
    let s = document.createElement('script')
    s.src=url
    return document.head.appendChild(s)
}

if(location.href.match('localhost')){
    plco.loadScript(`${location.href}plcoJonas.js`)
    plco.loadScript(`${location.href}plcoLorena.js`)
}else{
    plco.loadScript('https://episphere.github.io/plco/plcoJonas.js')
    plco.loadScript('https://episphere.github.io/plco/plcoLorena.js')
}

if(typeof(define)!='undefined'){
    define(plco)
}