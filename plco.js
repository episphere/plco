/** 
 * @file JS SDK for NCI DCEG's PLCO API. 〜(￣▽￣〜)
 * 
 * @version 0.5
 * @author Jonas Almeida, Lorena Sandoval, Erika Nemeth, Eric Ruan
 * @copyright 2021
 */
console.log('plco.js loaded')

/* plco = {
    date: new Date()
}
*/

/**
 * Main global portable module.
 * @namespace plco
 * @property {Function} saveFile - {@link plco.saveFile}
 * @property {Function} defineProperties - {@link plco.defineProperties}
 */
const plco = async function () {
    plco.loadScript("https://cdn.plot.ly/plotly-latest.min.js")
    console.log("plotly.js loaded")
    plco.loadScript("https://episphere.github.io/plotly/epiPlotly.js")
}

/**
 * TEMP work-around for the CORS issue, do NOT use in the final SDK. 
 * 
 * Instead, fetch the blob from the API and use a blob link just like in jmat.
 * 
 * Modified from https://github.com/jonasalmeida/jmat.
 * @param {string} url The download link.
 * @returns {HTMLAnchorElement} HTMLAnchorElement.
 */
plco.saveFile = (url) => {
    url = url || 'https://downloadgwas-dev.cancer.gov/j_breast_cancer.tsv.gz'
    let a = document.createElement('a')
    a.href = url
    a.target = '_blank'
    a.click()
    return a
}

/**
 * Adds a key-value pair as specified in `m_fields` and `o_fields` to `obj` if the key does not already exist.
 * @param {object} obj An object.
 * @param {object} m_fields Mandatory fields.
 * @param {object} [o_fields={}] Optional fields. Same as `m_fields`, but will not add in the key-value pair if value is undefined.
 */
plco.defineProperties = (obj, m_fields, o_fields = {}) => {
    Object.keys(m_fields).forEach((key) => {
        if (typeof obj[key] === 'undefined') {
            obj[key] = m_fields[key]
        }
    })
    Object.keys(o_fields).forEach((key) => {
        if (
            typeof obj[key] === 'undefined' &&
            typeof o_fields[key] !== 'undefined'
        ) {
            obj[key] = o_fields[key]
        }
    })
}

plco.loadScript = async (url, host) => {
    let s = document.createElement('script')
    s.src = url
    return document.head.appendChild(s)
}

plco.plotTest = async (
    chr = 1,
    div,
    url = 'https://exploregwas-dev.cancer.gov/plco-atlas/api/\
        summary?phenotype_id=3080&sex=female&ancestry=east_asian&p_value_nlog_min=2&raw=true'
) => {
    let xx = await (await fetch(url)).json()
    div = div || document.createElement('div')
    let dt = xx.data.filter(x => x[4] == chr)
    trace = {
        x: dt.map(d => d[5]),
        y: dt.map(d => d[6]),
        mode: 'markers',
        type: 'scatter'
    }
    let layout = {
        title: `Chromosoome ${chr}`,
        xaxis: {
            title: 'position'
        },
        yaxis: {
            title: '-log(p)'
        }
    }
    Plotly.newPlot(div, [trace], layout)
    return div
}

// plco.typeCheckAttributes = (obj = {}) => {
//     const typeKey = {
//         phenotype_id: 'integer',
//         raw: 'string'
//     }
//     Object.keys(obj).forEach((key) => {
//         if (typeKey[key] === 'string' && typeof obj[key] !== 'string') {
//             throw new TypeError(`${key} is not of type ${typeKey[key]}`)
//         } else if (typeKey[key] === 'integer' && !Number.isInteger(obj[key])) {
//             throw new TypeError(`${key} is not of type ${typeKey[key]}`)
//         }
//     })

// }

plco.explorePhenotypes = (graph = false) => {
    // TODO
    return 'WIP'
}

/**
 * Sub-module grouping API methods.
 * @memberof plco
 * @namespace plco.api
 * @property {Function} download - {@link plco.api.download}
 * @property {Function} metadata - {@link plco.api.metadata}
 * @property {Function} participants - {@link plco.api.participants}
 * @property {Function} pca - {@link plco.api.pca}
 * @property {Function} phenotypes - {@link plco.api.phenotypes}
 * @property {Function} points - {@link plco.api.points}
 * @property {Function} summary - {@link plco.api.summary}
 * @property {Function} variants - {@link plco.api.variants}
 */
plco.api = {}

plco.api.url = 'https://exploregwas-dev.cancer.gov/plco-atlas/api/'

plco.api.ping = async () => {
    return (await fetch(plco.api.url + 'ping')).text()
}

plco.api.get = async (cmd = "ping", parms = {}) => {
    // res = await fetch(...)
    // content-type = await res.blob().type
    if (cmd == "ping") {
        return await (await fetch(plco.api.url + 'ping')).text() == "true" ? true : false
    } else if (cmd === 'download') {
        if (parms['get_link_only'] === 'true') {
            return (
                await fetch(
                    plco.api.url + cmd + '?' + plco.api.parms2string(parms)
                )
            ).text()
        } else {
            plco.saveFile(
                plco.api.url + cmd + '?' + plco.api.parms2string(parms)
            )
            return await new Promise((resolve) => resolve({}))
        }
    } else {
        return (await fetch(plco.api.url + cmd + '?' + plco.api.parms2string(parms))).json()
    }
}

plco.api.string2parms = (
    str = "phenotype_id=3080&sex=all&ancestry=east_asian&p_value_nlog_min=4"
) => {
    let prm = {}
    str.split('&').forEach(s => {
        s = s.split('=')
        prm[s[0]] = s[1]
    })
    return prm
}

plco.api.parms2string = (
    prm = { phenotype_id: 3080, sex: "all", ancestry: "east_asian", p_value_nlog_min: 4 }
) => {
    return Object.keys(prm).map(p => `${p}=${prm[p]}`).join('&')
}

