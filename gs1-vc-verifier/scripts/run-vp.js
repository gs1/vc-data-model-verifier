#!/usr/bin/env node

/*
Usage:
  node scripts/run-vp.js "<vp-jwt>"
  node scripts/run-vp.js /path/to/vp.jwt.txt
  VP_JWT=<vp-jwt> node scripts/run-vp.js
If no JWT is provided, a built-in mock VP will be used.
*/

const fs = require('fs');
const path = require('path');
const { verifyVP } = require('../dist/index.js');

function resolveJwtFromArgs() {
  const arg = process.argv[2] || process.env.VP_JWT;
  if (!arg) return null;
  try {
    const p = path.resolve(arg);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      return fs.readFileSync(p, 'utf8').trim();
    }
  } catch (_) {}
  return String(arg).trim();
}

// Built-in mock VP (used if none provided)
const defaultMockVpJwt = "eyJraWQiOiJkaWQ6d2ViOndvb2R5Y3JlZWsuZ2l0aHViLmlvOkdTMURpZ2l0YWxMaWNlbnNlczpkaWRzOmZha2VfbWNfZGlkI0FYbjBwTGVueG5TU05mSV9xZlVjZFFaRGJudUExNXBNeDJKd0RHTGZON1UiLCJhbGciOiJFUzI1NiJ9.eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvbnMvY3JlZGVudGlhbHMvdjIiLCJodHRwczovL3JlZi5nczEub3JnL2dzMS92Yy9kZWNsYXJhdGlvbi1jb250ZXh0Il0sImlzc3VlciI6eyJpZCI6ImRpZDp3ZWI6d29vZHljcmVlay5naXRodWIuaW86R1MxRGlnaXRhbExpY2Vuc2VzOmRpZHM6ZmFrZV9tY19kaWQiLCJuYW1lIjoiSGVhbHRoeSBUb3RzIn0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJLZXlDcmVkZW50aWFsIl0sIm5hbWUiOiJHUzEgSUQgS2V5IENyZWRlbnRpYWwiLCJkZXNjcmlwdGlvbiI6IlRISVMgR1MxIERJR0lUQUwgTElDRU5TRSBDUkVERU5USUFMIElTIEZPUiBURVNUSU5HIFBVUlBPU0VTIE9OTFkuIFRoaXMgaXMgYSBWZXJpZmlhYmxlIENyZWRlbnRpYWwgdGhhdCBpbmRpY2F0ZXMgdGhhdCBzb21ldGhpbmcgaGFzIGJlZW4gaWRlbnRpZmllZC4gSXQgY29udGFpbnMgbm8gZGF0YSBhYm91dCB3aGF0IGhhcyBiZWVuIGlkZW50aWZpZWQgYXMgdGhhdCBpcyBkb25lIHZpYSB0aGUgYXNzb2NpYXRpb24gcHJvY2Vzcy4gVGhpcyBjcmVkZW50aWFsIGlzIHVzZWQgb25seSB0byBpbmRpY2F0ZSB0aGF0IHRoZSBHUzEgSUQgS2V5IHRoYXQgaXQgY29udGFpbnMgZXhpc3RzIGFuZCBpcyB2YWxpZC4iLCJpZCI6Imh0dHBzOi8vd29vZHljcmVlay5naXRodWIuaW8vR1MxRGlnaXRhbExpY2Vuc2VzL3NhbXBsZXMvZ2xuLWtleS1jcmVkZW50aWFsLXNhbXBsZS5qd3QiLCJ2YWxpZEZyb20iOiIyMDI0LTAxLTI1VDEyOjMwOjAwLjAwMFoiLCJjcmVkZW50aWFsU3ViamVjdCI6eyJpZCI6Imh0dHBzOi8vaWQuZ3MxLm9yZy80MTcvMDgxMDE1OTU1MDAwNCIsImV4dGVuZHNDcmVkZW50aWFsIjoiaHR0cHM6Ly93b29keWNyZWVrLmdpdGh1Yi5pby9HUzFEaWdpdGFsTGljZW5zZXMvc2FtcGxlcy9nY3Atc2FtcGxlLmp3dCJ9LCJjcmVkZW50aWFsU2NoZW1hIjp7ImlkIjoiaHR0cHM6Ly93b29keWNyZWVrLmdpdGh1Yi5pby9HUzFEaWdpdGFsTGljZW5zZXMvc2NoZW1hcy9rZXkuanNvbiIsInR5cGUiOiJKc29uU2NoZW1hIn0sImNyZWRlbnRpYWxTdGF0dXMiOnsiaWQiOiJodHRwczovL3dvb2R5Y3JlZWsuZ2l0aHViLmlvL0dTMURpZ2l0YWxMaWNlbnNlcy9zdGF0dXMvbWNfc3RhdHVzX2xpc3Quand0IzEyMzIwIiwidHlwZSI6IkJpdHN0cmluZ1N0YXR1c0xpc3RFbnRyeSIsInN0YXR1c1B1cnBvc2UiOiJyZXZvY2F0aW9uIiwic3RhdHVzTGlzdEluZGV4IjoiMTIzMjAiLCJzdGF0dXNMaXN0Q3JlZGVudGlhbCI6Imh0dHBzOi8vd29vZHljcmVlay5naXRodWIuaW8vR1MxRGlnaXRhbExpY2Vuc2VzL3N0YXR1cy9tY19zdGF0dXNfbGlzdC5qd3QifSwicmVuZGVyTWV0aG9kIjpbeyJpZCI6Imh0dHBzOi8vd29vZHljcmVlay5naXRodWIuaW8vR1MxRGlnaXRhbExpY2Vuc2VzL3RlbXBsYXRlcy9nczEtc2FtcGxlLWtleS10ZW1wbGF0ZS5zdmciLCJ0eXBlIjoiU3ZnUmVuZGVyaW5nVGVtcGxhdGUiLCJuYW1lIjoiV2ViIERpc3BsYXkiLCJjc3MzTWVkaWFRdWVyeSI6IkBtZWRpYSAobWluLWFzcGVjdC1yYXRpbzogMy8xKSJ9XX0.GFxUBt4MeBVjwQog4G8onA_KOF4d9jlZo4fYuWwPxZ7h849A0Tz_K6IuuQ0svGRWF_RStm16goIZ14xmuB_7nw";

