import { Hook, HookContext } from '@feathersjs/feathers';
import { decryptApiKey } from '../utils/encryption';
import { apiKeyPrefix } from '../utils/constants';

/**
 * Helper function to extract API key from headers
 */
function getApiKeyFromHeaders(headers: any): string | null {
  // Try different possible header formats
  return headers?.['ks-api-key'] || 
         headers?.['ks-api-key'] || 
         headers?.['ks-api-key'] ||
         headers?.['ks-api-key'] ||
         null;
}

/**
 * Hook to extract and decrypt API key from ks-api-key header
 * Extracts the API key from the request header, removes the prefix, decrypts it,
 * and adds the decrypted workspace ID to context.data
 */
export const extractApiKey = (): Hook => {
  return async (context: HookContext) => {
    try {
      // Get the API key from the request headers
      const apiKeyHeader = getApiKeyFromHeaders(context.params?.headers);

      if (!apiKeyHeader) {
        // No API key provided, continue without it
        return context;
      }

      // Remove the prefix if present
      let encryptedApiKey = apiKeyHeader;
      if (apiKeyHeader.startsWith(apiKeyPrefix)) {
        encryptedApiKey = apiKeyHeader.substring(apiKeyPrefix.length);
      }

      // Decrypt the API key to get the workspace ID
      const workspaceId = decryptApiKey(encryptedApiKey);

      // Add the decrypted workspace ID to context.data
      if (!context.data) {
        context.data = {};
      }
      
      context.data.workspaceId = workspaceId;
      
      // Also add to params for easy access in other hooks/services
      if (!context.params) {
        context.params = {};
      }
      context.params.workspaceId = workspaceId;
      context.params.apiKey = apiKeyHeader;

    } catch (error) {
      // Log the error but don't throw - let the service handle invalid API keys
      console.error('Failed to extract/decrypt API key:', error);
      
      // Optionally, you can throw an error here if you want to reject requests with invalid API keys
      // throw new Error('Invalid API key provided');
    }

    return context;
  };
};

/**
 * Hook to extract and decrypt API key from ks-api-key header with error handling
 * Similar to extractApiKey but throws an error if the API key is invalid
 */
export const extractApiKeyWithValidation = (): Hook => {
  return async (context: HookContext) => {
    try {
      // Get the API key from the request headers
      const apiKeyHeader = getApiKeyFromHeaders(context.params?.headers);

      if (!apiKeyHeader) {
        throw new Error('API key is required in ks-api-key header');
      }

      // Remove the prefix if present
      let encryptedApiKey = apiKeyHeader;
      if (apiKeyHeader.startsWith(apiKeyPrefix)) {
        encryptedApiKey = apiKeyHeader.substring(apiKeyPrefix.length);
      }

      // Decrypt the API key to get the workspace ID
      const workspaceId = decryptApiKey(encryptedApiKey);

      // Add the decrypted workspace ID to context.data
      if (!context.data) {
        context.data = {};
      }
      
      context.data.workspaceId = workspaceId;
      
      // Also add to params for easy access in other hooks/services
      if (!context.params) {
        context.params = {};
      }
      context.params.workspaceId = workspaceId;
      context.params.apiKey = apiKeyHeader;

    } catch (error) {
      throw new Error(`Invalid API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return context;
  };
}; 