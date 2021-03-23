console.log('plcoJonas.js loaded')

if(typeof(plco)=='undefined'){
    plco={}
}

if(!plco.api){plco.api={}}

plco.api.url='https://api.box.com/2.0/files/790147208541/content?version=4'

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

plco.crazy="thing"


plco.api.summary=async(parms)=>{
    parms= typeof(parms)=="string" ? plco.api.string2parms(parms) : parms
    parms=parms|{
        phenotype_id:3080,
        sex:"all",
        ancestry:"east_asian",
        p_value_nlog_min:4
    }
    return await plco.api.get(cmd="summary",parms)
    //phenotype_id=3080&sex=all&ancestry=east_asian&p_value_nlog_min=4"
}

plco.jonas=true
