import { randomBytes } from 'crypto'

export interface WebhookConfig {
    id: string
    name: string
    url: string
    events: string[]
    secret: string
    status: 'active' | 'inactive' | 'failed'
    createdAt: string
    lastTriggered?: string
    failureCount: number
}

// In-memory storage for demo (use database in production)
export let webhooks: WebhookConfig[] = [
    {
        id: '1',
        name: 'Payment Webhook',
        url: 'https://api.example.com/webhooks/payments',
        events: ['payment.succeeded', 'payment.failed'],
        secret: 'whsec_' + randomBytes(32).toString('hex'),
        status: 'active',
        createdAt: new Date().toISOString(),
        lastTriggered: new Date().toISOString(),
        failureCount: 0
    },
    {
        id: '2',
        name: 'User Events',
        url: 'https://api.example.com/webhooks/users',
        events: ['user.created', 'user.updated'],
        secret: 'whsec_' + randomBytes(32).toString('hex'),
        status: 'active',
        createdAt: new Date().toISOString(),
        failureCount: 1
    }
]