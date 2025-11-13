'use client'

import React, { useState } from 'react'
import {
    DollarSign,
    Package,
    Tag,
    Globe,
    Plus,
    Edit,
    Trash2,
    Save,
    TrendingUp,
    Calendar,
    Percent,
    CheckCircle,
    XCircle,
    Eye,
    EyeOff,
    Gift,
    Zap
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion } from 'framer-motion'

interface Product {
    id: string
    name: string
    nameAr: string
    type: 'subscription' | 'course' | 'channel'
    category: 'A' | 'B' | 'C'
    basePrice: number
    currency: 'EGP' | 'USD'
    billingCycle?: 'monthly' | 'annual'
    enabled: boolean
    subscribers?: number
    revenue?: number
}

interface LocalizedPrice {
    id: string
    productId: string
    productName: string
    country: string
    currency: string
    price: number
    originalPrice: number
    discount: number
    enabled: boolean
    lastUpdated: string
}

interface Promotion {
    id: string
    code: string
    name: string
    type: 'percentage' | 'fixed' | 'trial'
    value: number
    applicableTo: 'all' | 'subscription' | 'course' | 'channel'
    startDate: string
    endDate: string
    usageLimit?: number
    usageCount: number
    enabled: boolean
    minPurchase?: number
}

const MOCK_PRODUCTS: Product[] = [
    {
        id: '1',
        name: 'All-Access Library',
        nameAr: 'مكتبة الوصول الكامل',
        type: 'subscription',
        category: 'A',
        basePrice: 199,
        currency: 'EGP',
        billingCycle: 'monthly',
        enabled: true,
        subscribers: 1234,
        revenue: 245466
    },
    {
        id: '2',
        name: 'All-Access Library Annual',
        nameAr: 'مكتبة الوصول الكامل سنوي',
        type: 'subscription',
        category: 'A',
        basePrice: 1999,
        currency: 'EGP',
        billingCycle: 'annual',
        enabled: true,
        subscribers: 456,
        revenue: 911544
    },
    {
        id: '3',
        name: 'Signature Course Bundle',
        nameAr: 'حزمة الدورات المميزة',
        type: 'course',
        category: 'B',
        basePrice: 299,
        currency: 'EGP',
        enabled: true,
        subscribers: 234,
        revenue: 69966
    },
    {
        id: '4',
        name: 'Premium Creator Channel',
        nameAr: 'قناة المحتوى المميزة',
        type: 'channel',
        category: 'C',
        basePrice: 99,
        currency: 'EGP',
        billingCycle: 'monthly',
        enabled: true,
        subscribers: 567,
        revenue: 56133
    }
]

const MOCK_LOCALIZED_PRICES: LocalizedPrice[] = [
    {
        id: '1',
        productId: '1',
        productName: 'All-Access Library',
        country: 'Egypt',
        currency: 'EGP',
        price: 199,
        originalPrice: 199,
        discount: 0,
        enabled: true,
        lastUpdated: '2024-10-01T00:00:00Z'
    },
    {
        id: '2',
        productId: '1',
        productName: 'All-Access Library',
        country: 'Saudi Arabia',
        currency: 'SAR',
        price: 75,
        originalPrice: 75,
        discount: 0,
        enabled: true,
        lastUpdated: '2024-10-01T00:00:00Z'
    },
    {
        id: '3',
        productId: '1',
        productName: 'All-Access Library',
        country: 'UAE',
        currency: 'AED',
        price: 75,
        originalPrice: 75,
        discount: 0,
        enabled: true,
        lastUpdated: '2024-10-01T00:00:00Z'
    },
    {
        id: '4',
        productId: '2',
        productName: 'All-Access Library Annual',
        country: 'Egypt',
        currency: 'EGP',
        price: 1699,
        originalPrice: 1999,
        discount: 15,
        enabled: true,
        lastUpdated: '2024-10-01T00:00:00Z'
    }
]

