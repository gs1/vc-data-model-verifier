import { invalidAlternativeLicenseNotCompatible, invalidAlternativeLicenseNotSupported, invalidAlternativeLicenseValue, invalidLicenseValueFormat, invalidAlternativeLicenseEndsWith } from "../../engine/gs1-credential-errors.js";
import { gs1CredentialValidationRuleResult, subjectLicenseValue } from "../../gs1-rules-types.js";

// Check the Alternative License Value rule validation based on GS1 Digital Licenses Specification
// Rules:
// - Alternative License value MAY be included for any GS1 License Credential
// - If alternativeLicenseValue is present, licenseValue must END WITH alternateLicenseValue
// - This bridges canonical representations to compact representations for encoding into different symbologies
// Developer Notes: credentialSubject is defined as any because the credential subject is dynamic based on JSON-LD for a credential
export function checkCredentialAlternativeLicenseValue(credentialSubject: subjectLicenseValue): gs1CredentialValidationRuleResult {

    const value = credentialSubject.licenseValue;
    const altValue = credentialSubject.alternativeLicenseValue;

    if (!value) {
        return {verified: false, rule: invalidLicenseValueFormat};
    }

    // If alternative license value is present, check that license value ends with it
    if (altValue) {
        if (!value.endsWith(altValue)) {
            return {verified: false, rule: invalidAlternativeLicenseEndsWith};
        }
    }
  
    return {verified: true};
}

