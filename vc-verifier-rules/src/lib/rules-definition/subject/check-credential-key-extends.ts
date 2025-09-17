import { 
    invalidKeyCredentialExtendsCredential, 
    invalidKeyCredentialPrimaryKeyMatch, 
    invalidKeyCredentialIssuerMatch,
    invalidKeyCredentialParentKeyMatch,
    invalidKeyCredentialQualifierValidation
} from "../../engine/gs1-credential-errors.js";
import { gs1CredentialValidationRuleResult } from "../../gs1-rules-types.js";
import { VerifiableCredential } from "../../types.js";
import { 
    parseGS1DigitalLinkKeyInfo, 
    hasGS1DigitalLinkKeyQualifiers, 
    getGS1DigitalLinkPrimaryKey 
} from "./check-credential-subject-Id-digital-link.js";
import { getCredentialIssuer } from "../chain/shared-extended.js";

// Check the GS1 ID Key Credential extendsCredential validation based on GS1 Digital Licenses Specification
// Rules K-7 and K-8 from section 5.2 of the specification
// Developer Notes: credentialSubject is defined as any because the credential subject is dynamic based on JSON-LD for a credential
export function checkCredentialKeyExtendsCredential(
    credentialSubject: any, 
    extendedCredential: VerifiableCredential
): gs1CredentialValidationRuleResult {

    const digitalLinkId = credentialSubject?.id;
    const extendsCredentialValue = credentialSubject?.extendsCredential;

    if (!digitalLinkId || !extendsCredentialValue) {
        return {verified: false, rule: invalidKeyCredentialExtendsCredential};
    }

    // Parse the GS1 Digital Link to get primary key and qualifier information
    const keyInfo = parseGS1DigitalLinkKeyInfo(digitalLinkId);
    if (!keyInfo) {
        return {verified: false, rule: invalidKeyCredentialExtendsCredential};
    }

    const primaryKey = keyInfo.primaryKey;
    const hasKeyQualifiers = keyInfo.hasKeyQualifiers;

    // K-7: If D contains a GS1 Digital Link with primary Key PK and no key qualifiers
    if (!hasKeyQualifiers) {
        return validateKeyCredentialWithoutQualifiers(primaryKey, extendedCredential);
    }
    // K-8: If D contains a GS1 Digital Link with primary Key PK and one or more key qualifiers
    else {
        return validateKeyCredentialWithQualifiers(primaryKey, extendedCredential);
    }
}

// K-7: Validate key credential without qualifiers (must extend from GS1 License Credential)
function validateKeyCredentialWithoutQualifiers(
    primaryKey: string, 
    extendedCredential: VerifiableCredential
): gs1CredentialValidationRuleResult {

    // K-7.1: P MUST be a valid GS1 License Credential
    const extendedCredentialType = extendedCredential.type;
    const isLicenseCredential = Array.isArray(extendedCredentialType) && 
        extendedCredentialType.some(type => 
            type === "GS1PrefixLicenseCredential" || 
            type === "GS1CompanyPrefixLicenseCredential" ||
            type === "GS18PrefixLicenseCredential" ||
            type === "DelegatedGS1PrefixLicenseCredential" ||
            type === "GS1IdentificationKeyLicenseCredential" ||
            type === "DelegatedGS1IdentificationKeyLicenseCredential"
        );

    if (!isLicenseCredential) {
        return {verified: false, rule: invalidKeyCredentialExtendsCredential};
    }

    // K-7.2: The issuer of K MUST match the subject of P
    // Note: This validation is handled at the chain level, not here

    // K-7.3: PK MUST begin with (as a string) the licenseValue from P
    const licenseValue = extendedCredential.credentialSubject?.licenseValue;
    if (!licenseValue || !primaryKey.startsWith(licenseValue)) {
        return {verified: false, rule: invalidKeyCredentialPrimaryKeyMatch};
    }

    return {verified: true};
}

// K-8: Validate key credential with qualifiers (must extend from GS1 ID Key Credential)
function validateKeyCredentialWithQualifiers(
    primaryKey: string, 
    extendedCredential: VerifiableCredential
): gs1CredentialValidationRuleResult {

    // K-8.1: The issuer of K MUST match the issuer of P
    // Note: This validation is handled at the chain level, not here

    // K-8.2: P MUST be a valid GS1 ID Key Credential
    const extendedCredentialType = extendedCredential.type;
    const isKeyCredential = Array.isArray(extendedCredentialType) && 
        extendedCredentialType.includes("KeyCredential");

    if (!isKeyCredential) {
        return {verified: false, rule: invalidKeyCredentialQualifierValidation};
    }

    // K-8.3: The primary key of P's credentialSubject id MUST equal PK
    const extendedCredentialSubjectId = extendedCredential.credentialSubject?.id;
    if (!extendedCredentialSubjectId) {
        return {verified: false, rule: invalidKeyCredentialParentKeyMatch};
    }

    const extendedPrimaryKey = getGS1DigitalLinkPrimaryKey(extendedCredentialSubjectId);
    if (!extendedPrimaryKey || extendedPrimaryKey !== primaryKey) {
        return {verified: false, rule: invalidKeyCredentialParentKeyMatch};
    }

    // Additional validation: The extended credential should NOT have key qualifiers
    const extendedHasQualifiers = hasGS1DigitalLinkKeyQualifiers(extendedCredentialSubjectId);
    if (extendedHasQualifiers) {
        return {verified: false, rule: invalidKeyCredentialQualifierValidation};
    }

    return {verified: true};
} 