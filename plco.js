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

/**
 * Adds a key-value pair as specified in `m_fields` and `o_fields` to `obj` if the key does not already exist.
 * @param {object} obj An object.
 * @param {object} m_fields Mandatory fields.
 * @param {object} o_fields Optional fields. Same as `m_fields`, but will not add in the key-value pair if value is undefined.
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

plco.loadScript("https://cdn.plot.ly/plotly-latest.min.js")

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
 * @param {object | string | *[][] } parms A JSON object, query string, or array containing the query parameters.
 * @param {integer} phenotype_id A numeric phenotype id.
 * @param {string} get_link_only A string if equal to 'true' will return the link instead of downloading the tsv.gz. 
 * @returns Results of the API call.
 * @example
 * plco.api.download({phenotype_id: 3080, get_link_only: 'true'})
 * 
 * plco.api.download({}, 3080, 'true')
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

// Example call: await plco.api.metadata({ phenotype_id: 3080, sex: "female", ancestry: "european" })
plco.api.metadata = async (parms) => {
    parms = typeof parms == 'string' ? plco.api.string2parms(parms) : parms
    parms = parms || {
        phenotype_id: 3080,
        sex: "female",
        ancestry: "european"
    }
    return await plco.api.get((cmd = 'metadata'), parms)
}

/**
 * 
 * @param {object | string | *[][] } parms 
 * @param {integer} phenotype_id A numeric phenotype id.
 * @param {string} columns A character vector specifying properties for which to retrieve counts for. 
 * Valid properties are: value, ancestry, genetic_ancestry, sex, and age.
 * @param {integer} precision For continuous phenotypes, a numeric value specifying the -log10(precision) 
 * to which values should be rounded to.
 * @param {string} raw 
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
 * @param {object | string | *[][]} parms An object, query string, or 2-d array that contains the query parameters.
 * @param {integer} phenotype_id A numeric phenotype id.
 * @param {string} platform A character vector specifying the platform to retrieve data for.
 * @param {integer} pc_x A numeric value (1-20) specifying the x axis's principal component.
 * @param {integer} pc_y A numeric value (1-20) specifying the y axis's principal component.
 * @param {integer} limit _Optional_. A numeric value to limit the number of variants returned (used for pagination). 
 * Capped at 1 million.
 * @param {string} raw _Optional_. If true, returns data in an array of arrays instead of an array of objects.
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

// Example call: await plco.api.phenotypes({ q: "first_ca125_level" })
plco.api.phenotypes = async (parms) => {
    parms = typeof (parms) == "string" ? plco.api.string2parms(parms) : parms
    return await plco.api.get(cmd = "phenotypes", parms)
}

/**
 * Retrieves sampled variants suitable for visualizing a QQ plot for the specified phenotype, sex, and ancestry.
 * @param {object | string | *[][]} parms An object, query string, or 2-d array that contains the query parameters.
 * @param {integer} phenotype_id A numeric phenotype id.
 * @param {string} sex A character vector specifying a sex to retrieve data for.
 * @param {string} ancestry A character vector specifying ancestries to retrieve data for.
 * @param {string} raw _Optional_. If true, returns data in an array of arrays instead of an array of objects.
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

// Example call: await plco.api.summary({ phenotype_id: 3080, sex: "female", ancestry: "european", p_value_nlog_min: 4 })
plco.api.summary = async (parms) => {
    parms = typeof (parms) == "string" ? plco.api.string2parms(parms) : parms
    parms = parms || {
        phenotype_id: 3080,
        sex: "female",
        ancestry: "european",
        p_value_nlog_min: 4
    }
    return await plco.api.get(cmd = "summary", parms)
    //phenotype_id=3080&sex=all&ancestry=east_asian&p_value_nlog_min=4"
}

// Example call: await plco.api.variants({ phenotype_id: 3080, sex: "female", ancestry: "european", chromosome: 8,
// p_value_nlog_min: 4,  limit: 10 })
plco.api.variants = async (parms) => {
    parms = typeof (parms) == "string" ? plco.api.string2parms(parms) : parms
    parms = parms || {
        phenotype_id: 3080,
        sex: "female",
        ancestry: "european",
        chromosome: 8,
        p_value_nlog_min: 1.3,
        limit: 10
    }
    return await plco.api.get(cmd = "summary", parms)
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
