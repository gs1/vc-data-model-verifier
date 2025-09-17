import { invalidIdentificationKeyType, invalidIdentificationKeyTypeMissing } from "../../engine/gs1-credential-errors.js";
import { gs1CredentialValidationRuleResult, gs1IdentificationKeyType } from "../../gs1-rules-types.js";

// Check the Identification Key Type rule validation based on GS1 Digital Licenses Specification
// Rules:
// - identificationKeyType field MUST be present for GS1IdentificationKeyLicenseCredential
// - identificationKeyType must be one of the valid GS1 ID Key types
// Developer Notes: credentialSubject is defined as any because the credential subject is dynamic based on JSON-LD for a credential
export function checkCredentialIdentificationKeyType(credentialSubject: any): gs1CredentialValidationRuleResult {
    const identificationKeyType = credentialSubject.identificationKeyType;
    
    if (!identificationKeyType) {
        return {verified: false, rule: invalidIdentificationKeyTypeMissing};
    }
    
    const validTypes: gs1IdentificationKeyType[] = [
        "GTIN", "GLN", "SSCC", "GRAI", "GIAI", "GSRN", 
        "GDTI", "GINC", "GSIN", "GCN", "CPID", "GMN"
    ];
    
    if (!validTypes.includes(identificationKeyType)) {
        return {verified: false, rule: invalidIdentificationKeyType};
    }
    
    return {verified: true};
} 