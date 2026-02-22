export interface Contact {
  name: string;
  phoneNumber: string;
}

export type TabType = 'contact' | 'names' | 'byName' | 'byNumber';

export interface SearchResult {
  name: string;
  phoneNumber: string;
  timestamp?: any;
}
