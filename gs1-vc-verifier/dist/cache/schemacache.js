"use strict";
const schemacache = new Map();
const statusListCache = new Map();
async function fetchschemafromCache(url, cache) {
    if (cache.has(url))
        return cache.get(url);
    const response = await fetch(url);
    const data = response.json();
    cache.set(url, data);
    return data;
}
