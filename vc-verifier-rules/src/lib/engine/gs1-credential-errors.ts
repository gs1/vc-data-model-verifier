// GS1 Credential Error Codes
export const invalidGS1CredentialTypes = { code: "GS1-100", rule: 'The type of this license credential is not in the list of valid license credential types.'};
export const invalidExtendedGS1Credential =  { code: "GS1-110", rule: 'The extended credential must be a GS1 License credential.'};
export const invalidExtendedCredentialMissing = { code: "GS1-120", rule: 'Required extended license credential is missing to validate GS1 Extended Credentials Chain.'};
export const invalidRootCredentialType =  { code: "GS1-130", rule: 'The root credential type muts be a GS1PrefixLicenseCredential.'};
export const invalidIssueForPrefixLicense = { code: "GS1-140", rule: 'The issuer of prefix license credential does not match the expected value.'};
export const invalidIssuer = { code: "GS1-150", rule: 'The issuer of this license credential does not match the expected value.'};
export const invalidLicenseValueStart = { code: "GS1-200", rule: 'The license value doesn\'t start with the expected value.'};
export const invalidLicenseValueStartPrefix = { code: "GS1-201", rule: 'License value does not start with the correct prefix value.'};
export const invalidLicenseValueFormat = { code: "GS1-202", rule: 'The license value format is not valid.'};
export const invalidAlternativeLicenseValue = { code: "GS1-203", rule: 'The alternative license value has not been specified.'};
export const invalidAlternativeLicenseNotCompatible = { code: "GS1-204", rule: 'The alternative license value is not compatible with the license value.'};
export const invalidAlternativeLicenseNotSupported = { code: "GS1-205", rule: 'An alternative license value is not supported.'};
export const invalidIdentificationKeyType =  { code: "GS1-206", rule: 'The identification key type of this license credential does not match the expected value.'};
export const dataMissingProduct = { code: "GS1-207", rule: 'Required Field for GS1 product are missing.'};
export const invalidOrganization = { code: "GS1-208", rule: 'Required Field for GS1 organization are missing.'};
export const missingSubjectId = { code: "GS1-209", rule: 'Credential Subject Id is required.'};
export const invalidSubjectId = { code: "GS1-210", rule: 'Credential Subject Id is not a valid URI or DID.'};
export const invalidIdentityKeyTypeValue = { code: "GS1-211", rule: 'The specified identity key type value is not supported.'};
export const invalidIssueSubject = { code: "GS1EX-212", rule: 'License value does not start with the correct prefix value.'};
export const invalidGS1DigitalLink = { code: "GS1-213", rule: 'Credential Subject Id must be a GS1 Digital Link.'};
export const invalidGS1DigitalLink_sameAs = { code: "GS1-214", rule: 'Credential Subject sameAs must be a GS1 Digital Link.'};
// NEW ERROR CODES FOR GS1 DIGITAL LICENSES SPECIFICATION
export const invalidIdentificationKeyTypeMissing = { code: "GS1-215", rule: 'The identificationKeyType field is required for GS1IdentificationKeyLicenseCredential.'};
export const invalidGTIN8PrefixLicense = { code: "GS1-216", rule: 'GTIN8 Prefix License must be issued by GS1 Global Office.'};
export const invalidDelegatedLicense = { code: "GS1-217", rule: 'Delegated license validation failed.'};
export const invalidIssuerSubjectMatch = { code: "GS1-218", rule: 'The extended credential subject ID must match the current credential issuer.'};
export const invalidAlternativeLicenseEndsWith = { code: "GS1-219", rule: 'The license value must end with the alternative license value.'};
export const invalidLicenseValueLength = { code: "GS1-220", rule: 'The license value length is not within the required range.'};
export const invalidIssuerNotGS1GO = { code: "GS1-221", rule: 'The issuer must be a GS1 Global Office DID.'};
// NEW ERROR CODES FOR GS1 ID KEY CREDENTIALS VALIDATION
export const invalidKeyCredentialExtendsCredential = { code: "GS1-222", rule: 'The extendsCredential property does not properly reference a valid GS1 License or ID Key Credential.'};
export const invalidKeyCredentialPrimaryKeyMatch = { code: "GS1-223", rule: 'The primary key does not match the license value from the extended credential.'};
export const invalidKeyCredentialIssuerMatch = { code: "GS1-224", rule: 'The issuer of the key credential does not match the subject of the extended credential.'};
export const invalidKeyCredentialParentKeyMatch = { code: "GS1-225", rule: 'The primary key of the parent key credential does not match the current key credential.'};
export const invalidKeyCredentialQualifierValidation = { code: "GS1-226", rule: 'Key credential with qualifiers must extend from another key credential without qualifiers.'};
export const dataMissingToValidateCredentialChain =  { code: "GS1-300", rule: 'One or more subject fields are missing or invalid. Can not validate credential chain.'};
export const dataMismatchBetweenPartyDataKeyCredential =  { code: "GS1-310", rule: 'The partyGLN does not match the GLN in the Key Credential.'};
export const dataMismatchBetweenDataKeyCredential =  { code: "GS1-320", rule: 'The data credential GS1 Digital Link does not match the Id in the Key Credential.'};
export const unsupportedCredentialChain =  { code: "GS1-330", rule: 'The credential chain is not supported.'};

// Verifier Error Codes
export const verificationErrorCode = "VC-100";

// Local Code Must override --requiredField-- 
export const requiredFieldMissing = { code: "GS1-500", rule: `Required field --requiredField-- is missing.`};

// Generic Error Codes 
export const errorResolveCredentialCode = "GS1-010";

