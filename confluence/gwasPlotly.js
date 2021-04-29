console.log('gwasPlotly.js loaded')

convert2Plotly=async(url="GWAS_data1000.json")=>{
    let dt = await(await fetch(url)).json()
    switch(url) {
      case "GWAS_data1000.json":
        // code block
        console.log(dt)
        convert2Plotly.gwas(dt)
        break;

      case "GWAS_data374674_v2.json":
        console.log(dt)
        convert2Plotly.gwas(dt)
        break;
      
      default:
        console.warn(`data URL not found: ${url}`)
    }
}

convert2Plotly.saveFile=(x,fileName)=>{ // x is the content of the file
	// var bb = new Blob([x], {type: 'application/octet-binary'});
	// see also https://github.com/eligrey/FileSaver.js
	let bb = new Blob([x]);
   	let url = URL.createObjectURL(bb);
	let a = document.createElement('a');
   	a.href=url;
	if (fileName){
		if(typeof(fileName)=="string"){ // otherwise this is just a boolean toggle or something of the sort
			a.download=fileName;
		}
		a.click() // then download it automatically 
	} 
	return a
}

convert2Plotly.gwas=dt=>{
    
    // find chromossome and position
    //let chr=dt.data.map(x=>parseInt(x[0][0].match(/^\d+/)[0]))
    const chr_i = dt.columns.indexOf("chr.iCOGs")
    let chr = dt.data.map(x=>x[0][chr_i]) // chr.iCOGs
    //let pos=dt.data.map(x=>parseInt(x[0][0].match(/_\d+_/)[0].slice(1,-1)))
    const pos_i = dt.columns.indexOf("Position.iCOGs")
    let pos = dt.data.map(x=>x[0][pos_i]) // Position.iCOGs
    let chrs = [... new Set(chr)]
    //let p =dt.data.map(x=>x[0][38]) // P1df_risk_LRT.Onco
    const p_i = dt.columns.indexOf("p.meta")
    let p =dt.data.map(x=>(x[0][p_i]||1e-323))  // p.meta
    let pLog=p.map(x=>-Math.log10(x))
    debugger
    // try with a single chromossome
    chrs.forEach(chri=>{
    	console.log(`ploting chr ${chri}`)
        let trace={
            x:[],
            y:[],
            mode: 'markers',
            marker: { size: 3 }
        }
        chr.forEach((chrj,j)=>{
            if(chrj==chri){
                trace.x.push(pos[j])
                trace.y.push(pLog[j])
            }
        })
        let obj = {
			traces:[trace],
			layout:{
				title:`Chromossome ${chri}`,
				xaxis:{title:'position'},
				yaxis:{title:'-log<sub>10</sub>(p)'}
			},
		}
		convert2Plotly.saveFile(JSON.stringify(obj),`chromossome${chri}.json`)
			
        debugger
    })  
}

//convert2Plotly("GWAS_data374674_v2.json")