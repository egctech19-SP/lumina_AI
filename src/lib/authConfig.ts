/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Auth configuration for Google and Microsoft OAuth integrations.
 */

// --- Google ---
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'email',
  'profile',
].join(' ');

// --- Microsoft / OneDrive ---
export const MICROSOFT_CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID || '';

export const msalConfig = {
  auth: {
    clientId: MICROSOFT_CLIENT_ID,
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ['User.Read', 'Files.Read', 'Files.ReadWrite'],
};