const MOCK_PROMOTIONS: Promotion[] = [
    {
        id: '1',
        code: 'WELCOME2024',
        name: 'New User Welcome',
        type: 'percentage',
        value: 20,
        applicableTo: 'all',
        startDate: '2024-10-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        usageLimit: 1000,
        usageCount: 456,
        enabled: true,
        minPurchase: 100
    },
    {
        id: '2',
        code: 'ANNUAL25',
        name: 'Annual Plan Discount',
        type: 'percentage',
        value: 25,
        applicableTo: 'subscription',
        startDate: '2024-10-01T00:00:00Z',
        endDate: '2024-11-30T23:59:59Z',
        usageLimit: 500,
        usageCount: 234,
        enabled: true
    },
    {
        id: '3',
        code: 'FREETRIAL7',
        name: '7-Day Free Trial',
        type: 'trial',
        value: 7,
        applicableTo: 'subscription',
        startDate: '2024-10-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z',
        usageCount: 789,
        enabled: true
    },
    {
        id: '4',
        code: 'RAMADAN50',
        name: 'Ramadan Special',
        type: 'fixed',
        value: 50,
        applicableTo: 'all',
        startDate: '2024-03-01T00:00:00Z',
        endDate: '2024-04-15T23:59:59Z',
        usageLimit: 2000,
        usageCount: 1876,
        enabled: false,
        minPurchase: 150
    }
]

const categoryColors = {
    A: 'bg-blue-100 text-blue-800 border-blue-200',
    B: 'bg-purple-100 text-purple-800 border-purple-200',
    C: 'bg-green-100 text-green-800 border-green-200'
}

const typeColors = {
    subscription: 'bg-orange-100 text-orange-800 border-orange-200',
    course: 'bg-blue-100 text-blue-800 border-blue-200',
    channel: 'bg-green-100 text-green-800 border-green-200'
}

const promotionTypeColors = {
    percentage: 'bg-green-100 text-green-800 border-green-200',
    fixed: 'bg-blue-100 text-blue-800 border-blue-200',
    trial: 'bg-purple-100 text-purple-800 border-purple-200'
}

