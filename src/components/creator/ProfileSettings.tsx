'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, Camera, DollarSign, Bell, Shield, CreditCard, Users, 
  Link as LinkIcon, Globe, Lock, Eye, Heart, MessageCircle,
  Settings, ChevronRight, Check, X, Info, AlertCircle, Sparkles, Crown
} from 'lucide-react'
import Image from 'next/image'

interface ProfileSettingsProps {
  creatorData: any
  onUpdate: (data: any) => void
}

export default function ProfileSettings({ creatorData, onUpdate }: ProfileSettingsProps) {
  const [activeSection, setActiveSection] = useState('profile')
  const [formData, setFormData] = useState({
    // Profile
    displayName: creatorData?.user?.name || '',
    username: creatorData?.user?.email?.split('@')[0] || '',
    bio: creatorData?.user?.bio || '',
    location: '',
    website: '',
    
    // Subscription Pricing
    basicPrice: creatorData?.basicMonthlyPrice || 9.99,
    premiumPrice: creatorData?.premiumMonthlyPrice || 19.99,
    vipPrice: creatorData?.vipMonthlyPrice || 49.99,
    
    // Content Settings
    allowComments: true,
    allowDownloads: false,
    watermark: true,
    
    // Privacy
    showOnlineStatus: true,
    showSubscriberCount: true,
    blockCountries: [],
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    newSubscriber: true,
    newMessage: true,
    newTip: true,
    monthlyEarnings: true,
  })

  const sections = [
    { id: 'profile', name: 'Profile', icon: User, badge: null },
    { id: 'pricing', name: 'Subscription & Pricing', icon: DollarSign, badge: null },
    { id: 'content', name: 'Content Preferences', icon: Settings, badge: null },
    { id: 'privacy', name: 'Privacy & Security', icon: Shield, badge: null },
    { id: 'payments', name: 'Payment Methods', icon: CreditCard, badge: 'Verified' },
    { id: 'notifications', name: 'Notifications', icon: Bell, badge: null },
    { id: 'social', name: 'Social Links', icon: LinkIcon, badge: null },
    { id: 'fans', name: 'Fan Management', icon: Users, badge: null },
  ]

  const renderProfileSection = () => (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Profile Information</h2>
        <p className="text-gray-400 mt-1">Manage your public profile and personal information</p>
      </div>

      {/* Profile Picture */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <label className="block text-sm font-medium text-gray-300 mb-4">Profile Picture</label>
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 p-0.5">
              <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center overflow-hidden">
                {creatorData?.user?.profileImage ? (
                  <Image 
                    src={creatorData.user.profileImage} 
                    alt="Profile" 
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-gray-600" />
                )}
              </div>
            </div>
            <button className="absolute bottom-0 right-0 bg-pink-500 p-2 rounded-full hover:bg-pink-600 transition-colors">
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="flex-1">
            <button className="px-4 py-2 bg-pink-500/20 text-pink-400 rounded-lg hover:bg-pink-500/30 transition-colors">
              Change Photo
            </button>
            <button className="ml-2 px-4 py-2 text-gray-400 hover:text-white transition-colors">
              Remove
            </button>
            <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max size 5MB</p>
          </div>
        </div>
      </div>

      {/* Cover Photo */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <label className="block text-sm font-medium text-gray-300 mb-4">Cover Photo</label>
        <div className="relative h-48 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg overflow-hidden group cursor-pointer">
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="text-center">
              <Camera className="w-8 h-8 text-white mx-auto mb-2" />
              <p className="text-white text-sm">Upload Cover Photo</p>
              <p className="text-gray-400 text-xs">1500 x 500px recommended</p>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
          <input
            type="text"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
            placeholder="Your display name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg pl-8 pr-4 py-2.5 text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
              placeholder="username"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Your unique username for your profile URL</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors resize-none"
            placeholder="Tell your fans about yourself..."
          />
          <p className="text-xs text-gray-500 mt-1">500 characters maximum</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
              placeholder="City, Country"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
              placeholder="https://"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderPricingSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Subscription & Pricing</h2>
        <p className="text-gray-400 mt-1">Set your subscription tiers and pricing</p>
      </div>

      {/* Pricing Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic Tier */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-blue-400" />
              </div>
              <span className="font-semibold text-white">Basic</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
            </label>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Monthly Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                value={formData.basicPrice}
                onChange={(e) => setFormData({ ...formData, basicPrice: parseFloat(e.target.value) })}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg pl-8 pr-4 py-2 text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                step="0.01"
              />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Benefits:</p>
            <ul className="space-y-1 text-xs text-gray-400">
              <li className="flex items-center"><Check className="w-3 h-3 mr-2 text-green-500" />All standard posts</li>
              <li className="flex items-center"><Check className="w-3 h-3 mr-2 text-green-500" />Basic content access</li>
              <li className="flex items-center"><X className="w-3 h-3 mr-2 text-gray-600" />No exclusive content</li>
            </ul>
          </div>
        </div>

        {/* Premium Tier */}
        <div className="bg-gradient-to-b from-pink-500/10 to-purple-500/10 rounded-xl p-6 border-2 border-pink-500/50 relative">
          <div className="absolute top-4 right-4">
            <span className="px-2 py-1 bg-pink-500 text-white text-xs font-semibold rounded">POPULAR</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-pink-400" />
              </div>
              <span className="font-semibold text-white">Premium</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
            </label>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Monthly Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                value={formData.premiumPrice}
                onChange={(e) => setFormData({ ...formData, premiumPrice: parseFloat(e.target.value) })}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg pl-8 pr-4 py-2 text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                step="0.01"
              />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Benefits:</p>
            <ul className="space-y-1 text-xs text-gray-400">
              <li className="flex items-center"><Check className="w-3 h-3 mr-2 text-green-500" />All Basic benefits</li>
              <li className="flex items-center"><Check className="w-3 h-3 mr-2 text-green-500" />Exclusive content</li>
              <li className="flex items-center"><Check className="w-3 h-3 mr-2 text-green-500" />Behind the scenes</li>
              <li className="flex items-center"><Check className="w-3 h-3 mr-2 text-green-500" />Early access</li>
            </ul>
          </div>
        </div>

        {/* VIP Tier */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-purple-500/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-purple-400" />
              </div>
              <span className="font-semibold text-white">VIP</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
            </label>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Monthly Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                value={formData.vipPrice}
                onChange={(e) => setFormData({ ...formData, vipPrice: parseFloat(e.target.value) })}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg pl-8 pr-4 py-2 text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                step="0.01"
              />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Benefits:</p>
            <ul className="space-y-1 text-xs text-gray-400">
              <li className="flex items-center"><Check className="w-3 h-3 mr-2 text-green-500" />All Premium benefits</li>
              <li className="flex items-center"><Check className="w-3 h-3 mr-2 text-green-500" />1-on-1 messaging</li>
              <li className="flex items-center"><Check className="w-3 h-3 mr-2 text-green-500" />Custom requests</li>
              <li className="flex items-center"><Check className="w-3 h-3 mr-2 text-green-500" />Priority support</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bundles & Discounts */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Bundle Discounts</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">3-Month Discount</label>
            <div className="relative">
              <input
                type="number"
                placeholder="10"
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 pr-8 py-2 text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">6-Month Discount</label>
            <div className="relative">
              <input
                type="number"
                placeholder="15"
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 pr-8 py-2 text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">12-Month Discount</label>
            <div className="relative">
              <input
                type="number"
                placeholder="20"
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 pr-8 py-2 text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContentSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Content Preferences</h2>
        <p className="text-gray-400 mt-1">Control how your content is displayed and shared</p>
      </div>

      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 space-y-6">
        {/* Content Settings */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-700">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-pink-400" />
              <h4 className="font-medium text-white">Allow Comments</h4>
            </div>
            <p className="text-sm text-gray-400 mt-1">Let subscribers comment on your posts</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.allowComments}
              onChange={(e) => setFormData({ ...formData, allowComments: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
          </label>
        </div>

        <div className="flex items-center justify-between pb-6 border-b border-gray-700">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-pink-400" />
              <h4 className="font-medium text-white">Watermark</h4>
            </div>
            <p className="text-sm text-gray-400 mt-1">Add watermark to protect your content</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.watermark}
              onChange={(e) => setFormData({ ...formData, watermark: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-pink-400" />
              <h4 className="font-medium text-white">Download Protection</h4>
            </div>
            <p className="text-sm text-gray-400 mt-1">Prevent subscribers from downloading content</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={!formData.allowDownloads}
              onChange={(e) => setFormData({ ...formData, allowDownloads: !e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
          </label>
        </div>
      </div>
    </div>
  )

  const renderPrivacySection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Privacy & Security</h2>
        <p className="text-gray-400 mt-1">Manage your privacy and account security</p>
      </div>

      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 space-y-6">
        <div className="flex items-center justify-between pb-6 border-b border-gray-700">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-green-400" />
              <h4 className="font-medium text-white">Show Online Status</h4>
            </div>
            <p className="text-sm text-gray-400 mt-1">Let subscribers see when you're online</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.showOnlineStatus}
              onChange={(e) => setFormData({ ...formData, showOnlineStatus: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-400" />
              <h4 className="font-medium text-white">Show Subscriber Count</h4>
            </div>
            <p className="text-sm text-gray-400 mt-1">Display your total subscriber count publicly</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.showSubscriberCount}
              onChange={(e) => setFormData({ ...formData, showSubscriberCount: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
          </label>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-6 border border-green-500/50">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Lock className="w-6 h-6 text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-400 mb-4">Add an extra layer of security to your account</p>
            <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium">
              Enable 2FA
            </button>
          </div>
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full">Recommended</span>
        </div>
      </div>
    </div>
  )

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Notification Preferences</h2>
        <p className="text-gray-400 mt-1">Choose what notifications you want to receive</p>
      </div>

      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 space-y-6">
        <div className="flex items-center justify-between pb-6 border-b border-gray-700">
          <div className="flex-1">
            <h4 className="font-medium text-white">Email Notifications</h4>
            <p className="text-sm text-gray-400 mt-1">Receive notifications via email</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={formData.emailNotifications} onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
          </label>
        </div>

        <div className="flex items-center justify-between pb-6 border-b border-gray-700">
          <div className="flex-1">
            <h4 className="font-medium text-white">Push Notifications</h4>
            <p className="text-sm text-gray-400 mt-1">Receive push notifications on your devices</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={formData.pushNotifications} onChange={(e) => setFormData({ ...formData, pushNotifications: e.target.checked })} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
          </label>
        </div>

        <h3 className="text-sm font-semibold text-gray-300 pt-2">Notification Types</h3>

        {[
          { key: 'newSubscriber', label: 'New Subscriber', desc: 'When someone subscribes to you' },
          { key: 'newMessage', label: 'New Message', desc: 'When you receive a direct message' },
          { key: 'newTip', label: 'Tips & Donations', desc: 'When someone sends you a tip' },
          { key: 'monthlyEarnings', label: 'Monthly Earnings Report', desc: 'Monthly summary of your earnings' },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-white text-sm">{item.label}</h4>
              <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData[item.key as keyof typeof formData] as boolean}
                onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  )

  const renderSection = () => {
    switch (activeSection) {
      case 'profile': return renderProfileSection()
      case 'pricing': return renderPricingSection()
      case 'content': return renderContentSection()
      case 'privacy': return renderPrivacySection()
      case 'notifications': return renderNotificationsSection()
      default: return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Coming soon...</p>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex space-x-6">
          {/* Sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden sticky top-4">
              <div className="p-6 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">Settings</h2>
                <p className="text-sm text-gray-400 mt-1">Manage your creator profile</p>
              </div>
              <nav className="p-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors mb-1 ${
                      activeSection === section.id
                        ? 'bg-pink-500/20 text-pink-400'
                        : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <section.icon className="w-5 h-5" />
                      <span className="font-medium text-sm">{section.name}</span>
                    </div>
                    {section.badge && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                        {section.badge}
                      </span>
                    )}
                    {activeSection === section.id && <ChevronRight className="w-4 h-4" />}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderSection()}

              {/* Save Button */}
              <div className="mt-8 flex items-center justify-end space-x-4">
                <button className="px-6 py-2.5 text-gray-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => onUpdate(formData)}
                  className="px-8 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
