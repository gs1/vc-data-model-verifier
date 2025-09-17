export const gs1CredentialChainRules = {
    genericCredentialSchema: {
        title: "genericCredentialSchema",
        extendsCredentialType: { type: [], rule: ""},
        childCredential: undefined
    },
    GS1PrefixLicenseCredential: {
        title: "GS1PrefixLicenseCredential",
        extendsCredentialType: undefined,
        childCredential: {
            "type": ["GS1CompanyPrefixLicenseCredential", "GS1IdentificationKeyLicenseCredential"]
        }
    },
    GS1CompanyPrefixLicenseCredential: {
        title: "GS1CompanyPrefixLicenseCredential",
        extendsCredentialType: { type: ["GS1PrefixLicenseCredential"], rule: "GS1PrefixLicenseCredential"},
        childCredential: {
            "type": ["KeyCredential"]
          }
    },
    KeyCredential: {
        title: "KeyCredential",
        extendsCredentialType: { type: ["GS1CompanyPrefixLicenseCredential", "GS1IdentificationKeyLicenseCredential"], rule: "GS1CompanyPrefixLicenseCredential"},
        childCredential: {
            "type": ["OrganizationDataCredential", "ProductDataCredential"]
        }
    },
    OrganizationDataCredential: {
        title: "OrganizationDataCredential",
        extendsCredentialType: { type: ["KeyCredential"], rule: "KeyCredential"},
        childCredential: undefined
    },
    ProductDataCredential: {
        title: "ProductDataCredential",
        extendsCredentialType: { type: ["KeyCredential"], rule: "KeyDataCredential"},
        childCredential: undefined
    },
    // NEW CREDENTIAL CHAIN RULES FROM GS1 DIGITAL LICENSES SPECIFICATION
    GS18PrefixLicenseCredential: {
        title: "GS18PrefixLicenseCredential",
        extendsCredentialType: undefined, // No extends credential - issued directly by GO
        childCredential: {
            "type": ["GS1IdentificationKeyLicenseCredential"]
        }
    },
    DelegatedGS1PrefixLicenseCredential: {
        title: "DelegatedGS1PrefixLicenseCredential",
        extendsCredentialType: undefined, // No extends credential - special delegation
        childCredential: {
            "type": ["GS1CompanyPrefixLicenseCredential"]
        }
    },
    DelegatedGS1IdentificationKeyLicenseCredential: {
        title: "DelegatedGS1IdentificationKeyLicenseCredential",
        extendsCredentialType: { type: ["DelegatedGS1PrefixLicenseCredential"], rule: "DelegatedGS1PrefixLicenseCredential"},
        childCredential: undefined
    }
}
