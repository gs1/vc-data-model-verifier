import * as transmute from '@transmute/verifiable-credentials';
import { resolverWithCache } from './resolver';
import { checkRevocationStatus } from './revocation';
import { checkGS1CredentialPresentationValidation } from '@gs1us/vc-verifier-rules';
import { splitJwt } from './input';


export async function verifyVP(presentationJwtOrObj: string | object) {
  // Create validator with resolver
  const validator = transmute.validator({
    resolver: {
      resolve: async ({ type, id, content }) => resolverWithCache.resolve({ type, id, content })
    }
  });

  // 1. Verify VP structure and signature (best-effort)
  let vpResult: any = undefined;
  let vpValidationError: any = undefined;
  const vpContentUint8 = typeof presentationJwtOrObj === 'string'
    ? transmute.text.encoder.encode(presentationJwtOrObj)
    : transmute.text.encoder.encode(JSON.stringify(presentationJwtOrObj));

  try {
    vpResult = await validator.validate({
      type: 'application/vp-ld+jwt',
      content: vpContentUint8
    });
  } catch (err) {
    vpValidationError = err;
    // Try to decode VP content and continue
    try {
      if (typeof presentationJwtOrObj === 'string') {
        const { payload } = splitJwt(presentationJwtOrObj);
        vpResult = { verified: false, content: payload };
      } else {
        vpResult = { verified: false, content: presentationJwtOrObj };
      }
    } catch (_) {
      vpResult = { verified: false, content: undefined };
    }
  }

  if (vpResult?.content) {
    console.log('Extracted VC content from VP:', JSON.stringify(vpResult.content, null, 2));
  }

  // 2. Extract and verify embedded credentials
  const credentialResults = [];
  let allCredentialsValid = true;
  const extractedCredentials = [];

  if (vpResult.content?.verifiableCredential) {
    for (const [index, vc] of vpResult.content.verifiableCredential.entries()) {
      let vcContent: Uint8Array;
      let vcType:
        | "application/vp-ld+jwt"
        | "application/vc-ld+jwt"
        | "application/vc-ld+sd-jwt"
        | "application/vc-ld+cose"
        | "application/vp-ld"
        | "application/vp-ld+sd-jwt"
        | "application/vp-ld+cose"
        | "application/jwt"
        | "application/kb+jwt"
        | "application/sd-jwt";

      if (typeof vc === 'string') {
        vcType = 'application/vc-ld+jwt';
        vcContent = transmute.text.encoder.encode(vc);
      } else if (vc?.id?.startsWith('application/vc-ld+jwt;')) {
        const jwt = vc.id.split(';')[1];
        vcType = 'application/vc-ld+jwt';
        vcContent = transmute.text.encoder.encode(jwt);
      } else if (vc?.type === 'EnvelopedVerifiableCredential' && vc?.id?.startsWith('data:application/vc-ld+jwt;')) {
        // Handle EnvelopedVerifiableCredential format
        const jwt = vc.id.split(';')[1];
        vcType = 'application/vc-ld+jwt';
        vcContent = transmute.text.encoder.encode(jwt);
      } else {
        vcType = 'application/vc-ld+jwt';
        vcContent = transmute.text.encoder.encode(JSON.stringify(vc));
      }
      const decodedContent = transmute.text.decoder.decode(vcContent);
      const vcValidation = await validator.validate({
        type: vcType,
        content: vcContent
      });
      console.log(`\n=== Credential ${index} Verification ===`);
      console.log(`Signature Verified: ${vcValidation.verified}`);

      if (vcValidation.schema) {
        Object.entries(vcValidation.schema).forEach(([schemaId, schemaResult]) => {
          console.log(`Schema ${schemaId}: ${schemaResult.validation === "succeeded" ? "Valid" : "Invalid"}`);
        });
      } else {
        console.log("Schema Validation: Not performed");
      }

      let revoked = false;
      if (vcType === 'application/vc-ld+jwt') {
        revoked = await checkRevocationStatus(
          transmute.text.decoder.decode(vcContent)
        );
        console.log(`Revocation Check: ${revoked ? "Revoked" : "Not Revoked"}`);
      }

      const credentialValid = vcValidation.verified && !revoked;
      allCredentialsValid = allCredentialsValid && credentialValid;

      // Extract the validated credential content for GS1 validation
      if (vcValidation.content) {
        extractedCredentials.push(vcValidation.content);
      }

      credentialResults.push({
        index,
        valid: credentialValid,
        credential: vc,
        validationResult: vcValidation,
        revoked
      });
    }
  } else {
    // If no verifiableCredential array, treat vpResult.content as a single credential
    extractedCredentials.push(vpResult.content);
  }

  // Log the extracted VCs
  console.log(`\nExtracted ${extractedCredentials.length} VC(s) from VP:`, JSON.stringify(extractedCredentials, null, 2));

  // 3. GS1 Validation (best-effort): proceed even if some credentials failed

  const validatorRequest = {
    fullJsonSchemaValidationOn: true,
    gs1DocumentResolver: {
      externalCredentialLoader: async (url: string) => {
        // Implement: fetch and return a VC from a URL if needed
        return null;
      },
      externalCredentialVerification: async (credential: any) => {
        // Reuse your existing verification logic or return true for now
        return true;
      },
      externalJsonSchemaLoader: async (schemaId: string) => {
        try {
          // Use online schema URLs instead of local files for portability
          const response = await fetch(schemaId);
          if (response.ok) {
            return await response.json();
          }
          // If online fetch fails, return empty buffer
          return Buffer.from("");
        } catch (e) {
          return Buffer.from("");
        }
      }
    }
  };
  

  const gs1Result = await checkGS1CredentialPresentationValidation(
    validatorRequest,
    { verifiableCredential: extractedCredentials }
  );

  if (!gs1Result.verified) {
    console.error('GS1 validation failed:', gs1Result.result);
  } else {
    console.log('GS1 validation passed');
  }

  const overallVerified = allCredentialsValid && (gs1Result.verified ?? true) && !vpValidationError;

  return {
    verified: overallVerified,
    vpValidation: vpResult,
    credentialResults,
    gs1ValidationResult: gs1Result,
    errors: [
      ...(vpValidationError ? [{
        credentialIndex: -1,
        error: 'VP validation failed',
        details: String(vpValidationError)
      }] : []),
      ...credentialResults.filter(c => !c.valid).map(c => ({
        credentialIndex: c.index,
        error: c.revoked ? 'Revoked credential' : 'Invalid credential',
        details: c.validationResult
      })),
      ...(!gs1Result.verified ? [{
        credentialIndex: -1,
        error: 'GS1 validation failed',
        details: gs1Result.result
      }] : [])
    ]
  };
}

