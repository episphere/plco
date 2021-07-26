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

    custom.manhattan = class ManhattanPlot extends HTMLElement {
        constructor () {
            super()
            if (this.hasAttribute('data-inputs'))
                this.arrayOfObjects = JSON.parse(this.getAttribute('data-inputs'))
            else
                this.arrayOfObjects = [{ phenotype_id: 3080, sex: 'female', ancestry: 'east_asian' }, { phenotype_id: 3080, sex: 'female', ancestry: 'european' }]

            if (this.hasAttribute('p-val-nlog-min'))
                this.p_val = this.getAttribute('p-val-nlog-min')

            if (this.hasAttribute('chromosome'))
                this.chromosome = this.getAttribute('chromosome')

            if (this.hasAttribute('custom-layout'))
                this.customLayout = JSON.parse(this.getAttribute('custom-layout'))

            if (this.hasAttribute('custom-config'))
                this.customConfig = JSON.parse(this.getAttribute('custom-config'))
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

    customElements.define('manhattan-plot', custom.manhattan)
})()