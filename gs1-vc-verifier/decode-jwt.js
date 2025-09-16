#!/usr/bin/env node

/*
Decode JWT to check its structure
*/

import { splitJwt } from './dist/core/input.js';

// Your test JWT
const testJwt = 'eyJraWQiOiJ0ZXN0IiwiYWxnIjoiRVMyNTYifQ.eyJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiR1MxUHJlZml4TGljZW5zZUNyZWRlbnRpYWwiXSwiaXNzdWVyIjp7ImlkIjoiZGlkOndlYjpjb21wYW55LXdhbGxldC1kZXYucHJvZC1rOHMuZWVjYy5kZTphcGk6cmVnaXN0cnk6ZGlkOmdzMV9nbG9iYWwiLCJuYW1lIjoiR1MxIEdsb2JhbCJ9LCJjcmVkZW50aWFsU3ViamVjdCI6eyJpZCI6ImRpZDp3ZWI6Y29tcGFueS13YWxsZXQtZGV2LnByb2QtazhzLmVlY2MuZGU6YXBpOnJlZ2lzdHJ5OmRpZDpnczFfZ2VybWFueSIsImFsdGVybmF0aXZlTGljZW5zZVZhbHVlIjoiIiwibGljZW5zZVZhbHVlIjoiNDEiLCJvcmdhbml6YXRpb24iOnsiZ3MxOnBhcnR5R0xOIjoiNDAwMDAwMTAwMDAwNSIsImdzMTpvcmdhbml6YXRpb25OYW1lIjoiR1MxIEdlcm1hbnkifSwibmFtZSI6IkdTMSBQcmVmaXggTGljZW5zZSJ9LCJpZCI6Imh0dHBzOi8vY29tcGFueS13YWxsZXQtZGV2LnByb2QtazhzLmVlY2MuZGUvYXBpL3JlZ2lzdHJ5L3ZjL2xpY2Vuc2UvZ3MxX3ByZWZpeC80MSIsImNyZWRlbnRpYWxTdGF0dXMiOlt7ImlkIjoiaHR0cHM6Ly9jb21wYW55LXdhbGxldC1kZXYucHJvZC1rOHMuZWVjYy5kZS9hcGkvcmVnaXN0cnkvc3RhdHVzL3Jldm9jYXRpb24vZmVjOTRhZjMtZWU5Ny00NWU2LTg2MmItNTkxMGRmNWM4NGMyIzY0NDMiLCJ0eXBlIjoiQml0c3RyaW5nU3RhdHVzTGlzdEVudHJ5Iiwic3RhdHVzUHVycG9zZSI6InJldm9jYXRpb24iLCJzdGF0dXNMaXN0SW5kZXgiOjY0NDMsInN0YXR1c0xpc3RDcmVkZW50aWFsIjoiaHR0cHM6Ly9jb21wYW55LXdhbGxldC1kZXYucHJvZC1rOHMuZWVjYy5kZS9hcGkvcmVnaXN0cnkvc3RhdHVzL3Jldm9jYXRpb24vZmVjOTRhZjMtZWU5Ny00NWU2LTg2MmItNTkxMGRmNWM4NGMyIn1dLCJjcmVkZW50aWFsU2NoZW1hIjpbeyJpZCI6Imh0dHBzOi8vZ3MxLmdpdGh1Yi5pby9HUzFEaWdpdGFsTGljZW5zZXMvc2NoZW1hcy9wcmVmaXguanNvbiIsInR5cGUiOiJKc29uU2NoZW1hIn1dLCJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvbnMvY3JlZGVudGlhbHMvdjIiLCJodHRwczovL3JlZi5nczEub3JnL2dzMS92Yy9saWNlbnNlLWNvbnRleHQiXSwiaWF0IjoxNzU3NTEzNzM0fQ.n5spdU86NrfSkkZk8HUvBl6fLW0BTngJovjmu2M_bEaJs6069gCvgtVnS-rarQ72g7DheElT9FSv-US5sNGbvg';

console.log('=== JWT DECODING ===\n');

try {
  const { header, payload, signature } = splitJwt(testJwt);
  
  console.log('Header:');
  console.log(JSON.stringify(header, null, 2));
  
  console.log('\nPayload:');
  console.log(JSON.stringify(payload, null, 2));
  
  console.log('\nSignature:');
  console.log(signature);
  
  console.log('\nJWT Structure:');
  console.log(`Header: ${header ? 'Valid' : 'Invalid'}`);
  console.log(`Payload: ${payload ? 'Valid' : 'Invalid'}`);
  console.log(`Signature: ${signature ? 'Present' : 'Missing'}`);
  
} catch (error) {
  console.log('Error decoding JWT:', error.message);
}
