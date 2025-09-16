

import fs from 'fs'; 
import * as jose from 'jose';
import pkg, { checkRevocationStatus } from '../dist/index.js';
const { verifyVC, verifyVP } = pkg;

// VC JWT input 
let vcJwt = 'eyJraWQiOiJkaWQ6d2ViOmNvbXBhbnktd2FsbGV0LWRldi5wcm9kLWs4cy5lZWNjLmRlOmFwaTpyZWdpc3RyeTpkaWQ6Z3MxX2dsb2JhbCN0ZXN0IiwiYWxnIjoiRVMyNTYifQ.eyJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiR1MxUHJlZml4TGljZW5zZUNyZWRlbnRpYWwiXSwiaXNzdWVyIjp7ImlkIjoiZGlkOndlYjpjb21wYW55LXdhbGxldC1kZXYucHJvZC1rOHMuZWVjYy5kZTphcGk6cmVnaXN0cnk6ZGlkOmdzMV9nbG9iYWwiLCJuYW1lIjoiR1MxIEdsb2JhbCJ9LCJjcmVkZW50aWFsU3ViamVjdCI6eyJpZCI6ImRpZDp3ZWI6Y29tcGFueS13YWxsZXQtZGV2LnByb2QtazhzLmVlY2MuZGU6YXBpOnJlZ2lzdHJ5OmRpZDpnczFfdXRvcGlhIiwiYWx0ZXJuYXRpdmVMaWNlbnNlVmFsdWUiOiI5NTEiLCJsaWNlbnNlVmFsdWUiOiIwOTUxIiwib3JnYW5pemF0aW9uIjp7ImdzMTpwYXJ0eUdMTiI6IjA5NTEwMDAwMDAwMDEiLCJnczE6b3JnYW5pemF0aW9uTmFtZSI6IkdTMSBVdG9waWEifX0sImlkIjoiaHR0cHM6Ly9jb21wYW55LXdhbGxldC1kZXYucHJvZC1rOHMuZWVjYy5kZS9hcGkvcmVnaXN0cnkvdmMvbGljZW5zZS9nczFfcHJlZml4LzA5NTEiLCJjcmVkZW50aWFsU3RhdHVzIjpbeyJpZCI6Imh0dHBzOi8vY29tcGFueS13YWxsZXQtZGV2LnByb2QtazhzLmVlY2MuZGUvYXBpL3JlZ2lzdHJ5L3N0YXR1cy9yZXZvY2F0aW9uLzI3ZGIxYjMwLWQ3MmEtNDVjMi1hOWMzLTA3ZTc5NTA4ZGY5ZiM1OTY2OSIsInR5cGUiOiJCaXRzdHJpbmdTdGF0dXNMaXN0RW50cnkiLCJzdGF0dXNQdXJwb3NlIjoicmV2b2NhdGlvbiIsInN0YXR1c0xpc3RJbmRleCI6NTk2NjksInN0YXR1c0xpc3RDcmVkZW50aWFsIjoiaHR0cHM6Ly9jb21wYW55LXdhbGxldC1kZXYucHJvZC1rOHMuZWVjYy5kZS9hcGkvcmVnaXN0cnkvc3RhdHVzL3Jldm9jYXRpb24vMjdkYjFiMzAtZDcyYS00NWMyLWE5YzMtMDdlNzk1MDhkZjlmIn1dLCJjcmVkZW50aWFsU2NoZW1hIjp7ImlkIjoiaHR0cHM6Ly9nczEuZ2l0aHViLmlvL0dTMURpZ2l0YWxMaWNlbnNlcy9zY2hlbWFzL3ByZWZpeC5qc29uIiwidHlwZSI6Ikpzb25TY2hlbWEifSwiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnL25zL2NyZWRlbnRpYWxzL3YyIiwiaHR0cHM6Ly9yZWYuZ3MxLm9yZy9nczEvdmMvbGljZW5zZS1jb250ZXh0Il0sIm5hbWUiOiJHUzEgUHJlZml4IExpY2Vuc2UiLCJyZW5kZXJNZXRob2QiOlt7ImNzczNNZWRpYVF1ZXJ5IjoiQG1lZGlhIChtaW4tYXNwZWN0LXJhdGlvOiAzLzEpIiwibmFtZSI6IldlYiBEaXNwbGF5IiwiaWQiOiJodHRwczovL2dzMS5naXRodWIuaW8vR1MxRGlnaXRhbExpY2Vuc2VzL3RlbXBsYXRlcy9nczEtc2FtcGxlLWxpY2Vuc2UtdGVtcGxhdGUuc3ZnIiwidHlwZSI6IlN2Z1JlbmRlcmluZ1RlbXBsYXRlIn1dLCJpYXQiOjE3NTgwMjgxMDF9.EUGzFGOA-vBOuP6ZcxZaTsm-NPKu-3pIQCRT7Vn7rXBbPiv0o9YAfTV9oeTfcGwVzQZD8iibpcaZEMKXToGovg';

