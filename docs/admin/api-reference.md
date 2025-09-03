# Admin API Reference

## Overview

Complete API reference for all TShop admin endpoints, providing programmatic access to administrative functions.

## Authentication

All admin API endpoints require authentication using the `adminApiRoute` middleware.

### Authentication Methods

**Session-Based Authentication**
```bash
# Login first to establish session
POST /api/auth/signin
{
  "email": "admin@tshop.com",
  "password": "admin_password"
}

# Then make admin API calls with session cookie
GET /api/admin/system?action=health
Cookie: next-auth.session-token=...
```

**API Key Authentication** (Coming Soon)
```bash
GET /api/admin/system?action=health
Authorization: Bearer admin_api_key_here
```

### Admin Permissions

Admin access requires:
- ✅ User account with admin role
- ✅ Active session with proper authentication
- ✅ IP whitelist approval (production)
- ✅ Two-factor authentication enabled

## AI Models Management

### Base Endpoint
```
/api/admin/ai-models
```

### Get AI Models
```bash
GET /api/admin/ai-models?action=models
```

**Response:**
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "gemini-pro",
        "name": "Google Gemini Pro",
        "provider": "Google",
        "status": "active",
        "costPerRequest": 0.002,
        "dailyRequests": 1247,
        "successRate": 98.5
      }
    ]
  }
}
```

### Get AI Usage Analytics
```bash
GET /api/admin/ai-models?action=usage
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRequests": 15678,
    "totalCost": 31.36,
    "avgCostPerRequest": 0.002,
    "dailyUsage": [
      {
        "date": "2024-01-15",
        "requests": 1432,
        "cost": 2.86,
        "uniqueUsers": 234
      }
    ],
    "topUsers": [
      {
        "id": "user_123",
        "name": "John Doe",
        "aiGenerations": 45,
        "estimatedCost": 0.09
      }
    ]
  }
}
```

### Get AI Cost Analysis
```bash
GET /api/admin/ai-models?action=costs
```

### Get AI Settings
```bash
GET /api/admin/ai-models?action=settings
```

### Enable AI Model
```bash
POST /api/admin/ai-models
{
  "action": "enable_model",
  "modelId": "dalle-3",
  "settings": {
    "priority": 2,
    "maxDailyRequests": 1000,
    "costPerRequest": 0.040
  }
}
```

### Disable AI Model
```bash
POST /api/admin/ai-models
{
  "action": "disable_model",
  "modelId": "midjourney"
}
```

### Update AI Limits
```bash
POST /api/admin/ai-models
{
  "action": "update_limits",
  "limits": {
    "registered": { "daily": 15, "monthly": 300 },
    "premium": { "daily": 75, "monthly": 1500 }
  }
}
```

### Update System Prompts
```bash
POST /api/admin/ai-models
{
  "action": "update_prompts",
  "prompts": {
    "system": "Updated system prompt for AI models...",
    "safety": "Updated safety guidelines..."
  }
}
```

## Content Moderation

### Base Endpoint
```
/api/admin/content
```

### Get Designs for Moderation
```bash
GET /api/admin/content?action=designs&status=pending&page=1&limit=20
```

**Query Parameters:**
- `status`: Filter by status (`pending`, `approved`, `rejected`, `flagged`)
- `page`: Page number (default: 1)
- `limit`: Items per page (max: 100, default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "designs": [
      {
        "id": "design_123",
        "title": "Cool Design",
        "status": "PENDING",
        "user": {
          "id": "user_456",
          "name": "Jane Smith",
          "email": "jane@example.com"
        },
        "createdAt": "2024-01-15T10:30:00Z",
        "isAIGenerated": true,
        "stats": {
          "comments": 3,
          "orders": 0
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Get Content Reports
```bash
GET /api/admin/content?action=reports&page=1&limit=20
```

### Get Flagged Content
```bash
GET /api/admin/content?action=flagged&page=1&limit=20
```

### Get Content Analytics
```bash
GET /api/admin/content?action=analytics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalDesigns": 15432,
      "pendingReview": 234,
      "flaggedCount": 45,
      "approvedCount": 14256,
      "rejectedCount": 897,
      "aiGeneratedCount": 8934
    },
    "moderationQueue": {
      "pending": 234,
      "flagged": 45,
      "avgReviewTime": "2.3 hours",
      "completionRate": "94.2%"
    }
  }
}
```

### Approve Design
```bash
POST /api/admin/content
{
  "action": "approve",
  "designId": "design_123",
  "adminId": "admin_456"
}
```

### Reject Design
```bash
POST /api/admin/content
{
  "action": "reject",
  "designId": "design_123",
  "reason": "Copyright violation detected",
  "adminId": "admin_456"
}
```

### Flag Design
```bash
POST /api/admin/content
{
  "action": "flag",
  "designId": "design_123",
  "reason": "Requires additional review",
  "severity": "HIGH",
  "adminId": "admin_456"
}
```

### Bulk Moderation
```bash
POST /api/admin/content
{
  "action": "bulk_action",
  "designs": ["design_1", "design_2", "design_3"],
  "bulkAction": "approve",
  "adminId": "admin_456"
}
```

**Available Bulk Actions:**
- `approve`: Approve all selected designs
- `reject`: Reject all selected designs
- `flag`: Flag all selected designs

## Integration Management

### Base Endpoint
```
/api/admin/integrations
```

### Get Integrations List
```bash
GET /api/admin/integrations?action=list
```

**Response:**
```json
{
  "success": true,
  "data": {
    "integrations": [
      {
        "id": "printful",
        "name": "Printful",
        "category": "fulfillment",
        "status": "active",
        "health": "healthy",
        "lastSync": "2024-01-15T10:30:00Z",
        "metrics": {
          "ordersProcessed": 1247,
          "errorRate": 0.2,
          "avgProcessingTime": "2.3 hours"
        }
      }
    ]
  }
}
```

### Get Webhooks
```bash
GET /api/admin/integrations?action=webhooks
```

### Get API Keys
```bash
GET /api/admin/integrations?action=api_keys
```

### Get Fulfillment Providers
```bash
GET /api/admin/integrations?action=fulfillment
```

### Get Payment Providers
```bash
GET /api/admin/integrations?action=payment
```

### Get Integration Analytics
```bash
GET /api/admin/integrations?action=analytics
```

### Enable Integration
```bash
POST /api/admin/integrations
{
  "action": "enable_integration",
  "integrationId": "printify",
  "config": {
    "apiKey": "your-api-key",
    "webhookUrl": "https://api.tshop.com/webhooks/printify",
    "autoFulfill": true
  }
}
```

### Disable Integration
```bash
POST /api/admin/integrations
{
  "action": "disable_integration",
  "integrationId": "mailchimp"
}
```

### Update Integration Config
```bash
POST /api/admin/integrations
{
  "action": "update_config",
  "integrationId": "stripe",
  "config": {
    "currency": "USD",
    "captureMethod": "automatic"
  }
}
```

### Test Integration Connection
```bash
POST /api/admin/integrations
{
  "action": "test_connection",
  "integrationId": "printful",
  "config": {
    "apiKey": "test-api-key"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connection test successful",
  "data": {
    "responseTime": "245ms",
    "status": "connected"
  }
}
```

### Sync Integration Data
```bash
POST /api/admin/integrations
{
  "action": "sync_data",
  "integrationId": "printful"
}
```

### Revoke API Key
```bash
POST /api/admin/integrations
{
  "action": "revoke_api_key",
  "keyId": "key_123"
}
```

## System Administration

### Base Endpoint
```
/api/admin/system
```

### Get System Health
```bash
GET /api/admin/system?action=health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "database": {
      "status": "healthy",
      "responseTime": "< 10ms"
    },
    "system": {
      "uptime": 261360.5,
      "memory": {
        "rss": 52428800,
        "heapTotal": 29360128,
        "heapUsed": 20971520,
        "external": 1048576
      }
    },
    "application": {
      "totalUsers": 1247,
      "totalOrders": 3456,
      "totalDesigns": 15432,
      "recentErrors": 3
    },
    "status": "healthy"
  }
}
```

### Get System Statistics
```bash
GET /api/admin/system?action=stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1247,
      "active30d": 432,
      "active7d": 156,
      "newToday": 23
    },
    "revenue": {
      "total": 125678.90,
      "today": 1234.56
    },
    "orders": {
      "total": 3456,
      "today": 45
    },
    "designs": {
      "total": 15432,
      "today": 67
    },
    "ai": {
      "generationsToday": 123
    },
    "system": {
      "errors24h": 3,
      "status": "healthy"
    }
  }
}
```

### Get System Settings
```bash
GET /api/admin/system?action=settings
```

### Update System Settings
```bash
POST /api/admin/system
{
  "action": "update_settings",
  "settings": {
    "general": {
      "siteName": "TShop",
      "registrationEnabled": true,
      "aiGenerationEnabled": true
    },
    "ai": {
      "dailyLimitFree": 3,
      "dailyLimitRegistered": 15
    }
  }
}
```

### Toggle Maintenance Mode
```bash
POST /api/admin/system
{
  "action": "maintenance_mode",
  "enabled": true,
  "message": "Scheduled maintenance in progress"
}
```

### Clear Application Cache
```bash
POST /api/admin/system
{
  "action": "clear_cache"
}
```

### Backup Database
```bash
POST /api/admin/system
{
  "action": "backup_database"
}
```

## Team Management

### Base Endpoint
```
/api/admin/teams
```

### Get All Teams
```bash
GET /api/admin/teams?action=list&page=1&limit=20
```

### Get Team Details
```bash
GET /api/admin/teams?action=details&teamId=team_123
```

### Get User Management
```bash
GET /api/admin/teams?action=users&page=1&limit=20
```

### Update User Role
```bash
POST /api/admin/teams
{
  "action": "update_user_role",
  "userId": "user_123",
  "role": "premium",
  "adminId": "admin_456"
}
```

### Suspend User Account
```bash
POST /api/admin/teams
{
  "action": "suspend_user",
  "userId": "user_123",
  "reason": "Policy violation",
  "adminId": "admin_456"
}
```

## Error Responses

### Standard Error Format

```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific error details"
  }
}
```

### Common HTTP Status Codes

- `200 OK`: Successful operation
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Error Codes

**Authentication Errors**
- `AUTH_REQUIRED`: Authentication is required
- `INVALID_SESSION`: Session is invalid or expired
- `INSUFFICIENT_PERMISSIONS`: User lacks admin permissions

**Validation Errors**
- `INVALID_PARAMETERS`: Request parameters are invalid
- `MISSING_REQUIRED_FIELD`: Required field is missing
- `INVALID_FORMAT`: Data format is incorrect

**Business Logic Errors**
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `OPERATION_NOT_ALLOWED`: Operation is not permitted
- `RATE_LIMIT_EXCEEDED`: Too many requests

## Rate Limiting

### Admin API Limits

**Per-User Limits**
- 1000 requests per hour
- 100 requests per minute
- Burst allowance: 200 requests

**Rate Limit Headers**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642694400
```

