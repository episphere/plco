console.log('plco_dev.js loaded')

plco={
    date:new Date()

}

plco.loadScript=async(url,host)=>{
    let s = document.createElement('script')
    s.src=url
    return document.head.appendChild(s)
}

plco.loadScript('http://localhost:8000/plco/plcoJonas.js')
plco.loadScript('http://localhost:8000/plco/plcoLorena.js')

if(typeof(define)!='undefined'){
    define(plco)
}