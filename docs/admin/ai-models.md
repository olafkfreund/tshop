# AI Models Management

## Overview

The AI Models management system provides comprehensive control over all AI providers, cost monitoring, usage limits, and model configurations used for design generation.

## Accessing AI Models Management

Navigate to **AI Models** in the admin dashboard to access:

- 🤖 **Models Overview**: Status and performance of all AI providers
- 📊 **Usage Analytics**: Real-time usage tracking and trends  
- 💰 **Cost Management**: Budget monitoring and expense breakdown
- ⚙️ **Settings**: Global AI configuration and safety controls

## AI Provider Management

### Currently Supported Models

**Google Gemini Pro** (Primary)
- **Status**: Active
- **Cost**: $0.002 per request
- **Features**: High-quality, fast, apparel-optimized
- **Limits**: 60 requests/minute, 10,000/day
- **Use Case**: Primary design generation

**DALL-E 3** (Premium)
- **Status**: Available
- **Cost**: $0.040 per request  
- **Features**: Creative, artistic, detailed
- **Limits**: 10 requests/minute, 1,000/day
- **Use Case**: High-end creative designs

**Midjourney** (Artistic)
- **Status**: Testing
- **Cost**: $0.025 per request
- **Features**: Artistic, photorealistic, style variety
- **Limits**: 5 requests/minute, 500/day
- **Use Case**: Artistic and unique designs

### Managing AI Models

#### Enable/Disable Models

```bash
# Enable a model
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

# Disable a model
POST /api/admin/ai-models
{
  "action": "disable_model", 
  "modelId": "midjourney"
}
```

#### Update Model Configuration

Navigate to **AI Models** → **Model Settings**:

1. **Performance Tuning**
   - Adjust timeout settings (default: 30 seconds)
   - Set retry limits (default: 3 attempts)
   - Configure fallback model priority

2. **Cost Controls**
   - Set per-request cost limits
   - Configure daily/monthly budget caps
   - Enable cost alerts and notifications

3. **Quality Settings**
   - Define image resolution requirements
   - Set content filtering levels
   - Configure design validation rules

## Usage Analytics & Monitoring

### Real-Time Usage Dashboard

The usage dashboard provides:

**Current Usage Metrics**
- Requests per hour/day/month
- Success/failure rates
- Average response times
- Cost accumulation

**Usage Trends**
- Historical usage patterns
- Peak usage identification
- Seasonal demand analysis
- User behavior insights

**Performance Metrics**
- Model response times
- Error rates by provider
- Quality scores and ratings
- User satisfaction metrics

### Usage Limits Configuration

#### User Tier Limits

```json
{
  "limits": {
    "free": { 
      "daily": 2, 
      "monthly": 50,
      "features": ["basic_templates"]
    },
    "registered": { 
      "daily": 10, 
      "monthly": 200,
      "features": ["premium_templates", "high_resolution"]
    },
    "premium": { 
      "daily": 50, 
      "monthly": 1000,
      "features": ["all_models", "priority_queue"]
    },
    "enterprise": { 
      "daily": 200, 
      "monthly": 5000,
      "features": ["custom_models", "dedicated_support"]
    }
  }
}
```

#### Dynamic Limit Adjustments

**Automatic Scaling**
- Increase limits during peak periods
- Reduce limits when budget constraints hit
- Adjust based on model performance

**Manual Overrides**
- Grant temporary limit increases
- Provide emergency access during outages
- Customize limits for specific users/teams

## Cost Management

### Budget Monitoring

**Monthly Cost Tracking**
- Current month spending: $847.32
- Budget allocation: $2,000.00
- Projected end-of-month: $1,243.67
- Budget utilization: 42.4%

**Cost Breakdown by Model**
- Gemini Pro: $567.84 (67.0%)
- DALL-E 3: $156.24 (18.4%)
- Midjourney: $123.24 (14.6%)

### Cost Control Measures

#### Automated Controls

**Budget Alerts**
- 50% budget threshold warning
- 80% budget threshold critical alert
- 100% budget automatic model suspension

**Cost Optimization**
- Route requests to most cost-effective model
- Cache common design elements
- Batch similar requests when possible

