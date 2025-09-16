"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDidDocumentWithCache = getDidDocumentWithCache;
exports.getDidDocumentDirect = getDidDocumentDirect;
const did_resolver_1 = require("did-resolver");
const web_did_resolver_1 = require("web-did-resolver");
const didcache = new Map();
async function getDidDocumentWithCache(did) {
    if (didcache.has(did)) {
        console.log(`Cache HIT for DID: ${did}`);
        return didcache.get(did);
    }
    console.log(`Cache MISS for DID: ${did}`);
    const webResolver = (0, web_did_resolver_1.getResolver)();
    const resolver = new did_resolver_1.Resolver({ ...webResolver });
    const didDocument = await resolver.resolve(did);
    didcache.set(did, didDocument);
    console.log(`Cached DID: ${did}`);
    return didDocument;
}
async function getDidDocumentDirect(did) {
    const webResolver = (0, web_did_resolver_1.getResolver)();
    const resolver = new did_resolver_1.Resolver({ ...webResolver });
    return resolver.resolve(did);
}
