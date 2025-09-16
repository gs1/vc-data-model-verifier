import { Resolver } from "did-resolver";
import { getResolver } from "web-did-resolver";
const didcache  = new Map<string,any>();

export async function getDidDocumentWithCache(did:string){
    if(didcache.has(did)){
      console.log(`Cache HIT for DID: ${did}`);
      return didcache.get(did);
    }
    console.log(`Cache MISS for DID: ${did}`);
    const webResolver = getResolver();
    const resolver = new Resolver({ ...webResolver });
    const didDocument = await resolver.resolve(did);
    didcache.set(did,didDocument);
    console.log(`Cached DID: ${did}`);
    return didDocument;
}

export async function getDidDocumentDirect(did: string) {
    const webResolver = getResolver();
    const resolver = new Resolver({ ...webResolver });
    return resolver.resolve(did);
}

