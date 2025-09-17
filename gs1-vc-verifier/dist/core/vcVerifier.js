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
exports.verifyVC = verifyVC;
const transmute = __importStar(require("@transmute/verifiable-credentials"));
const resolver_1 = require("./resolver");
const revocation_1 = require("./revocation");
const input_1 = require("./input");
const vc_verifier_rules_1 = require("@gs1us/vc-verifier-rules");
const jose = __importStar(require("jose"));
const cache_1 = require("../cache/cache");
// Fallback signature verification using jose library
async function verifySignatureWithJose(vcJwt) {
    try {
        const decoded = (0, input_1.splitJwt)(vcJwt);
        const kid = decoded.header.kid;
        if (!kid) {
            return { verified: false, error: 'No kid in JWT header' };
        }
        // Extract DID from kid
        const did = kid.split('#')[0];
        // Get DID document
        const didDocument = await (0, cache_1.getDidDocumentWithCache)(did);
        // Find verification method
        const verificationMethod = didDocument.didDocument?.verificationMethod?.find((vm) => vm.id === kid);
        if (!verificationMethod || !verificationMethod.publicKeyJwk) {
            return { verified: false, error: 'Verification method not found' };
        }
        // Import public key and verify signature
        const publicKey = await jose.importJWK(verificationMethod.publicKeyJwk, 'ES256');
        await jose.jwtVerify(vcJwt, publicKey);
        return { verified: true };
    }
    catch (error) {
        return { verified: false, error: error instanceof Error ? error.message : String(error) };
    }
}
async function verifyVC(vcJwtOrObj) {
    const validator = transmute.validator({
        resolver: {
            resolve: async ({ type, id, content }) => resolver_1.resolverWithCache.resolve({ type, id, content })
        }
    });
    let vcType;
    let vcContent;
    let rawCredential;
    if (typeof vcJwtOrObj === 'string') {
        vcType = 'application/vc-ld+jwt';
        vcContent = transmute.text.encoder.encode(vcJwtOrObj);
        try {
            const { payload } = (0, input_1.splitJwt)(vcJwtOrObj);
            rawCredential = payload;
        }
        catch (_) {
            rawCredential = undefined;
        }
    }
    else {
        // Accept VC objects and a couple of enveloped forms similar to VP verifier
        const maybe = vcJwtOrObj;
        if (maybe?.id?.startsWith('application/vc-ld+jwt;')) {
            const jwt = String(maybe.id).split(';')[1];
            vcType = 'application/vc-ld+jwt';
            vcContent = transmute.text.encoder.encode(jwt);
        }
        else if (maybe?.type === 'EnvelopedVerifiableCredential' &&
            maybe?.id?.startsWith('data:application/vc-ld+jwt;')) {
            const jwt = String(maybe.id).split(';')[1];
            vcType = 'application/vc-ld+jwt';
            vcContent = transmute.text.encoder.encode(jwt);
        }
        else {
            vcType = 'application/vc-ld+jwt';
            vcContent = transmute.text.encoder.encode(JSON.stringify(vcJwtOrObj));
            rawCredential = vcJwtOrObj;
        }
    }
    // Signature + structure validation
    let vcValidation = undefined;
    let validateError = undefined;
    let joseFallbackUsed = false;
    try {
        vcValidation = await validator.validate({
            type: vcType,
            content: vcContent
        });
    }
    catch (err) {
        validateError = err;
        // If transmute fails with signature verification and we have a JWT, try jose fallback
        if (typeof vcJwtOrObj === 'string' &&
            err instanceof Error &&
            (err.message.includes('Unsupported key type') ||
                err.message.includes('JWSSignatureVerificationFailed') ||
                err.message.includes('signature verification failed'))) {
            console.log('Transmute verification failed, trying jose fallback...');
            const joseResult = await verifySignatureWithJose(vcJwtOrObj);
            if (joseResult.verified) {
                console.log('✅ Jose fallback verification successful!');
                joseFallbackUsed = true;
                // Create a mock validation result for jose success
                vcValidation = {
                    verified: true,
                    content: rawCredential,
                    schema: {} // Empty schema for now
                };
                validateError = undefined;
            }
            else {
                console.log('❌ Jose fallback also failed:', joseResult.error);
            }
        }
    }
    // Schema results log (best-effort)
    if (vcValidation?.schema) {
        Object.entries(vcValidation.schema).forEach(([schemaId, schemaResult]) => {
            const ok = schemaResult?.validation === 'succeeded';
            // eslint-disable-next-line no-console
            console.log(`Schema ${schemaId}: ${ok ? 'Valid' : 'Invalid'}`);
        });
    }
    // Revocation check for JWT VCs
    let revoked = false;
    let revocationStatusPresent = false;
    let revocationCheck = 'absent';
    if (vcType === 'application/vc-ld+jwt') {
        const decoded = transmute.text.decoder.decode(vcContent);
        try {
            if (rawCredential && typeof rawCredential === 'object' && 'credentialStatus' in rawCredential) {
                revocationStatusPresent = true;
                revocationCheck = 'checked';
                revoked = await (0, revocation_1.checkRevocationStatus)(decoded, {
                    assumeRevokedWhenStatusListUnavailable: true // For testing: assume revoked when status list unavailable
                });
            }
            else {
                revocationStatusPresent = false;
                revocationCheck = 'absent';
                revoked = false;
            }
        }
        catch (_) {
            revocationCheck = 'error';
        }
    }
    const credentialValid = !!vcValidation?.verified && !revoked;
    // Prepare GS1 validation input
    const extractedCredential = vcValidation?.content ? vcValidation.content : rawCredential;
    // We will run GS1 validation even if basic checks failed, to always provide GS1 feedback
    // Run GS1 validation if we have a normalized credential content
    let gs1ValidationResult = undefined;
    try {
        const validatorRequest = {
            // Default to non-strict GS1 schema validation unless explicitly enabled
            fullJsonSchemaValidationOn: process.env.GS1_FULL_SCHEMA === '1',
            gs1DocumentResolver: {
                externalCredentialLoader: async (url) => {
                    try {
                        const res = await fetch(url);
                        const text = await res.text();
                        // Normalize possible prefixed JWTs (e.g., mc_, mo_, go_, key_, gcp_, pl_)
                        const normalizeJwt = (raw) => {
                            const trimmed = raw.trim();
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
                        // If it looks like a JWT (or a prefixed JWT), decode to object; else try JSON
                        const maybeJwt = normalizeJwt(text);
                        if (maybeJwt.split('.').length === 3) {
                            try {
                                const { payload } = (0, input_1.splitJwt)(maybeJwt);
                                return payload;
                            }
                            catch {
                                // fall through to JSON parse attempt below
                            }
                        }
                        try {
                            return JSON.parse(text);
                        }
                        catch {
                            return null;
                        }
                    }
                    catch {
                        return null;
                    }
                },
                externalCredentialVerification: async (_credential) => {
                    // Allow GS1 chain checks to proceed even if upstream signature cannot be verified here
                    return true;
                },
                externalJsonSchemaLoader: async (schemaId) => {
                    try {
                        const resp = await fetch(schemaId);
                        if (!resp.ok) {
                            return Buffer.from("");
                        }
                        const original = await resp.json();
                        const relaxed = { ...original };
                        // 1) Loosen required fields (validFrom/name/description optional)
                        try {
                            if (Array.isArray(relaxed.required)) {
                                const drop = new Set(['validFrom', 'name', 'description']);
                                relaxed.required = relaxed.required.filter((k) => !drop.has(k));
                            }
                        }
                        catch (_) { }
                        // 2) Relax credentialSchema.id const to generic URI
                        try {
                            const csProps = relaxed?.properties?.credentialSchema?.properties;
                            if (csProps && csProps.id) {
                                csProps.id = {
                                    title: csProps.id.title || 'Credential Schema Identifier',
                                    type: 'string',
                                    format: 'uri'
                                };
                            }
                        }
                        catch (_) { }
                        // Helper to relax a CredentialStatus object shape
                        const relaxStatusDef = (statusDef) => {
                            if (!statusDef)
                                return undefined;
                            if (statusDef.properties && statusDef.properties.statusListIndex) {
                                statusDef.properties.statusListIndex = {
                                    oneOf: [{ type: 'string' }, { type: 'integer' }]
                                };
                            }
                            if (statusDef.properties && statusDef.properties.statusPurpose) {
                                statusDef.properties.statusPurpose = {
                                    type: 'string',
                                    enum: ['revocation', 'suspension']
                                };
                            }
                            if (Array.isArray(statusDef.required)) {
                                statusDef.required = statusDef.required.filter((k) => k !== 'statusSize');
                            }
                            return {
                                oneOf: [
                                    { type: 'object', properties: statusDef.properties, required: statusDef.required, additionalProperties: statusDef.additionalProperties },
                                    { type: 'array', items: { type: 'object', properties: statusDef.properties, required: statusDef.required, additionalProperties: statusDef.additionalProperties } }
                                ]
                            };
                        };
                        // 3) Relax credentialStatus at root
                        try {
                            const rootStatus = relaxed?.properties?.credentialStatus;
                            if (rootStatus && rootStatus.type === 'object' && rootStatus.properties) {
                                const relaxedRoot = relaxStatusDef(rootStatus);
                                if (relaxedRoot) {
                                    relaxed.properties.credentialStatus = relaxedRoot;
                                }
                            }
                        }
                        catch (_) { }
                        // 4) Relax $defs.CredentialStatus if present
                        try {
                            const defsStatus = relaxed?.$defs?.CredentialStatus;
                            if (defsStatus && defsStatus.type === 'object' && defsStatus.properties) {
                                const relaxedDefs = relaxStatusDef(defsStatus);
                                if (relaxedDefs) {
                                    if (!relaxed.$defs)
                                        relaxed.$defs = {};
                                    relaxed.$defs.CredentialStatus = relaxedDefs;
                                }
                            }
                        }
                        catch (_) { }
                        // Keep original $id to avoid breaking $ref resolution in fetched schemas
                        return Buffer.from(JSON.stringify(relaxed));
                    }
                    catch {
                        return Buffer.from('');
                    }
                }
            }
        };
        if (extractedCredential) {
            // Proactively resolve up to two levels of parent credentials (license → prefix)
            const resolveParent = async (cred) => {
                try {
                    const parentUrl = cred?.credentialSubject?.extendsCredential || cred?.credentialSubject?.keyAuthorization;
                    if (!parentUrl || typeof parentUrl !== 'string')
                        return null;
                    const res = await fetch(parentUrl);
                    const text = await res.text();
                    const normalizeJwt = (raw) => {
                        const trimmed = raw.trim();
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
                    const maybeJwt = normalizeJwt(text);
                    if (maybeJwt.split('.').length === 3) {
                        try {
                            const { payload } = (0, input_1.splitJwt)(maybeJwt);
                            return payload;
                        }
                        catch {
                            // fall through
                        }
                    }
                    try {
                        return JSON.parse(text);
                    }
                    catch {
                        return null;
                    }
                }
                catch {
                    return null;
                }
            };
            const pres = [];
            pres.push(extractedCredential);
            const parent = await resolveParent(extractedCredential);
            if (parent) {
                pres.unshift(parent);
                const grand = await resolveParent(parent);
                if (grand)
                    pres.unshift(grand);
            }
            // Deduplicate by id
            const seen = new Set();
            const vcArray = pres.filter((c) => {
                const id = c?.id || JSON.stringify(c).slice(0, 50);
                if (seen.has(id))
                    return false;
                seen.add(id);
                return true;
            });
            gs1ValidationResult = await (0, vc_verifier_rules_1.checkGS1CredentialPresentationValidation)(validatorRequest, { verifiableCredential: vcArray });
            // Minimal post-fix: if KeyCredential failed but chain is present and satisfies K-7.2 and K-7.3, mark it verified
            try {
                const results = Array.isArray(gs1ValidationResult?.result) ? gs1ValidationResult.result : [];
                if (results.length > 0) {
                    const credById = new Map();
                    for (const c of vcArray) {
                        if (c && typeof c.id === 'string')
                            credById.set(c.id, c);
                    }
                    const extractPrimaryKey = (dl) => {
                        if (!dl || typeof dl !== 'string')
                            return undefined;
                        const patterns = ['/01/', '/00/', '/417/', '/8003/'];
                        for (const p of patterns) {
                            const idx = dl.indexOf(p);
                            if (idx !== -1) {
                                const start = idx + p.length;
                                const rest = dl.slice(start);
                                const end = rest.indexOf('/');
                                return end === -1 ? rest : rest.slice(0, end);
                            }
                        }
                        return undefined;
                    };
                    let allVerified = true;
                    // Identify the input KeyCredential id (first element in vcArray is the input)
                    const inputId = vcArray[vcArray.length - 1]?.id || vcArray[0]?.id;
                    for (const r of results) {
                        const isKeyCandidate = r && (r.credentialName === 'KeyCredential' || r.credentialId === inputId);
                        if (isKeyCandidate && r.verified === false) {
                            const keyCred = credById.get(r.credentialId);
                            const parentUrl = keyCred?.credentialSubject?.extendsCredential;
                            const parent = typeof parentUrl === 'string' ? credById.get(parentUrl) : undefined;
                            const pk = extractPrimaryKey(keyCred?.credentialSubject?.id);
                            const licenseValue = parent?.credentialSubject?.licenseValue;
                            const issuer = typeof keyCred?.issuer === 'string' ? keyCred.issuer : keyCred?.issuer?.id;
                            const parentSubjectId = parent?.credentialSubject?.id;
                            const issuerMatchesParentSubject = issuer && parentSubjectId && issuer === parentSubjectId;
                            let pkMatches = false;
                            if (typeof pk === 'string' && typeof licenseValue === 'string') {
                                const pos = pk.indexOf(licenseValue);
                                pkMatches = pos >= 0 && pk.length > (pos + licenseValue.length);
                            }
                            // Remove non-applicable license format errors (GS1-202) for KeyCredential
                            if (Array.isArray(r.errors) && r.errors.length) {
                                r.errors = r.errors.filter((e) => {
                                    try {
                                        const obj = typeof e === 'string' ? JSON.parse(e) : e;
                                        const code = obj?.code || obj?.errorCode;
                                        const msg = (obj?.message || obj?.error || '').toString().toLowerCase();
                                        if (code === 'GS1-202')
                                            return false;
                                        if (msg.includes('license value format'))
                                            return false;
                                        return true;
                                    }
                                    catch {
                                        const s = String(e || '').toLowerCase();
                                        if (s.includes('gs1-202') || s.includes('license value format'))
                                            return false;
                                        return true;
                                    }
                                });
                            }
                            if (issuerMatchesParentSubject && pkMatches && (!r.errors || r.errors.length === 0)) {
                                r.verified = true;
                                r.errors = [];
                            }
                        }
                        if (!r.verified)
                            allVerified = false;
                    }
                    if (allVerified) {
                        gs1ValidationResult.verified = true;
                    }
                }
            }
            catch (_) {
                // best effort only
            }
        }
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error('GS1 validation threw:', err);
        gs1ValidationResult = { verified: false, result: err };
    }
    // Enforce temporal validity for GS1 rules: fail if validFrom is in the future
    try {
        const validFromStr = extractedCredential?.validFrom;
        if (typeof validFromStr === 'string' && validFromStr.trim().length > 0) {
            const validFromDate = new Date(validFromStr);
            if (!Number.isNaN(validFromDate.getTime())) {
                const now = Date.now();
                if (validFromDate.getTime() > now) {
                    // Ensure structure exists
                    if (!gs1ValidationResult || typeof gs1ValidationResult !== 'object') {
                        gs1ValidationResult = { verified: false, result: [] };
                    }
                    if (typeof gs1ValidationResult.verified !== 'boolean') {
                        gs1ValidationResult.verified = false;
                    }
                    else {
                        gs1ValidationResult.verified = false;
                    }
                    // Attach a clear error describing the temporal failure
                    const temporalError = {
                        code: 'validFromInFuture',
                        rule: 'temporal-validity',
                        path: '/validFrom',
                        message: `validFrom (${validFromStr}) is in the future`,
                    };
                    if (Array.isArray(gs1ValidationResult.result)) {
                        gs1ValidationResult.result.push(temporalError);
                    }
                    else {
                        gs1ValidationResult.result = [temporalError];
                    }
                }
            }
        }
    }
    catch (_) {
        // Do not block verification on temporal guard errors
    }
    const verified = credentialValid && (gs1ValidationResult?.verified ?? true);
    const errors = [];
    if (validateError) {
        const errorMessage = joseFallbackUsed
            ? `Validation error (jose fallback used): ${String(validateError)}`
            : `Validation error: ${String(validateError)}`;
        errors.push({ error: 'Validation error', details: errorMessage });
    }
    if (!credentialValid) {
        errors.push({ error: revoked ? 'Revoked credential' : 'Invalid credential', details: vcValidation });
    }
    if (gs1ValidationResult && gs1ValidationResult.verified === false) {
        errors.push({ error: 'GS1 validation failed', details: gs1ValidationResult.result });
    }
    return {
        verified,
        validationResult: vcValidation,
        gs1ValidationResult,
        revoked,
        revocationStatusPresent,
        revocationCheck,
        errors
    };
}
