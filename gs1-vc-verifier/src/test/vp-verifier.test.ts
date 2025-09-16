import { verifyVP } from '../core/vpVerifier';
import { inputJWT } from './test';

describe('Verifiable Presentation Verification', () => {
  it('should verify a valid VP', async () => {
    const result = await verifyVP(inputJWT);
    console.log(JSON.stringify(result, null, 2));

    expect('valid' in result ? result.valid : result.verified).toBe(true);
  }, 20000);
});
