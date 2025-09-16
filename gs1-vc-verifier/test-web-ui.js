#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Your JWT
const jwt = 'eyJraWQiOiJkaWQ6d2ViOmNvbXBhbnktd2FsbGV0LWRldi5wcm9kLWs4cy5lZWNjLmRlOmFwaTpyZWdpc3RyeTpkaWQ6Z3MxX2dsb2JhbCN0ZXN0IiwiYWxnIjoiRVMyNTYifQ.eyJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIiwiR1MxUHJlZml4TGljZW5zZUNyZWRlbnRpYWwiXSwiaXNzdWVyIjp7ImlkIjoiZGlkOndlYjpjb21wYW55LXdhbGxldC1kZXYucHJvZC1rOHMuZWVjYy5kZTphcGk6cmVnaXN0cnk6ZGlkOmdzMV9nbG9iYWwiLCJuYW1lIjoiR1MxIEdsb2JhbCJ9LCJjcmVkZW50aWFsU3ViamVjdCI6eyJpZCI6ImRpZDp3ZWI6Y29tcGFueS13YWxsZXQtZGV2LnByb2QtazhzLmVlY2MuZGU6YXBpOnJlZ2lzdHJ5OmRpZDpnczFfdXRvcGlhIiwicmVuZGVyTWV0aG9kIjpbeyJuYW1lIjoiV2ViIERpc3BsYXkiLCJjc3MzTWVkaWFRdWVyeSI6IkBtZWRpYSAobWluLWFzcGVjdC1yYXRpbzogMy8xKSIsInR5cGUiOiJTdmdSZW5kZXJpbmdUZW1wbGF0ZSIsImlkIjoiaHR0cHM6Ly9nczEuZ2l0aHViLmlvL0dTMURpZ2l0YWxMaWNlbnNlcy90ZW1wbGF0ZXMvZ3MxLXNhbXBsZS1saWNlbnNlLXRlbXBsYXRlLnN2ZyJ9XSwibGljZW5zZVZhbHVlIjoiOTc0Iiwib3JnYW5pemF0aW9uIjp7ImdzMTpwYXJ0eUdMTiI6Ijk3NDAwMDAwMDAxIiwiZ3MxOm9yZ2FuaXphdGlvbk5hbWUiOiJHUzEgVXRvcGlhIn0sIm5hbWUiOiJHUzEgUHJlZml4IExpY2Vuc2UifSwiaWQiOiJodHRwczovL2NvbXBhbnktd2FsbGV0LWRldi5wcm9kLWs4cy5lZWNjLmRlL2FwaS9yZWdpc3RyeS92Yy9saWNlbnNlL2dzMV9wcmVmaXgvOTc0IiwiY3JlZGVudGlhbFN0YXR1cyI6W3siaWQiOiJodHRwczovL2NvbXBhbnktd2FsbGV0LWRldi5wcm9kLWs4cy5lZWNjLmRlL2FwaS9yZWdpc3RyeS9zdGF0dXMvcmV2b2NhdGlvbi80MzBmOGIyMy04ZmQ0LTRlOGQtYjcwMy1mZjI0ZGM4OTc3Y2YjNjExIiwidHlwZSI6IkJpdHN0cmluZ1N0YXR1c0xpc3RFbnRyeSIsInN0YXR1c1B1cnBvc2UiOiJyZXZvY2F0aW9uIiwic3RhdHVzTGlzdEluZGV4Ijo2MTEsInN0YXR1c0xpc3RDcmVkZW50aWFsIjoiaHR0cHM6Ly9jb21wYW55LXdhbGxldC1kZXYucHJvZC1rOHMuZWVjYy5kZS9hcGkvcmVnaXN0cnkvc3RhdHVzL3Jldm9jYXRpb24vNDMwZjhiMjMtOGZkNC00ZThkLWI3MDMtZmYyNGRjODk3N2NmIn1dLCJjcmVkZW50aWFsU2NoZW1hIjpbeyJpZCI6Imh0dHBzOi8vZ3MxLmdpdGh1Yi5pby9HUzFEaWdpdGFsTGljZW5zZXMvc2NoZW1hcy9wcmVmaXguanNvbiIsInR5cGUiOiJKc29uU2NoZW1hIn1dLCJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvbnMvY3JlZGVudGlhbHMvdjIiLCJodHRwczovL3JlZi5nczEub3JnL2dzMS92Yy9saWNlbnNlLWNvbnRleHQiXSwiaWF0IjoxNzU3NTg0Mzk5fQ.djhYa2Yv35b5zTnfsNEMWOPYqgLa5j_ByZiVrifFY1thV5BwucRleGzBeLtKY2V5XtN5mrkSG7cCBvMMz1XzXA';

// Test the web UI
async function testWebUI() {
  console.log('🧪 Testing Web UI with your JWT...\n');
  
  const postData = new URLSearchParams({
    jwt: jwt,
    mode: 'auto'
  }).toString();

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/verify',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('✅ Web UI Response received');
        console.log('Status Code:', res.statusCode);
        console.log('Response Length:', data.length);
        
        // Check if the response contains our expected results
        const hasSignatureVerification = data.includes('Signature verification:');
        const hasSchemaValidation = data.includes('Schema validation:');
        const hasRevocationCheck = data.includes('Revocation check:');
        const hasGS1Rules = data.includes('GS1 rules validation:');
        const hasSummary = data.includes('Summary');
        const hasJoseFallback = data.includes('jose fallback');
        const hasGS1Section = data.includes('GS1 Verified:');
        
        console.log('\n📊 UI Results Check:');
        console.log('✅ Signature verification section:', hasSignatureVerification);
        console.log('✅ Schema validation section:', hasSchemaValidation);
        console.log('✅ Revocation check section:', hasRevocationCheck);
        console.log('✅ GS1 rules validation section:', hasGS1Rules);
        console.log('✅ Summary section:', hasSummary);
        console.log('✅ Jose fallback indicator:', hasJoseFallback);
        console.log('✅ GS1 section:', hasGS1Section);
        
        if (hasSignatureVerification && hasSchemaValidation && hasRevocationCheck && hasGS1Rules && hasSummary) {
          console.log('\n🎉 SUCCESS: Web UI is showing all expected verification results!');
          console.log('🌐 Open http://localhost:3000 in your browser to see the full UI');
        } else {
          console.log('\n⚠️  Some sections may be missing from the UI response');
        }
        
        resolve(data);
      });
    });

    req.on('error', (err) => {
      console.error('❌ Error testing web UI:', err.message);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

// Run the test
testWebUI().catch(console.error);