function short(str, n = 80) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function printDivider(title) {
  console.log('\n' + '-'.repeat(20) + ' ' + title + ' ' + '-'.repeat(20));
}

(async () => {
  const vpJwt = resolveJwtFromArgs() || defaultMockVpJwt;

  printDivider('INPUT');
  console.log('Using VP JWT:', short(vpJwt));

  try {
    const result = await verifyVP(vpJwt);

    printDivider('SUMMARY');
    console.log('Overall Verified:', !!result.verified);

    // VP-level
    printDivider('VP VALIDATION');
    if (result.vpValidation) {
      console.log('VP Signature Verified:', !!result.vpValidation.verified);
    } else {
      console.log('No VP validation info');
    }

    // Per-credential
    printDivider('CREDENTIALS');
    if (Array.isArray(result.credentialResults) && result.credentialResults.length > 0) {
      for (const c of result.credentialResults) {
        console.log(`Credential #${c.index}`);
        console.log('  Valid:', !!c.valid);
        console.log('  Revoked:', !!c.revoked);
        if (c.validationResult) {
          console.log('  Signature Verified:', !!c.validationResult.verified);
          if (c.validationResult.schema) {
            const schemas = Object.entries(c.validationResult.schema).map(([id, r]) => ({ id, ok: r.validation === 'succeeded' }));
            console.log('  Schema Results:', schemas);
          } else {
            console.log('  Schema Results: none');
          }
        }
      }
    } else {
      console.log('No credential results');
    }

    // GS1
    printDivider('GS1 VALIDATION');
    if (result.gs1ValidationResult) {
      console.log('GS1 Verified:', !!result.gs1ValidationResult.verified);
      // Add GS1 type coverage summary
      try {
        const gs1 = result.gs1ValidationResult;
        const inferType = (entry) => {
          const name = entry?.credentialName;
          if (name && name !== 'GS1GenericSchema') return name;
          const id = String(entry?.credentialId || '');
          if (id.includes('/vc/license/gs1_prefix/')) return 'GS1PrefixLicenseCredential';
          if (id.includes('company_prefix') || id.includes('/credentials/')) return 'GS1CompanyPrefixLicenseCredential';
          if (name === 'KeyCredential') return 'KeyCredential';
          return name || 'unknown';
        };
        const names = new Set();
        if (Array.isArray(gs1.result)) {
          for (const r of gs1.result) {
            names.add(inferType(r));
            if (r?.resolvedCredential) names.add(inferType(r.resolvedCredential));
          }
        }
        console.log('GS1 TYPE COVERAGE:');
        console.log('  KeyCredential tested:', names.has('KeyCredential'));
        console.log('  GS1CompanyPrefixLicenseCredential tested:', names.has('GS1CompanyPrefixLicenseCredential'));
        console.log('  GS1PrefixLicenseCredential tested:', names.has('GS1PrefixLicenseCredential'));
      } catch (_) {}
      if (!result.gs1ValidationResult.verified) {
        console.log('GS1 Details:', JSON.stringify(result.gs1ValidationResult.result, null, 2));
      }
    } else {
      console.log('GS1 Validation: skipped (basic checks likely failed)');
    }

    // Errors
    if (Array.isArray(result.errors) && result.errors.length > 0) {
      printDivider('ERRORS');
      for (const e of result.errors) {
        console.log(`Credential Index: ${e.credentialIndex}`);
        console.log('Error:', e.error);
        if (e.details) {
          try {
            console.log('Details:', JSON.stringify(e.details, null, 2));
          } catch (_) {
            console.log('Details: (unserializable)');
          }
        }
      }
    }

    printDivider('DONE');
    console.log('Report complete.');
  } catch (err) {
    printDivider('FAILURE');
    console.error('Verification threw:', err && err.message ? err.message : err);
  }
})();