/**
 * Downloads the original association results in tsv.gz format.
 * @param {object | string | Array<Array>} parms A JSON object, query string, or 2-d array containing the query parameters.
 * @param {integer} [phenotype_id=3080] A numeric phenotype id.
 * @param {string} [get_link_only] _Optional_. If set to 'true', returns the download link instead of redirecting automatically to the file.
 * @returns Results of the API call.
 */
plco.api.download = async (
    parms,
    phenotype_id = 3080,
    get_link_only = undefined
) => {
    parms =
        typeof parms === 'string'
            ? plco.api.string2parms(parms)
            : Array.isArray(parms)
                ? Object.fromEntries(parms)
                : parms
    parms = parms || {
        phenotype_id,
    }
    plco.defineProperties(parms, { phenotype_id }, { get_link_only })
    return await plco.api.get((cmd = 'download'), parms)
}

/**
 * Retrieves metadata for phenotypes specified
 * @param {object | string | Array<Array>} parms A JSON object, query string, or 2-d array containing the query parameters.
 * @param {number} [phenotype_id=3080] A phenotype id.
 * @param {string} [sex=female] A sex, which may be "all", "female", or "male".
 * @param {string} [ancestry=european] A character vector specifying ancestries to retrieve data for.
 * @param {string} [raw] _Optional_. If true, returns data in an array of arrays instead of an array of objects.
 * @return A dataframe containing phenotype metadata
 * @example
 * plco.api.metadata()
 * plco.api.metadata({ phenotype_id: 3080, sex: "female", ancestry: "european" })
 * plco.api.metadata("phenotype_id=3080&sex=female&ancestry=european")
 * plco.api.metadata([["phenotype_id",3080], ["sex","female"], ["ancestry","european"]])
 * plco.api.metadata({}, 3080, "female", "european")
 */
plco.api.metadata = async (
    parms,
    phenotype_id = 3080,
    sex = "female",
    ancestry = "european",
    raw = undefined
) => {
    parms = typeof parms == 'string' ? plco.api.string2parms(parms) : Array.isArray(parms) ? Object.fromEntries(parms) : parms
    parms = parms || {
        phenotype_id,
        sex,
        ancestry
    }
    plco.defineProperties(parms, { phenotype_id, sex, ancestry }, { raw })
    return await plco.api.get((cmd = 'metadata'), parms)
}

/**
 * Retrieves aggregate counts for participants. Aggregate counts under 10 are returned as "< 10".
 * @param {object | string | Array<Array>} parms A JSON object, query string, or 2-d array containing the query parameters.
 * @param {integer} [phenotype_id=2250] A numeric phenotype id.
 * @param {string} [columns] _Optional_. A character vector specifying properties for which to retrieve counts for. 
 * Valid properties are: value, ancestry, genetic_ancestry, sex, and age.
 * @param {integer} [precision] _Optional_. For continuous phenotypes, a numeric value specifying the -log10(precision) 
 * to which values should be rounded to.
 * @param {string} [raw] _Optional_. If true, returns data in an array of arrays instead of an array of objects.
 * @returns Results of the API call.
 */
plco.api.participants = async (
    parms,
    phenotype_id = 2250,
    columns = undefined,
    precision = undefined,
    raw = undefined
) => {
    parms =
        typeof parms === 'string'
            ? plco.api.string2parms(parms)
            : Array.isArray(parms)
                ? Object.fromEntries(parms)
                : parms
    parms = parms || {
        phenotype_id,
        columns: 'value',
        precision: 0,
    }
    plco.defineProperties(parms, { phenotype_id }, { columns, precision, raw })
    return await plco.api.get((cmd = 'participants'), parms)
}


/**
 * Retrieve PCA coordinates for the specified phenotype and platform.
 * @param {object | string | Array<Array>} parms A JSON object, query string, or 2-d array containing the query parameters.
 * @param {integer} [phenotype_id=3080] A numeric phenotype id.
 * @param {string} [platform=PLCO_GSA] A character vector specifying the platform to retrieve data for.
 * @param {integer} [pc_x=1] A numeric value (1-20) specifying the x axis's principal component.
 * @param {integer} [pc_y=2] A numeric value (1-20) specifying the y axis's principal component.
 * @param {integer} [limit] _Optional_. A numeric value to limit the number of variants returned (used for pagination). 
 * Capped at 1 million.
 * @param {string} [raw] _Optional_. If true, returns data in an array of arrays instead of an array of objects.
 * @returns A dataframe containing pca coordinates.
 * @example
 * plco.api.pca()
 * plco.api.pca({}, 3080, 'PLCO_GSA', 1, 1, 1000)
 * plco.api.pca({phenotype_id: 3080, platform: 'PLCO_GSA', pc_x: 1, pc_y: 1, limit: 1000 })
 * plco.api.pca("phenotype_id=3080&platform=PLCO_GSA&pc_x=1&pc_y=1&limit=1000")
 * plco.api.pca([["phenotype_id",3080], ["platform","PLCO_GSA"], ["pc_x",1], ["pc_y",1], ["limit",1000]])
 */
plco.api.pca = async (
    parms,
    phenotype_id = 3080,
    platform = 'PLCO_GSA',
    pc_x = 1,
    pc_y = 2,
    limit = undefined,
    raw = undefined
) => {
    parms =
        typeof parms === 'string'
            ? plco.api.string2parms(parms)
            : Array.isArray(parms)
                ? Object.fromEntries(parms)
                : parms
    parms = parms || {
        phenotype_id,
        platform,
        pc_x,
        pc_y,
        limit: 10,
    }
    plco.defineProperties(parms, { phenotype_id, platform, pc_x, pc_y }, { limit, raw })

    if (!Number.isInteger(parms['pc_x']) || parms['pc_x'] < 1 || parms['pc_x'] > 20) {
        throw new RangeError('pc_x must be an integer between 1 and 20 inclusive.')
    }
    if (!Number.isInteger(parms['pc_y']) || parms['pc_y'] < 1 || parms['pc_y'] > 20) {
        throw new RangeError('pc_y must be an integer between 1 and 20 inclusive.')
    }
    return await plco.api.get((cmd = 'pca'), parms)
}