function resolveJwtFromArgsOrEnv() {
  if (vcJwt && vcJwt.trim().length > 0) return vcJwt.trim();
  const arg = process.argv[2] || process.env.VC_JWT;
  if (!arg) return null;
  try {
    const p = path.resolve(arg);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      return fs.readFileSync(p, 'utf8').trim();
    }
  } catch (_) {}
  return String(arg).trim();
}

function short(str, n = 100) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

(async () => {
  const jwt = resolveJwtFromArgsOrEnv();
  if (!jwt) {
    console.error('No VC JWT provided. Paste it into scripts/test-vc.js or pass as arg/env.');
    process.exit(1);
  }


  console.log('--- VC INPUT ---');
  console.log(short(jwt));

  try {
    const result = await verifyVC(jwt);

    // Checklist 
    const signatureVerified = !!(result && result.validationResult && result.validationResult.verified === true);
    const schemaValid = !!(result && result.validationResult && result.validationResult.schema && Object.values(result.validationResult.schema).every((r) => r && r.validation === 'succeeded'));
    const revocationOk = result && result.revocationStatusPresent ? (result.revocationCheck === 'checked' && !result.revoked) : false;
    const gs1Ok = !!(result && result.gs1ValidationResult && result.gs1ValidationResult.verified === true);
    const mark = (ok) => ok ? '✅' : '❌';

    console.log('\n--- CHECKLIST ---');
    console.log(`Signature verification: ${mark(signatureVerified)}`);
    console.log(`Schema validation: ${mark(schemaValid)}`);
    console.log(`Revocation check: ${mark(revocationOk)}${result && !result.revocationStatusPresent ? ' (no status present)' : ''}`);
    console.log(`GS1 rules validation: ${mark(gs1Ok)}`);

    console.log('\n--- SUMMARY ---');
    console.log('Verified:', !!result.verified);
    console.log('Revoked:', !!result.revoked);

    const checkrevocationusinginternalfile = await checkRevocationStatus(jwt);
    console.log('Revocation check using internal file:', checkrevocationusinginternalfile);

    console.log('\n--- GS1 ---');
    if (result.gs1ValidationResult) {
      const gs1 = result.gs1ValidationResult;
      console.log('GS1 Verified:', !!gs1.verified);
      // Decode input VC to show actual credential types from payload
      const b64urlToUtf8 = (s) => {
        try {
          let t = String(s || '').replace(/-/g, '+').replace(/_/g, '/');
          const pad = t.length % 4;
          if (pad) t += '='.repeat(4 - pad);
          return Buffer.from(t, 'base64').toString('utf8');
        } catch (_) {
          return '';
        }
      };
      const decodeJwtPayloadSafe = (token) => {
        try {
          const payload = jose.decodeJwt(token);
          if (payload) {
            return payload;
          }
          return null;
        } catch (error) {
          return null;
        }
      };
      const inputPayload = decodeJwtPayloadSafe(jwt);
      const inputTypes = Array.isArray(inputPayload?.type)
        ? inputPayload.type
        : (inputPayload?.type ? [inputPayload.type] : []);
      if (Array.isArray(gs1.result)) {
        const inferTypeFromId = (id) => {
          const s = String(id || '');
          if (s.includes('/vc/license/gs1_prefix/')) return 'GS1PrefixLicenseCredential';
          if (s.includes('company_prefix') || s.includes('/credentials/')) return 'GS1CompanyPrefixLicenseCredential';
          return undefined;
        };
        const b64urlToUtf8 = (s) => {
          try {
            let t = String(s || '').replace(/-/g, '+').replace(/_/g, '/');
            const pad = t.length % 4;
            if (pad) t += '='.repeat(4 - pad);
            return Buffer.from(t, 'base64').toString('utf8');
          } catch (_) {
            return '';
          }
        };
        const decodeJwtTypes = (jwt) => {
          try {
            const parts = String(jwt || '').split('.');
            if (parts.length !== 3) return [];
            const json = b64urlToUtf8(parts[1]);
            const payload = JSON.parse(json);
            const t = payload?.type;
            const arr = Array.isArray(t) ? t : (t ? [t] : []);
            return arr.filter((x) => x && x !== 'VerifiableCredential');
          } catch (_) {
            return [];
          }
        };
        const fetchTypesFromUrl = async (url) => {
          if (!url) return [];
          try {
            const res = await fetch(url);
            const text = await res.text();
            const jwtTypes = decodeJwtTypes(text);
            if (jwtTypes.length) return jwtTypes;
            try {
              const obj = JSON.parse(text);
              const t = obj?.type;
              const arr = Array.isArray(t) ? t : (t ? [t] : []);
              return arr.filter((x) => x && x !== 'VerifiableCredential');
            } catch (_) {
              const inferred = inferTypeFromId(url);
              return inferred ? [inferred] : [];
            }
          } catch (_) {
            const inferred = inferTypeFromId(url);
            return inferred ? [inferred] : [];
          }
        };
        const seen = new Set();
        const resolvedTypeNames = new Set();
        try {
          for (let idx = 0; idx < gs1.result.length; idx++) {
            const item = gs1.result[idx];
            if (item.credentialId && seen.has(item.credentialId)) continue;
            if (item.credentialId) seen.add(item.credentialId);
            const childTypes = await fetchTypesFromUrl(item.credentialId);
            const shownChildType = (childTypes && childTypes.length) ? childTypes.join(', ') : (inferTypeFromId(item.credentialId) || 'unknown');
            
            console.log(`\n  [${idx}] CREDENTIAL DETAILS:`);
            console.log(`      Type: ${shownChildType}`);
            if (item.credentialId) console.log(`      ID: ${item.credentialId}`);
            if (typeof item.verified === 'boolean') console.log(`      Status: ${item.verified ? '✅ Verified' : '❌ Failed'}`);
            
            const parentId = item?.resolvedCredential?.credentialId;
            if (parentId) {
              const parentTypes = await fetchTypesFromUrl(parentId);
              const shownParentType = (parentTypes && parentTypes.length) ? parentTypes.join(', ') : (inferTypeFromId(parentId) || 'unknown');
              // Accumulate parent decoded types for coverage
              for (const t of parentTypes) {
                if (t) resolvedTypeNames.add(t);
              }
            }
            // Accumulate child decoded types for coverage
            for (const t of childTypes) {
              if (t) resolvedTypeNames.add(t);
            }
            if (Array.isArray(item.errors) && item.errors.length) {
              item.errors.forEach((err, i) => {
                try {
                  const parsed = typeof err === 'string' ? { message: err } : err;
                  const line = {
                    code: parsed.code ?? parsed.errorCode ?? undefined,
                    rule: parsed.rule ?? parsed.ruleId ?? undefined,
                    path: parsed.path ?? parsed.instancePath ?? undefined,
                    message: parsed.message ?? parsed.error ?? JSON.stringify(parsed)
                  };
                  console.log(`      Error ${i + 1}: code=${line.code || ''} rule=${line.rule || ''} path=${line.path || ''}`);
                  console.log(`                 ${line.message}`);
                } catch (parseError) {
                  // Handle parsing errors
                }
              });
            }
          }
        } catch (error) {
          // Handle errors in credential processing
        }
        
        // Summary of fetched credentials
        console.log('\n--- CREDENTIAL CHAIN SUMMARY ---');
        console.log(`Total credentials fetched: ${gs1.result.length}`);
        const verifiedCount = gs1.result.filter(item => item.verified === true).length;
        const failedCount = gs1.result.filter(item => item.verified === false).length;
        console.log(`Verified: ${verifiedCount}`);
        console.log(`Failed: ${failedCount}`);
        console.log(`Credential types found: ${Array.from(resolvedTypeNames).join(', ')}`);
        
      }
    } else {
      console.log('GS1 Validation: not available');
    }

  } catch (err) {
    console.error('\n--- FAILURE ---');
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  }
})();


