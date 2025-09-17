
const schemacache = new Map<string,any>();
const statusListCache = new Map<string,string>();

async function fetchschemafromCache(url:string,cache:Map<string,any>){
    if(cache.has(url))return cache.get(url);
    const response = await fetch(url);
    const data = response.json();
    cache.set(url,data);
    return data;
}