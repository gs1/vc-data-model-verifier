"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vpVerifier_1 = require("../core/vpVerifier");
const test_1 = require("./test");
describe('Verifiable Presentation Verification', () => {
    it('should verify a valid VP', async () => {
        const result = await (0, vpVerifier_1.verifyVP)(test_1.inputJWT);
        console.log(JSON.stringify(result, null, 2));
        expect('valid' in result ? result.valid : result.verified).toBe(true);
    }, 20000);
});