#### Manual Controls

**Emergency Actions**
- Immediately suspend all AI generation
- Switch to cheaper models only
- Enable emergency free quota

**Budget Adjustments**
- Increase monthly budget allocation
- Redistribute budget between models
- Set up additional funding sources

## AI Safety & Content Moderation

### Content Filtering

**Automatic Filtering**
- Block inappropriate content generation
- Filter copyrighted material requests
- Prevent harmful or offensive designs

**Filter Configuration**
```json
{
  "contentModeration": {
    "enableAutoModeration": true,
    "flagKeywords": ["violence", "hate", "nsfw", "copyright"],
    "autoRejectThreshold": 0.8,
    "humanReviewRequired": true,
    "safetyPrompts": {
      "system": "Create family-friendly apparel designs only",
      "safety": "Avoid offensive, copyrighted, or inappropriate content",
      "quality": "Ensure designs are print-ready and professionally styled"
    }
  }
}
```

### Model Safety Settings

**Prompt Engineering Safety**
- Inject safety constraints into all prompts
- Block potentially harmful prompt patterns
- Require content category classification

**Output Validation**
- Scan generated images for inappropriate content
- Validate design quality and printability
- Check for copyright infringement indicators

## Advanced Configuration

### Custom System Prompts

```json
{
  "prompts": {
    "system": "You are an AI assistant that creates professional apparel designs. Focus on trendy, marketable designs suitable for t-shirts, caps, and tote bags. Ensure all designs are family-friendly and appropriate for all audiences.",
    "safety": "Never create designs with offensive content, copyrighted characters, violent imagery, or inappropriate text. All designs should be suitable for public display.",
    "quality": "Generate high-quality, print-ready designs optimized for the specified product type. Consider fabric colors, design placement, and printing limitations."
  }
}
```

### Integration Settings

**Model Failover**
- Primary: Gemini Pro
- Secondary: DALL-E 3 
- Emergency: Midjourney

**Performance Optimization**
- Enable request caching (TTL: 24 hours)
- Use parallel processing for bulk requests
- Implement smart retry logic with exponential backoff

**Monitoring Integration**
- Real-time alerts for model failures
- Performance degradation notifications
- Cost spike warnings

## API Reference

### Get AI Models Status
```bash
GET /api/admin/ai-models?action=models
```

### Get Usage Analytics
```bash
GET /api/admin/ai-models?action=usage
```

### Get Cost Analysis
```bash
GET /api/admin/ai-models?action=costs
```

### Update Model Settings
```bash
POST /api/admin/ai-models
{
  "action": "update_limits",
  "limits": {
    "registered": { "daily": 15, "monthly": 300 }
  }
}
```

### Update System Prompts
```bash
POST /api/admin/ai-models
{
  "action": "update_prompts",
  "prompts": {
    "system": "Updated system prompt...",
    "safety": "Updated safety prompt..."
  }
}
```

## Troubleshooting

### Common Issues

**High Error Rates**
- Check model API status pages
- Verify API keys and permissions
- Review network connectivity
- Examine prompt formatting

**Unexpected High Costs**
- Review usage patterns for anomalies
- Check for automated bot traffic
- Verify rate limiting is working
- Analyze cost per user metrics

**Quality Issues**
- Review and update system prompts
- Check content filtering settings
- Analyze user feedback and ratings
- Consider model fine-tuning

### Monitoring & Alerts

Set up alerts for:
- ⚠️ Model response time > 10 seconds
- ⚠️ Error rate > 5%
- ⚠️ Daily cost > $100
- ⚠️ Usage spike > 200% of average

---

## Best Practices

1. **Cost Management**: Set conservative budgets initially and scale based on usage patterns
2. **Quality Control**: Regularly review generated designs and update prompts accordingly
3. **Performance**: Monitor response times and adjust timeouts to balance speed and reliability
4. **Safety**: Keep content filters updated and review flagged content regularly
5. **Analytics**: Use usage data to optimize model selection and user experience

> **Note**: All AI model changes require confirmation and are logged for audit purposes. Test changes in development environment before applying to production.