import { invalidGS1DigitalLink, invalidGS1DigitalLink_sameAs } from "../../engine/gs1-credential-errors.js";
import { gs1CredentialValidationRuleResult, subjectId, subjectSameAs } from "../../gs1-rules-types.js";
import { gs1CredentialValidationRule } from "../../types.js";

export type gs1DigitalLinkValue = {
  isValid: boolean;
  type: "GLN" |"GTIN" | "Unknown";
  originalValue: string;
  parsedValue?: string;
  otherUriElements?: string[];
}

// NEW: Enhanced GS1 Digital Link parsing for ID Key Credentials
export type gs1DigitalLinkKeyInfo = {
  primaryKey: string;
  hasKeyQualifiers: boolean;
  keyQualifiers: string[];
  applicationIdentifier: string;
}

function checkForGS1DigitalLink(value: string  | undefined, validationRule: gs1CredentialValidationRule, ignoreNull: boolean) : gs1CredentialValidationRuleResult {
  if (!value) {
    if (ignoreNull) {
      return {verified: true};
    }
    return {verified: false, rule: validationRule};
  }

  const gs1DigitalLinkResult = parseGS1DigitalLink(value);
  return gs1DigitalLinkResult.isValid ? {verified: true} : {verified: false, rule: validationRule};
}

// Verify the Credential Subject sameAs is a valid GS1 Digital Link
export function checkCredentialSameAsDigitalLink(credentialSubject?: subjectSameAs): gs1CredentialValidationRuleResult {
  return checkForGS1DigitalLink(credentialSubject?.sameAs, invalidGS1DigitalLink_sameAs, true);
}

export function checkCredentialSubjectIdDigitalLink(credentialSubject?: subjectId): gs1CredentialValidationRuleResult {
  return checkForGS1DigitalLink(credentialSubject?.id, invalidGS1DigitalLink, false);
}

// GS1 Digital Link Application Identifiers
const GS1_DIGITAL_LINK_GTIN = "01";
const GS1_DIGITAL_LINK_GLN = "254";
const GS1_DIGITAL_LINK_PARTYGLN = "417";

// Determine the type of GS1 Digital Link
// Developer Notes: We are currently only supporting GLN and GTIN Types
export function gs1DigitalLinkType(typeValue: string) : "GLN" |"GTIN" | "Unknown" {

  if (typeValue === GS1_DIGITAL_LINK_GTIN) {
    return "GTIN";
  }

  if (typeValue === GS1_DIGITAL_LINK_GLN || typeValue === GS1_DIGITAL_LINK_PARTYGLN) {
    return "GLN";
  }

  return "Unknown";
}

// parse value into GS1 Digital Link URI elements
export function parseGS1DigitalLink(value?: string | URL) : gs1DigitalLinkValue {

  const ulrValue = value instanceof URL ? value.toString() : value ? value : '';
  if (value != null) {

    const subjectIdNoProtocol = ulrValue.replace("https://", "");
    const subjectIdParsed = subjectIdNoProtocol.split("/");
  
     if (subjectIdParsed.length >= 3) {
          return {
            isValid: true,
            type: gs1DigitalLinkType(subjectIdParsed[1]),
            originalValue: ulrValue,
            parsedValue: subjectIdParsed[2],
            otherUriElements: subjectIdParsed.slice(3)
          }
     }
  }

   return {
    isValid: false,
    originalValue: ulrValue,
    type: "Unknown"
  }

}

// NEW: Extract primary key and key qualifiers from GS1 Digital Link
// This function implements the logic described in section 4.2.6 of the GS1 Digital Licenses specification
export function parseGS1DigitalLinkKeyInfo(value?: string | URL): gs1DigitalLinkKeyInfo | null {
  const digitalLink = parseGS1DigitalLink(value);
  
  if (!digitalLink.isValid || !digitalLink.parsedValue) {
    return null;
  }

  const primaryKey = digitalLink.parsedValue;
  const otherElements = digitalLink.otherUriElements || [];
  
  // Check if there are key qualifiers (additional path segments after the primary key)
  const hasKeyQualifiers = otherElements.length > 0;
  const keyQualifiers = hasKeyQualifiers ? otherElements : [];

  return {
    primaryKey,
    hasKeyQualifiers,
    keyQualifiers,
    applicationIdentifier: digitalLink.type === "GTIN" ? "01" : 
                          digitalLink.type === "GLN" ? "254" : "417"
  };
}

// NEW: Check if a GS1 Digital Link has key qualifiers
export function hasGS1DigitalLinkKeyQualifiers(value?: string | URL): boolean {
  const keyInfo = parseGS1DigitalLinkKeyInfo(value);
  return keyInfo ? keyInfo.hasKeyQualifiers : false;
}

// NEW: Extract primary key from GS1 Digital Link
export function getGS1DigitalLinkPrimaryKey(value?: string | URL): string | null {
  const keyInfo = parseGS1DigitalLinkKeyInfo(value);
  return keyInfo ? keyInfo.primaryKey : null;
}