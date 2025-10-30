import { Hook, HookContext } from '@feathersjs/feathers';
import { safeEncryptApiKey, safeDecryptApiKey } from '../utils/encryption';

/**
 * Hook to encrypt API keys before saving to database
 * @param fieldName - The field name containing the API key (default: 'apiKey')
 */
export const encryptApiKeys = (fieldName: string = 'apiKey'): Hook => {
  return async (context: HookContext) => {
    // Handle create and update operations
    if (context.data && context.data[fieldName]) {
      context.data[fieldName] = safeEncryptApiKey(context.data[fieldName]);
    }
    
    // Handle patch operations
    if (context.params && context.params.query && context.params.query[fieldName]) {
      context.params.query[fieldName] = safeEncryptApiKey(context.params.query[fieldName]);
    }
    
    return context;
  };
};

/**
 * Hook to decrypt API keys after retrieving from database
 * @param fieldName - The field name containing the API key (default: 'apiKey')
 */
export const decryptApiKeys = (fieldName: string = 'apiKey'): Hook => {
  return async (context: HookContext) => {
    // Handle single result
    if (context.result && context.result[fieldName]) {
      context.result[fieldName] = safeDecryptApiKey(context.result[fieldName]);
    }
    
    // Handle multiple results (find operations)
    if (context.result && Array.isArray(context.result.data)) {
      context.result.data = context.result.data.map((item: any) => {
        if (item[fieldName]) {
          item[fieldName] = safeDecryptApiKey(item[fieldName]);
        }
        return item;
      });
    }
    
    // Handle direct array results
    if (context.result && Array.isArray(context.result)) {
      context.result = context.result.map((item: any) => {
        if (item[fieldName]) {
          item[fieldName] = safeDecryptApiKey(item[fieldName]);
        }
        return item;
      });
    }
    
    return context;
  };
};

/**
 * Hook to encrypt API keys in query parameters for find operations
 * @param fieldName - The field name containing the API key (default: 'apiKey')
 */
export const encryptApiKeyQueries = (fieldName: string = 'apiKey'): Hook => {
  return async (context: HookContext) => {
    if (context.params && context.params.query && context.params.query[fieldName]) {
      context.params.query[fieldName] = safeEncryptApiKey(context.params.query[fieldName]);
    }
    return context;
  };
}; 