'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useSession } from 'next-auth/react'

interface PostMenuDropdownProps {
    postId: string
    creatorId: string
    creatorName: string
    locale: string
    isArabic: boolean
    isOpen: boolean
    onClose: () => void
    isHidden?: boolean
    onHideToggle?: (hidden: boolean) => void
}

export function PostMenuDropdown({
    postId,
    creatorId,
    creatorName,
    locale,
    isArabic,
    isOpen,
    onClose,
    isHidden: initialIsHidden = false,
    onHideToggle
}: PostMenuDropdownProps) {
    const { data: session } = useSession()
    const [isHidden, setIsHidden] = useState(initialIsHidden)
    const [showLists, setShowLists] = useState(false)
    const [lists, setLists] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen && session) {
            fetchLists()
        }
    }, [isOpen, session])

    const fetchLists = async () => {
        try {
            const response = await fetch('/api/user/lists')
            if (response.ok) {
                const data = await response.json()
                setLists(data.lists || [])
            }
        } catch (error) {
            console.error('Error fetching lists:', error)
        }
    }

    const handleCopyLink = (e: React.MouseEvent) => {
        e.stopPropagation()
        const postUrl = `${window.location.origin}/${locale}/posts/${postId}`
        navigator.clipboard.writeText(postUrl)
        toast.success(isArabic ? 'تم نسخ الرابط!' : 'Link copied!')
        onClose()
    }

    const handleToggleHide = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!session) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/user/hidden-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hiddenUserId: creatorId })
            })

            if (response.ok) {
                const data = await response.json()
                setIsHidden(data.hidden)
                onHideToggle?.(data.hidden)
                toast.success(data.message)
                onClose()
            } else {
                const error = await response.json()
                toast.error(error.error || 'Failed to update')
            }
        } catch (error) {
            console.error('Hide user error:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleAddToList = async (listId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setLoading(true)
        try {
            const response = await fetch('/api/user/lists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add', listId, postId })
            })

            if (response.ok) {
                toast.success(isArabic ? 'تمت الإضافة إلى القائمة' : 'Added to list')
                onClose()
            } else {
                const error = await response.json()
                toast.error(error.error || 'Failed to add')
            }
        } catch (error) {
            console.error('Add to list error:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateListAndAdd = async (e: React.MouseEvent) => {
        e.stopPropagation()
        const listName = prompt(isArabic ? 'اسم القائمة الجديدة:' : 'New list name:')
        if (!listName) return

        setLoading(true)
        try {
            // 1. Create list
            const createRes = await fetch('/api/user/lists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', listName })
            })

            if (createRes.ok) {
                const data = await createRes.json()
                // 2. Add post to new list
                await handleAddToList(data.list.id, e)
            }
        } catch (error) {
            console.error('Create list error:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop to close menu */}
            <div
                className="fixed inset-0 z-40"
                onClick={(e) => {
                    e.stopPropagation()
                    onClose()
                }}
            />

            {/* Menu Dialog */}
            <div
                className="absolute right-0 mt-2 w-64 bg-[#292929] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {!showLists ? (
                    <>
                        <button
                            onClick={handleCopyLink}
                            className="w-full px-4 py-3.5 text-left hover:bg-white/5 transition-colors flex items-center gap-3 text-white border-b border-white/5"
                        >
                            <svg className="w-5 h-5 text-[#0a84ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>{isArabic ? 'نسخ رابط المنشور' : 'Copy link to post'}</span>
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                if (!session) {
                                    toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
                                    return
                                }
                                setShowLists(true)
                            }}
                            className="w-full px-4 py-3.5 text-left hover:bg-white/5 transition-colors flex items-center gap-3 text-white border-b border-white/5"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            <span>{isArabic ? 'إضافة إلى القوائم' : 'Add to lists'}</span>
                        </button>

                        <button
                            onClick={handleToggleHide}
                            disabled={loading}
                            className={`w-full px-4 py-3.5 text-left hover:bg-white/5 transition-colors flex items-center gap-3 text-white ${loading ? 'opacity-50' : ''}`}
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                            <span>
                                {isHidden
                                    ? (isArabic ? 'إلغاء إخفاء المستخدم' : 'Unhide user')
                                    : (isArabic ? 'إخفاء منشورات المستخدم' : "Hide user's posts")}
                            </span>
                        </button>
                    </>
                ) : (
                    <div className="max-h-64 flex flex-col">
                        <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between bg-white/5">
                            <button onClick={(e) => { e.stopPropagation(); setShowLists(false) }} className="text-muted-foreground hover:text-white transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <span className="text-sm font-bold text-white">{isArabic ? 'اختر قائمة' : 'Select List'}</span>
                            <div className="w-4" />
                        </div>
                        <div className="overflow-y-auto flex-1">
                            {lists.map(list => (
                                <button
                                    key={list.id}
                                    onClick={(e) => handleAddToList(list.id, e)}
                                    className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors text-white border-b border-white/5 flex items-center justify-between"
                                >
                                    <span>{list.name}</span>
                                    {list.items?.some((i: any) => i.postId === postId) && (
                                        <svg className="w-4 h-4 text-[#0a84ff]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    )}
                                </button>
                            ))}
                            <button
                                onClick={handleCreateListAndAdd}
                                className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors text-[#0a84ff] font-medium flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                {isArabic ? 'إنشاء قائمة جديدة' : 'Create new list'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
