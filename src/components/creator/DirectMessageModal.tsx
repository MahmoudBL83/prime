'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Smile, Paperclip, Image as ImageIcon, DollarSign, Heart, Check } from 'lucide-react'
import Image from 'next/image'

interface Message {
  id: string
  content: string
  sender: 'user' | 'creator'
  timestamp: Date
  type: 'text' | 'image' | 'tip'
  amount?: number
  imageUrl?: string
  read?: boolean
}

interface DirectMessageModalProps {
  creator: any
  isOpen: boolean
  onClose: () => void
  onSendMessage: (message: string, type: string) => void
}

export default function DirectMessageModal({ creator, isOpen, onClose, onSendMessage }: DirectMessageModalProps) {
  const [message, setMessage] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hi! Thanks for subscribing! I'm excited to have you here. Feel free to message me anytime! 💖`,
      sender: 'creator',
      timestamp: new Date(Date.now() - 3600000),
      type: 'text',
      read: true
    }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const handleSend = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: message,
        sender: 'user',
        timestamp: new Date(),
        type: 'text',
        read: false
      }
      
      setMessages([...messages, newMessage])
      onSendMessage(message, 'text')
      setMessage('')

      // Simulate creator typing and response
      setTimeout(() => {
        setIsTyping(true)
      }, 1000)

      setTimeout(() => {
        setIsTyping(false)
        const responses = [
          "Thanks for your message! 😊",
          "I appreciate you reaching out! 💕",
          "That's so sweet of you! ✨",
          "I'm glad you're enjoying the content! 🎉"
        ]
        const response: Message = {
          id: (Date.now() + 1).toString(),
          content: responses[Math.floor(Math.random() * responses.length)],
          sender: 'creator',
          timestamp: new Date(),
          type: 'text',
          read: true
        }
        setMessages(prev => [...prev, response])
      }, 3000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-gray-900 rounded-2xl max-w-2xl w-full h-[600px] border border-gray-800 shadow-2xl flex flex-col">
              {/* Header */}
              <div className="relative p-4 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 p-0.5">
                      <div className="w-full h-full rounded-full bg-gray-900 overflow-hidden flex items-center justify-center">
                        {creator?.user?.profileImage ? (
                          <Image 
                            src={creator.user.profileImage} 
                            alt={creator.user.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-500" />
                        )}
                      </div>
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{creator?.user?.name}</h3>
                    <p className="text-xs text-green-400">● Online</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${msg.sender === 'user' ? 'order-2' : 'order-1'}`}>
                      {msg.type === 'text' && (
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            msg.sender === 'user'
                              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                              : 'bg-gray-800 text-gray-100'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      )}
                      {msg.type === 'tip' && (
                        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-5 h-5 text-yellow-400" />
                            <span className="text-white font-semibold">Sent ${msg.amount} tip</span>
                            <Heart className="w-4 h-4 text-pink-400" />
                          </div>
                          {msg.content && (
                            <p className="text-gray-300 text-sm mt-2">{msg.content}</p>
                          )}
                        </div>
                      )}
                      <div className={`flex items-center space-x-1 mt-1 text-xs text-gray-500 ${
                        msg.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}>
                        <span>{formatTime(msg.timestamp)}</span>
                        {msg.sender === 'user' && msg.read && (
                          <Check className="w-3 h-3 text-blue-400" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-800 rounded-2xl px-4 py-3">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-800 bg-gray-800/50">
                <div className="flex items-end space-x-2">
                  <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700 focus-within:border-pink-500 transition-colors">
                    <textarea
                      ref={inputRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      rows={1}
                      className="w-full bg-transparent px-4 py-3 text-white resize-none focus:outline-none"
                      style={{ minHeight: '48px', maxHeight: '120px' }}
                    />
                    <div className="px-4 pb-2 flex items-center space-x-2">
                      <button className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white">
                        <Smile className="w-5 h-5" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white">
                        <ImageIcon className="w-5 h-5" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white">
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white">
                        <DollarSign className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!message.trim()}
                    className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
