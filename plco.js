console.log('plco.js loaded')

plco={
    date:new Date()

}

plco.loadScript=async(url,host)=>{
    let s = document.createElement('script')
    s.src=url
    return document.head.appendChild(s)
}

plco.loadScript("https://cdn.plot.ly/plotly-latest.min.js")

plco.plotTest=async(chr=1,div,url='https://exploregwas-dev.cancer.gov/plco-atlas/api/summary?phenotype_id=3080&sex=female&ancestry=east_asian&p_value_nlog_min=2&raw=true')=>{
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

plco.api={}

plco.api.url='https://exploregwas-dev.cancer.gov/plco-atlas/api/'

plco.api.ping=async()=>{
    return (await fetch(plco.api.url+'ping')).text()
}

plco.api.get=async(cmd="ping",parms={})=>{
    if(cmd=="ping"){
        return await(await fetch(plco.api.url+'ping')).text()=="true"? true : false;
    }else{
        return (await fetch(plco.api.url+cmd+'?'+plco.api.parms2string(parms))).json()
    }
}

plco.api.string2parms=(str="phenotype_id=3080&sex=all&ancestry=east_asian&p_value_nlog_min=4")=>{
    let prm={}
    str.split('&').forEach(s=>{
        s=s.split('=')
        prm[s[0]]=s[1]
    })
    return prm
}

plco.api.parms2string=(prm={phenotype_id:3080,sex:"all",ancestry:"east_asian",p_value_nlog_min:4})=>{
    return Object.keys(prm).map(p=>`${p}=${prm[p]}`).join('&')
}

plco.api.download= async (parms, phenotype_id=3080, get_link_only=undefined) => {
    parms = typeof(params) == "string" ? plco.api.string2parms(parms) : parms
    parms = parms || {
        phenotype_id: phenotype_id
    }
    if (typeof(parms['phenotype_id']) == 'undefined') {
        parms['phenotype_id'] = phenotype_id
    }
    if (typeof(parms['get_link_only']) == 'undefined' && typeof(get_link_only) != 'undefined') {
        parms['get_link_only'] = get_link_only
    }
    return await plco.api.get(cmd="download", parms)
}

plco.api.summary=async(parms)=>{
    parms= typeof(parms)=="string" ? plco.api.string2parms(parms) : parms
    parms=parms||{
        phenotype_id:3080,
        sex:"all",
        ancestry:"east_asian",
        p_value_nlog_min:4
    }
    return await plco.api.get(cmd="summary",parms)
    //phenotype_id=3080&sex=all&ancestry=east_asian&p_value_nlog_min=4"
}

/*
if(location.href.match('localhost')||location.href.match('127.0.0.1')){
    let scriptHost=location.href.replace(/\/[^\/]*$/,'/')
    plco.loadScript(`${scriptHost}plcoJonas.js`)
    plco.loadScript(`${scriptHost}plcoLorena.js`)
}else{
    plco.loadScript('https://episphere.github.io/plco/plcoJonas.js')
    plco.loadScript('https://episphere.github.io/plco/plcoLorena.js')
}
*/

if(typeof(define)!='undefined'){
    define(plco)
}

/*
if(typeof(define)!='undefined'){

    define([
    'https://cdn.plot.ly/plotly-latest.min.js',
    //'https://episphere.github.io/plco/plco',
    //'https://episphere.github.io/plco/plcoJonas.js',
    //'https://episphere.github.io/plco/plcoLorena.js',
    'https://cdnjs.cloudflare.com/ajax/libs/localforage/1.9.0/localforage.min.js'
    ],function(Plotly,localforage){
        plco.localforage=localforage
        plco.Plotly=Plotly
        return plco
    })
}
*/