**Rate Limit Exceeded Response**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 3600
}
```

## Webhooks

Admin APIs can trigger webhooks for external system integration:

**Admin Action Webhook**
```json
{
  "event": "admin.design.approved",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "designId": "design_123",
    "adminId": "admin_456",
    "action": "approve",
    "previousStatus": "pending",
    "newStatus": "approved"
  }
}
```

**System Alert Webhook**
```json
{
  "event": "system.alert.critical",
  "timestamp": "2024-01-15T10:30:00Z", 
  "data": {
    "alertType": "database_connection_failure",
    "severity": "critical",
    "message": "Database connection pool exhausted",
    "metrics": {
      "activeConnections": 100,
      "maxConnections": 100
    }
  }
}
```

---

## SDK and Client Libraries

### JavaScript SDK (Coming Soon)
```javascript
import { TShopAdminAPI } from '@tshop/admin-sdk';

const client = new TShopAdminAPI({
  apiKey: 'your-admin-api-key',
  baseUrl: 'https://api.tshop.com'
});

// Get system health
const health = await client.system.getHealth();

// Approve design
await client.content.approveDesign('design_123', 'admin_456');
```

### Python SDK (Coming Soon)
```python
from tshop_admin import TShopAdminClient

client = TShopAdminClient(
    api_key='your-admin-api-key',
    base_url='https://api.tshop.com'
)

# Get AI usage analytics
usage = client.ai_models.get_usage_analytics()

# Bulk moderate designs
client.content.bulk_moderate(['design_1', 'design_2'], 'approve')
```

> **Note**: All admin API endpoints are logged and audited. Use responsibly and follow your organization's security policies when integrating with external systems.