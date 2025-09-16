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
        if (!Array.isArray(status) || status.length === 0) {
            throw new Error('credentialStatus must be a non-empty array');
        }
        const statusEntry = status[0]; // Take first status entry
        if (statusEntry.type !== 'BitstringStatusListEntry') {
            throw new Error(`Unsupported status type: ${statusEntry.type}`);
        }
        if (statusEntry.statusPurpose !== 'revocation') {
            throw new Error(`Unsupported status purpose: ${statusEntry.statusPurpose}`);
        }
        // Extract status list information
        const statusListCredentialUrl = statusEntry.statusListCredential;
        const statusListIndex = statusEntry.statusListIndex;
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
// const inputJWT ='eyJraWQiOiJkaWQ6d2ViOmNvbXBhbnktd2FsbGV0LWRldi5wcm9kLWs4cy5lZWNjLmRlOmFwaTpyZWdpc3RyeTpkaWQ6Z3MxX2dsb2JhbCNwcmVmaXhlcyIsImFsZyI6IkVTMjU2In0.eyJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiR1MxUHJlZml4TGljZW5zZUNyZWRlbnRpYWwiXSwiaXNzdWVyIjp7ImlkIjoiZGlkOndlYjpjb21wYW55LXdhbGxldC1kZXYucHJvZC1rOHMuZWVjYy5kZTphcGk6cmVnaXN0cnk6ZGlkOmdzMV9nbG9iYWwiLCJuYW1lIjoiR1MxIEdsb2JhbCJ9LCJjcmVkZW50aWFsU3ViamVjdCI6eyJpZCI6ImRpZDp3ZWI6Y29tcGFueS13YWxsZXQtZGV2LnByb2QtazhzLmVlY2MuZGU6YXBpOnJlZ2lzdHJ5OmRpZDpnczFfdXRvcGlhIiwiYWx0ZXJuYXRpdmVMaWNlbnNlVmFsdWUiOiI5NTAiLCJsaWNlbnNlVmFsdWUiOiIwOTUwIiwib3JnYW5pemF0aW9uIjp7ImdzMTpwYXJ0eUdMTiI6IjA5NTAwMDAwMDEiLCJnczE6b3JnYW5pemF0aW9uTmFtZSI6IkdTMSBVdG9waWEifSwibmFtZSI6IkdTMSBQcmVmaXggTGljZW5zZSJ9LCJpZCI6Imh0dHBzOi8vY29tcGFueS13YWxsZXQtZGV2LnByb2QtazhzLmVlY2MuZGUvYXBpL3JlZ2lzdHJ5L3ZjL2xpY2Vuc2UvZ3MxX3ByZWZpeC8wOTUwIiwiY3JlZGVudGlhbFN0YXR1cyI6W3siaWQiOiJodHRwczovL2NvbXBhbnktd2FsbGV0LWRldi5wcm9kLWs4cy5lZWNjLmRlL2FwaS9yZWdpc3RyeS9zdGF0dXMvcmV2b2NhdGlvbi8zZDRmYTBjMi1mOWVlLTQ5ZWUtYjIwMS02ZTQzYjM3YTYzYWIjMTE5MjMxIiwidHlwZSI6IkJpdHN0cmluZ1N0YXR1c0xpc3RFbnRyeSIsInN0YXR1c1B1cnBvc2UiOiJyZXZvY2F0aW9uIiwic3RhdHVzTGlzdEluZGV4IjoxMTkyMzEsInN0YXR1c0xpc3RDcmVkZW50aWFsIjoiaHR0cHM6Ly9jb21wYW55LXdhbGxldC1kZXYucHJvZC1rOHMuZWVjYy5kZS9hcGkvcmVnaXN0cnkvc3RhdHVzL3Jldm9jYXRpb24vM2Q0ZmEwYzItZjllZS00OWVlLWIyMDEtNmU0M2IzN2E2M2FiIn1dLCJjcmVkZW50aWFsU2NoZW1hIjpbeyJpZCI6Imh0dHBzOi8vZ3MxLmdpdGh1Yi5pby9HUzFEaWdpdGFsTGljZW5zZXMvc2NoZW1hcy9wcmVmaXguanNvbiIsInR5cGUiOiJKc29uU2NoZW1hIn1dLCJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvbnMvY3JlZGVudGlhbHMvdjIiLCJodHRwczovL3JlZi5nczEub3JnL2dzMS92Yy9saWNlbnNlLWNvbnRleHQiXSwicmVuZGVyTWV0aG9kIjpbeyJjc3MzTWVkaWFRdWVyeSI6IkBtZWRpYSAobWluLWFzcGVjdC1yYXRpbzogMy8xKSIsIm5hbWUiOiJXZWIgRGlzcGxheSIsImlkIjoiaHR0cHM6Ly9nczEuZ2l0aHViLmlvL0dTMURpZ2l0YWxMaWNlbnNlcy90ZW1wbGF0ZXMvZ3MxLXNhbXBsZS1saWNlbnNlLXRlbXBsYXRlLnN2ZyIsInR5cGUiOiJTdmdSZW5kZXJpbmdUZW1wbGF0ZSJ9XSwiaWF0IjoxNzU3OTQwNTU2fQ.-P0OyIDmn6N0pHpwyf9s5O-3OYYtxCkQJhjUn1VYcbl2jlCrFLOaBTmj8RbzqKR3baKDCmNOyNkU4M7Rd-FZLw';
// checkRevocationStatus(inputJWT).then(console.log).catch(console.error);
