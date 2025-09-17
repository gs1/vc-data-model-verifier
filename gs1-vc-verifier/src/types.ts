export interface CreateStatusList {
  id: string;
  length?: number;
  purpose: string;
}

export interface UpdateStatusList {
  claimset: BitstringStatusListCredential;
  position: number;
  purpose: string;
  status: boolean;
}

export interface CheckStatusList {
  claimset: BitstringStatusListCredential;
  purpose: string;
  position: number;
}

export interface BitstringStatusListCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string;
  validFrom: string;
  credentialSubject: {
    id: string;
    type: string;
    statusPurpose: string;
    encodedList: string;
  };
} 