export default function PricingCatalogManager() {
    const [activeTab, setActiveTab] = useState('products')
    const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS)
    const [localizedPrices, setLocalizedPrices] = useState<LocalizedPrice[]>(MOCK_LOCALIZED_PRICES)
    const [promotions, setPromotions] = useState<Promotion[]>(MOCK_PROMOTIONS)

    const stats = {
        totalProducts: products.length,
        activeProducts: products.filter(p => p.enabled).length,
        totalRevenue: products.reduce((sum, p) => sum + (p.revenue || 0), 0),
        activePromotions: promotions.filter(p => p.enabled && new Date(p.endDate) > new Date()).length,
        localizedMarkets: [...new Set(localizedPrices.map(p => p.country))].length
    }

    const toggleProduct = (id: string) => {
        setProducts(products.map(p =>
            p.id === id ? { ...p, enabled: !p.enabled } : p
        ))
    }

    const togglePromotion = (id: string) => {
        setPromotions(promotions.map(p =>
            p.id === id ? { ...p, enabled: !p.enabled } : p
        ))
    }

    const toggleLocalizedPrice = (id: string) => {
        setLocalizedPrices(localizedPrices.map(p =>
            p.id === id ? { ...p, enabled: !p.enabled } : p
        ))
    }

    const formatCurrency = (amount: number, currency: string = 'EGP') => {
        const symbols: Record<string, string> = {
            EGP: 'E£',
            USD: '$',
            SAR: 'SAR',
            AED: 'AED'
        }
        return `${symbols[currency] || currency} ${amount.toLocaleString()}`
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const isPromotionActive = (promo: Promotion) => {
        const now = new Date()
        const start = new Date(promo.startDate)
        const end = new Date(promo.endDate)
        return promo.enabled && now >= start && now <= end
    }

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Package className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="text-2xl font-semibold text-foreground">{stats.totalProducts}</div>
                    <div className="text-sm text-muted-foreground">Total Products</div>
                </div>

                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="text-2xl font-semibold text-foreground">{stats.activeProducts}</div>
                    <div className="text-sm text-muted-foreground">Active Products</div>
                </div>

                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <DollarSign className="w-8 h-8 text-purple-600" />
                    </div>
                    <div className="text-2xl font-semibold text-foreground">{formatCurrency(stats.totalRevenue)}</div>
                    <div className="text-sm text-muted-foreground">Total Revenue</div>
                </div>

                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Tag className="w-8 h-8 text-orange-600" />
                    </div>
                    <div className="text-2xl font-semibold text-foreground">{stats.activePromotions}</div>
                    <div className="text-sm text-muted-foreground">Active Promos</div>
                </div>

                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Globe className="w-8 h-8 text-teal-600" />
                    </div>
                    <div className="text-2xl font-semibold text-foreground">{stats.localizedMarkets}</div>
                    <div className="text-sm text-muted-foreground">Markets</div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-background rounded-lg border border-border">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <div className="border-b border-border px-6">
                        <TabsList className="bg-transparent">
                            <TabsTrigger value="products" className="data-[state=active]:bg-purple-50">
                                <Package className="w-4 h-4 mr-2" />
                                Product Catalog
                            </TabsTrigger>
                            <TabsTrigger value="pricing" className="data-[state=active]:bg-purple-50">
                                <Globe className="w-4 h-4 mr-2" />
                                Localized Pricing
                            </TabsTrigger>
                            <TabsTrigger value="promotions" className="data-[state=active]:bg-purple-50">
                                <Tag className="w-4 h-4 mr-2" />
                                Promotions
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Products Tab */}
                    <TabsContent value="products" className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-foreground">Product Catalog</h3>
                                <Button className="bg-purple-600 hover:bg-purple-700 text-foreground">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Product
                                </Button>
                            </div>

                            <div className="border border-border rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-background border-b border-border">
                                        <tr>
                                            <th className="text-left py-3 px-4 font-medium text-foreground">Product</th>
                                            <th className="text-left py-3 px-4 font-medium text-foreground">Type</th>
                                            <th className="text-left py-3 px-4 font-medium text-foreground">Category</th>
                                            <th className="text-left py-3 px-4 font-medium text-foreground">Price</th>
                                            <th className="text-left py-3 px-4 font-medium text-foreground">Subscribers</th>
                                            <th className="text-left py-3 px-4 font-medium text-foreground">Revenue</th>
                                            <th className="text-center py-3 px-4 font-medium text-foreground">Status</th>
                                            <th className="text-center py-3 px-4 font-medium text-foreground">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {products.map((product) => (
                                            <tr key={product.id} className="hover:bg-background">
                                                <td className="py-3 px-4">
                                                    <div>
                                                        <div className="font-medium text-foreground">{product.name}</div>
                                                        <div className="text-sm text-muted-foreground">{product.nameAr}</div>
                                                        {product.billingCycle && (
                                                            <Badge className="mt-1 bg-blue-100 text-blue-800 border-blue-200 text-xs">
                                                                {product.billingCycle}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge className={typeColors[product.type]}>
                                                        {product.type}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge className={categoryColors[product.category]}>
                                                        Category {product.category}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="font-semibold text-foreground">
                                                        {formatCurrency(product.basePrice, product.currency)}
                                                    </div>
                                                    {product.billingCycle && (
                                                        <div className="text-xs text-muted-foreground">/{product.billingCycle === 'monthly' ? 'mo' : 'yr'}</div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                                        <span className="font-medium text-foreground">
                                                            {product.subscribers?.toLocaleString() || 0}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="font-semibold text-foreground">
                                                        {formatCurrency(product.revenue || 0)}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <button
                                                        onClick={() => toggleProduct(product.id)}
                                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                                            product.enabled
                                                                ? 'bg-green-100 text-green-800 border border-green-200'
                                                                : 'bg-muted text-gray-800 border border-border'
                                                        }`}
                                                    >
                                                        {product.enabled ? (
                                                            <>
                                                                <Eye className="w-3 h-3" />
                                                                Active
                                                            </>
                                                        ) : (
                                                            <>
                                                                <EyeOff className="w-3 h-3" />
                                                                Inactive
                                                            </>
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button size="sm" variant="outline" className="text-xs">
                                                            <Edit className="w-3 h-3" />
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="text-xs">
                                                            <DollarSign className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Localized Pricing Tab */}
                    <TabsContent value="pricing" className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">Localized Pricing</h3>
                                    <p className="text-sm text-muted-foreground mt-1">Configure region-specific pricing for the Egyptian market and beyond</p>
                                </div>
                                <Button className="bg-purple-600 hover:bg-purple-700 text-foreground">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Market
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {localizedPrices.map((price) => (
                                    <div key={price.id} className="border border-border rounded-lg p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Globe className="w-5 h-5 text-muted-foreground" />
                                                    <div>
                                                        <h4 className="font-semibold text-foreground">{price.productName}</h4>
                                                        <p className="text-sm text-muted-foreground">{price.country}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-4 gap-4 mt-3">
                                                    <div>
                                                        <div className="text-xs text-muted-foreground">Current Price</div>
                                                        <div className="text-lg font-semibold text-foreground">
                                                            {formatCurrency(price.price, price.currency)}
                                                        </div>
                                                    </div>
                                                    {price.discount > 0 && (
                                                        <>
                                                            <div>
                                                                <div className="text-xs text-muted-foreground">Original Price</div>
                                                                <div className="text-lg font-medium text-muted-foreground line-through">
                                                                    {formatCurrency(price.originalPrice, price.currency)}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xs text-muted-foreground">Discount</div>
                                                                <div className="text-lg font-semibold text-green-600">
                                                                    {price.discount}% OFF
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                    <div>
                                                        <div className="text-xs text-muted-foreground">Last Updated</div>
                                                        <div className="text-sm text-foreground">
                                                            {formatDate(price.lastUpdated)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <button
                                                    onClick={() => toggleLocalizedPrice(price.id)}
                                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                                                        price.enabled
                                                            ? 'bg-green-100 text-green-800 border border-green-200'
                                                            : 'bg-muted text-gray-800 border border-border'
                                                    }`}
                                                >
                                                    {price.enabled ? (
                                                        <>
                                                            <CheckCircle className="w-4 h-4" />
                                                            Active
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="w-4 h-4" />
                                                            Inactive
                                                        </>
                                                    )}
                                                </button>
                                                <Button size="sm" variant="outline">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-blue-900 mb-1">Purchasing Power Parity</h4>
                                        <p className="text-sm text-blue-800">
                                            Prices are automatically adjusted based on local purchasing power and market conditions.
                                            Egyptian pricing optimized for the local market with EGP currency support.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Promotions Tab */}
                    <TabsContent value="promotions" className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-foreground">Promotional Campaigns</h3>
                                <Button className="bg-purple-600 hover:bg-purple-700 text-foreground">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Promotion
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {promotions.map((promo) => {
                                    const isActive = isPromotionActive(promo)
                                    return (
                                        <div key={promo.id} className="border border-border rounded-lg p-5">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="bg-purple-100 rounded-lg p-2">
                                                            {promo.type === 'trial' ? (
                                                                <Gift className="w-5 h-5 text-purple-600" />
                                                            ) : (
                                                                <Percent className="w-5 h-5 text-purple-600" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-foreground">{promo.name}</h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge className="bg-muted text-gray-800 border-border">
                                                                    {promo.code}
                                                                </Badge>
                                                                <Badge className={promotionTypeColors[promo.type]}>
                                                                    {promo.type === 'percentage' && `${promo.value}% OFF`}
                                                                    {promo.type === 'fixed' && `E£${promo.value} OFF`}
                                                                    {promo.type === 'trial' && `${promo.value} Days Free`}
                                                                </Badge>
                                                                {isActive && (
                                                                    <Badge className="bg-green-100 text-green-800 border-green-200">
                                                                        <Zap className="w-3 h-3 mr-1" />
                                                                        Active Now
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                                                        <div>
                                                            <div className="text-xs text-muted-foreground">Applicable To</div>
                                                            <div className="font-medium text-foreground">{promo.applicableTo}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground">Usage</div>
                                                            <div className="font-medium text-foreground">
                                                                {promo.usageCount.toLocaleString()}
                                                                {promo.usageLimit && ` / ${promo.usageLimit.toLocaleString()}`}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground">Valid Period</div>
                                                            <div className="font-medium text-foreground">
                                                                {formatDate(promo.startDate)} - {formatDate(promo.endDate)}
                                                            </div>
                                                        </div>
                                                        {promo.minPurchase && (
                                                            <div>
                                                                <div className="text-xs text-muted-foreground">Min Purchase</div>
                                                                <div className="font-medium text-foreground">
                                                                    {formatCurrency(promo.minPurchase)}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <button
                                                        onClick={() => togglePromotion(promo.id)}
                                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                                                            promo.enabled
                                                                ? 'bg-green-100 text-green-800 border border-green-200'
                                                                : 'bg-muted text-gray-800 border border-border'
                                                        }`}
                                                    >
                                                        {promo.enabled ? (
                                                            <>
                                                                <CheckCircle className="w-4 h-4" />
                                                                Enabled
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="w-4 h-4" />
                                                                Disabled
                                                            </>
                                                        )}
                                                    </button>
                                                    <Button size="sm" variant="outline">
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
