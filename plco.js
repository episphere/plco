console.log('plco.js loaded')

plco = {
    date: new Date()
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

plco.defineAttributes = (obj, m_fields, o_fields = {}) => {
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

plco.loadScript("https://cdn.plot.ly/plotly-latest.min.js")

plco.plotTest = async (chr = 1, div, url = 'https://exploregwas-dev.cancer.gov/plco-atlas/api/summary?phenotype_id=3080&sex=female&ancestry=east_asian&p_value_nlog_min=2&raw=true') => {
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

plco.api.download = async (
    parms,
    phenotype_id = 3080,
    get_link_only = undefined
) => {
    parms =
        typeof parms == 'string'
            ? plco.api.string2parms(parms)
            : Array.isArray(parms)
                ? Object.fromEntries(parms)
                : parms
    parms = parms || {
        phenotype_id,
    }
    plco.defineAttributes(parms, { phenotype_id }, { get_link_only })
    return await plco.api.get((cmd = 'download'), parms)
}

/**
 * Retrieves metadata for phenotypes specified
 * @param {object | string | *[][]} parms An object, query string, or 2-d array that contains the query parameters.
 * @param {number} phenotype_id A phenotype id.
 * @param {string} sex A sex, which may be "all", "female", or "male".
 * @param {string} ancestry A character vector specifying ancestries to retrieve data for.
 * @param {string} raw _Optional_. If true, returns data in an array of arrays instead of an array of objects.
 * @return A dataframe containing phenotype metadata
 * @examples
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
    plco.defineAttributes(parms, { phenotype_id, sex, ancestry }, { raw })
    return await plco.api.get((cmd = 'metadata'), parms)
}

plco.api.participants = async (
    parms,
    phenotype_id = 2250,
    columns = undefined,
    precision = undefined,
    raw = undefined
) => {
    parms =
        typeof parms == 'string'
            ? plco.api.string2parms(parms)
            : Array.isArray(parms)
                ? Object.fromEntries(parms)
                : parms
    parms = parms || {
        phenotype_id,
        columns: 'value',
        precision: 0,
    }
    plco.defineAttributes(parms, { phenotype_id }, { columns, precision, raw })
    return await plco.api.get((cmd = 'participants'), parms)
}

/**
 * Retrieves phenotypes
 * @param {object | string | *[][]} parms An object, query string, or 2-d array that contains the query parameters.
 * @param {string} q _Optional_. A query term
 * @param {string} raw _Optional_. If true, returns data in an array of arrays instead of an array of objects.
 * @return If query is specified, a list of phenotypes that contain the query term is returned. Otherwise, a tree of all phenotypes is returned.
 * @examples
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
    plco.defineAttributes(parms, { }, { q, raw })
    return await plco.api.get(cmd = "phenotypes", parms)
}

/**
 * Retrieve variants for all chromosomes at a resolution of 400x800 bins across the whole genome and specified -log10(p) range
 * @param {object | string | *[][]} parms An object, query string, or 2-d array that contains the query parameters.
 * @param {number} phenotype_id A phenotype id.
 * @param {string} sex A sex, which may be "all", "female", or "male".
 * @param {string} ancestry A character vector specifying ancestries to retrieve data for.
 * @param {number} p_value_nlog_min A numeric value >= 0 specifying the minimum -log10(p) for variants.
 * @param {string} raw _Optional_. If true, returns data in an array of arrays instead of an array of objects.
 * @return A dataframe with aggregated variants.
 * @examples
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
    plco.defineAttributes(parms, { phenotype_id, sex, ancestry, p_value_nlog_min }, { raw })
    return await plco.api.get(cmd = "summary", parms)
}

/**
 * Retrieve variants for specified phenotype, sex, ancestry, chromosome, and other optional fields.
 * @param {object | string | *[][]} parms An object, query string, or 2-d array that contains the query parameters.
 * @param {number} phenotype_id Phenotype id(s)
 * @param {string} sex A sex, which may be "all", "female", or "male".
 * @param {string} ancestry An ancestry, which may be "african_american", "east_asian", or "european".
 * @param {number} chromosome A chromosome number.
 * @param {string} columns _Optional_ Properties for each variant. Default: all properties.
 * @param {string} snp _Optional_ Snps.
 * @param {number} position _Optional_ The exact position of the variant within a chromosome.
 * @param {number} position_min _Optional_ The minimum chromosome position for variants.
 * @param {number} position_max _Optional_ The maximum chromosome position for variants.
 * @param {number} p_value_nlog_min _Optional_ The minimum -log10(p) of variants in the chromosome.
 * @param {number} p_value_nlog_max _Optional_ The maximum -log10(p) of variants in the chromosome.
 * @param {number} p_value_min _Optional_ The minimum p-value of variants in the chromosome.
 * @param {number} p_value_max _Optional_ The maximum p-value of variants in the chromosome.
 * @param {string} orderBy _Optional_ A property to order variants by. May be "id", "snp", "chromosome", "position", "p_value", or "p_value_nlog".
 * @param {string} order _Optional_ An order in which to sort variants. May be "asc" or "desc".
 * @param {number} offset _Optional_ The number of records by which to offset the variants (for pagination)
 * @param {number} limit _Optional_ The maximum number of variants to return (for pagination). Highest allowed value is 1 million.
 * @param {string} raw _Optional_. If true, returns data in an array of arrays instead of an array of objects.
 * @return A dataframe with variants.
 * @examples
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
)  => {
    parms = typeof parms == 'string' ? plco.api.string2parms(parms) : Array.isArray(parms) ? Object.fromEntries(parms) : parms
    parms = parms || {
        phenotype_id,
        sex,
        ancestry,
        chromosome,
        limit: 10
    }
    plco.defineAttributes(
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

if (typeof (define) != 'undefined') {
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
