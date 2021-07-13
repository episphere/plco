console.log('plcoMod.js loaded')

plcoMod={
    created:Date()
}

plcoMod.loadScript = async (url) => {
    let s = document.createElement('script')
    s.src = url
    return document.head.appendChild(s)
}

if(typeof(define)!="undefined"){
    //define(plcoMod)
    define(['https://cdn.plot.ly/plotly-latest.min.js'],function(Plotly){
        plcoMod.Plotly=Plotly
        return plcoMod
    })
}else{
    // satisfy Plotly dependency already
    let s = plcoMod.loadScript('https://cdn.plot.ly/plotly-latest.min.js')
    s.then(async s => {
        s.onload=()=>{
            plcoMod.Plotly=Plotly
        }
    })
}