/*
const vpJwt = "eyJraWQiOiJkaWQ6d2ViOmhlYWx0aHl0b3RzLm5ldCNJeXIwZndUdmRsRVJrOEVCWFZ1SXM3NjgyeW45ZGpjQng2aEdtemNhb2FzIiwiYWxnIjoiRVMyNTYifQ.eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvbnMvY3JlZGVudGlhbHMvdjIiXSwidHlwZSI6WyJWZXJpZmlhYmxlUHJlc2VudGF0aW9uIl0sImhvbGRlciI6ImRpZDpoZWFsdGh5dG90cy5uZXQiLCJ2ZXJpZmlhYmxlQ3JlZGVudGlhbCI6W3siQGNvbnRleHQiOiJodHRwczovL3d3dy53My5vcmcvbnMvY3JlZGVudGlhbHMvdjIiLCJpZCI6ImRhdGE6YXBwbGljYXRpb24vdmMrbGQranNvbitqd3Q7ZXlKcmFXUWlPaUprYVdRNmQyVmlPbU5pY0haemRtbHdMWFpqTG1kek1YVnpMbTl5WnlOSmVYSXdabmRVZG1Sc1JWSnJPRVZDV0ZaMVNYTTNOamd5ZVc0NVpHcGpRbmcyYUVkdGVtTmhiMkZ6SWl3aVlXeG5Jam9pUlZNeU5UWWlmUS5leUpBWTI5dWRHVjRkQ0k2V3lKb2RIUndjem92TDNkM2R5NTNNeTV2Y21jdmJuTXZZM0psWkdWdWRHbGhiSE12ZGpJaUxDSm9kSFJ3Y3pvdkwzSmxaaTVuY3pFdWIzSm5MMmR6TVM5Mll5OXNhV05sYm5ObExXTnZiblJsZUhRaVhTd2lhV1FpT2lKb2RIUndjem92TDJOaWNIWnpkbWx3TFhaakxXRndhUzVuY3pGMWN5NXZjbWN2WTNKbFpHVnVkR2xoYkhNdk1EZzJNREF3TlRjMk9UUWlMQ0pwYzNOMVpYSWlPbnNpYVdRaU9pSmthV1E2ZDJWaU9tTmljSFp6ZG1sd0xYWmpMbWR6TVhWekxtOXlaeUlzSW01aGJXVWlPaUpIVXpFZ1ZWTWlmU3dpYm1GdFpTSTZJa2RUTVNCRGIyMXdZVzU1SUZCeVpXWnBlQ0JNYVdObGJuTmxJaXdpWkdWelkzSnBjSFJwYjI0aU9pSlVTRWxUSUVkVE1TQkVTVWRKVkVGTUlFeEpRMFZPVTBVZ1ExSkZSRVZPVkVsQlRDQkpVeUJHVDFJZ1ZFVlRWRWxPUnlCUVZWSlFUMU5GVXlCUFRreFpMaUJCSUVkVE1TQkRiMjF3WVc1NUlGQnlaV1pwZUNCTWFXTmxibk5sSUdseklHbHpjM1ZsWkNCaWVTQmhJRWRUTVNCTlpXMWlaWElnVDNKbllXNXBlbUYwYVc5dUlHOXlJRWRUTVNCSGJHOWlZV3dnVDJabWFXTmxJR0Z1WkNCaGJHeHZZMkYwWldRZ2RHOGdZU0IxYzJWeUlHTnZiWEJoYm5rZ2IzSWdkRzhnYVhSelpXeG1JR1p2Y2lCMGFHVWdjSFZ5Y0c5elpTQnZaaUJuWlc1bGNtRjBhVzVuSUhScFpYSWdNU0JIVXpFZ2FXUmxiblJwWm1sallYUnBiMjRnYTJWNWN5NGlMQ0oyWVd4cFpFWnliMjBpT2lJeU1ESTBMVEF4TFRJMVZERXlPak13T2pBd0xqQXdNRm9pTENKMGVYQmxJanBiSWxabGNtbG1hV0ZpYkdWRGNtVmtaVzUwYVdGc0lpd2lSMU14UTI5dGNHRnVlVkJ5WldacGVFeHBZMlZ1YzJWRGNtVmtaVzUwYVdGc0lsMHNJbU55WldSbGJuUnBZV3hUZFdKcVpXTjBJanA3SW1sa0lqb2laR2xrT210bGVUcDZOazFyYWtWS09USTRRVmszYVdkV1VUSTJjRlIwWW5velZFVXpXWEZHTVdOU1JFb3pURFozWlRKeFl6bEZVWFV2TVNJc0ltOXlaMkZ1YVhwaGRHbHZiaUk2ZXlKbmN6RTZjR0Z5ZEhsSFRFNGlPaUl3T0RZd01EQTFOelk1TkRBM0lpd2laM014T205eVoyRnVhWHBoZEdsdmJrNWhiV1VpT2lKSVpXRnNkR2g1SUZSdmRITWlmU3dpWlhoMFpXNWtjME55WldSbGJuUnBZV3dpT2lKb2RIUndjem92TDJsa0xtZHpNUzV2Y21jdmRtTXZiR2xqWlc1elpTOW5jekZmY0hKbFptbDRMekE0SWl3aWJHbGpaVzV6WlZaaGJIVmxJam9pTURnMk1EQXdOVGMyT1RRaUxDSmhiSFJsY201aGRHbDJaVXhwWTJWdWMyVldZV3gxWlNJNklqZzJNREF3TlRjMk9UUWlmU3dpWTNKbFpHVnVkR2xoYkZOamFHVnRZU0k2ZXlKcFpDSTZJbWgwZEhCek9pOHZhV1F1WjNNeExtOXlaeTkyWXk5elkyaGxiV0V2ZGpFdlkyOXRjR0Z1ZVhCeVpXWnBlQ0lzSW5SNWNHVWlPaUpLYzI5dVUyTm9aVzFoSW4wc0ltTnlaV1JsYm5ScFlXeFRkR0YwZFhNaU9uc2lhV1FpT2lKb2RIUndjem92TDJOaWNIWnpkbWx3TFhaakxXRndhUzVuY3pGMWN5NXZjbWN2YzNSaGRIVnpMemd3TVdNMlkyTTJMVFJtWXpRdE5HRmhNeTFoTXpRM0xUTmlNekZoTVRjMVlXTXhOQzh4TURBd01TSXNJblI1Y0dVaU9pSkNhWFJ6ZEhKcGJtZFRkR0YwZFhOTWFYTjBSVzUwY25raUxDSnpkR0YwZFhOUWRYSndiM05sSWpvaWNtVjJiMk5oZEdsdmJpSXNJbk4wWVhSMWMweHBjM1JKYm1SbGVDSTZJakV3TURBeElpd2ljM1JoZEhWelRHbHpkRU55WldSbGJuUnBZV3dpT2lKb2RIUndjem92TDJOaWNIWnpkbWx3TFhaakxXRndhUzVuY3pGMWN5NXZjbWN2YzNSaGRIVnpMemd3TVdNMlkyTTJMVFJtWXpRdE5HRmhNeTFoTXpRM0xUTmlNekZoTVRjMVlXTXhOQzhpZlgwLnNZNGI5cTFRMVY3Zmp6OWtFZ19OY2xOQW5iTFBwcUxJaHdSZjFJbWdSbVlKX3REbnFaWGNBVzlFeVJrLUhfclZJanVNTVU2Q29KZEg5VUJ1SVdadHZBIiwidHlwZSI6IkVudmVsb3BlZFZlcmlmaWFibGVDcmVkZW50aWFsIn0seyJAY29udGV4dCI6Imh0dHBzOi8vd3d3LnczLm9yZy9ucy9jcmVkZW50aWFscy92MiIsImlkIjoiZGF0YTphcHBsaWNhdGlvbi92YytsZCtqc29uK2p3dDtleUpyYVdRaU9pSmthV1E2ZDJWaU9taGxZV3gwYUhsMGIzUnpMbTVsZENOSmVYSXdabmRVZG1Sc1JWSnJPRVZDV0ZaMVNYTTNOamd5ZVc0NVpHcGpRbmcyYUVkdGVtTmhiMkZ6SWl3aVlXeG5Jam9pUlZNeU5UWWlmUS5leUpBWTI5dWRHVjRkQ0k2V3lKb2RIUndjem92TDNkM2R5NTNNeTV2Y21jdmJuTXZZM0psWkdWdWRHbGhiSE12ZGpJaUxDSm9kSFJ3Y3pvdkwzSmxaaTVuY3pFdWIzSm5MMmR6TVM5Mll5OWtaV05zWVhKaGRHbHZiaTFqYjI1MFpYaDBJbDBzSW1semMzVmxjaUk2ZXlKcFpDSTZJbVJwWkRwM1pXSTZhR1ZoYkhSb2VYUnZkSE11Ym1WMElpd2libUZ0WlNJNklraGxZV3gwYUhrZ1ZHOTBjeUo5TENKMGVYQmxJanBiSWxabGNtbG1hV0ZpYkdWRGNtVmtaVzUwYVdGc0lpd2lTMlY1UTNKbFpHVnVkR2xoYkNKZExDSnVZVzFsSWpvaVIxTXhJRXRsZVNCRGNtVmtaVzUwYVdGc0lpd2laR1Z6WTNKcGNIUnBiMjRpT2lKVVNFbFRJRWRUTVNCRVNVZEpWRUZNSUV4SlEwVk9VMFVnUTFKRlJFVk9WRWxCVENCSlV5QkdUMUlnVkVWVFZFbE9SeUJRVlZKUVQxTkZVeUJQVGt4WkxpQlVhR2x6SUdseklIUm9aU0JXWlhKcFptbGhZbXhsSUVOeVpXUmxiblJwWVd3Z2RHaGhkQ0JwYm1ScFkyRjBaWE1nZEdoaGRDQnpiMjFsZEdocGJtY2dhR0Z6SUdKbFpXNGdhV1JsYm5ScFptbGxaQzRnU1hRZ1kyOXVkR0ZwYm5NZ2JtOGdaR0YwWVNCaFltOTFkQ0IzYUdGMElHaGhjeUJpWldWdUlHbGtaVzUwYVdacFpXUWdZWE1nZEdoaGRDQnBjeUJrYjI1bElIWnBZU0IwYUdVZ1lYTnpiMk5wWVhScGIyNGdjSEp2WTJWemN5NGdWR2hwY3lCamNtVmtaVzUwYVdGc0lHbHpJSFZ6WldRZ2IyNXNlU0IwYnlCcGJtUnBZMkYwWlNCMGFHRjBJSFJvWlNCclpYa2dkR2hoZENCcGRDQmpiMjUwWVdsdWN5QmxlR2x6ZEhNZ1lXNWtJR2x6SUhaaGJHbGtMaUlzSW1sa0lqb2laR2xrT210bGVUcDZOazFyYWtwTVlsTXpaVUZ0UWtjMlFWZzNRWFZRWjJwV1pVUk9aR2Q2TXpSbVF6ZHdSalZTWjJoM1dVNTFkRVVpTENKMllXeHBaRVp5YjIwaU9pSXlNREkwTFRBNExUSXhWREU0T2pFMU9qSXpMakk1TWxvaUxDSmpjbVZrWlc1MGFXRnNVM1ZpYW1WamRDSTZleUpwWkNJNkltaDBkSEJ6T2k4dmFXUXVaM014TG05eVp5OHdNUzh3TURnMk1EQXdOVGMyT1RReE5DSXNJbVY0ZEdWdVpITkRjbVZrWlc1MGFXRnNJam9pYUhSMGNITTZMeTlqWW5CMmMzWnBjQzEyWXkxaGNHa3VaM014ZFhNdWIzSm5MMk55WldSbGJuUnBZV3h6THpBNE5qQXdNRFUzTmprMEluMHNJbU55WldSbGJuUnBZV3hUWTJobGJXRWlPbnNpYVdRaU9pSm9kSFJ3Y3pvdkwybGtMbWR6TVM1dmNtY3ZkbU12YzJOb1pXMWhMM1l4TDJ0bGVTSXNJblI1Y0dVaU9pSktjMjl1VTJOb1pXMWhJbjBzSW1OeVpXUmxiblJwWVd4VGRHRjBkWE1pT25zaWFXUWlPaUpvZEhSd2N6b3ZMMmhsWVd4MGFIbDBiM1J6TG01bGRDOXpkR0YwZFhNdlpEWTRNREJrWW1NdE9UVTNNeTAwTlRJeUxXSm1OVFF0WkdObFlUSTRNVE5sTmpZeEx6RXlNREF4SWl3aWRIbHdaU0k2SWtKcGRITjBjbWx1WjFOMFlYUjFjMHhwYzNSRmJuUnllU0lzSW5OMFlYUjFjMUIxY25CdmMyVWlPaUp5WlhadlkyRjBhVzl1SWl3aWMzUmhkSFZ6VEdsemRFbHVaR1Y0SWpvaU1USXdNREVpTENKemRHRjBkWE5NYVhOMFEzSmxaR1Z1ZEdsaGJDSTZJbWgwZEhCek9pOHZhR1ZoYkhSb2VYUnZkSE11Ym1WMEwzTjBZWFIxY3k5a05qZ3dNR1JpWXkwNU5UY3pMVFExTWpJdFltWTFOQzFrWTJWaE1qZ3hNMlUyTmpFdkluMTkuZGNJT1k0eF9CTnFPSDNXYktXdEQzMldQYko1RW95cVFWdUI2NXJUQk15QmRnWHBhOG84dEVlNGJiU050YTdOY3FManQtYTRGOTQ1RHg0bk1TcnVOZXciLCJ0eXBlIjoiRW52ZWxvcGVkVmVyaWZpYWJsZUNyZWRlbnRpYWwifSx7IkBjb250ZXh0IjoiaHR0cHM6Ly93d3cudzMub3JnL25zL2NyZWRlbnRpYWxzL3YyIiwiaWQiOiJkYXRhOmFwcGxpY2F0aW9uL3ZjK2xkK2pzb24rand0O2V5SnJhV1FpT2lKa2FXUTZkMlZpT21obFlXeDBhSGwwYjNSekxtNWxkQ05KZVhJd1puZFVkbVJzUlZKck9FVkNXRloxU1hNM05qZ3llVzQ1WkdwalFuZzJhRWR0ZW1OaGIyRnpJaXdpWVd4bklqb2lSVk15TlRZaWZRLmV5SkFZMjl1ZEdWNGRDSTZXeUpvZEhSd2N6b3ZMM2QzZHk1M015NXZjbWN2Ym5NdlkzSmxaR1Z1ZEdsaGJITXZkaklpTENKb2RIUndjem92TDNKbFppNW5jekV1YjNKbkwyZHpNUzkyWXk5a1pXTnNZWEpoZEdsdmJpMWpiMjUwWlhoMElpd2lhSFIwY0hNNkx5OXlaV1l1WjNNeExtOXlaeTluY3pFdmRtTXZjSEp2WkhWamRDMWpiMjUwWlhoMElsMHNJblI1Y0dVaU9sc2lWbVZ5YVdacFlXSnNaVU55WldSbGJuUnBZV3dpTENKUWNtOWtkV04wUkdGMFlVTnlaV1JsYm5ScFlXd2lYU3dpYVhOemRXVnlJanA3SW1sa0lqb2laR2xrT25kbFlqcG9aV0ZzZEdoNWRHOTBjeTV1WlhRaUxDSnVZVzFsSWpvaVNHVmhiSFJvZVNCVWIzUnpJbjBzSW1sa0lqb2lhSFIwY0hNNkx5OWpZbkIyYzNacGNDMTJZeTFoY0drdVozTXhkWE11YjNKbkwyTnlaV1JsYm5ScFlXeHpMekF3T0RZd01EQTFOelk1TkRFMElpd2lkbUZzYVdSR2NtOXRJam9pTWpBeU5DMHdPQzB5TVZReE9Eb3hOVG8xTXk0MU5EUmFJaXdpYm1GdFpTSTZJa2RUTVNCUWNtOWtkV04wSUVSaGRHRWdRM0psWkdWdWRHbGhiQ0lzSW1SbGMyTnlhWEIwYVc5dUlqb2lWRWhKVXlCSFV6RWdSRWxIU1ZSQlRDQk1TVU5GVGxORklFTlNSVVJGVGxSSlFVd2dTVk1nUms5U0lGUkZVMVJKVGtjZ1VGVlNVRTlUUlZNZ1QwNU1XUzRnVkdobElIQnliMlIxWTNRZ1pHRjBZU0JqY21Wa1pXNTBhV0ZzSUdseklIUm9aU0JXWlhKcFptbGhZbXhsSUVOeVpXUmxiblJwWVd3Z2RHaGhkQ0JwY3lCemFHRnlaV1FnZDJsMGFDQndZWEowYVdWeklHbHVkR1Z5WlhOMFpXUWdhVzRnZEdobElHSmhjMmxqSUdsdVptOXliV0YwYVc5dUlHRnpjMjlqYVdGMFpXUWdkMmwwYUNCaElIQnliMlIxWTNRZ1IxUkpUaTRpTENKamNtVmtaVzUwYVdGc1UzVmlhbVZqZENJNmV5SnBaQ0k2SW1oMGRIQnpPaTh2YVdRdVozTXhMbTl5Wnk4d01TOHdNRGcyTURBd05UYzJPVFF4TkNJc0ltdGxlVUYxZEdodmNtbDZZWFJwYjI0aU9pSmthV1E2YTJWNU9ubzJUV3RxU2t4aVV6TmxRVzFDUnpaQldEZEJkVkJuYWxabFJFNWtaM296TkdaRE4zQkdOVkpuYUhkWlRuVjBSU0lzSW5CeWIyUjFZM1FpT25zaVozTXhPbUp5WVc1a0lqcDdJbWR6TVRwaWNtRnVaRTVoYldVaU9pSklaV0ZzZEdoNUlGUnZkSE1pZlN3aVozTXhPbkJ5YjJSMVkzUkVaWE5qY21sd2RHbHZiaUk2SWxSbGMzUWdVSEp2WkhWamRDQXhJaXdpWjNNeE9tZHdZME5oZEdWbmIzSjVRMjlrWlNJNklqRXdNREF3TWpZMklpd2laM014T201bGRFTnZiblJsYm5RaU9uc2laM014T25aaGJIVmxJam9pTXlJc0ltZHpNVHAxYm1sMFEyOWtaU0k2SWt4Q1V5SjlMQ0puY3pFNmRHRnlaMlYwVFdGeWEyVjBJanA3SW1kek1UcDBZWEpuWlhSTllYSnJaWFJEYjNWdWRISnBaWE1pT2x0N0ltZHpNVHBqYjNWdWRISjVRMjlrWlNJNklrMVlJbjBzZXlKbmN6RTZZMjkxYm5SeWVVTnZaR1VpT2lKRFFTSjlMSHNpWjNNeE9tTnZkVzUwY25sRGIyUmxJam9pVlZNaWZWMTlmWDBzSW1OeVpXUmxiblJwWVd4VFkyaGxiV0VpT25zaWFXUWlPaUpvZEhSd2N6b3ZMMmxrTG1kek1TNXZjbWN2ZG1NdmMyTm9aVzFoTDNZeEwzQnliMlIxWTNSa1lYUmhJaXdpZEhsd1pTSTZJa3B6YjI1VFkyaGxiV0VpZlN3aVkzSmxaR1Z1ZEdsaGJGTjBZWFIxY3lJNmV5SnBaQ0k2SW1oMGRIQnpPaTh2YUdWaGJIUm9lWFJ2ZEhNdWJtVjBMM04wWVhSMWN5OWtOamd3TUdSaVl5MDVOVGN6TFRRMU1qSXRZbVkxTkMxa1kyVmhNamd4TTJVMk5qRXZNVEl3TURJaUxDSjBlWEJsSWpvaVFtbDBjM1J5YVc1blUzUmhkSFZ6VEdsemRFVnVkSEo1SWl3aWMzUmhkSFZ6VUhWeWNHOXpaU0k2SW5KbGRtOWpZWFJwYjI0aUxDSnpkR0YwZFhOTWFYTjBTVzVrWlhnaU9pSXhNakF3TWlJc0luTjBZWFIxYzB4cGMzUkRjbVZrWlc1MGFXRnNJam9pYUhSMGNITTZMeTlvWldGc2RHaDVkRzkwY3k1dVpYUXZjM1JoZEhWekwyUTJPREF3WkdKakxUazFOek10TkRVeU1pMWlaalUwTFdSalpXRXlPREV6WlRZMk1TOGlmWDAuTXJSY1VGYU1EUjZBQnNFY2FMZGRjcnNGV1JlbEdkUXRqVTJNS3J4OWFYVGQ4MHZ3TFdOeXo0SE11NUxNdExsSUM1by1ucGJfdTJaX0Y4SWc1b3dLdFEiLCJ0eXBlIjoiRW52ZWxvcGVkVmVyaWZpYWJsZUNyZWRlbnRpYWwifV19.qYqrlG0yaaiFEwB6TZRorEo5iRCnC8j5KWiC4cFr2DVe4YZu5F9KOin8QW5FeJiETVtkyGLLXqZbue9GL8J6Ig";
verifyVP(vpJwt)
  .then(result => {
    console.log('Verification Result:', JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('Verification Error:', error);
  });
*/