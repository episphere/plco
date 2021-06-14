/** 
 * @file JS SDK for NCI DCEG's PLCO API.
 * 
 * @version 0.5
 * @author Jonas Almeida, Lorena Sandoval, Erika Nemeth, Eric Ruan
 * @copyright 2021
 */
console.log('plco.js loaded')

/**
 * Main global portable module.
 * @namespace plco
 * @property {Function} saveFile - {@link plco.saveFile}
 * @property {Function} defineProperties - {@link plco.defineProperties}
 */
plco = {
    /** @type {Date} */
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
 * @param {integer} phenotype_id A numeric phenotype id.
 * @param {string} get_link_only _Optional_. If set to 'true', returns the download link instead of redirecting automatically to the file.
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
 * @param {number} phenotype_id A phenotype id.
 * @param {string} sex A sex, which may be "all", "female", or "male".
 * @param {string} ancestry A character vector specifying ancestries to retrieve data for.
 * @param {string} raw _Optional_. If true, returns data in an array of arrays instead of an array of objects.
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
 * @param {integer} phenotype_id A numeric phenotype id.
 * @param {string} columns _Optional_. A character vector specifying properties for which to retrieve counts for. 
 * Valid properties are: value, ancestry, genetic_ancestry, sex, and age.
 * @param {integer} precision _Optional_. For continuous phenotypes, a numeric value specifying the -log10(precision) 
 * to which values should be rounded to.
 * @param {string} raw _Optional_. If true, returns data in an array of arrays instead of an array of objects.
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

/**
 * Retrieves phenotypes
 * @param {object | string | Array<Array>} parms A JSON object, query string, or 2-d array containing the query parameters.
 * @param {string} q _Optional_. A query term
 * @param {string} raw _Optional_. If true, returns data in an array of arrays instead of an array of objects.
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

/**
 * Retrieve variants for all chromosomes at a resolution of 400x800 bins across the whole genome and specified -log10(p) range
 * @param {object | string | Array<Array>} parms A JSON object, query string, or 2-d array containing the query parameters.
 * @param {number} phenotype_id A phenotype id.
 * @param {string} sex A sex, which may be "all", "female", or "male".
 * @param {string} ancestry A character vector specifying ancestries to retrieve data for.
 * @param {number} p_value_nlog_min A numeric value >= 0 specifying the minimum -log10(p) for variants.
 * @param {string} raw _Optional_. If true, returns data in an array of arrays instead of an array of objects.
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
