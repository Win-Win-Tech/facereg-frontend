const DEFAULT_PROD_URL = 'https://apigatekeeper.cloudgentechnologies.com/api';
const DEFAULT_DEV_URL = 'http://127.0.0.1:8000/api';

export const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'development' ? DEFAULT_DEV_URL : DEFAULT_PROD_URL)
).replace(/\/$/, '');

export const AUTH_STORAGE_KEY = 'trueface_auth';

export default API_BASE_URL;

