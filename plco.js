console.log('plco.js loaded')

//if(typeof(define)!='undefined')


plco={
    date:new Date()

}

plco.loadScript=async(url)=>{
    let s = document.createElement('script')
    s.src=url
    return document.head.appendChild(s)
}


//plco.loadScript('http://localhost:8000/plco/plcoJonas.js')
//plco.loadScript('http://localhost:8000/plco/plcoLorena.js')
//plco.loadScript('https://episphere.github.io/plco/plcoJonas.js')
//plco.loadScript('https://episphere.github.io/plco/plcoLorena.js')
plco.loadScript(`${location.href}plcoJonas.js`)
plco.loadScript(`${location.href}/plcoLorena.js`)


if(typeof(define)!='undefined'){
    define(plco)
}