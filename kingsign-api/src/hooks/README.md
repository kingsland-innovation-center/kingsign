# Hooks

This directory contains custom hooks for the Kingsign API.

## Available Hooks

### extract-api-key

Extracts and decrypts API keys from the `ks-api-key` request header.

**Exports:**
- `extractApiKey()` - Extracts API key without validation (continues if missing/invalid)
- `extractApiKeyWithValidation()` - Extracts API key with validation (throws error if missing/invalid)

**Usage:**

```typescript
import { extractApiKey, extractApiKeyWithValidation } from '../hooks/extract-api-key';

// In your service hooks file:
export default {
  before: {
    all: [authenticate('jwt')],
    find: [extractApiKey()], // Optional API key
    get: [extractApiKeyWithValidation()], // Required API key
    create: [extractApiKey()],
    update: [extractApiKey()],
    patch: [extractApiKey()],
    remove: [extractApiKey()]
  },
  // ... rest of hooks
};
```

**What it does:**
1. Extracts the API key from the `ks-api-key` header
2. Removes the `sk_live_` prefix if present
3. Decrypts the API key to get the workspace ID
4. Adds the workspace ID to `context.data.workspaceId` and `context.params.workspaceId`

**Example API key format:**
```
ks-api-key: sk_live_<encrypted-workspace-id>
```

### encrypt-api-keys

Encrypts and decrypts API keys for database storage.

**Exports:**
- `encryptApiKeys(fieldName?)` - Encrypts API keys before saving
- `decryptApiKeys(fieldName?)` - Decrypts API keys after retrieval
- `encryptApiKeyQueries(fieldName?)` - Encrypts API keys in query parameters

### authenticate-public-sign

Handles authentication for public document signing.

## Usage Examples

### Using extractApiKey in a service

```typescript
// In your service class
async find(params?: Params) {
  // The workspaceId is now available from the hook
  const workspaceId = params?.workspaceId;
  
  if (workspaceId) {
    // Filter results by workspace
    params.query = { ...params.query, workspaceId };
  }
  
  return super.find(params);
}
```

### Combining hooks

```typescript
import { extractApiKey } from '../hooks/extract-api-key';
import { encryptApiKeys, decryptApiKeys } from '../hooks/encrypt-api-keys';

export default {
  before: {
    all: [authenticate('jwt')],
    find: [extractApiKey(), encryptApiKeyQueries()],
    create: [extractApiKey(), encryptApiKeys()],
    // ... other methods
  },
  after: {
    all: [],
    find: [decryptApiKeys()],
    get: [decryptApiKeys()],
    // ... other methods
  }
};
``` 