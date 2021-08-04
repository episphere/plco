visited = false
otherContainerContents = `<span class="text-lg md:text-3xl font-semibold text-red-900 block">Demostrating support with the <a href="https://episphere.github.io/plotly">Epi-Plotly library</a>.</span>        
<span class="text-green-500 text-md">Pros: Great for static plots; faster due to not having to fetch API data; no JavaScript code needed;</span>
<span class="text-red-500 text-md">Cons: As of now, the json file must be hosted; </span>
<epi-plotly>https://episphere.github.io/plco/plot.json</epi-plotly>
<br>
<span class="text-lg">Steps to recreate:</span>
<ol class="list-decimal">
    <li class="mx-6">Set the to_json parameter to true in any of the graphing methods. E.g.: plco.plot.qq('', 3080, 'female', 'east_asian', true)</li>
    <li class="mx-6">Call it and then parse the results using JSON.parse(...)</li>
    <li class="mx-6">Pass the JS object into plco.downloadJSON(your_obj)</li>
    <li class="mx-6">Host the downloaded *.json file anywhere that supports raw files. E.g.: Github, Google Drive, Your Web Server</li>
</ol>
<br>
<span class="text-lg">Tips:</span>
<span>You can add Plotly event listeners by querying the div with js-plotly-plot class nested within the epi-plotly tag.</span>
<br>
<span class="text-lg md:text-3xl font-semibold text-red-900 block">An alternative to <a href="https://episphere.github.io/plotly">Epi-Plotly library</a>.</span>        
<span>Insert this into the header: <br> &lt;script src="https://episphere.github.io/plco/plcoHTMLElements.js"&gt;&lt;/script&gt; <br><br> 3 plotting tags available:</span>
<ul class="text-lg md:text-xl text-red-900 block">
    <li>
        &lt;manhattan-plot&gt;&lt;/manhattan-plot&gt; 
    </li>
    <li>
        &lt;qq-plot&gt;&lt;/qq-plot&gt; 
    </li>
    <li>
        &lt;pca-plot&gt;&lt;/pca-plot&gt;
    </li>
</ul><br>
<span>All three plotting tags have the following attributes available: data-inputs, custom-layout, custom-config</span><br>
<span>Example: (Notice that for <span class="text-blue-500">data-inputs</span> each object is separated by a semi-colon)</span><br>
<span> &lt;manhattan-plot <span class="text-blue-500">data-inputs</span>="[{phenotype_id: 3080, sex: female, ancestry: european}; {phenotype_id:3080, sex: female, ancestry: east_asian}]" <span class="text-blue-500">custom-layout</span>="plot_bgcolor:#d3d3d3;paper_bgcolor:#fff" <span class="text-blue-500">custom-config</span>="scrollZoom:false" &gt;&lt;/manhattan-plot&gt; </span><br>
<span>The manhattan-plot have additionally <span class="text-blue-500">chromosome</span>=number and <span class="text-blue-500">p-val-nlog-min</span>=number attributes.</span>        
<manhattan-plot style="border: 2px solid black;" data-inputs="[{phenotype_id: 3080, sex: female, ancestry:european}; {phenotype_id:3080, sex: female, ancestry: east_asian}]" custom-layout="plot_bgcolor:#d3d3d3;paper_bgcolor:#fff" custom-config="scrollZoom:false"></manhattan-plot>`