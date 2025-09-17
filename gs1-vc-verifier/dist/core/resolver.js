"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolverNoCache = exports.resolverWithCache = void 0;
exports.createResolver = createResolver;
const transmute = __importStar(require("@transmute/verifiable-credentials"));
const input_1 = require("./input");
const cache_1 = require("../cache/cache");
function createResolver(fetchDidDocument) {
    return {
        resolve: async (req) => {
            const { id, type, content } = req;
            console.log('Resolver request:', { id, type, hasContent: !!content });
            if (content && (type === "application/vc-ld+jwt" || type === "application/vp-ld+jwt")) {
                try {
                    const jwt = transmute.text.decoder.decode(content);
                    const { header } = (0, input_1.splitJwt)(jwt);
                    console.log('JWT kid in resolver:', header.kid);
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    console.log('Error parsing JWT in resolver:', errorMessage);
                    console.log('Content preview:', transmute.text.decoder.decode(content).substring(0, 100));
                }
            }
            // Handle VP JWT signature verification
            if ((type === "application/vp-ld+jwt" || type === "application/vc-ld+jwt") && content) {
                try {
                    const jwt = transmute.text.decoder.decode(content);
                    const { header, payload } = (0, input_1.splitJwt)(jwt);
                    const kid = header.kid;
                    // Try to extract DID from kid first (existing flow)
                    let did = kid.split("#")[0];
                    let didDocument;
                    let verificationMethod;
                    try {
                        // Check if kid contains a valid DID format
                        if (did.startsWith('did:')) {
                            console.log(`Using DID from kid: ${did}`);
                            didDocument = await fetchDidDocument(did);
                            verificationMethod = didDocument.didDocument?.verificationMethod?.find((vm) => vm.id === kid);
                        }
                        else {
                            throw new Error(`Invalid DID format in kid: ${did}`);
                        }
                    }
                    catch (error) {
                        console.log(`Failed to resolve DID from kid: ${did}, trying issuer fallback`);
                        // Fallback: Extract DID from issuer field in payload
                        if (payload.issuer && payload.issuer.id && payload.issuer.id.startsWith('did:')) {
                            did = payload.issuer.id;
                            console.log(`Using issuer DID as fallback: ${did}`);
                            try {
                                didDocument = await fetchDidDocument(did);
                                console.log(`Available verification methods in DID ${did}:`);
                                didDocument.didDocument?.verificationMethod?.forEach((vm, index) => {
                                    console.log(`${index + 1}. ID: ${vm.id}, Kid: ${vm.publicKeyJwk?.kid || 'N/A'}`);
                                });
                                // Only use verification method that matches the exact kid from header
                                verificationMethod = didDocument.didDocument?.verificationMethod?.find((vm) => vm.id === kid);
                                if (!verificationMethod) {
                                    console.log(`No verification method found with id '${kid}'`);
                                    console.log(`Looking for verification method with publicKeyJwk.kid '${kid}'`);
                                    verificationMethod = didDocument.didDocument?.verificationMethod?.find((vm) => vm.publicKeyJwk?.kid === kid);
                                }
                                if (!verificationMethod) {
                                    throw new Error(`No verification method found with kid '${kid}' in issuer DID: ${did}`);
                                }
                            }
                            catch (issuerError) {
                                const errorMessage = issuerError instanceof Error ? issuerError.message : String(issuerError);
                                throw new Error(`Failed to resolve both kid DID and issuer DID. Kid: ${kid}, Issuer: ${did}, Error: ${errorMessage}`);
                            }
                        }
                        else {
                            throw new Error(`No valid DID found in kid (${kid}) or issuer field (${payload.issuer?.id || 'missing'})`);
                        }
                    }
                    if (!verificationMethod?.publicKeyJwk) {
                        throw new Error(`No matching verification method found for kid: ${kid} in DID: ${did}`);
                    }
                    console.log(`Found verification method: ${verificationMethod.id}`);
                    console.log(`Public key JWK:`, JSON.stringify(verificationMethod.publicKeyJwk, null, 2));
                    return {
                        type: "application/jwk+json",
                        content: new TextEncoder().encode(JSON.stringify(verificationMethod.publicKeyJwk))
                    };
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    console.log('Error in JWT signature verification:', errorMessage);
                    throw new Error(`JWT signature verification failed: ${errorMessage}`);
                }
            }
            // Handle schema requests (fetch and optionally relax constraints per product requirements)
            if (type === "application/schema+json" && id) {
                console.log(`Schema request for: ${id}`);
                try {
                    let schemaUrl = id;
                    try {
                        const u = new URL(id);
                        u.searchParams.set('cb', Date.now().toString());
                        schemaUrl = u.toString();
                    }
                    catch (_) { }
                    const schemaResponse = await fetch(schemaUrl);
                    const originalSchema = await schemaResponse.json();
                    // Apply relaxations for GS1 schemas without altering the upstream source:
                    // - Make validFrom optional (and name/description when present)
                    // - Allow credentialSchema.id to be any URI (drop const)
                    // - Allow credentialStatus to be either an object or an array of objects
                    // - Allow statusListIndex to be string or integer
                    // - Allow statusPurpose to be either "revocation" or "suspension"
                    // - Map gs1.github.io schema $id to id.gs1.org canonical IDs for display
                    const relaxed = { ...originalSchema };
                    try {
                        // Do not change $id to avoid breaking internal $ref resolution
                        // 1) Loosen required fields
                        if (Array.isArray(relaxed.required)) {
                            const drop = new Set(['validFrom', 'name', 'description']);
                            relaxed.required = relaxed.required.filter((k) => !drop.has(k));
                        }
                        // 2) Relax credentialSchema.id const
                        const csProps = relaxed?.properties?.credentialSchema?.properties;
                        if (csProps && csProps.id) {
                            // Replace strict const with a general URI string rule
                            csProps.id = {
                                title: csProps.id.title || 'Credential Schema Identifier',
                                type: 'string',
                                format: 'uri'
                            };
                        }
                        // Helper to relax a CredentialStatus definition object in-place
                        const relaxStatusDef = (statusDef) => {
                            if (!statusDef)
                                return;
                            // Allow numeric or string index
                            if (statusDef.properties && statusDef.properties.statusListIndex) {
                                statusDef.properties.statusListIndex = {
                                    oneOf: [{ type: 'string' }, { type: 'integer' }]
                                };
                            }
                            // Allow suspension in addition to revocation
                            if (statusDef.properties && statusDef.properties.statusPurpose) {
                                statusDef.properties.statusPurpose = {
                                    type: 'string',
                                    enum: ['revocation', 'suspension']
                                };
                            }
                            // Drop statusSize from required if present
                            if (Array.isArray(statusDef.required)) {
                                statusDef.required = statusDef.required.filter((k) => k !== 'statusSize');
                            }
                            // Build a union allowing object or array of objects
                            return {
                                oneOf: [
                                    { type: 'object', properties: statusDef.properties, required: statusDef.required, additionalProperties: statusDef.additionalProperties },
                                    { type: 'array', items: { type: 'object', properties: statusDef.properties, required: statusDef.required, additionalProperties: statusDef.additionalProperties } }
                                ]
                            };
                        };
                        // 3) Relax credentialStatus at root properties (most GS1 schemas)
                        const rootStatus = relaxed?.properties?.credentialStatus;
                        if (rootStatus && rootStatus.type === 'object' && rootStatus.properties) {
                            const relaxedRoot = relaxStatusDef(rootStatus);
                            if (relaxedRoot) {
                                relaxed.properties.credentialStatus = relaxedRoot;
                            }
                        }
                        // 4) Relax $defs.CredentialStatus, if present (some schemas)
                        const defsStatus = relaxed?.$defs?.CredentialStatus;
                        if (defsStatus && defsStatus.type === 'object' && defsStatus.properties) {
                            const relaxedDefs = relaxStatusDef(defsStatus);
                            if (relaxedDefs) {
                                relaxed.$defs.CredentialStatus = relaxedDefs;
                            }
                        }
                        console.log('Applied relaxed GS1 schema rules');
                    }
                    catch (_) {
                        // If structure differs, return original schema
                    }
                    return {
                        type: "application/schema+json",
                        content: new TextEncoder().encode(JSON.stringify(relaxed))
                    };
                }
                catch (e) {
                    // Fallback to permissive schema if fetch fails
                    return {
                        type: "application/schema+json",
                        content: new TextEncoder().encode(JSON.stringify({
                            "$schema": "https://json-schema.org/draft/2020-12/schema",
                            "type": "object",
                            "properties": {},
                            "additionalProperties": true
                        }))
                    };
                }
            }
            // Removed mock status-list response. Real status list handling is below.
            // Handle direct JWK requests (e.g., from VC verification)
            if (type === "application/jwk+json" && id) {
                const did = id.split("#")[0];
                const didDocument = await fetchDidDocument(did);
                const verificationMethod = didDocument.didDocument?.verificationMethod?.find((vm) => vm.id === id);
                if (!verificationMethod?.publicKeyJwk) {
                    throw new Error(`No matching verification method found for id: ${id}`);
                }
                return {
                    type: "application/jwk+json",
                    content: new TextEncoder().encode(JSON.stringify(verificationMethod.publicKeyJwk))
                };
            }
            // (schema handling above)
            // Handle status list checks
            if ((type === "application/vc-ld+jwt" || type === "application/vp-ld+jwt") && id && !content) {
                const resp = await fetch(id);
                const raw = await resp.text();
                const normalizeJwt = (rawIn) => {
                    const trimmed = rawIn.trim();
                    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
                    if (jwtRegex.test(trimmed))
                        return trimmed;
                    const us = trimmed.indexOf('_');
                    if (us > -1) {
                        const candidate = trimmed.slice(us + 1);
                        if (jwtRegex.test(candidate))
                            return candidate;
                    }
                    return trimmed;
                };
                const normalized = normalizeJwt(raw);
                return {
                    type: "application/vc-ld+jwt",
                    content: new TextEncoder().encode(normalized)
                };
            }
            throw new Error(`Unsupported type or missing parameters. Received: type=${type}, id=${id}, hasContent=${!!content}`);
        }
    };
}
exports.resolverWithCache = createResolver(cache_1.getDidDocumentWithCache);
exports.resolverNoCache = createResolver(cache_1.getDidDocumentDirect);
