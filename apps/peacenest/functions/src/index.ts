/**
 * PeaceNest Cloud Functions
 * 
 * Entry point for Firebase Cloud Functions.
 * Exports the classify endpoint for content classification.
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export functions
export { classify } from './classify';