/**
 * Retrieves phenotypes
 * @param {object | string | Array<Array>} parms A JSON object, query string, or 2-d array containing the query parameters.
 * @param {string} [q] _Optional_. A query term
 * @param {string} [raw] _Optional_. If true, returns data in an array of arrays instead of an array of objects.
 * @return If query is specified, a list of phenotypes that contain the query term is returned. Otherwise, a tree of all phenotypes is returned.
 * @example
 * plco.api.phenotypes()
 * plco.api.phenotypes({ q: "first_ca125_level" })
 * plco.api.phenotypes("q=first_ca125_level")
 * plco.api.phenotypes([["q","first_ca125_level"]])
 * plco.api.phenotypes({}, "first_ca125_level")
 */
plco.api.phenotypes = async (
    parms,
    q = undefined,
    raw = undefined
) => {
    parms = typeof parms == 'string' ? plco.api.string2parms(parms) : Array.isArray(parms) ? Object.fromEntries(parms) : parms
    parms = parms || {
    }
    plco.defineProperties(parms, {}, { q, raw })
    return await plco.api.get(cmd = "phenotypes", parms)
}

/**
 * Retrieves sampled variants suitable for visualizing a QQ plot for the specified phenotype, sex, and ancestry.
 * @param {object | string | Array<Array>} parms A JSON object, query string, or 2-d array containing the query parameters.
 * @param {integer} [phenotype_id=3080] A numeric phenotype id.
 * @param {string} [sex=female] A character vector specifying a sex to retrieve data for.
 * @param {string} [ancestry=european] A character vector specifying ancestries to retrieve data for.
 * @param {string} [raw] _Optional_. If true, returns data in an array of arrays instead of an array of objects.
 * @returns A dataframe containing variants.
 */
plco.api.points = async (parms,
    phenotype_id = 3080,
    sex = 'female',
    ancestry = 'european',
    raw = undefined
) => {
    parms =
        typeof parms === 'string'
            ? plco.api.string2parms(parms)
            : Array.isArray(parms)
                ? Object.fromEntries(parms)
                : parms
    parms = parms || {
        phenotype_id,
        sex,
        ancestry,
    }
    plco.defineProperties(parms, { phenotype_id, sex, ancestry }, { raw })

    return await plco.api.get((cmd = 'points'), parms)
}

/**
 * Retrieve variants for all chromosomes at a resolution of 400x800 bins across the whole genome and specified -log10(p) range
 * @param {object | string | Array<Array>} parms A JSON object, query string, or 2-d array containing the query parameters.
 * @param {number} [phenotype_id=3080] A phenotype id.
 * @param {string} [sex=female] A sex, which may be "all", "female", or "male".
 * @param {string} [ancestry=european] A character vector specifying ancestries to retrieve data for.
 * @param {number} [p_value_nlog_min=4] A numeric value >= 0 specifying the minimum -log10(p) for variants.
 * @param {string} [raw] _Optional_. If true, returns data in an array of arrays instead of an array of objects.
 * @return A dataframe with aggregated variants.
 * @example
 * plco.api.summary()
 * plco.api.summary({ phenotype_id: 3080, sex: "female", ancestry: "european", p_value_nlog_min: 4 })
 * plco.api.summary("phenotype_id=3080&sex=female&ancestry=european&p_value_nlog_min=4")
 * plco.api.summary([["phenotype_id",3080], ["sex","female"], ["ancestry","european"], ["p_value_nlog_min",4]])
 * plco.api.summary({}, 3080, "female", "european", 4)
 */
plco.api.summary = async (
    parms,
    phenotype_id = 3080,
    sex = "female",
    ancestry = "european",
    p_value_nlog_min = 4,
    raw = undefined
) => {
    parms = typeof parms == 'string' ? plco.api.string2parms(parms) : Array.isArray(parms) ? Object.fromEntries(parms) : parms
    parms = parms || {
        phenotype_id,
        sex,
        ancestry,
        p_value_nlog_min
    }
    plco.defineProperties(parms, { phenotype_id, sex, ancestry, p_value_nlog_min }, { raw })
    return await plco.api.get(cmd = "summary", parms)
}

/**
 * Retrieve variants for specified phenotype, sex, ancestry, chromosome, and other optional fields.
 * @param {object | string | Array<Array>} parms A JSON object, query string, or 2-d array containing the query parameters.
 * @param {number} [phenotype_id=3080] Phenotype id(s)
 * @param {string} [sex=female] A sex, which may be "all", "female", or "male".
 * @param {string} [ancestry=european] An ancestry, which may be "african_american", "east_asian", or "european".
 * @param {number} [chromosome=8] A chromosome number.
 * @param {string} [columns] _Optional_ Properties for each variant. Default: all properties.
 * @param {string} [snp] _Optional_ Snps.
 * @param {number} [position] _Optional_ The exact position of the variant within a chromosome.
 * @param {number} [position_min] _Optional_ The minimum chromosome position for variants.
 * @param {number} [position_max] _Optional_ The maximum chromosome position for variants.
 * @param {number} [p_value_nlog_min] _Optional_ The minimum -log10(p) of variants in the chromosome.
 * @param {number} [p_value_nlog_max] _Optional_ The maximum -log10(p) of variants in the chromosome.
 * @param {number} [p_value_min] _Optional_ The minimum p-value of variants in the chromosome.
 * @param {number} [p_value_max] _Optional_ The maximum p-value of variants in the chromosome.
 * @param {string} [orderBy] _Optional_ A property to order variants by. May be "id", "snp", "chromosome", "position", "p_value", or "p_value_nlog".
 * @param {string} [order] _Optional_ An order in which to sort variants. May be "asc" or "desc".
 * @param {number} [offset] _Optional_ The number of records by which to offset the variants (for pagination)
 * @param {number} [limit] _Optional_ The maximum number of variants to return (for pagination). Highest allowed value is 1 million.
 * @param {string} [raw] _Optional_. If true, returns data in an array of arrays instead of an array of objects.
 * @return A dataframe with variants.
 * @example
 * plco.api.variants()
 * plco.api.variants({ phenotype_id: 3080, sex: "female", ancestry: "european", chromosome: 8, limit: 10 })
 * plco.api.variants("phenotype_id=3080&sex=female&ancestry=european&chromosome=8&limit=10")
 * plco.api.variants([["phenotype_id",3080], ["sex","female"], ["ancestry","european"], ["chromosome",8], ["limit",10]])
 * plco.api.variants({}, 3080, "female", "european", 8)
 */
