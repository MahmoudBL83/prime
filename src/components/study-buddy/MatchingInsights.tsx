'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Sparkles, 
  Target, 
  Clock,
  Heart,
  MessageCircle,
  Star,
  Zap,
  ChevronRight,
  BarChart3
} from 'lucide-react'

interface MatchingInsightsProps {
  totalMatches: number
  averageCompatibility: number
  topCategories: string[]
  matchingStats?: {
    interestsMatches: number
    goalsMatches: number
    scheduleMatches: number
    communicationMatches: number
  }
}

export function MatchingInsights({ 
  totalMatches, 
  averageCompatibility, 
  topCategories,
  matchingStats 
}: MatchingInsightsProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const insights = [
    {
      icon: Users,
      title: 'Study Buddies Available',
      value: totalMatches,
      subtitle: 'potential matches found',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      icon: Brain,
      title: 'Average Compatibility',
      value: `${averageCompatibility}%`,
      subtitle: 'enhanced algorithm score',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-500/20 to-pink-500/20'
    },
    {
      icon: Sparkles,
      title: 'Smart Matching',
      value: '8+',
      subtitle: 'compatibility factors',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'from-yellow-500/20 to-orange-500/20'
    }
  ]

  const algorithmFactors = [
    { name: 'Shared Interests', weight: 20, icon: Star, color: 'text-purple-400' },
    { name: 'Common Goals', weight: 15, icon: Target, color: 'text-blue-400' },
    { name: 'Communication Style', weight: 15, icon: MessageCircle, color: 'text-green-400' },
    { name: 'Subject Expertise', weight: 15, icon: Brain, color: 'text-indigo-400' },
    { name: 'Schedule Compatibility', weight: 10, icon: Clock, color: 'text-cyan-400' },
    { name: 'Learning Style', weight: 10, icon: Zap, color: 'text-yellow-400' },
    { name: 'Skill Level', weight: 10, icon: TrendingUp, color: 'text-pink-400' },
    { name: 'Other Preferences', weight: 5, icon: Heart, color: 'text-red-400' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full border border-purple-400/30 backdrop-blur-sm mb-4"
        >
          <Brain className="w-5 h-5 text-purple-400" />
          <span className="text-sm font-medium text-foreground">Enhanced AI Matching</span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-2xl font-bold text-foreground mb-2"
        >
          Your Matching Insights
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-muted-foreground text-sm"
        >
          Powered by advanced compatibility algorithms
        </motion.p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
            className={`relative overflow-hidden bg-gradient-to-br ${insight.bgColor} backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-border transition-all duration-300 group`}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white to-transparent rounded-full blur-xl"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-white to-transparent rounded-full blur-lg"></div>
            </div>
            
            <div className="relative z-10">
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${insight.color} mb-4 group-hover:scale-110 transition-transform`}>
                <insight.icon className="w-6 h-6 text-foreground" />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">
                {insight.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {insight.subtitle}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Algorithm Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="bg-white/5 backdrop-blur-sm border border-border rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl">
            <BarChart3 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Matching Algorithm Factors</h3>
            <p className="text-sm text-muted-foreground">How we calculate your compatibility scores</p>
          </div>
        </div>

        <div className="space-y-3">
          {algorithmFactors.map((factor, index) => (
            <motion.div
              key={factor.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -20 }}
              transition={{ duration: 0.4, delay: 0.9 + index * 0.05 }}
              className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-border transition-colors"
            >
              <div className="flex items-center gap-3">
                <factor.icon className={`w-4 h-4 ${factor.color}`} />
                <span className="text-sm font-medium text-foreground">{factor.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{factor.weight}% weight</span>
                <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: isVisible ? `${factor.weight * 5}%` : 0 }}
                    transition={{ duration: 0.8, delay: 1 + index * 0.05 }}
                    className={`h-full bg-gradient-to-r ${factor.color === 'text-purple-400' ? 'from-purple-500 to-purple-600' :
                      factor.color === 'text-blue-400' ? 'from-blue-500 to-blue-600' :
                      factor.color === 'text-green-400' ? 'from-green-500 to-green-600' :
                      factor.color === 'text-indigo-400' ? 'from-indigo-500 to-indigo-600' :
                      factor.color === 'text-cyan-400' ? 'from-cyan-500 to-cyan-600' :
                      factor.color === 'text-yellow-400' ? 'from-yellow-500 to-yellow-600' :
                      factor.color === 'text-pink-400' ? 'from-pink-500 to-pink-600' :
                      'from-red-500 to-red-600'
                    }`}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 1.5 }}
          className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-400/20 backdrop-blur-sm"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-foreground mb-1">Smart Preference Matching</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our enhanced algorithm considers your study preferences, communication style, learning goals, 
                and schedule compatibility to find the most suitable study partners for your academic journey.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Top Categories */}
      {topCategories && topCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="bg-white/5 backdrop-blur-sm border border-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Popular Study Topics</h3>
              <p className="text-sm text-muted-foreground">Most common interests among your matches</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {topCategories.slice(0, 8).map((category, index) => (
              <motion.span
                key={category}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8 }}
                transition={{ duration: 0.4, delay: 1.3 + index * 0.05 }}
                className="px-3 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 text-sm rounded-full border border-green-400/30 backdrop-blur-sm hover:border-green-400/50 transition-colors"
              >
                {category}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}