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
 * @property {Function} defineProperties - {@link plco.defineProperties}
 * @property {Function} explorePhenotypes - {@link plco.explorePhenotypes}
 * @property {Function} loadScript - {@link plco.loadScript}
 * @property {Function} saveFile - {@link plco.saveFile}
 */
const plco = async () => {
    plco.loadScript("https://cdn.plot.ly/plotly-latest.min.js")
    console.log("plotly.js loaded")
    plco.loadScript("https://episphere.github.io/plotly/epiPlotly.js")
    plco.addStyle()
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
    // TODO downloadgwas is not up yet, so i will make change later once its fixed
    url = url || 'https://downloadgwas.cancer.gov/j_breast_cancer.tsv.gz'
    let a = document.createElement('a')
    a.href = url
    a.target = '_blank'
    a.click()
    return a
}

/**
 * Adds a style tag containing css for some plot elements.
 */
plco.addStyle = () => {
    const style = document.createElement('style')
    style.innerHTML = `
        .loader {
            border: 16px solid #f3f3f3; /* Light grey */
            border-top: 16px solid #3498db; /* Blue */
            border-radius: 50%;
            width: 120px;
            height: 120px;
            animation: spin 2s linear infinite;
            position: absolute;
            z-index: 10;
            top: 50%;
            left: 40%;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `
    window.onload = (_) => {
        document.head.appendChild(style)
    }
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

/**
 * Creates and attaches a new script tag to head with script src pointing at `url`.
 * @param {string} url 
 * @param {string} host 
 * @returns {HTMLScriptElement} HTMLScriptElement
 */
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

/**
 * Provides a way to explore all the available phenotypes.
 * @param {boolean} [flatten=false] If 'true', returns an array of objects instead of a tree.
 * @param {boolean} [mini=false] If 'true', removes keys from the objects to provide a condensed view.
 * @param {boolean} [graph=false] If 'true', returns a Plotly chart instead of an array of objects.
 * @returns An array of objects.
 */
plco.explorePhenotypes = async (
    flatten = false,
    mini = false,
    graph = false,
) => {
    let phenotypes_json = await plco.api.phenotypes()

    if (flatten) {
        let queue = []
        let r = []
        for (let i = 0; i < phenotypes_json.length; i++) {
            let root = phenotypes_json[i]
            queue.push(root)

            while (true) {
                let removed = queue.splice(0, 1)[0]

                if (removed === undefined) break
                r.push(removed)

                if (removed.children === undefined) continue
                else {
                    if (Array.isArray(removed.children)) {
                        for (let j = 0; j < removed.children.length; j++) {
                            queue.push(removed.children[j])
                        }
                    } else {
                        queue.push(removed.children)
                    }
                }
            }

        }
        phenotypes_json = r

        for (let i = 0; i < phenotypes_json.length; i++) {
            let obj = phenotypes_json[i]
            delete obj.children
        }
    }

    if (mini) {
        let queue = []
        for (let i = 0; i < phenotypes_json.length; i++) {
            let root = phenotypes_json[i]
            queue.push(root)

            while (true) {
                let removed = queue.splice(0, 1)[0]

                if (removed === undefined) break
                delete removed.color
                delete removed.import_date
                delete removed.type
                delete removed.age_name
                delete removed.import_count
                delete removed.parent_id
                if (removed.children === undefined) continue
                else {
                    if (Array.isArray(removed.children)) {
                        for (let j = 0; j < removed.children.length; j++) {
                            queue.push(removed.children[j])
                        }
                    } else {
                        queue.push(removed.children)
                    }
                }
            }

        }
    }

    if (graph) {
        // https://plotly.com/javascript/sunburst-charts/
        // TODO partipicants endpoint, perhaps like a table
        const div = document.createElement('div')
        div.id = 'sunburst'
        document.body.appendChild(div)

        phenotypes_json = await plco.explorePhenotypes(true, false, false)

        const data = [{
            type: "sunburst",
            ids: phenotypes_json.map(phenotype => phenotype.id),
            labels: phenotypes_json.map(phenotype => phenotype.display_name),
            parents: phenotypes_json.map(phenotype => phenotype.parent_id ? phenotype.parent_id : ''),
            values: phenotypes_json.map(phenotype => phenotype.participant_count ? phenotype.participant_count : 0),
            outsidetextfont: { size: 20, color: "#377eb8" },
            leaf: { opacity: 0.6 },
            marker: { line: { width: 2 } },
            hovertext: phenotypes_json.map(phenotype => 'phenotype_id: ' + phenotype.id),
            hoverinfo: 'label+text+value',
            textposition: 'inside',
            insidetextorientation: 'radial',
        }]

        const layout = {
            margin: { l: 0, r: 0, b: 0, t: 0 },
            width: 800,
            height: 800,
            sunburstcolorway: phenotypes_json.map(phenotype => phenotype.color).filter(Boolean),
        }

        Plotly.newPlot(div, data, layout)
        div.on('plotly_click', async ({ event, points }) => {
            if (event.altKey) {
                const part = await plco.api.participants({}, points[0].id, 'value,ancestry,sex', 0)

                function helper(totalObject, cur, property) {
                    if (!totalObject['count_' + cur[property]] && cur[property] != null) {
                        const num = Number.parseInt(cur.counts)
                        if (isNaN(num))
                            totalObject['count_' + cur[property]] = 4
                        else
                            totalObject['count_' + cur[property]] = num
                    } else if (cur[property] != null) {
                        const num = Number.parseInt(cur.counts)
                        if (isNaN(num))
                            totalObject['count_' + cur[property]] = totalObject['count_' + cur[property]] + 4
                        else
                            totalObject['count_' + cur[property]] = totalObject['count_' + cur[property]] + num
                    }
                }

                function convertRowMajortoColMajor(numOfRows, numOfCols, arrays) {
                    let matrix = []
                    for (let i = 0; i < numOfCols; i++) {
                        matrix.push([])
                        for (let j = 0; j < numOfRows; j++) {
                            matrix[i].push(arrays[j][i])
                        }
                    }
                    return matrix
                }

                const data =
                    part.data.reduce((prev, cur) => {
                        const found = prev.find(obj => obj.value === cur.value)
                        if (!found) {
                            let addToArray = {
                                value: cur.value,
                                count: isNaN(Number.parseInt(cur.counts)) ? 4 : Number.parseInt(cur.counts),
                            }
                            helper(addToArray, cur, 'sex')
                            helper(addToArray, cur, 'ancestry')
                            prev.push(addToArray)
                        } else {
                            found.count = found.count +
                                (isNaN(Number.parseInt(cur.counts)) ? 4 : Number.parseInt(cur.counts))
                            helper(found, cur, 'sex')
                            helper(found, cur, 'ancestry')
                        }
                        return prev
                    }, [])

                console.table(data)

                const cellsVal = data.map(obj => Object.values(obj))
                const cellsValPercent = data.map(obj => {
                    const newObj = {}
                    const keys = Object.keys(obj)
                    for (let i = 0; i < keys.length; i++) {
                        let k = keys[i]
                        if (k === 'count') {
                            const totalCount = data.reduce((total, cur) => total + cur.count, 0)
                            newObj[k] = Math.round(Number.parseInt(obj[k]) / Number.parseInt(totalCount) * 100) + '%'
                        } else if (k === 'value')
                            newObj[k] = obj[k]
                        else
                            newObj[k] = Math.round(Number.parseInt(obj[k]) / Number.parseInt(obj.count) * 100) + '%'
                    }
                    return Object.values(newObj)
                })
                const headerVal = Object.keys(data[0])
                const trace = [{
                    type: 'table',
                    columnwidth: headerVal.map((_) => 150),
                    header: {
                        values: headerVal,
                        fill: { color: "grey" },
                    }, cells: {
                        values: convertRowMajortoColMajor(
                            cellsVal.length, cellsVal[0].length || 0, cellsVal)
                    }
                }]
                const layout = {
                    updatemenus: [{
                        y: 1.0,
                        yanchor: 'top',
                        buttons: [{
                            method: 'restyle',
                            args: [{
                                cells: {
                                    values: convertRowMajortoColMajor(
                                        cellsVal.length, cellsVal[0].length || 0, cellsVal)
                                }
                            }],
                            label: 'Normal',
                        }, {
                            method: 'restyle',
                            args: [{
                                cells: {
                                    values: convertRowMajortoColMajor(
                                        cellsVal.length, cellsVal[0].length || 0, cellsValPercent)
                                }
                            }],
                            label: 'Percentage',
                        }],
                    }]
                }
                const div2 = document.createElement('div')
                div2.id = 'table' + Math.floor(Math.random() * 20)
                document.body.appendChild(div2)

                Plotly.newPlot(div2, trace, layout)
            }
        })
        return phenotypes_json
    }
    return phenotypes_json
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
 * @property {Function} ping - {@link plco.api.ping}
 */
plco.api = {}

plco.api.url = 'https://exploregwas.cancer.gov/plco-atlas/api/'

/**
 * Returns the status of the PLCO API.
 */
plco.api.ping = async () => {
    return (await fetch(plco.api.url + 'ping')).text()
}

plco.api.get = async (cmd = "ping", parms = {}) => {
    // res = await fetch(...)
    // content-type = await res.blob().type
    if (cmd === "ping") {
        return await (await fetch(plco.api.url + 'ping')).text() === "true"
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
    parms =
        typeof parms === 'string'
            ? plco.api.string2parms(parms)
            : Array.isArray(parms)
                ? Object.fromEntries(parms)
                : parms
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
    parms =
        typeof parms === 'string'
            ? plco.api.string2parms(parms)
            : Array.isArray(parms)
                ? Object.fromEntries(parms)
                : parms
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
plco.api.points = async (
    parms,
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
 * @prop {Function} manhattan2 - {@link plco.plot.manhattan2}  
 * @prop {Function} qq - {@link plco.plot.qq}
 * @prop {Function} qq2 - {@link plco.plot.qq2}
 * @prop {Function} pca - {@link plco.plot.pca}
 * @prop {Function} pca2 - {@link plco.plot.pca2}
 */
plco.plot = async () => {

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
 * @param {object} [customLayout={}] _Optional_. Contains Plotly supported layout key-values pair that will overwrite the default layout. Commonly overwritten values may include height and width of the graph. See: https://plotly.com/javascript/reference/layout/ for more details. Also, set `to_json` to true to see what the default layout is.
 * @param {object} [customConfig={}] _Optional_. Contains Plotly supported config key-values pair that will overwrite the default config. See: https://github.com/plotly/plotly.js/blob/master/src/plot_api/plot_config.js#L22-L86 for full details.
 * @returns A div element or a string if 'to_json' is true.
 * @example 
 * plco.plot.manhattan()
 * plco.plot.manhattan('plot', 3080, "female", "european", 2, 18)
*/
plco.plot.manhattan = async (
    div_id,
    phenotype_id = 3080,
    sex = 'female',
    ancestry = 'european',
    p_value_nlog_min = 2,
    chromosome,
    to_json = false,
    customLayout = {},
    customConfig = {},
) => {
    // Set up div, in which Plotly graph may be inserted.
    let div = document.getElementById(div_id)
    if (div === null && !to_json) {
        div = document.createElement('div')
        div.id = div_id
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
    let chromosomeTraces = []
    let currentChromosome

    for (i = 1; i <= numberOfChromosomes; i++) {
        if (numberOfChromosomes == 1) {
            currentChromosome = chromosome
        } else {
            currentChromosome = i
        }
        currentChromosomeData = inputData.filter(x => x.chromosome == "" + currentChromosome)
        const traceInfo = {
            x: currentChromosomeData.map(x => parseInt(x.position_abs)),
            y: currentChromosomeData.map(x => parseFloat(x.p_value_nlog)),
            mode: 'markers',
            type: 'scattergl',
            marker: {
                opacity: 0.65,
                size: 5
            },
            name: 'Chromosome ' + currentChromosome, // appears as legend item
            hovertemplate: currentChromosomeData.map(x =>
                'absolute position: ' + parseInt(x.position_abs) +
                '<br>p-value: ' + Math.pow(10, -x.p_value_nlog)
            )
        }
        traces.push(traceInfo)
        chromosomeTraces.push({
            x: [traceInfo.x.reduce((smallest, cur) => cur > smallest ? smallest : cur, Number.MAX_SAFE_INTEGER)],
            y: [p_value_nlog_min],
            mode: 'markers',
            type: 'scattergl',
            marker: {
                size: 0,
                opacity: 0,
                color: '#FFFFFF',
            },
            hoverinfo: 'none',
            xaxis: 'x2',
            showlegend: false,
            name: 'Chromosome ' + currentChromosome,
        })
    }

    if (numberOfChromosomes == 1) {
        for (i = 0; i < traces[0].hovertemplate.length; i++) {
            traces[0].hovertemplate[i] += '<br>snp: ' + rsNumbers[i]
        }
    }

    traces = traces.concat(chromosomeTraces)

    let layout = {
        title: 'SNPs in ' + chromosomeName,
        xaxis: {
            title: 'absolute position',
            position: '0.0',
            showgrid: false,
            tickfont: {
                color: 'black',
                size: 15
            },
        },
        xaxis2: {
            title: '',
            overlaying: 'x',
            anchor: 'free',
            position: '1.0',
            tickmode: 'array',
            tickvals: chromosomeTraces.map(trace => trace.x[0]),
            ticktext: chromosomeTraces.map(trace => trace.name),
        },
        yaxis: {
            title: '-log<sub>10</sub>(p)',
            fixedrange: numberOfChromosomes !== 1,
        },
        hovermode: 'closest',
        height: 700,
        width: 1200,
        ...customLayout,
    }

    let config = {
        scrollZoom: true,
        ...customConfig
    }

    // experimental
    const chromosomeAbsPos =
        chromosomeTraces.map(trace => ({
            val: trace.x[0],
            chromosomeNum: Number.parseInt(trace.name.split(' ')[1])
        }))


    if (!to_json) {
        Plotly.newPlot(div, traces, layout, config)

        const oldCheckbox = document.getElementById(div_id + 'checkbox')
        if (oldCheckbox) {
            oldCheckbox.remove()
        }
        const oldLabel = document.getElementById(div_id + 'label')
        if (oldLabel) {
            oldLabel.remove()
        }

        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.id = div_id + 'checkbox'
        const label = document.createElement('label')
        label.id = div_id + 'label'
        label.for = div_id + 'checkbox'
        label.innerHTML = 'allow graph to update on zoom: '
        div.appendChild(checkbox)
        div.appendChild(label)

        div.on('plotly_relayout', async (eventdata) => {
            // TODO Add an loader class
            if (checkbox.checked && eventdata['xaxis2.range[0]'] && eventdata['xaxis2.range[1]']) {
                const tempDiv = document.createElement('div')
                tempDiv.classList.add('loader')
                document.body.appendChild(tempDiv)
                div.style = 'display: none;'
                const findStart = chromosomeAbsPos.find(({ val }) => val >= eventdata['xaxis2.range[0]'])
                await plco.plot.manhattan(div_id, phenotype_id, sex, ancestry, p_value_nlog_min, findStart.chromosomeNum)
                tempDiv.remove()
                div.style = ''
            }
            else if (checkbox.checked) {
                const tempDiv = document.createElement('div')
                tempDiv.classList.add('loader')
                document.body.appendChild(tempDiv)
                div.style = 'display: none;'
                await plco.plot.manhattan(div_id, phenotype_id, sex, ancestry, p_value_nlog_min, undefined)
                tempDiv.remove()
                div.style = ''
            } else { return }
        })
        return div
    } else {
        let tracesString = '{"traces":' + JSON.stringify(traces) + ','
        let layoutString = '"layout":' + JSON.stringify(layout) + ','
        let configString = '"config":' + JSON.stringify(config) + '}'
        return tracesString + layoutString + configString
    }
}

/**
 * 
 * @param {string} div_id 
 * @param {Array} arrayOfObjects 
 * @param {boolean} [to_json=false]
 * @param {object} [customLayout={}] _Optional_. Contains Plotly supported layout key-values pair that will overwrite the default layout. Commonly overwritten values may include height and width of the graph. See: https://plotly.com/javascript/reference/layout/ for more details. Also, set `to_json` to true to see what the default layout is.
 * @param {object} [customConfig={}] _Optional_. Contains Plotly supported config key-values pair that will overwrite the default config. See: https://github.com/plotly/plotly.js/blob/master/src/plot_api/plot_config.js#L22-L86 for full details.
 */
plco.plot.manhattan2 = async (
    div_id,
    arrayOfObjects,
    p_value_nlog_min = 2,
    chromosome,
    to_json = false,
    customLayout = {},
    customConfig = {},
) => {
    // TODO something with the variants endpoint
    const validObjects = await plco.plot.helpers.validateInputs(arrayOfObjects)

    if (validObjects.length < 2) throw new Error('Incorrect number of arguments.')

    let div = document.getElementById(div_id)
    if (div === null && !to_json) {
        div = document.createElement('div')
        div.id = div_id
        document.body.appendChild(div)
    }

    let inputData1 = await plco.api.summary(Object.assign(validObjects[0], { p_value_nlog_min }))
    let inputData2 = await plco.api.summary(Object.assign(validObjects[1], { p_value_nlog_min }))

    let chromosomeName
    let numberOfChromosomes
    if (chromosome) {
        inputData1 = inputData1.data.filter(x => x.chromosome == "" + chromosome)
        inputData2 = inputData2.data.filter(x => x.chromosome == "" + chromosome)
        chromosomeName = 'Chromosome ' + chromosome
        numberOfChromosomes = 1
    } else {
        inputData1 = inputData1.data
        inputData2 = inputData2.data
        chromosomeName = 'All Chromosomes'
        numberOfChromosomes = 22
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
 * @param {object} [customLayout={}] _Optional_. Contains Plotly supported layout key-values pair that will overwrite the default layout. Commonly overwritten values may include height and width of the graph. See: https://plotly.com/javascript/reference/layout/ for more details. Also, set `to_json` to true to see what the default layout is.
 * @param {object} [customConfig={}] _Optional_. Contains Plotly supported config key-values pair that will overwrite the default config. See: https://github.com/plotly/plotly.js/blob/master/src/plot_api/plot_config.js#L22-L86 for full details.
 * @returns A div element or a string if `to_json` is true.
 * @example
 * await plco.plot.qq('plot', 3080, 'female', 'east_asian')
 */
plco.plot.qq = async (
    div_id,
    phenotype_id = 3080,
    sex = 'female',
    ancestry = 'east_asian',
    to_json = false,
    customLayout = {},
    customConfig = {},
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
    const metadata = (await plco.plot.helpers.validateInputs([{ phenotype_id, sex, ancestry }]))[0]

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
        name: `${metadata.phenotype_display_name}, ${sex}, ${ancestry}`,
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
        ...customLayout
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
        ...customConfig
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
        const tracesString = '{"traces":' + JSON.stringify([traceLine, trace]) + ','
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
 * @param {object} [customLayout={}] _Optional_. Contains Plotly supported layout key-values pair that will overwrite the default layout. Commonly overwritten values may include height and width of the graph. See: https://plotly.com/javascript/reference/layout/ for more details. Also, set `to_json` to true to see what the default layout is.
 * @param {object} [customConfig={}] _Optional_. Contains Plotly supported config key-values pair that will overwrite the default config. See: https://github.com/plotly/plotly.js/blob/master/src/plot_api/plot_config.js#L22-L86 for full details.
 * @returns A div element or a string if `to_json` is true.
 * @example
 * await plco.plot.qq2('plot', [{phenotype_id:3080, sex:'female', ancestry:'east_asian'}, {phenotype_id:3080, sex:'female', ancestry:'european'}, {phenotype_id: 3550, sex:'all', ancestry:'east_asian'}]) 
 */
plco.plot.qq2 = (
    div_id,
    arrayOfObjects = [],
    to_json = false,
    customLayout = {},
    customConfig = {},
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
                },
                ...customLayout
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
                ...customConfig
            }

            if (!to_json) {
                Plotly.newPlot(div, traces, layout, config)
                div.on('plotly_click', async (data) => {
                    console.log(data) // contains the custom data

                    // An array
                    const { points } = data

                    for (let i = 0; i < points.length; i++) {
                        try {
                            const { variantId: id, phenotype_id, sex, ancestry } = points[i].customdata
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
 * @param {boolean} [to_json=false] _Optional_. If true, returns a stringified JSON object containing traces and layout.
 * Else, returns a div element containing the Plotly graph.
 * @param {object} [customLayout={}] _Optional_. Contains Plotly supported layout key-values pair that will overwrite the default layout. Commonly overwritten values may include height and width of the graph. See: https://plotly.com/javascript/reference/layout/ for more details. Also, set `to_json` to true to see what the default layout is.
 * @param {object} [customConfig={}] _Optional_. Contains Plotly supported config key-values pair that will overwrite the default config. See: https://github.com/plotly/plotly.js/blob/master/src/plot_api/plot_config.js#L22-L86 for full details.
 * @returns A div element or a string if `to_json` is true.
 * @example
 * await plco.plot.pca('plot', 3080, 'female', 'east_asian')
 */
plco.plot.pca = async (
    div_id,
    phenotype_id,
    sex,
    ancestry,
    to_json = false,
    customLayout = {},
    customConfig = {}
) => {
    return await plco.plot.pca2(div_id, [{ phenotype_id, sex, ancestry }], to_json, customLayout, customConfig)
}

/**
 * Generates a Plotly PCA plot at the given div element with support for multiple inputs.
 * @param {string} div_id The id of the div element, if it does not exist, a new div will be created.
 * @param {Array} arrayOfObjects Accepts an array of objects containing the following keys: phenotype_id, sex, ancestry.
 * @param {boolean} [to_json=false] _Optional_. If true, returns a stringified JSON object containing traces and layout.
 * Else, returns a div element containing the Plotly graph.
 * @param {object} [customLayout={}] _Optional_. Contains Plotly supported layout key-values pair that will overwrite the default layout. Commonly overwritten values may include height and width of the graph. See: https://plotly.com/javascript/reference/layout/ for more details. Also, set `to_json` to true to see what the default layout is.
 * @param {object} [customConfig={}] _Optional_. Contains Plotly supported config key-values pair that will overwrite the default config. See: https://github.com/plotly/plotly.js/blob/master/src/plot_api/plot_config.js#L22-L86 for full details.
 * @returns A div element or a string if `to_json` is true.
 * @example
 * await plco.plot.pca2('plot', [{phenotype_id: 3080, sex: 'female', ancestry: 'east_asian'}, {phenotype_id: 3080, sex: 'female', ancestry: 'european'}])
 */
plco.plot.pca2 = async (
    div_id,
    arrayOfObjects,
    to_json = false,
    customLayout = {},
    customConfig = {}
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
        },
        ...customLayout,
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
        ],
        ...customConfig,
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

plco.plot.helpers.validateInputs = async (
    arrayOfObjects = []
) => {
    const promises = []
    arrayOfObjects.forEach(({ phenotype_id, sex, ancestry }) => {
        if (phenotype_id && sex && ancestry) {
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
        }
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
    const colors = [['#FF626F', '#B2444D'], ['#FFD5A6', '#CCAA84'],
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
        try {
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
                    opacity: 0.35
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
        }
        catch (_) {
            console.error('PC_X and PC_Y cannot be equal.')
        }
    })

    return otherTraces.concat(traces)
}

plco.plot.helpers.pcaHelper = async (
    arrayOfObjects,
    platform,
    pc_x,
    pc_y
) => {
    const metadatas = await plco.plot.helpers.validateInputs(arrayOfObjects)
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
    const metadatas = await plco.plot.helpers.validateInputs(validArray)

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

    async function eventListener() {
        const xVal = Number.parseFloat(xSelector.value)
        const yVal = Number.parseFloat(ySelector.value)

        const traces = await plco.plot.helpers.pcaHelper(arrayOfObjects, 'PLCO_GSA', xVal, yVal)
        const dropdownLayout = await plco.plot.helpers.pcaCreateDropdownLayout(arrayOfObjects, xVal, yVal)
        Plotly.newPlot(div_id, traces, Object.assign({
            ...layout,
            xaxis: { ...layout.xaxis, title: { text: `<b>PC-X ${(xVal || '2')}</b>` } },
            yaxis: { ...layout.yaxis, title: { text: `<b>PC-Y ${(yVal || '2')}</b>` } },
        }, dropdownLayout), config)
    }

    xSelector.addEventListener('change', eventListener, false)
    ySelector.addEventListener('change', eventListener, false)

    const div = document.getElementById(div_id)
    div.appendChild(xLabel)
    div.appendChild(xSelector)
    div.appendChild(yLabel)
    div.appendChild(ySelector)
}

plco()

if (typeof (define) != 'undefined') {
    define(plco())
}
