export interface UniversityRawData {
  name: string;
  country: string;
  alpha_two_code: string;
  domains: string[];
  web_pages: string[];
  'state-province': string | null;
}

export interface University {
  name: string;
  country: string;
  alphaTwoCode: string;
  domains: string[];
  webPages: string[];
  stateProvince: string | null;
} 