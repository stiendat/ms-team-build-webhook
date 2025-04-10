// src/lib/webhookValidator.js
import crypto from 'crypto';

export function validateTeamsWebhook(authHeaderValue, messageContent, signingKey) {
    try {
        // Extract the provided HMAC from the Authorization header
        const providedHmacValue = authHeaderValue && authHeaderValue.startsWith('HMAC ')
            ? authHeaderValue.substring(5)  // Remove 'HMAC ' prefix
            : null;

        if (!providedHmacValue) {
            return { isValid: false, errorMessage: 'Missing HMAC signature in Authorization header' };
        }

        // Calculate HMAC using the message content and signing key
        const serializedPayloadBytes = Buffer.from(messageContent, 'utf-8');
        const keyBytes = Buffer.from(signingKey, 'base64');

        const hmac = crypto.createHmac('sha256', keyBytes);
        hmac.update(serializedPayloadBytes);
        const calculatedHmacValue = hmac.digest('base64');

        // Compare the calculated HMAC with the one provided in the request
        if (providedHmacValue === calculatedHmacValue) {
            return { isValid: true, errorMessage: null };
        } else {
            const errorMessage = `AuthHeaderValueMismatch. Expected:'${calculatedHmacValue}' Provided:'${providedHmacValue}'`;
            return { isValid: false, errorMessage };
        }
    } catch (error) {
        console.error('Exception occurred while verifying HMAC:', error);
        return { isValid: false, errorMessage: 'Exception thrown while verifying MAC on incoming request.' };
    }
}