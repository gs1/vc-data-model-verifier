import { invalidIssuer, invalidIssuerSubjectMatch } from "../../engine/gs1-credential-errors.js";
import { credentialChainMetaData } from "../../engine/validate-extended-credential.js";
import { gs1RulesResult } from "../../types.js";
import { parseGS1DigitalLink } from "../subject/check-credential-subject-Id-digital-link.js";
import { gs1KeyCredentialType } from "../types/gs1-key-type.js";
import { getCredentialIssuer } from "./shared-extended.js";

// Validate the extended credentials for Company Prefix Credential
export async function validateExtendedCompanyPrefixCredential(credentialType: string, 
    credentialChain: credentialChainMetaData): Promise<gs1RulesResult> {

    const gs1CredentialCheck: gs1RulesResult = { credentialId: credentialChain.credential.id, credentialName: credentialType, verified: true, errors: []};

    const credential = credentialChain.credential;
    const credentialSubject = credential.credentialSubject;
    const extendedCredential = credentialChain.extendedCredentialChain?.credential;

    if (!extendedCredential) {
        gs1CredentialCheck.verified = false;
        gs1CredentialCheck.errors.push(invalidIssuer);
        return gs1CredentialCheck;
    }

    // GL-4 - Extended credential subject ID must match current credential issuer
    const extendedCredentialSubjectId = extendedCredential.credentialSubject?.id;
    const currentIssuer = getCredentialIssuer(credential);
    if (extendedCredentialSubjectId !== currentIssuer) {
        gs1CredentialCheck.verified = false;
        gs1CredentialCheck.errors.push(invalidIssuerSubjectMatch);
        return gs1CredentialCheck;
    }

    // Verify company prefix partyGLN value with parsed digital link from key credential
    const keyValue = parseGS1DigitalLink(credentialSubject.id);

    if (keyValue.isValid) {
        const companyPrefixValue = credentialSubject.licenseValue;
        if (companyPrefixValue) {
            const keyValueParsed = keyValue.parsedValue;
            if (keyValueParsed && !keyValueParsed.startsWith(companyPrefixValue)) {
                gs1CredentialCheck.verified = false;
                gs1CredentialCheck.errors.push(invalidIssuer);
            }
        }
    }

    if (gs1CredentialCheck.errors.length > 0) {
        gs1CredentialCheck.verified = false;
    }

    return gs1CredentialCheck;
}

