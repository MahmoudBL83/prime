import axios from 'axios'
import CryptoJS from 'crypto-js'

const PAYMOB_API_URL = 'https://accept.paymob.com/api'
const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET

interface PaymentRequest {
    amount: number // in cents
    currency: string
    orderId: string
    userEmail: string
    userPhone?: string
    billingData: {
        first_name: string
        last_name: string
        email: string
        phone_number?: string
        apartment?: string
        floor?: string
        street?: string
        building?: string
        city: string
        state?: string
        country: string
        postal_code?: string
    }
}

interface PaymobOrderResponse {
    id: number
    created_at: string
    delivery_needed: boolean
    merchant: {
        id: number
        created_at: string
        emails: string[]
        extra_contacts: any[]
        phones: string[]
    }
    amount_cents: number
    shipping_data: any
    currency: string
    is_payment_locked: boolean
    is_return: boolean
    is_cancelled: boolean
    is_fulfilled: boolean
    is_expired: boolean
    order_url: string
    commission_fees: number
    delivery_fees_cents: number
    delivery_vat_cents: number
    payment_method: string
    merchant_order_id: string
    wallet_notification: any
    paymob_notification: any
    api_source: string
    data: any
    token: string
    state: string
    items: any[]
}

export class PaymobService {
    private authToken: string | null = null
    private tokenExpiry: number = 0

    private async authenticate(): Promise<string> {
        try {
            // Check if we have a valid token
            if (this.authToken && Date.now() < this.tokenExpiry) {
                return this.authToken
            }

            const response = await axios.post(`${PAYMOB_API_URL}/auth/tokens`, {
                api_key: PAYMOB_API_KEY,
            })

            this.authToken = response.data.token
            // Token expires in 1 hour (3600 seconds)
            this.tokenExpiry = Date.now() + (3600 * 1000) - (60 * 1000) // Refresh 1 minute early

            return this.authToken!
        } catch (error) {
            console.error('Paymob authentication error:', error)
            throw new Error('Failed to authenticate with Paymob')
        }
    }

    private async createOrder(token: string, amount: number, currency: string, orderId: string): Promise<PaymobOrderResponse> {
        try {
            const response = await axios.post(
                `${PAYMOB_API_URL}/ecommerce/orders`,
                {
                    auth_token: token,
                    delivery_needed: 'false',
                    amount_cents: amount,
                    currency,
                    merchant_order_id: orderId,
                    items: [],
                }
            )
            return response.data
        } catch (error) {
            console.error('Paymob order creation error:', error)
            throw new Error('Failed to create order with Paymob')
        }
    }

    private async getPaymentKey(token: string, orderId: number, request: PaymentRequest): Promise<string> {
        try {
            const response = await axios.post(
                `${PAYMOB_API_URL}/acceptance/payment_keys`,
                {
                    auth_token: token,
                    amount_cents: request.amount,
                    expiration: 3600,
                    order_id: orderId,
                    billing_data: request.billingData,
                    currency: request.currency,
                    integration_id: PAYMOB_INTEGRATION_ID,
                    lock_order_when_paid: 'false',
                }
            )
            return response.data.token
        } catch (error) {
            console.error('Paymob payment key generation error:', error)
            throw new Error('Failed to generate payment key')
        }
    }

    async createPaymentRequest(request: PaymentRequest): Promise<{
        paymentKey: string
        paymobOrderId: string
        merchantOrderId: string
        iframeUrl: string
    }> {
        try {
            if (!PAYMOB_API_KEY || !PAYMOB_INTEGRATION_ID) {
                throw new Error('Paymob configuration missing')
            }

            // Step 1: Authenticate
            const authToken = await this.authenticate()

            // Step 2: Create order
            const order = await this.createOrder(authToken, request.amount, request.currency, request.orderId)

            // Step 3: Get payment key
            const paymentKey = await this.getPaymentKey(authToken, order.id, request)

            // Generate iframe URL
            const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`

            return {
                paymentKey,
                paymobOrderId: order.id.toString(),
                merchantOrderId: request.orderId,
                iframeUrl,
            }
        } catch (error) {
            console.error('Paymob payment creation error:', error)
            throw new Error('Failed to create payment request')
        }
    }

    verifyWebhookSignature(data: any, hmac: string): boolean {
        try {
            if (!PAYMOB_HMAC_SECRET) {
                console.error('Paymob HMAC secret not configured')
                return false
            }

            // Extract the relevant data for HMAC calculation
            const obj = {
                amount_cents: data.amount_cents,
                created_at: data.created_at,
                currency: data.currency,
                error_occured: data.error_occured,
                has_parent_transaction: data.has_parent_transaction,
                id: data.id,
                integration_id: data.integration_id,
                is_3d_secure: data.is_3d_secure,
                is_auth: data.is_auth,
                is_capture: data.is_capture,
                is_refunded: data.is_refunded,
                is_standalone_payment: data.is_standalone_payment,
                is_voided: data.is_voided,
                order: data.order,
                owner: data.owner,
                pending: data.pending,
                source_data: data.source_data,
                success: data.success,
            }

            const calculatedHmac = CryptoJS.HmacSHA512(JSON.stringify(obj), PAYMOB_HMAC_SECRET).toString()

            return calculatedHmac === hmac
        } catch (error) {
            console.error('Webhook signature verification error:', error)
            return false
        }
    }

    async getPaymentStatus(transactionId: string): Promise<any> {
        try {
            const authToken = await this.authenticate()
            const response = await axios.get(
                `${PAYMOB_API_URL}/acceptance/transaction/${transactionId}`,
                {
                    params: {
                        auth_token: authToken,
                    },
                }
            )
            return response.data
        } catch (error) {
            console.error('Payment status check error:', error)
            throw new Error('Failed to check payment status')
        }
    }
}

export const paymobService = new PaymobService()
