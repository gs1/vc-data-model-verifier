

import fs from 'fs'; 
import * as jose from 'jose';
import pkg, { checkRevocationStatus } from '../dist/index.js';
const { verifyVC, verifyVP } = pkg;

// VC JWT input 
let vcJwt = 'eyJraWQiOiJkaWQ6d2ViOmNvbXBhbnktd2FsbGV0LWRldi5wcm9kLWs4cy5lZWNjLmRlOmFwaTpyZWdpc3RyeTpkaWQ6dXRvcGlhX2NvbXBhbnkja2V5cyIsImFsZyI6IkVTMjU2In0.eyJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiS2V5Q3JlZGVudGlhbCJdLCJpc3N1ZXIiOnsiaWQiOiJkaWQ6d2ViOmNvbXBhbnktd2FsbGV0LWRldi5wcm9kLWs4cy5lZWNjLmRlOmFwaTpyZWdpc3RyeTpkaWQ6dXRvcGlhX2NvbXBhbnkiLCJuYW1lIjoiVXRvcGlhIENvbXBhbnkifSwiY3JlZGVudGlhbFN1YmplY3QiOnsiaWQiOiJodHRwczovL2lkLmdzMS5vcmcvMDEvMDk1MTAwMTAwMDAwMiIsImV4dGVuZHNDcmVkZW50aWFsIjoiaHR0cHM6Ly9jb21wYW55LXdhbGxldC1kZXYucHJvZC1rOHMuZWVjYy5kZS9hcGkvcmVnaXN0cnkvdmMvbGljZW5zZS9nczFfcHJlZml4LzA5NTEwMDEifSwiaWQiOiJodHRwczovL2NvbXBhbnktd2FsbGV0LWRldi5wcm9kLWs4cy5lZWNjLmRlL2FwaS9yZWdpc3RyeS92Yy83NTI1ZTNjMi0xYjMxLTRhMTItYmNkYy05OTEwNWU1ODhiZjciLCJ2YWxpZEZyb20iOiIyMDI1LTA5LTE3VDA5OjM5OjMxWiIsImNyZWRlbnRpYWxTdGF0dXMiOnsiaWQiOiJodHRwczovL2NvbXBhbnktd2FsbGV0LWRldi5wcm9kLWs4cy5lZWNjLmRlL2FwaS9yZWdpc3RyeS9zdGF0dXMvcmV2b2NhdGlvbi9mMzZlMGZmYi01NjE4LTQ5NDItODMwYS1kM2IzNmE3MWI5NWYjNDQ2OTQiLCJ0eXBlIjoiQml0c3RyaW5nU3RhdHVzTGlzdEVudHJ5Iiwic3RhdHVzUHVycG9zZSI6InJldm9jYXRpb24iLCJzdGF0dXNMaXN0SW5kZXgiOiI0NDY5NCIsInN0YXR1c0xpc3RDcmVkZW50aWFsIjoiaHR0cHM6Ly9jb21wYW55LXdhbGxldC1kZXYucHJvZC1rOHMuZWVjYy5kZS9hcGkvcmVnaXN0cnkvc3RhdHVzL3Jldm9jYXRpb24vZjM2ZTBmZmItNTYxOC00OTQyLTgzMGEtZDNiMzZhNzFiOTVmIn0sImNyZWRlbnRpYWxTY2hlbWEiOnsiaWQiOiJodHRwczovL2lkLmdzMS5vcmcvdmMvc2NoZW1hL3YxL2tleS5qc29uIiwidHlwZSI6Ikpzb25TY2hlbWEifSwiQGNvbnRleHQiOlsiaHR0cHM6Ly93d3cudzMub3JnL25zL2NyZWRlbnRpYWxzL3YyIiwiaHR0cHM6Ly9yZWYuZ3MxLm9yZy9nczEvdmMvZGVjbGFyYXRpb24tY29udGV4dCJdLCJuYW1lIjoiR1MxIElEIEtleSBDcmVkZW50aWFsIiwicmVuZGVyTWV0aG9kIjpbeyJ0eXBlIjoiU3ZnUmVuZGVyaW5nVGVtcGxhdGUiLCJpZCI6Imh0dHBzOi8vZ3MxLmdpdGh1Yi5pby9HUzFEaWdpdGFsTGljZW5zZXMvdGVtcGxhdGVzL2dzMS1zYW1wbGUtbGljZW5zZS10ZW1wbGF0ZS5zdmciLCJuYW1lIjoiV2ViIERpc3BsYXkiLCJjc3MzTWVkaWFRdWVyeSI6IkBtZWRpYSAobWluLWFzcGVjdC1yYXRpbzogMy8xKSJ9XSwiZGVzY3JpcHRpb24iOiJEZWNsYXJlcyB0aGUgY3J5cHRvZ3JhcGhpYyBrZXkgYXNzb2NpYXRlZCB3aXRoIGEgR1MxIGlkZW50aWZpZXIsIGVuYWJsaW5nIHNlY3VyZSBkaWdpdGFsIHNpZ25hdHVyZXMgYW5kIHZlcmlmaWNhdGlvbiBvZiBHUzEtcmVsYXRlZCB0cmFuc2FjdGlvbnMuIFRoaXMgY3JlZGVudGlhbCBleHRlbmRzIGZyb20gYSBDb21wYW55IFByZWZpeCBMaWNlbnNlIGFuZCBiaW5kcyBhIHNwZWNpZmljIGNyeXB0b2dyYXBoaWMga2V5IHRvIGEgR1MxIGlkZW50aWZpZXIsIGVuc3VyaW5nIHRoZSBhdXRoZW50aWNpdHkgYW5kIGludGVncml0eSBvZiBkYXRhIGFzc29jaWF0ZWQgd2l0aCBwcm9kdWN0cywgbG9jYXRpb25zLCBvciBlbnRpdGllcyBpZGVudGlmaWVkIGJ5IEdTMSBzdGFuZGFyZHMuIiwiaWF0IjoxNzU4MTAyMDE3fQ.UpcCwZ0vVKpHRJhiVmPeNMz4O-AA5hiLvnkQmZyk6dOllzErRPfy4kwJwXnB7zRsfCMZfOqGVQtLoarSOETnMQ';

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

      // Print top-level GS1 errors if present
      if (!gs1.verified) {
        const topErrors = Array.isArray(gs1.errors) ? gs1.errors : [];
        if (topErrors.length) {
          console.log('\n--- GS1 TOP-LEVEL ERRORS ---');
          topErrors.forEach((err, i) => {
            try {
              const parsed = typeof err === 'string' ? { message: err } : err;
              const line = {
                code: parsed.code ?? parsed.errorCode ?? undefined,
                rule: parsed.rule ?? parsed.ruleId ?? undefined,
                path: parsed.path ?? parsed.instancePath ?? undefined,
                message: parsed.message ?? parsed.error ?? JSON.stringify(parsed)
              };
              console.log(`  ${i + 1}. code=${line.code || ''} rule=${line.rule || ''} path=${line.path || ''}`);
              console.log(`     ${line.message}`);
            } catch (_) {}
          });
        }
      }
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
          const failingRules = new Map();
          let totalErrors = 0;
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
                  totalErrors += 1;
                  const key = line.rule || line.code || line.message || 'Unknown';
                  failingRules.set(key, (failingRules.get(key) || 0) + 1);
                } catch (parseError) {
                  // Handle parsing errors
                }
              });
            }
          }
          // Print a compact summary of failing rules
          if (failingRules.size > 0) {
            console.log('\n--- GS1 ERROR SUMMARY ---');
            console.log(`Total GS1 errors: ${totalErrors}`);
            for (const [ruleOrCode, count] of failingRules.entries()) {
              console.log(`  ${ruleOrCode}: ${count}`);
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


