import { checkPrefixCredentialLicenseValue, checkCompanyPrefixCredentialLicenseValue, checkGTIN8PrefixCredentialLicenseValue } from "./subject/check-credential-license.js";
import { checkCredentialIdentificationKeyType } from "./subject/check-credential-identification-key-type.js";
import { checkCredentialKeyExtendsCredential } from "./subject/check-credential-key-extends.js";
import { validateExtendedCompanyPrefixCredential } from "./chain/validate-extended-company-prefix.js";
import { validateExtendedLicensePrefix } from "./chain/validate-extended-license-prefix.js";
import { validateExtendedKeyCredential, validateExtendedKeyDataCredential } from "./chain/validate-extended-data-key.js";
import { gs1CredentialValidationRuleResult, subjectLicenseValue } from "../gs1-rules-types.js";
import { credentialChainMetaData } from "../engine/validate-extended-credential.js";
import { VerifiableCredential } from "../types.js";

export type rulesEngineManagerConfig = {
    prefixLicense?: {(credentialSubject: subjectLicenseValue):  Promise<gs1CredentialValidationRuleResult>},
    companyPrefixLicense?: {(credentialSubject: subjectLicenseValue):  Promise<gs1CredentialValidationRuleResult>},
    gtin8PrefixLicense?: {(credentialSubject: subjectLicenseValue):  Promise<gs1CredentialValidationRuleResult>},
    identificationKeyType?: {(credentialSubject: any):  gs1CredentialValidationRuleResult},
    keyCredentialExtends?: {(credentialSubject: any, extendedCredential: VerifiableCredential):  gs1CredentialValidationRuleResult},
    GS1PrefixLicenseCredential?: {(credentialType: string, credentialChain: credentialChainMetaData):  Promise<gs1CredentialValidationRuleResult>},
    GS1CompanyPrefixLicenseCredential?: {(credentialType: string, credentialChain: credentialChainMetaData):  Promise<gs1CredentialValidationRuleResult>},
    KeyCredential?: {(credentialType: string, credentialChain: credentialChainMetaData):  Promise<gs1CredentialValidationRuleResult>},
    KeyDataCredential?: {(credentialType: string, credentialChain: credentialChainMetaData):  Promise<gs1CredentialValidationRuleResult>},
}

// Rules Engine Manager that handles GS1 Credential Rules validation
// Developer Notes: this is defined as dynamic object (any) for flexibility in calling the rules engine 
// eslint-disable-next-line
export const rulesEngineManager: any = {};

rulesEngineManager.prefixLicense = checkPrefixCredentialLicenseValue;
rulesEngineManager.companyPrefixLicense = checkCompanyPrefixCredentialLicenseValue;
rulesEngineManager.gtin8PrefixLicense = checkGTIN8PrefixCredentialLicenseValue;
rulesEngineManager.identificationKeyType = checkCredentialIdentificationKeyType;
rulesEngineManager.keyCredentialExtends = checkCredentialKeyExtendsCredential;
rulesEngineManager.GS1PrefixLicenseCredential  = validateExtendedLicensePrefix;
rulesEngineManager.GS1CompanyPrefixLicenseCredential  = validateExtendedCompanyPrefixCredential;
rulesEngineManager.KeyCredential  = validateExtendedKeyCredential;
rulesEngineManager.KeyDataCredential  = validateExtendedKeyDataCredential;
