export const environment = {
  apiBaseUrl: (typeof window !== 'undefined' ? (window as any).env?.apiUrl : undefined) || 'http://localhost:8080'
};
