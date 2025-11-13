'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Save, Eye, EyeOff, RefreshCw, CheckCircle, AlertCircle, DollarSign, Key, Webhook } from 'lucide-react'
import toast from 'react-hot-toast'

interface StripeConfig {
  secretKey: string
  publishableKey: string
  webhookSecret: string
  appUrl: string
  prices: {
    categoryAMonthly: string
    categoryAYearly: string
    categoryBMonthly: string
    categoryBYearly: string
    bundleABMonthly: string
    bundleABYearly: string
  }
}

export default function StripeConfigPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showSecrets, setShowSecrets] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connected' | 'error'>('idle')

  const [config, setConfig] = useState<StripeConfig>({
    secretKey: '',
    publishableKey: '',
    webhookSecret: '',
    appUrl: '',
    prices: {
      categoryAMonthly: '',
      categoryAYearly: '',
      categoryBMonthly: '',
      categoryBYearly: '',
      bundleABMonthly: '',
      bundleABYearly: '',
    }
  })

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      router.push('/admin')
      return
    }
    fetchConfig()
  }, [session])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/stripe/config')
      const data = await response.json()
      if (data.config) {
        setConfig(data.config)
        setConnectionStatus(data.connected ? 'connected' : 'idle')
      }
    } catch (error) {
      console.error('Failed to fetch config:', error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/stripe/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save configuration')
      }

      toast.success('Stripe configuration saved successfully!')
      setConnectionStatus('connected')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save configuration')
      setConnectionStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    if (!config.secretKey) {
      toast.error('Please enter Stripe Secret Key first')
      return
    }

    setTesting(true)
    try {
      const response = await fetch('/api/admin/stripe/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: config.secretKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Connection test failed')
      }

      toast.success(`✓ Connected to Stripe (${data.mode} mode)`)
      setConnectionStatus('connected')
    } catch (error: any) {
      toast.error(error.message || 'Connection test failed')
      setConnectionStatus('error')
    } finally {
      setTesting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('prices.')) {
      const priceField = field.split('.')[1]
      setConfig(prev => ({
        ...prev,
        prices: { ...prev.prices, [priceField]: value }
      }))
    } else {
      setConfig(prev => ({ ...prev, [field]: value }))
    }
  }

  const generateWebhookUrl = () => {
    if (config.appUrl) {
      return `${config.appUrl}/api/stripe/webhook`
    }
    return 'https://yourdomain.com/api/stripe/webhook'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Stripe Configuration</h1>
              <p className="text-gray-600 mt-1">Configure your Stripe payment gateway settings</p>
            </div>
            <div className="flex items-center gap-2">
              {connectionStatus === 'connected' && (
                <span className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <CheckCircle className="w-5 h-5" />
                  Connected
                </span>
              )}
              {connectionStatus === 'error' && (
                <span className="flex items-center gap-2 text-red-600 text-sm font-medium">
                  <AlertCircle className="w-5 h-5" />
                  Error
                </span>
              )}
            </div>
          </div>
        </div>

        {/* API Keys Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">API Keys</h2>
          </div>

          <div className="space-y-4">
            {/* Secret Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secret Key <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showSecrets ? 'text' : 'password'}
                  value={config.secretKey}
                  onChange={(e) => handleInputChange('secretKey', e.target.value)}
                  placeholder="sk_test_51xxxxx or sk_live_51xxxxx"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showSecrets ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                From Stripe Dashboard → Developers → API Keys
              </p>
            </div>

            {/* Publishable Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Publishable Key <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={config.publishableKey}
                onChange={(e) => handleInputChange('publishableKey', e.target.value)}
                placeholder="pk_test_51xxxxx or pk_live_51xxxxx"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Test Connection Button */}
            <div className="flex gap-3">
              <button
                onClick={testConnection}
                disabled={testing || !config.secretKey}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
          </div>
        </div>

        {/* Webhook Configuration */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Webhook className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Webhook Configuration</h2>
          </div>

          <div className="space-y-4">
            {/* App URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Application URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={config.appUrl}
                onChange={(e) => handleInputChange('appUrl', e.target.value)}
                placeholder="https://yourdomain.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your production domain (without trailing slash)
              </p>
            </div>

            {/* Generated Webhook URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook Endpoint URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={generateWebhookUrl()}
                  readOnly
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateWebhookUrl())
                    toast.success('Webhook URL copied!')
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Use this URL in Stripe Dashboard → Developers → Webhooks
              </p>
            </div>

            {/* Webhook Secret */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook Secret <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showSecrets ? 'text' : 'password'}
                  value={config.webhookSecret}
                  onChange={(e) => handleInputChange('webhookSecret', e.target.value)}
                  placeholder="whsec_xxxxx"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showSecrets ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                After creating webhook endpoint in Stripe Dashboard
              </p>
            </div>

            {/* Events to Listen */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm font-medium text-purple-900 mb-2">Required Webhook Events:</p>
              <ul className="text-xs text-purple-800 space-y-1 ml-4 list-disc">
                <li>checkout.session.completed</li>
                <li>customer.subscription.updated</li>
                <li>customer.subscription.deleted</li>
                <li>invoice.payment_succeeded</li>
                <li>invoice.payment_failed</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Price IDs Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Subscription Price IDs</h2>
          </div>

          <div className="space-y-6">
            {/* Category A - All-Access Library */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-3">Category A - All-Access Library</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly (149 EGP) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={config.prices.categoryAMonthly}
                    onChange={(e) => handleInputChange('prices.categoryAMonthly', e.target.value)}
                    placeholder="price_xxxxx"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yearly (1,428 EGP - 20% off) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={config.prices.categoryAYearly}
                    onChange={(e) => handleInputChange('prices.categoryAYearly', e.target.value)}
                    placeholder="price_xxxxx"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Category B - Signature Courses */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-3">Category B - Signature Courses</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly (249 EGP) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={config.prices.categoryBMonthly}
                    onChange={(e) => handleInputChange('prices.categoryBMonthly', e.target.value)}
                    placeholder="price_xxxxx"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yearly (2,388 EGP - 20% off) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={config.prices.categoryBYearly}
                    onChange={(e) => handleInputChange('prices.categoryBYearly', e.target.value)}
                    placeholder="price_xxxxx"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Bundle AB */}
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-3">Bundle AB - Complete Package</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly (349 EGP) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={config.prices.bundleABMonthly}
                    onChange={(e) => handleInputChange('prices.bundleABMonthly', e.target.value)}
                    placeholder="price_xxxxx"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yearly (3,348 EGP - 20% off) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={config.prices.bundleABYearly}
                    onChange={(e) => handleInputChange('prices.bundleABYearly', e.target.value)}
                    placeholder="price_xxxxx"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Create these products in Stripe Dashboard → Products. Set each as recurring subscription with the correct billing interval.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => router.push('/admin')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  )
}
