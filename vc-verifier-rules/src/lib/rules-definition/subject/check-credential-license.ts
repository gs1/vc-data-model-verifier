import { invalidLicenseValueFormat, invalidLicenseValueLength } from "../../engine/gs1-credential-errors.js";
import { LicenseValueMinMax, gs1CredentialValidationRuleResult, subjectLicenseValue } from "../../gs1-rules-types.js";

// Check the License Value rule validation based on GS1 Digital Licenses Specification
// Rules:
// 1. The License Value must be numeric
// 2. The License Value must be within the specified character length range
// 3. Different credential types have different length requirements:
//    - GS1PrefixLicenseCredential: 2-7 digits
//    - GS1CompanyPrefixLicenseCredential: 4-12 digits
//    - GS18PrefixLicenseCredential: 2-7 digits
// Developer Notes: credentialSubject is defined as any because the credential subject is dynamic based on JSON-LD for a credential
export async function checkCredentialLicenseValue(credentialSubject: subjectLicenseValue, licenseLength: LicenseValueMinMax = { miniumLength: 3, maximumLength: 14 }): Promise<gs1CredentialValidationRuleResult> {

    if (!credentialSubject?.licenseValue) {
        return {verified: false, rule: invalidLicenseValueFormat};
    }

    const value = credentialSubject.licenseValue;

    if (isNaN(+value)) {
        return {verified: false, rule: invalidLicenseValueFormat};
    }

    if (value.length < licenseLength.miniumLength || value.length > licenseLength.maximumLength) {
        return {verified: false, rule: invalidLicenseValueLength};
    } 

    return {verified: true};
}

// Check prefix credential license value (2-7 digits for GS1PrefixLicenseCredential)
export async function checkPrefixCredentialLicenseValue(credentialSubject: subjectLicenseValue): Promise<gs1CredentialValidationRuleResult> {
    return checkCredentialLicenseValue(credentialSubject, { miniumLength: 2, maximumLength: 7 }) // UPDATED: was 2-4
}

// Check company prefix credential license value (4-12 digits for GS1CompanyPrefixLicenseCredential)
export async function checkCompanyPrefixCredentialLicenseValue(credentialSubject: subjectLicenseValue): Promise<gs1CredentialValidationRuleResult> {
    return checkCredentialLicenseValue(credentialSubject, { miniumLength: 4, maximumLength: 12 }) // UPDATED: was 3-14
}

// Check GTIN8 prefix credential license value (2-7 digits for GS18PrefixLicenseCredential)
export async function checkGTIN8PrefixCredentialLicenseValue(credentialSubject: subjectLicenseValue): Promise<gs1CredentialValidationRuleResult> {
    return checkCredentialLicenseValue(credentialSubject, { miniumLength: 2, maximumLength: 7 })
}