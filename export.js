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

function plco() { return plco };
function api() { return plco.api };
function plot() { return plco.plot };

export {
    hello,
    loadScript,
    plco as plcoModule,
    api,
    plot
};
