'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Edit, ArrowRight } from 'lucide-react'

interface ProfileCompletionProps {
    missingFields: string[]
    completionPercentage?: number
    nextSteps?: string[]
    onStartEditing: () => void
}

export default function ProfileCompletionGuide({ 
    missingFields, 
    completionPercentage = 0, 
    nextSteps = [],
    onStartEditing 
}: ProfileCompletionProps) {
    const [isExpanded, setIsExpanded] = useState(true)

    const getFieldDisplayName = (field: string) => {
        const fieldNames: { [key: string]: string } = {
            'interests': 'Learning Interests',
            'goals': 'Study Goals',
            'skillLevel': 'Skill Level',
            'learningMode': 'Learning Mode',
            'bio': 'Bio Description',
            'studyPreferences': 'Study Preferences',
            'communicationStyle': 'Communication Style',
            'languagePreference': 'Language Preference',
            'learningStyle': 'Learning Style'
        }
        return fieldNames[field] || field
    }

    const getFieldDescription = (field: string) => {
        const descriptions: { [key: string]: string } = {
            'interests': 'What subjects or topics are you passionate about?',
            'goals': 'What do you want to achieve through studying?',
            'skillLevel': 'Are you a beginner, intermediate, or advanced learner?',
            'learningMode': 'Do you prefer individual study, group sessions, or mixed?',
            'bio': 'A brief introduction about yourself',
            'studyPreferences': 'Your preferred study times and communication style',
            'communicationStyle': 'How do you like to communicate with study partners?',
            'languagePreference': 'Which language do you prefer for study sessions?',
            'learningStyle': 'Are you a visual, auditory, or hands-on learner?'
        }
        return descriptions[field] || 'Complete this field to improve your profile'
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 
                       border border-purple-800/30 rounded-xl p-6 mb-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <Edit className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">
                            Complete Your Profile
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {completionPercentage}% complete • {missingFields.length} fields remaining
                        </p>
                    </div>
                </div>
                <button
                    onClick={onStartEditing}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-foreground px-4 py-2 rounded-lg 
                             flex items-center space-x-2 transition-colors duration-200"
                >
                    <Edit className="w-4 h-4" />
                    <span>Edit Profile</span>
                </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Profile Completion</span>
                    <span>{completionPercentage}%</span>
                </div>
                <div className="w-full bg-card rounded-full h-2">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${completionPercentage}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                    />
                </div>
            </div>

            {/* Missing Fields */}
            {isExpanded && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3"
                >
                    <h4 className="font-medium text-foreground mb-3">
                        Required for Study Buddy Matching:
                    </h4>
                    
                    {missingFields.slice(0, 5).map((field, index) => (
                        <motion.div
                            key={field}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start space-x-3 p-3 bg-white/5 
                                     rounded-lg border border-border"
                        >
                            <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h5 className="font-medium text-foreground">
                                    {getFieldDisplayName(field)}
                                </h5>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {getFieldDescription(field)}
                                </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground mt-1" />
                        </motion.div>
                    ))}

                    {/* Next Steps */}
                    {nextSteps.length > 0 && (
                        <div className="mt-6 p-4 bg-purple-500/20 rounded-lg">
                            <h5 className="font-medium text-purple-100 mb-2">
                                Quick Start Guide:
                            </h5>
                            <ul className="space-y-2">
                                {nextSteps.map((step, index) => (
                                    <li key={index} className="flex items-start space-x-2 text-sm">
                                        <span className="w-5 h-5 bg-purple-500/30 text-purple-300 
                                                       rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                                            {index + 1}
                                        </span>
                                        <span className="text-purple-200">{step}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Action Button */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={onStartEditing}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 
                                     text-foreground py-3 px-6 rounded-lg font-medium transition-all duration-200 
                                     transform hover:scale-[1.02] flex items-center justify-center space-x-2"
                        >
                            <Edit className="w-5 h-5" />
                            <span>Complete Profile Now</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-4 text-sm text-purple-400 hover:text-purple-300 
                         transition-colors duration-200"
            >
                {isExpanded ? 'Show Less' : 'Show Details'}
            </button>
        </motion.div>
    )
}