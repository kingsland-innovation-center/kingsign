# Webhook Payload Examples

This document shows example webhook payloads that will be sent to notification integration endpoints.

## Document Updated Notification

Triggered when a document field is signed/updated.

```json
{
  "type": "document.updated",
  "document": {
    "_id": "64a1b2c3d4e5f6789012345",
    "title": "Contract Agreement 2024",
    "status": "pending",
    "note": "Please review and sign this agreement",
    "workspaceId": "64a1b2c3d4e5f6789012340",
    "templateId": "64a1b2c3d4e5f6789012341",
    "fileId": "64a1b2c3d4e5f6789012342",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T14:45:00.000Z",
    "documentFields": [
      {
        "_id": "64a1b2c3d4e5f6789012346",
        "documentId": "64a1b2c3d4e5f6789012345",
        "fieldId": "64a1b2c3d4e5f6789012347",
        "contactId": "64a1b2c3d4e5f6789012348",
        "value": "John Doe",
        "isSigned": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T14:45:00.000Z"
      },
      {
        "_id": "64a1b2c3d4e5f6789012349",
        "documentId": "64a1b2c3d4e5f6789012345",
        "fieldId": "64a1b2c3d4e5f6789012350",
        "contactId": "64a1b2c3d4e5f6789012351",
        "value": null,
        "isSigned": false,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  },
  "timestamp": "2024-01-15T14:45:30.123Z",
  "webhookId": "64a1b2c3d4e5f6789012352"
}
```

## Document Completed Notification

Triggered when all document fields are signed and the document status changes to "signed".

```json
{
  "type": "document.completed",
  "document": {
    "_id": "64a1b2c3d4e5f6789012345",
    "title": "Contract Agreement 2024",
    "status": "signed",
    "note": "Please review and sign this agreement",
    "workspaceId": "64a1b2c3d4e5f6789012340",
    "templateId": "64a1b2c3d4e5f6789012341",
    "fileId": "64a1b2c3d4e5f6789012342",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T15:00:00.000Z",
    "documentFields": [
      {
        "_id": "64a1b2c3d4e5f6789012346",
        "documentId": "64a1b2c3d4e5f6789012345",
        "fieldId": "64a1b2c3d4e5f6789012347",
        "contactId": "64a1b2c3d4e5f6789012348",
        "value": "John Doe",
        "isSigned": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T14:45:00.000Z"
      },
      {
        "_id": "64a1b2c3d4e5f6789012349",
        "documentId": "64a1b2c3d4e5f6789012345",
        "fieldId": "64a1b2c3d4e5f6789012350",
        "contactId": "64a1b2c3d4e5f6789012351",
        "value": "Jane Smith", 
        "isSigned": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T15:00:00.000Z"
      }
    ]
  },
  "timestamp": "2024-01-15T15:00:30.456Z",
  "webhookId": "64a1b2c3d4e5f6789012352"
}
```

## HTTP Headers

All webhook requests include the following headers:

- `Content-Type: application/json`
- `User-Agent: Kingsign-Webhook/1.0`
- `X-Webhook-Type: document.updated` or `document.completed`
- `X-Webhook-Source: kingsign`

## Webhook Response

Your webhook endpoint should respond with a 2xx status code to indicate successful receipt. 

- Response times should be under 10 seconds (requests timeout after 10 seconds)
- Non-2xx responses or timeouts will be logged as failed webhook deliveries
- No automatic retry mechanism is implemented

## Error Handling

- Failed webhook deliveries are logged but do not affect the main document signing process
- Integration URLs must be valid HTTP/HTTPS endpoints
- Only enabled integrations receive webhook notifications
- Integrations are filtered by workspace and notification type