plco.api.variants = async (
    parms,
    phenotype_id = 3080,
    sex = "female",
    ancestry = "european",
    chromosome = 8,
    columns = undefined,
    snp = undefined,
    position = undefined,
    position_min = undefined,
    position_max = undefined,
    p_value_nlog_min = undefined,
    p_value_nlog_max = undefined,
    p_value_min = undefined,
    p_value_max = undefined,
    orderBy = undefined,
    order = undefined,
    offset = undefined,
    limit = undefined,
    raw = undefined
) => {
    parms = typeof parms == 'string' ? plco.api.string2parms(parms) : Array.isArray(parms) ? Object.fromEntries(parms) : parms
    parms = parms || {
        phenotype_id,
        sex,
        ancestry,
        chromosome,
        limit: 10
    }
    plco.defineProperties(
        parms,
        { phenotype_id, sex, ancestry, chromosome },
        { columns, snp, position, position_min, position_max, p_value_nlog_min, p_value_nlog_max, p_value_min, p_value_max, orderBy, order, offset, limit, raw }
    )
    return await plco.api.get(cmd = "variants", parms)
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

/**
 * Sub-module grouping plotting methods.
 * @memberof plco
 * @namespace plco.plot
 * @prop {Function} manhattan - {@link plco.plot.manhattan}  
 * @prop {Function} qq - {@link plco.plot.qq}
 * @prop {Function} qq2 - {@link plco.plot.qq2}
 * @prop {Function} pca - {@link plco.plot.pca}
 * @prop {Function} pca2 - {@link plco.plot.pca2}
 */
plco.plot = async function () {

}

/**
 * Generates a Plotly manhattan plot at the given div element with support for a single input.
 * @param {string} div_id The id of the div element. If it does not exist, a new div will be created.
 * @param {number} [phenotype_id=3080] A phenotype id.
 * @param {string} [sex=female] A sex, which may be "all, "female", or "male".
 * @param {string} [ancestry=european] An ancestry, which may be  "african_american", "east_asian" or "european".
 * @param {number} [p_value_nlog_min=2] A numeric value >= 0 specifying the minimum -log10(p) for variants.
 * @param {integer} [chromosome] _Optional_ A single chromosome. If no chromosome argument is passed, then assume all chromosomes.
 * @param {boolean} [to_json=false] _Optional_ If true, returns a stringified JSON object containing traces and layout.
 * If false, returns a div element containing the Plotly graph.
 * @returns A div element or a string if 'to_json' is true.
 * @example 
 * plco.plot.manhattan()
 * plco.plot.manhattan('plot', 3080, "female", "european", 2, 18)
*/
plco.plot.manhattan = async function (
    div_id,
    phenotype_id = 3080,
    sex = 'female',
    ancestry = 'european',
    p_value_nlog_min = 2,
    chromosome,
    to_json = false
) {

    // Set up div, in which Plotly graph may be inserted.
    let div = document.getElementById(div_id)
    if (div === null && !to_json) {
        div = document.createElement('div')
        document.body.appendChild(div)
    }

    // Retrieve all summary data.
    let inputData = await plco.api.summary({ phenotype_id, sex, ancestry, p_value_nlog_min })

    // Filter summary data if chromosome number was specified, and set associated variables for later.
    let chromosomeName
    let numberOfChromosomes
    if (chromosome) {
        inputData = inputData.data.filter(x => x.chromosome == "" + chromosome)
        chromosomeName = 'Chromosome ' + chromosome
        numberOfChromosomes = 1
    } else {
        inputData = inputData.data
        chromosomeName = 'All Chromosomes'
        numberOfChromosomes = 22
    }

    // Retrieve rs number for all SNPs if a chromosome number was passed as an argument.
    let rsNumbers = []
    if (numberOfChromosomes == 1) {
        let rsNumbers_allData = await plco.api.variants({}, phenotype_id, sex, ancestry, chromosome)
        rsNumbers_allData.data.map(x => rsNumbers.push(x.snp))
    }

    // Set up traces
    let traces = []
    let currentChromosome
    for (i = 1; i <= numberOfChromosomes; i++) {
        if (numberOfChromosomes == 1) {
            currentChromosome = chromosome
        } else {
            currentChromosome = i
        }
        currentChromosomeData = inputData.filter(x => x.chromosome == "" + currentChromosome)
        traces.push({
            x: currentChromosomeData.map(x => parseInt(x.position_abs)),
            y: currentChromosomeData.map(x => parseFloat(x.p_value_nlog)),
            mode: 'markers',
            type: 'scatter',
            marker: {
                opacity: 0.65,
                size: 5
            },
            name: 'Chromosome ' + currentChromosome, // appears as legend item
            hovertemplate: currentChromosomeData.map(x =>
                'absolute position: ' + parseInt(x.position_abs) +
                '<br>p-value: ' + Math.pow(10, -x.p_value_nlog)
            )
        })
    }

    if (numberOfChromosomes == 1) {
        for (i = 0; i < traces[0].hovertemplate.length; i++) {
            traces[0].hovertemplate[i] += '<br>snp: ' + rsNumbers[i]
        }
    }

    let layout = {
        title: 'SNPs in ' + chromosomeName,
        xaxis: {
            title: 'absolute position'
        },
        yaxis: {
            title: '-log<sub>10</sub>(p)'
        },
        hovermode: 'closest'
    }

    if (!to_json) {
        Plotly.newPlot(div, traces, layout)
        return div
    } else {
        tracesString = '{"traces":' + JSON.stringify(traces) + ','
        layoutString = '"layout":' + JSON.stringify(layout) + '}'
        return tracesString + layoutString
    }
}

/**
 * Generates a Plotly quartile-quartile plot at the given div element with support for a single input.
 * @param {string} div_id The id of the div element, if it does not exist, a new div will be created.
 * @param {number} [phenotype_id=3080] A phenotype id.
 * @param {string} [sex=female] A sex, which may be "all", "female", or "male".
 * @param {string} [ancestry=east_asian] A character vector specifying ancestries to retrieve data for.
 * @param {boolean} [to_json=false] _Optional_. If true, returns a stringified JSON object containing traces and layout.
 * Else, returns a div element containing the Plotly graph.
 * @returns A div element or a string if `to_json` is true.
 * @example
 * await plco.plot.qq('plot', 3080, 'female', 'east_asian')
 */
plco.plot.qq = async (
    div_id,
    phenotype_id = 3080,
    sex = 'female',
    ancestry = 'east_asian',
    to_json = false
) => {
    /**
     * @type {Array<object>} Each object in the array has the properties defined below.
     * @prop {integer} id
     * @prop {integer} phenotype_id
     * @prop {string} phenotype_name
     * @prop {string} phenotype_display_name
     * @prop {string} sex
     * @prop {string} ancestry
     * @prop {string} chromosome
     * @prop {number} lambda_gc
     * @prop {number} lambda_gc_ld_score
     * @prop {integer} count
     */
    const metadata = (await plco.api.metadata({ chromosome: 'all' }, phenotype_id, sex, ancestry))[0]

    if (metadata === undefined || metadata['count'] === null) {
        throw new Error('No data found for this combination of sex and/or ancestry.')
    }

    /**
     * @type {object} Object with the following props:
     * @prop {Array<object>} data
     * @prop {Array<string>} columns
     */
    const points = await plco.api.points({}, phenotype_id, sex, ancestry)

    let div = document.getElementById(div_id)

    if (div === null && !to_json) {
        div = document.createElement('div')
        div.id = div_id
        document.body.appendChild(div)
    }

    const trace = {
        x: points.data.map(p => p.p_value_nlog_expected),
        y: points.data.map(p => p.p_value_nlog),
        type: 'scattergl',
        mode: 'markers',
        marker: {
            color: '#A71515',
            size: 4,
            opacity: 0.75
        },
        // customdata is an array containing more data on each of the individual point corresponding to indices of x
        // this is useful later with the onClick event
        customdata: points.data.map((point) => ({
            phenotype_id,
            sex,
            ancestry,
            variantId: point['id'],
            p: Math.pow(10, -point['p_value_nlog']),
        })),
        text: points.data.map(point =>
            'Variant Id: ' + point['id'] +
            '<br>p-value: ' + Math.pow(10, -point['p_value_nlog']) +
            '<br>Click to learn more.'),
        hoverinfo: 'text+x+y+name',
        name: `${metadata[phenotype_display_name]}, ${sex}, ${ancestry}`,
    }

    const max = points.data.reduce(
        (max, cur) => cur.p_value_nlog_expected > max ? cur.p_value_nlog_expected : max, 0)

    const traceLine = {
        x: [0, max],
        y: [0, max],
        type: 'scattergl', // scattergl seems to load faster than scatter, else no major diff
        mode: 'line',
        marker: {
            color: '#BBB',
            opacity: 0.4,
            size: 0.1,
        },
        hoverinfo: 'none',
        showlegend: false,
    }

    const layout = {
        hoverlabel: {
            bgcolor: '#FFF',
            bordercolor: '#BBB',
            font: {
                size: 14,
                color: '#212529',
            }
        },
        width: 750,
        height: 750,
        title: {
            text:
                `\u03BB (median) = ${metadata['lambda_gc']} <b>|</b>` +
                `\u03BB (LD score) = ${metadata['lambda_gc_ld_score']} <b>|</b> ` +
                `Number of variants = ${metadata['count']}`,
            font: {
                size: 14,
                color: 'black'
            }
        },
        xaxis: {
            automargin: true,
            rangemode: 'tozero',
            showgrid: false,
            fixedrange: false,
            title: {
                text: '<b>Expected -log<sub>10</sub>(p)</b>',
                font: {
                    size: 15,
                    color: 'black'
                }
            },
            ticklen: 10, // Length of the tick marks on the x-axis
            tickwidth: 1,
            dtick: 0.5,
            tickfont: {
                size: 12,
                color: 'black'
            }
        },
        yaxis: {
            automargin: true,
            rangemode: 'tozero',
            showgrid: true,
            fixedrange: false,
            title: {
                text: '<b>Observed -log<sub>10</sub>(p)</b>',
                font: {
                    size: 15,
                    color: 'black'
                }
            },
            ticklen: 10, // Length of the tick marks on the y-axis
            tickwidth: 1,
            dtick: 0.5,
            tickfont: {
                size: 12,
                color: 'black'
            }
        },
        clickmode: 'event',
        hovermode: 'closest', // When a point is hovered, it will display their (x, y) coordinate
        dragmode: 'pan',
        showlegend: false,
    }

    const config = {
        scrollZoom: true,
        displaylogo: false,
        modeBarButtonsToRemove: [
            'lasso2d',
            'select2d',
            'toggleSpikelines',
            'autoScale2d',
            'hoverCompareCartesian',
            'hoverClosestCartesian',
        ],
    }

    if (!to_json) {
        Plotly.newPlot(div, [traceLine, trace], layout, config)

        div.on('plotly_click', async (data) => {
            console.log(data) // contains the custom data

            // An array
            const { points } = data

            for (let i = 0; i < points.length; i++) {
                try {
                    const res = await plco.api.get('variants', {
                        id: points[i].customdata.variantId,
                        phenotype_id,
                        sex,
                        ancestry,
                        columns: 'chromosome,position,snp',
                    })
                    const { chromosome: resChromosome, position: resPosition, snp: resSnp } = res.data[0]
                    let updatedText = points[i].data.text.slice()
                    updatedText[points[i].pointIndex] = `Chromosome: ${resChromosome} <br>` +
                        `Position: ${resPosition} <br> SNP: ${resSnp}`
                    Plotly.restyle(div, { text: [updatedText] }, [1])
                } catch (e) {
                    console.error(e)
                }
            }
        })
        return div
    } else {
        const tracesString = '{"traces":' + JSON.stringify(traces) + ','
        const layoutString = '"layout":' + JSON.stringify(layout) + ','
        const configString = '"config":' + JSON.stringify(config) + '}'
        return tracesString + layoutString + configString
    }
}

/**
 * Generates a Plotly quartile-quartile plot at the given div element with support for multiple inputs. 
 * @param {string} div_id The id of the div element, if it does not exist, a new div will be created.
 * @param {Array} arrayOfObjects Accepts an array of objects containing the following keys: phenotype_id, sex, ancestry.
 * @param {boolean} [to_json=false] _Optional_. If true, returns a stringified JSON object containing traces and layout.
 * Else, returns a div element containing the Plotly graph.
 * @returns A div element or a string if `to_json` is true.
 * @example
 * await plco.plot.qq2('plot', [{phenotype_id:3080, sex:'female', ancestry:'east_asian'}, 
 * {phenotype_id:3080, sex:'female', ancestry:'european'}, {phenotype_id: 3550, sex:'all', ancestry:'east_asian'}]) 
 */
plco.plot.qq2 = (
    div_id,
    arrayOfObjects = [],
    to_json = false
) => {
    const promises = []
    arrayOfObjects.forEach((obj) => {
        const { phenotype_id, sex, ancestry } = obj
        if (!phenotype_id || !sex || !ancestry) {
            console.error('An object is missing mandatory fields, skipping ...')
            return
        } else {
            promises.push(
                plco.plot.qq('', phenotype_id, sex, ancestry, true)
                    .catch(() => {
                        console.error('Unable to fetch data, skipping...')
                        return undefined
                    })
            )
        }
    })

    /**
     * @type {Array<object>} Each object has the following props:
     * @prop {Array<object>} traces
     * @prop {object} layout
     */
    return Promise.all(promises)
        .then((_) => _.filter(Boolean)) // Filters out all undefined and null
        .then((arrayOfJsonStr) => arrayOfJsonStr.map((str) => JSON.parse(str)))
        .then((arrayOfJson) => {
            if (arrayOfJson.length === 0) return

            const colors = ['#01A5E4', '#FFBF65', '#FF5768', '#8DD7C0', '#FF96C6']

            let div = document.getElementById(div_id)
            if (div === null && !to_json) {
                div = document.createElement('div')
                div.id = div_id
                document.body.appendChild(div)
            }

            const traces = [arrayOfJson[0].traces[0]]

            arrayOfJson.forEach((obj, index) => {
                traces.push({
                    ...obj.traces[1],
                    marker: {
                        color: colors[index % colors.length],
                        size: 4,
                        opacity: 0.6
                    },
                })
            })

            const layout = {
                ...arrayOfJson[0].layout,
                showlegend: true,
                width: 900,
                height: 900,
                hoverlabel: {
                },
                title: {
                    text: arrayOfJson.reduce((word, cur, index) =>
                        word + traces[index + 1].name + ' ' + cur.layout.title.text + '<br>', ''),
                    font: {
                        size: 12,
                        color: 'black'
                    }
                }
            }

            const config = {
                scrollZoom: true,
                displaylogo: false,
                modeBarButtonsToRemove: [
                    'lasso2d',
                    'select2d',
                    'toggleSpikelines',
                    'autoScale2d',
                    'hoverCompareCartesian',
                    'hoverClosestCartesian',
                ],
            }

            if (!to_json) {
                Plotly.newPlot(div, traces, layout, config)
                div.on('plotly_click', async (data) => {
                    console.log(data) // contains the custom data

                    // An array
                    const { points } = data

                    for (let i = 0; i < points.length; i++) {
                        try {
                            const { id, phenotype_id, sex, ancestry } = points[i].customdata
                            const res = await plco.api.get('variants', {
                                id,
                                phenotype_id,
                                sex,
                                ancestry,
                                columns: 'chromosome,position,snp',
                            })
                            const { chromosome: resChromosome, position: resPosition, snp: resSnp } = res.data[0]
                            let updatedText = points[i].data.text.slice()
                            updatedText[points[i].pointIndex] = `Chromosome: ${resChromosome} <br>` +
                                `Position: ${resPosition} <br> SNP: ${resSnp}`
                            Plotly.restyle(div, { text: [updatedText] }, [points[i].curveNumber])
                        } catch (e) {
                            console.error(e)
                        }
                    }
                })
                return div
            } else {
                const tracesString = '{"traces":' + JSON.stringify(traces) + ','
                const layoutString = '"layout":' + JSON.stringify(layout) + ','
                const configString = '"config":' + JSON.stringify(config) + '}'
                return tracesString + layoutString + configString
            }
        })
}

/**
 * Generates a Plotly PCA plot at the given div element with support for a single input.
 * @param {string} div_id The id of the div element, if it does not exist, a new div will be created.
 * @param {number} phenotype_id A phenotype id.
 * @param {string} sex A sex, which may be "all", "female", or "male".
 * @param {string} ancestry A character vector specifying ancestries to retrieve data for.
 * @param {boolean} to_json _Optional_. If true, returns a stringified JSON object containing traces and layout.
 * Else, returns a div element containing the Plotly graph.
 * @returns A div element or a string if `to_json` is true.
 * @example
 * await plco.plot.pca('plot', 3080, 'female', 'east_asian')
 */
plco.plot.pca = async (
    div_id,
    phenotype_id,
    sex,
    ancestry,
    to_json = false
) => {
    return await plco.plot.pca2(div_id, [{ phenotype_id, sex, ancestry }], to_json)
}

/**
 * Generates a Plotly PCA plot at the given div element with support for multiple inputs.
 * @param {*} div_id The id of the div element, if it does not exist, a new div will be created.
 * @param {*} arrayOfObjects Accepts an array of objects containing the following keys: phenotype_id, sex, ancestry.
 * @param {*} [to_json=false] _Optional_. If true, returns a stringified JSON object containing traces and layout.
 * Else, returns a div element containing the Plotly graph.
 * @returns A div element or a string if `to_json` is true.
 */
plco.plot.pca2 = async (
    div_id,
    arrayOfObjects,
    to_json = false
) => {
    let pc_x = 1
    let pc_y = 2

    /**
     * Metadata
     * @type {Array<object>} Each object in the array has the properties defined below.
     * @prop {integer} id
     * @prop {integer} phenotype_id
     * @prop {string} phenotype_name
     * @prop {string} phenotype_display_name
     * @prop {string} sex
     * @prop {string} ancestry
     * @prop {string} chromosome
     * @prop {number} lambda_gc
     * @prop {number} lambda_gc_ld_score
     * @prop {integer} count
     */


    /**
     * PCA
     * @type {object}
     * @prop {Array} columns 
     * @prop {Array} data - `data` is an array of object that has the following props: 
     * pc_x, pc_y, ancestry, sex, value
     */

    let div = document.getElementById(div_id)

    if (div === null && !to_json) {
        div = document.createElement('div')
        div.id = div_id
        document.body.appendChild(div)
    }

    // Other are the points that do not share the inputted ancestry or sex or value == null
    // Control are the same ancestry and sex, but value == null or 0
    // Cases are the same ancestry and sex, but value != null and != 0

    const traces = await plco.plot.helpers.pcaHelper(arrayOfObjects, 'PLCO_GSA', 1, 2)

    const layout = {
        hovermode: 'closest',
        dragmode: 'pan',
        clickmode: 'event',
        width: 800,
        height: 800,
        autosize: true,
        xaxis: {
            automargin: true,
            showgrid: false,
            title: {
                text: `<b>PC-X ${(pc_x || '1')}</b>`,
                font: {
                    size: 14,
                    color: 'black'
                }
            },
            tick0: 0,
            ticklen: 10,
            tickfont: {
                size: 10,
                color: 'black'
            }
        },
        yaxis: {
            automargin: true,
            showgrid: false,
            title: {
                text: `<b>PC-Y ${(pc_y || '2')}</b>`,
                font: {
                    size: 14,
                    color: 'black'
                }
            },
            tick0: 0,
            ticklen: 10,
            tickfont: {
                size: 10,
                color: 'black'
            }
        },
        showlegend: true,
        legend: {
            title: {
                font: {
                    size: 12,
                    color: 'grey'
                }
            },
            itemdoubleclick: false,
            orientation: 'v',
            x: 0.0,
            y: 1.2
        }
    }

    const config = {
        scrollZoom: true,
        responsive: true,
        toImageButtonOptions: {
            format: 'svg',
            filename: 'pca_plot',
            height: 1000,
            width: 1000,
            scale: 1
        },
        displaylogo: false,
        modeBarButtonsToRemove: [
            'select2d',
            'autoScale2d',
            'hoverClosestCartesian',
            'hoverCompareCartesian',
            'lasso2d',
            'toggleSpikelines',
        ]
    }

    const dropdownLayout = await plco.plot.helpers.pcaCreateDropdownLayout(arrayOfObjects, 1, 2)

    if (!to_json) {
        Plotly.newPlot(div, traces, Object.assign(layout, dropdownLayout), config)
        plco.plot.helpers.pcaGenerateXYInputs(div_id, arrayOfObjects, layout, config)
        return div
    } else {
        const tracesString = '{"traces":' + JSON.stringify(traces) + ','
        const layoutString = '"layout":' + JSON.stringify(Object.assign(layout, dropdownLayout)) + ','
        const configString = '"config":' + JSON.stringify(config) + '}'
        return tracesString + layoutString + configString
    }
}

/**
 * A collection of helper methods for plotting, not intended to be used on its own.
 * @memberof plco.plot
 */
plco.plot.helpers = {}

plco.plot.helpers.pcaValidate = async (
    arrayOfObjects = []
) => {
    const promises = []
    arrayOfObjects.forEach(({ phenotype_id, sex, ancestry }) => {
        promises.push(
            plco.api.metadata({ chromosome: 'all' }, phenotype_id, sex, ancestry)
                .then(array => array[0])
                .then(metadata => {
                    if (metadata === undefined || metadata['count'] === null) {
                        throw new Error('No data found for this combination of sex and/or ancestry.')
                    } else
                        return metadata
                })
                .catch(() => {
                    console.error('Unable to fetch data, skipping...')
                    return undefined
                })
        )
    })

    return (await Promise.all(promises)).filter(Boolean)
}

plco.plot.helpers.pcaGenerateTraces = async (
    validArray,
    platform,
    pc_x,
    pc_y
) => {
    // [light, dark]
    const colors = [['#D4A8E2', '#A482AF'], ['#FFD5A6', '#CCAA84'],
    ['#8DD7C0', '#6BA392'], ['#01A7FF', '#0085CC']]

    const pcaPromises = []
    validArray.forEach((obj) =>
        pcaPromises.push(
            plco.api.pca({}, obj.phenotype_id, platform, pc_x, pc_y)
        )
    )
    // Pca [] should have a one-to-one correspondence with validArray []
    const pcadatas = await Promise.all(pcaPromises).catch(() => [])

    if (pcadatas.length === 0) return []

    const baseTrace = {
        type: 'scattergl',
        hoverinfo: 'x+y',
        showlegend: true,
        mode: 'markers',
    }
    const traces = []
    const otherTraces = []

    pcadatas.forEach((item, index) => {
        // Create the other traces first
        const others = item.data.filter(obj =>
            obj.ancestry !== validArray[index].ancestry ||
            obj.sex !== validArray[index].sex || obj.value === null
        )
        otherTraces.push({
            ...baseTrace,
            x: others.map(obj => obj.pc_x),
            y: others.map(obj => obj.pc_y),
            marker: {
                color: '#A6A6A6',
                size: 4,
                opacity: 0.4
            },
            name: 'Other, Count: ' + others.length
        })

        const controls = item.data.filter(obj =>
            obj.ancestry === validArray[index].ancestry &&
            obj.sex === validArray[index].sex && (obj.value === null || obj.value === 0)
        )
        const cases = item.data.filter(obj =>
            obj.ancestry === validArray[index].ancestry &&
            obj.sex === validArray[index].sex && (obj.value !== null && obj.value !== 0)
        )
        const controlsTrace = {
            ...baseTrace,
            x: controls.map(obj => obj.pc_x),
            y: controls.map(obj => obj.pc_y),
            marker: {
                color: colors[index % colors.length][1],
                size: 5,
                opacity: 0.65
            },
            name: `Controls ${validArray[index].phenotype_display_name}, ${validArray[index].ancestry}, ` +
                `${validArray[index].sex[0]}, Count: ${controls.length}`
        }
        const casesTrace = {
            ...baseTrace,
            x: cases.map(obj => obj.pc_x),
            y: cases.map(obj => obj.pc_y),
            marker: {
                color: colors[index % colors.length][0],
                size: 5,
                opacity: 0.65
            },
            name: `Cases ${validArray[index].phenotype_display_name}, ${validArray[index].ancestry}, ` +
                `${validArray[index].sex[0]}, Count: ${cases.length}`
        }

        traces.push(controlsTrace, casesTrace)
    })

    return otherTraces.concat(traces)
}

plco.plot.helpers.pcaHelper = async (
    arrayOfObjects,
    platform,
    pc_x,
    pc_y
) => {
    const metadatas = await plco.plot.helpers.pcaValidate(arrayOfObjects)
    const traces = await plco.plot.helpers.pcaGenerateTraces(metadatas, platform, pc_x, pc_y)
    return traces
}

plco.plot.helpers.pcaCreateDropdownLayout = async (validArray, pc_x, pc_y) => {
    // https://plotly.com/javascript/dropdowns/
    const layout = {
        updatemenus: [{
            y: 1.2,
            yanchor: 'top',
            buttons: [],
        }]
    }

    const platforms = ['PLCO_GSA', 'PLCO_Omni5', 'PLCO_Omni25', 'PLCO_Oncoarray', 'PLCO_OmniX']
    const promises = []
    const metadatas = await plco.plot.helpers.pcaValidate(validArray)

    for (let i = 0; i < platforms.length; i++) {
        promises.push(
            plco.plot.helpers.pcaGenerateTraces(metadatas, platforms[i], pc_x, pc_y)
                .then((traces) => {
                    layout.updatemenus[0].buttons.push({
                        method: 'restyle',
                        args: [{ x: traces.map(t => t.x), y: traces.map(t => t.y) }],
                        label: platforms[i],
                    })
                })
        )
    }

    await Promise.all(promises)
    return layout
}

plco.plot.helpers.pcaGenerateXYInputs = (div_id, arrayOfObjects, layout, config) => {
    const xSelector = document.createElement('select')
    xSelector.id = div_id + 'xSelector'
    const ySelector = document.createElement('select')
    ySelector.id = div_id + 'ySelector'

    const xLabel = document.createElement('label')
    xLabel.for = div_id + 'xSelector'
    xLabel.innerHTML = 'PC_X: '

    const yLabel = document.createElement('label')
    yLabel.for = div_id + 'ySelector'
    yLabel.innerHTML = 'PC_Y: '


    for (let i = 1; i <= 20; i++) {
        const opt = document.createElement('option')
        opt.text = i
        xSelector.appendChild(opt)

        if (i === 1) continue
        const opt2 = document.createElement('option')
        opt2.text = i
        ySelector.appendChild(opt2)
    }

    const opt3 = document.createElement('option')
    opt3.text = 1
    ySelector.appendChild(opt3)

    xSelector.addEventListener('change', async () => {
        const xVal = Number.parseFloat(xSelector.value)
        const yVal = Number.parseFloat(ySelector.value)

        const traces = await plco.plot.helpers.pcaHelper(arrayOfObjects, 'PLCO_GSA', xVal, yVal)
        const dropdownLayout = await plco.plot.helpers.pcaCreateDropdownLayout(arrayOfObjects, xVal, yVal)
        Plotly.newPlot(div_id, traces, Object.assign({
            ...layout,
            xaxis: { ...layout.xaxis, title: { text: `<b>PC-X ${(xVal || '2')}</b>` } },
            yaxis: { ...layout.yaxis, title: { text: `<b>PC-Y ${(yVal || '2')}</b>` } },
        }, dropdownLayout), config)
    }, false)

    ySelector.addEventListener('change', async () => {
        const xVal = Number.parseFloat(xSelector.value)
        const yVal = Number.parseFloat(ySelector.value)

        const traces = await plco.plot.helpers.pcaHelper(arrayOfObjects, 'PLCO_GSA', xVal, yVal)
        const dropdownLayout = await plco.plot.helpers.pcaCreateDropdownLayout(arrayOfObjects, xVal, yVal)
        Plotly.newPlot(div_id, traces, Object.assign({
            ...layout,
            xaxis: { ...layout.xaxis, title: { text: `<b>PC-X ${(xVal || '2')}</b>` } },
            yaxis: { ...layout.yaxis, title: { text: `<b>PC-Y ${(yVal || '2')}</b>` } },
        }, dropdownLayout), config)
    }, false)

    const div = document.getElementById(div_id)
    div.appendChild(xLabel)
    div.appendChild(xSelector)
    div.appendChild(yLabel)
    div.appendChild(ySelector)
}

plco()

if (typeof (define) != 'undefined') {
    define(plco)
}
