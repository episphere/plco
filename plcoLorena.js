console.log('plcoLorena.js loaded')



plco={
    date:new Date()

}

plco.loadScript=async(url,host)=>{
    let s = document.createElement('script')
    s.src=url
    return document.head.appendChild(s)
}

plco.loadScript("https://cdn.plot.ly/plotly-latest.min.js")

plco.plotTest=async(chr=1,div,url='https://georgetown.app.box.com/file/790147208541')=>{
   let xx = await (await fetch(url)).json()
   div=div||document.createElement('div')
   let dt = xx.data.filter(x=>x[4]==chr)
   trace={
       x:dt.map(d=>d[5]),
       y:dt.map(d=>d[6]),
       mode: 'markers',
       type: 'scatter'
   }
   let layout={
       title:`Chromosoome ${chr}`,
       xaxis:{
           title:'position'
       },
       yaxis:{
           title:'-log(p)'
       }
   }
   Plotly.newPlot(div,[trace],layout)
   return div
}

if(location.href.match('localhost')||location.href.match('127.0.0.1')){
    let scriptHost=location.href.replace(/\/[^\/]*$/,'/')
    plco.loadScript(`${scriptHost}plcoJonas.js`)
    plco.loadScript(`${scriptHost}plcoLorena.js`)
}else{
    plco.loadScript('https://episphere.github.io/plco/plcoJonas.js')
    plco.loadScript('https://episphere.github.io/plco/plcoLorena.js')
}

if(typeof(define)!='undefined'){
    define(plco)
}


if(typeof(plco)=='undefined'){
    plco={}
}

plco.lorena=true


console.log('plco.js loaded')
