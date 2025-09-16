"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusList = void 0;
const Bitstring_1 = require("./Bitstring");
const statusListCredentialTemplate = {
    '@context': [
        'https://www.w3.org/ns/credentials/v2'
    ],
    id: 'https://example.com/credentials/status/3',
    type: ['VerifiableCredential', 'BitstringStatusListCredential'],
    issuer: 'did:example:12345',
    validFrom: '2021-04-05T14:27:40Z',
    credentialSubject: {
        id: 'https://example.com/status/3#list',
        type: 'BitstringStatusList',
        statusPurpose: 'revocation',
        encodedList: 'H4sIAAAAAAAAA-3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAIC3AYbSVKsAQAAA',
    },
};
class StatusList {
}
exports.StatusList = StatusList;
_a = StatusList;
StatusList.Bitstring = Bitstring_1.Bitstring;
StatusList.defaultLength = 131072;
StatusList.create = async ({ id, length, purpose, }) => {
    const template = JSON.parse(JSON.stringify(statusListCredentialTemplate));
    template.id = id;
    template.credentialSubject.id = id + '#list';
    template.credentialSubject.statusPurpose = purpose;
    template.credentialSubject.encodedList = await new Bitstring_1.Bitstring({
        length,
    }).encodeBits();
    return template;
};
StatusList.updateStatus = async ({ claimset, position, purpose, status, }) => {
    if (!claimset.credentialSubject) {
        throw new Error('claimset is not of RDF type BitstringStatusListCredential');
    }
    const statuListCredential = claimset;
    if (statuListCredential.credentialSubject.statusPurpose !== purpose) {
        throw new Error('claimset is not for RDF purpose ' + purpose);
    }
    const bs = new Bitstring_1.Bitstring({
        buffer: await Bitstring_1.Bitstring.decodeBits({
            encoded: statuListCredential.credentialSubject.encodedList,
        }),
    });
    bs.set(position, status);
    statuListCredential.credentialSubject.encodedList = await bs.encodeBits();
    return statuListCredential;
};
StatusList.checkStatus = async ({ claimset, purpose, position, }) => {
    if (!claimset.credentialSubject) {
        throw new Error('claimset is not of RDF type BitstringStatusListCredential');
    }
    const statuListCredential = claimset;
    if (statuListCredential.credentialSubject.statusPurpose !== purpose) {
        throw new Error('claimset is not for RDF purpose ' + purpose);
    }
    const bs = new Bitstring_1.Bitstring({
        buffer: await Bitstring_1.Bitstring.decodeBits({
            encoded: statuListCredential.credentialSubject.encodedList,
        }),
    });
    return bs.get(position);
};
