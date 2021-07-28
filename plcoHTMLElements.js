(async function () {
    custom = {
        loadScript: url => new Promise(function (resolve, reject) {
            let s = document.createElement('script')
            s.src = url
            s.onload = resolve
            document.head.appendChild(s)
        })
    }

    if (typeof plco === 'undefined') {
        await custom.loadScript('https://episphere.github.io/plco/plco.js')
    }

    custom.timeout = () => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(this)
            }, 1000)
        })
    }

    custom.ids = {
    }

    custom.generateId = () => {
        return [0, 1, 2, 3].map(_ => Math.round(Math.random() * 10)).join('')
    }

    custom.parse = (string) => {
        return string.split(';').reduce((total, cur) => {
            if (cur.includes(':'))
                total[cur.split(':')[0].trim()] = cur.split(':')[1].trim()
            return total
        }, {})
    }

    custom.listParse = (string) => {
        // '[{id: 3080, sex: male}; {id:3080, sex:female}]'
        return string.trim().substring(1, string.trim().length - 1).split(';').reduce((total, cur) => {
            return total.concat(cur.trim().substring(1, cur.trim().length - 1).split(',').reduce((whole, part) => {
                if (part.includes(':'))
                    whole[part.split(':')[0].trim()] = part.split(':')[1].trim()
                return whole
            }, {}))
        }, [])
    }

    custom.plot = class Plot extends HTMLElement {
        constructor () {
            super()
            if (this.hasAttribute('data-inputs'))
                this.arrayOfObjects = custom.listParse(this.getAttribute('data-inputs'))
            else
                this.arrayOfObjects = [{ phenotype_id: 3080, sex: 'female', ancestry: 'east_asian' }, { phenotype_id: 3080, sex: 'female', ancestry: 'european' }]

            if (this.hasAttribute('custom-layout'))
                this.customLayout = custom.parse(this.getAttribute('custom-layout'))

            if (this.hasAttribute('custom-config'))
                this.customConfig = custom.parse(this.getAttribute('custom-config'))
        }

        async connectedCallback() {
            try {
                await custom.timeout()
                let id = custom.generateId()
                while (id in custom.ids) {
                    id = custom.generateId()
                }
                custom.ids[id] = id

                const div = document.createElement('div')
                div.id = id
                this.appendChild(div)

                return id
            } catch (e) {
                console.error(e)
            }
        }
    }

    custom.manhattan = class ManhattanPlot extends custom.plot {
        constructor () {
            super()
            if (this.hasAttribute('p-val-nlog-min'))
                this.p_val = Number.parseInt(this.getAttribute('p-val-nlog-min'))

            if (this.hasAttribute('chromosome'))
                this.chromosome = Number.parseInt(this.getAttribute('chromosome'))
        }

        async connectedCallback() {
            try {
                let id = await super.connectedCallback()
                if (this.arrayOfObjects.length === 1) {
                    const { phenotype_id = 3080, sex = 'female', ancestry = 'east_asian' } = this.arrayOfObjects[0]
                    await plco.plot.manhattan(id, phenotype_id, sex, ancestry, p_val, chromosome, false, this.customLayout, this.customConfig)
                } else
                    await plco.plot.manhattan2(id, this.arrayOfObjects, this.p_val, this.chromosome, false, this.customLayout, this.customConfig)
            } catch (e) {
                console.error(e)
            }
        }
    }

    custom.qq = class QQPlot extends custom.plot {
        async connectedCallback() {
            try {
                let id = await super.connectedCallback()
                if (this.arrayOfObjects.length === 1) {
                    const { phenotype_id = 3080, sex = 'female', ancestry = 'east_asian' } = this.arrayOfObjects[0]
                    await plco.plot.qq(id, phenotype_id, sex, ancestry, false, this.customLayout, this.customConfig)
                } else
                    await plco.plot.qq2(id, this.arrayOfObjects, false, this.customLayout, this.customConfig)
            } catch (e) {
                console.error(e)
            }
        }
    }

    custom.pca = class PCAPlot extends custom.plot {
        async connectedCallback() {
            try {
                let id = await super.connectedCallback()
                if (this.arrayOfObjects.length === 1) {
                    const { phenotype_id = 3080, sex = 'female', ancestry = 'east_asian' } = this.arrayOfObjects[0]
                    await plco.plot.pca(id, phenotype_id, sex, ancestry, false, this.customLayout, this.customConfig)
                } else
                    await plco.plot.pca2(id, this.arrayOfObjects, false, this.customLayout, this.customConfig)
            } catch (e) {
                console.error(e)
            }
        }
    }

    customElements.define('manhattan-plot', custom.manhattan)
    customElements.define('qq-plot', custom.qq)
    customElements.define('pca-plot', custom.pca)
})()
