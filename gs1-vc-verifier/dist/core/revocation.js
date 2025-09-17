"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRevocationStatus = checkRevocationStatus;
const Bitstring_1 = require("../utils/statusList/Bitstring");
/**
 * Decode JWT payload without signature verification
 */
function decodeJwtPayload(jwt) {
    try {
        const parts = jwt.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
        }
        // Decode header
        const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
        // Decode payload
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        return { header, payload };
    }
    catch (error) {
        throw new Error(`Failed to decode JWT: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Fetch content from URL
 */
async function fetchFromUrl(url) {
    try {
        // Add cache-buster to avoid stale status list responses in some proxies
        let cacheBustedUrl = url;
        try {
            const u = new URL(url);
            u.searchParams.set('cb', Date.now().toString());
            cacheBustedUrl = u.toString();
        }
        catch (_) { }
        const response = await fetch(cacheBustedUrl);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const contentType = response.headers.get('content-type') || '';
        const text = await response.text();
        return { text, contentType };
    }
    catch (error) {
        console.error(`Failed to fetch status list from ${url}:`, error instanceof Error ? error.message : String(error));
        throw error;
    }
}
/**
 * Check if content is a JWT
 */
function isJWT(content) {
    const parts = content.trim().split('.');
    return parts.length === 3 &&
        parts.every(part => part.length > 0 && /^[A-Za-z0-9_-]+$/.test(part));
}
/**
 * Decode bitstring from base64
 */
async function decodeBitstring(encoded) {
    // Delegate to shared Bitstring utility (supports raw and gzip-compressed lists)
    return Bitstring_1.Bitstring.decodeBits({ encoded });
}
// Bit checking is centralized in Bitstring.get
/**
 * Main revocation check function
 * @param vc - The verifiable credential JWT
 * @param options - Optional configuration for revocation checking
 */
async function checkRevocationStatus(vc, options) {
    try {
        // Decode JWT payload
        const { payload } = decodeJwtPayload(vc);
        // Check if credential has status information
        if (!payload.credentialStatus) {
            console.log('No credential status found - credential is not revocable');
            return false;
        }
        const status = payload.credentialStatus;
        // Validate status type
        if (!status) {
            throw new Error('credentialStatus must be a non-empty array');
        }
        const statusEntry = Array.isArray(status) ? status[0] : status;
        if (statusEntry.type !== 'BitstringStatusListEntry') {
            throw new Error(`Unsupported status type: ${statusEntry.type}`);
        }
        if (statusEntry.statusPurpose !== 'revocation') {
            throw new Error(`Unsupported status purpose: ${statusEntry.statusPurpose}`);
        }
        // Extract status list information
        const statusListCredentialUrl = statusEntry.statusListCredential;
        const statusListIndex = parseInt(statusEntry.statusListIndex);
        if (!statusListCredentialUrl) {
            throw new Error('statusListCredential URL is missing');
        }
        if (typeof statusListIndex !== 'number') {
            throw new Error('statusListIndex must be a number');
        }
        console.log(`Checking revocation status for position ${statusListIndex}`);
        // Fetch status list
        let statusListPayload;
        try {
            const { text: statusListContent } = await fetchFromUrl(statusListCredentialUrl);
            // Parse status list
            if (isJWT(statusListContent)) {
                const { payload: jwtPayload } = decodeJwtPayload(statusListContent);
                statusListPayload = jwtPayload;
            }
            else {
                statusListPayload = JSON.parse(statusListContent);
            }
        }
        catch (fetchError) {
            // If status list is not available, we need to make a decision
            console.log(`Status list unavailable at ${statusListCredentialUrl}`);
            console.log(`Error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
            // Use the provided option or default to assuming not revoked
            const assumeRevoked = options?.assumeRevokedWhenStatusListUnavailable ?? false;
            if (assumeRevoked) {
                console.log('Assuming credential IS revoked due to unavailable status list (as configured)');
                return true;
            }
            else {
                console.log('Assuming credential is NOT revoked due to unavailable status list (default behavior)');
                return false;
            }
        }
        // Extract encoded list
        if (!statusListPayload.credentialSubject) {
            throw new Error('Status list missing credentialSubject');
        }
        const credentialSubject = statusListPayload.credentialSubject;
        if (!credentialSubject.encodedList) {
            throw new Error('Status list missing encodedList');
        }
        const encodedList = credentialSubject.encodedList;
        try {
            console.log(`[Revocation] Encoded list length=${encodedList?.length || 0}, preview=${String(encodedList).slice(0, 50)}...`);
        }
        catch (_) { }
        // Decode bitstring and check revocation status via Bitstring
        const bitBytes = await Bitstring_1.Bitstring.decodeBits({ encoded: encodedList });
        try {
            console.log(`[Revocation] Decoded bitstring bytes=${bitBytes.length}, maxPositions=${bitBytes.length * 8}`);
        }
        catch (_) { }
        const bitset = new Bitstring_1.Bitstring({ buffer: bitBytes });
        const isRevoked = bitset.get(statusListIndex);
        console.log(`Revocation status for position ${statusListIndex}: ${isRevoked ? 'REVOKED' : 'NOT REVOKED'}`);
        return isRevoked;
    }
    catch (error) {
        console.error('Error checking revocation status:', error instanceof Error ? error.message : String(error));
        return false; // Assume not revoked if there's an error
    }
}
const inputJWT = 'eyJraWQiOiJkaWQ6d2ViOmNvbXBhbnktd2FsbGV0LWRldi5wcm9kLWs4cy5lZWNjLmRlOmFwaTpyZWdpc3RyeTpkaWQ6dXRvcGlhX2NvbXBhbnkja2V5cyIsImFsZyI6IkVTMjU2In0.eyJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiS2V5Q3JlZGVudGlhbCJdLCJpc3N1ZXIiOnsiaWQiOiJkaWQ6d2ViOmNvbXBhbnktd2FsbGV0LWRldi5wcm9kLWs4cy5lZWNjLmRlOmFwaTpyZWdpc3RyeTpkaWQ6dXRvcGlhX2NvbXBhbnkiLCJuYW1lIjoiVXRvcGlhIENvbXBhbnkifSwiY3JlZGVudGlhbFN1YmplY3QiOnsiaWQiOiJodHRwczovL2lkLmdzMS5vcmcvMDEvMDk1MTAwMTAwMDAwMiIsImV4dGVuZHNDcmVkZW50aWFsIjoiaHR0cHM6Ly9jb21wYW55LXdhbGxldC1kZXYucHJvZC1rOHMuZWVjYy5kZS9hcGkvcmVnaXN0cnkvdmMvbGljZW5zZS9nczFfcHJlZml4LzA5NTEwMDEifSwiaWQiOiJodHRwczovL2NvbXBhbnktd2FsbGV0LWRldi5wcm9kLWs4cy5lZWNjLmRlL2FwaS9yZWdpc3RyeS92Yy83NTI1ZTNjMi0xYjMxLTRhMTItYmNkYy05OTEwNWU1ODhiZjciLCJ2YWxpZEZyb20iOiIyMDI1LTA5LTE3VDA5OjM5OjMxWiIsImNyZWRlbnRpYWxTdGF0dXMiOnsiaWQiOiJodHRwczovL2NvbXBhbnktd2FsbGV0LWRldi5wcm9kLWs4cy5lZWNjLmRlL2FwaS9yZWdpc3RyeS9zdGF0dXMvcmV2b2NhdGlvbi9mMzZlMGZmYi01NjE4LTQ5NDItODMwYS1kM2IzNmE3MWI5NWYjNDQ2OTQiLCJ0eXBlIjoiQml0c3RyaW5nU3RhdHVzTGlzdEVudHJ5Iiwic3RhdHVzUHVycG9zZSI6InJldm9jYXRpb24iLCJzdGF0dXNMaXN0SW5kZXgiOiI0NDY5NCIsInN0YXR1c0xpc3RDcmVkZW50aWFsIjoiaHR0cHM6Ly9jb21wYW55LXdhbGxldC1kZXYucHJvZC1rOHMuZWVjYy5kZS9hcGkvcmVnaXN0cnkvc3RhdHVzL3Jldm9jYXRpb24vZjM2ZTBmZmItNTYxOC00OTQyLTgzMGEtZDNiMzZhNzFiOTVmIn0sImNyZWRlbnRpYWxTY2hlbWEiOnsiaWQiOiJodHRwczovL2lkLmdzMS5vcmcvdmMvc2NoZW1hL3YxL2tleS5qc29uIiwidHlwZSI6Ikpzb25TY2hlbWEifSwiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnL25zL2NyZWRlbnRpYWxzL3YyIiwiaHR0cHM6Ly9yZWYuZ3MxLm9yZy9nczEvdmMvZGVjbGFyYXRpb24tY29udGV4dCJdLCJuYW1lIjoiR1MxIElEIEtleSBDcmVkZW50aWFsIiwicmVuZGVyTWV0aG9kIjpbeyJ0eXBlIjoiU3ZnUmVuZGVyaW5nVGVtcGxhdGUiLCJpZCI6Imh0dHBzOi8vZ3MxLmdpdGh1Yi5pby9HUzFEaWdpdGFsTGljZW5zZXMvdGVtcGxhdGVzL2dzMS1zYW1wbGUtbGljZW5zZS10ZW1wbGF0ZS5zdmciLCJuYW1lIjoiV2ViIERpc3BsYXkiLCJjc3MzTWVkaWFRdWVyeSI6IkBtZWRpYSAobWluLWFzcGVjdC1yYXRpbzogMy8xKSJ9XSwiZGVzY3JpcHRpb24iOiJEZWNsYXJlcyB0aGUgY3J5cHRvZ3JhcGhpYyBrZXkgYXNzb2NpYXRlZCB3aXRoIGEgR1MxIGlkZW50aWZpZXIsIGVuYWJsaW5nIHNlY3VyZSBkaWdpdGFsIHNpZ25hdHVyZXMgYW5kIHZlcmlmaWNhdGlvbiBvZiBHUzEtcmVsYXRlZCB0cmFuc2FjdGlvbnMuIFRoaXMgY3JlZGVudGlhbCBleHRlbmRzIGZyb20gYSBDb21wYW55IFByZWZpeCBMaWNlbnNlIGFuZCBiaW5kcyBhIHNwZWNpZmljIGNyeXB0b2dyYXBoaWMga2V5IHRvIGEgR1MxIGlkZW50aWZpZXIsIGVuc3VyaW5nIHRoZSBhdXRoZW50aWNpdHkgYW5kIGludGVncml0eSBvZiBkYXRhIGFzc29jaWF0ZWQgd2l0aCBwcm9kdWN0cywgbG9jYXRpb25zLCBvciBlbnRpdGllcyBpZGVudGlmaWVkIGJ5IEdTMSBzdGFuZGFyZHMuIiwiaWF0IjoxNzU4MTAyMDE3fQ.UpcCwZ0vVKpHRJhiVmPeNMz4O-AA5hiLvnkQmZyk6dOllzErRPfy4kwJwXnB7zRsfCMZfOqGVQtLoarSOETnM';
checkRevocationStatus(inputJWT).then(console.log).catch(console.error);
