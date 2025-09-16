// import * as transmute from '@transmute/verifiable-credentials';
// import { resolver } from './resolver';
// import { splitJwt } from './input';

// export async function verifySignature(inputJwt: string) {
//   try {
//     // using transmute verifier with custom resolver
//     const verified = await transmute
//       .verifier({
//         resolver: resolver,
//       })
//       .verify<transmute.VerifiableCredentialWithIssuerObject>({
//         type: 'application/vc-ld+jwt',
//         content: transmute.text.encoder.encode(inputJwt),
//       });

//     // output in the desired format
//     return {
//       issuer: verified.issuer,
//       type: verified.type,
//       credentialSubject: verified.credentialSubject,
//       validFrom: verified.validFrom,
//       '@context': verified['@context'],
//       credentialStatus: verified.credentialStatus,
//     };
//   } catch (error) {
//     console.error('Verification failed:', error);
//     throw error;
//   }
// }

// // Example usage (uncomment to test):
// (async () => {
//   const inputJwt = 'eyJraWQiOiJkaWQ6d2ViOmlkLmdzMS5vcmcjZndfaFJ2d2R0Si1MZ0prNW1TQmNkWFlmWmlnWTBZc3Z6MWhPQS0tMXRoSSIsImFsZyI6IkVTMjU2In0.eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvbnMvY3JlZGVudGlhbHMvdjIiLCJodHRwczovL3JlZi5nczEub3JnL2dzMS92Yy9saWNlbnNlLWNvbnRleHQiXSwiaWQiOiJodHRwczovL2lkLmdzMS5vcmcvdmMvbGljZW5zZS9nczFfcHJlZml4LzA4IiwidHlwZSI6WyJWZXJpZmlhYmxlQ3JlZGVudGlhbCIsIkdTMVByZWZpeExpY2Vuc2VDcmVkZW50aWFsIl0sImlzc3VlciI6eyJpZCI6ImRpZDp3ZWI6aWQuZ3MxLm9yZyIsIm5hbWUiOiJHUzEgR2xvYmFsIn0sIm5hbWUiOiJHUzEgUHJlZml4IExpY2Vuc2UiLCJkZXNjcmlwdGlvbiI6IkZPUiBERU1PTlNUUkFUSU9OIFBVUlBPU0VTIE9OTFk6IE5PVCBUTyBCRSBVU0VEIEZPUiBQUk9EVUNUSU9OIEdSQURFIFNZU1RFTVMhIEEgY29tcGFueSBwcmVmaXggdGhhdCBjb21wbGllcyB3aXRoIEdTMSBTdGFuZGFyZHMgKGEg4oCcR1MxIENvbXBhbnkgUHJlZml44oCdKSBpcyBhIHVuaXF1ZSBpZGVudGlmaWNhdGlvbiBudW1iZXIgdGhhdCBpcyBhc3NpZ25lZCB0byBqdXN0IHlvdXIgY29tcGFueSBieSBHUzEgVVMuIEl04oCZcyB0aGUgZm91bmRhdGlvbiBvZiBHUzEgU3RhbmRhcmRzIGFuZCBjYW4gYmUgZm91bmQgaW4gYWxsIG9mIHRoZSBHUzEgSWRlbnRpZmljYXRpb24gTnVtYmVycy4iLCJ2YWxpZEZyb20iOiIyMDI0LTAxLTI1VDEyOjMwOjAwLjAwMFoiLCJjcmVkZW50aWFsU3ViamVjdCI6eyJpZCI6ImRpZDp3ZWI6Y2JwdnN2aXAtdmMuZ3MxdXMub3JnIiwib3JnYW5pemF0aW9uIjp7ImdzMTpwYXJ0eUdMTiI6IjA2MTQxNDEwMDAwMDUiLCJnczE6b3JnYW5pemF0aW9uTmFtZSI6IkdTMSBVUyJ9LCJsaWNlbnNlVmFsdWUiOiIwOCIsImFsdGVybmF0aXZlTGljZW5zZVZhbHVlIjoiOCJ9LCJjcmVkZW50aWFsU2NoZW1hIjp7ImlkIjoiaHR0cHM6Ly9pZC5nczEub3JnL3ZjL3NjaGVtYS92MS9wcmVmaXgiLCJ0eXBlIjoiSnNvblNjaGVtYSJ9LCJjcmVkZW50aWFsU3RhdHVzIjp7ImlkIjoiaHR0cHM6Ly9pZC5nczEub3JnL3ZjL3N0YXR1cy8xIzEwOCIsInR5cGUiOiJCaXRzdHJpbmdTdGF0dXNMaXN0RW50cnkiLCJzdGF0dXNQdXJwb3NlIjoicmV2b2NhdGlvbiIsInN0YXR1c0xpc3RJbmRleCI6IjEwOCIsInN0YXR1c0xpc3RDcmVkZW50aWFsIjoiaHR0cHM6Ly9pZC5nczEub3JnL3ZjL3N0YXR1cy8xIn19.VskuDGd3QtlV8jCWV6NqvFLgKK-DnfAnzuORDvbRsV64De_l2jwzg1ctJveeRbw-ykZjpG7Pl5JbukbJRE58Kg';
//   const result = await verifySignature(inputJwt);
//   console.log('Verification Result:', result);
// })();
