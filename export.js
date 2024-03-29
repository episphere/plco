function hello() {
    return `hello at ${Date()}`;
};

async function loadScript(url) {
    let load = new Promise((resolve, reject) => {
        let s = document.createElement('script')
        s.src = url
        s.onload = resolve
        document.head.appendChild(s)
    })
    return load
}

await loadScript('https://episphere.github.io/plco/plco.js')

function defineProperties() { return plco.defineProperties };
function explorePhenotypes() { return plco.explorePhenotypes };
function saveFile() { return plco.saveFile };
function api() { return plco.api };api=api()
function plot() { return plco.plot };plot=plot()
const help = 'https://episphere.github.io/plco';
const docs = 'https://episphere.github.io/plco/docs';

export {
    help,
    docs,
    api,
    plot,
    loadScript,
    defineProperties,
    explorePhenotypes,
    saveFile
};



