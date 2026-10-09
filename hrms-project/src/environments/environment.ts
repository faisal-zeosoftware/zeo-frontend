// v1.13.1: the API address comes from src/assets/env.js (window.ZEO_API_URL) so it can be set per server without a rebuild.
const w = window as any;
const host = window.location.hostname;
const auto = host === 'localhost' || host === '127.0.0.1' ? 'http://localhost:8000' : `${window.location.protocol}//${host}`;

export const environment = {
  production: false,
  apiBaseUrl: ((w.ZEO_API_URL as string) || auto).replace(/\/+$/, ''),
};
