'use client';

import { useState } from 'react';
import { useLocaleSafe } from '@/hooks/useTranslationsSafe';
import { Mail, MessageCircle, Phone, MapPin, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ContactPage() {
    const locale = useLocaleSafe();
    const isArabic = locale === 'ar';
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate form submission
        setTimeout(() => {
            toast.success(
                isArabic ? 'تم إرسال رسالتك بنجاح!' : 'Your message has been sent successfully!',
                {
                    style: {
                        background: '#333',
                        color: '#fff',
                    },
                }
            );
            setFormData({ name: '', email: '', subject: '', message: '' });
            setIsSubmitting(false);
        }, 1500);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="min-h-screen pt-20 pb-12" style={{ backgroundColor: '#1f1f1f' }}>
            <div className="max-w-6xl mx-auto px-8">
                {/* Header */}
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        {isArabic ? 'اتصل بنا' : 'Contact Us'}
                    </h1>
                    <p className="text-white/70 text-lg">
                        {isArabic ? 'نحن هنا للمساعدة والإجابة على أي سؤال قد يكون لديك' : 'We\'re here to help and answer any question you might have'}
                    </p>
                    <div className="h-1 w-20 bg-[#0a84ff] rounded mx-auto mt-4"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Contact Information Cards */}
                    <div className="bg-neutral-900/50 rounded-2xl p-6 border border-white/10 flex flex-col items-center text-center">
                        <div className="w-14 h-14 bg-[#0a84ff]/20 rounded-full flex items-center justify-center mb-4">
                            <Mail className="w-7 h-7 text-[#0a84ff]" />
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-2">
                            {isArabic ? 'البريد الإلكتروني' : 'Email'}
                        </h3>
                        <p className="text-white/70 text-sm mb-2">
                            {isArabic ? 'تواصل معنا عبر البريد الإلكتروني' : 'Get in touch via email'}
                        </p>
                        <a href="mailto:support@prime-edu.com" className="text-[#0a84ff] hover:underline">
                            support@prime-edu.com
                        </a>
                    </div>

                    <div className="bg-neutral-900/50 rounded-2xl p-6 border border-white/10 flex flex-col items-center text-center">
                        <div className="w-14 h-14 bg-[#0a84ff]/20 rounded-full flex items-center justify-center mb-4">
                            <Phone className="w-7 h-7 text-[#0a84ff]" />
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-2">
                            {isArabic ? 'الهاتف' : 'Phone'}
                        </h3>
                        <p className="text-white/70 text-sm mb-2">
                            {isArabic ? 'اتصل بنا مباشرة' : 'Give us a call'}
                        </p>
                        <a href="tel:+20123456789" className="text-[#0a84ff] hover:underline">
                            +20 123 456 789
                        </a>
                    </div>

                    <div className="bg-neutral-900/50 rounded-2xl p-6 border border-white/10 flex flex-col items-center text-center">
                        <div className="w-14 h-14 bg-[#0a84ff]/20 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="w-7 h-7 text-[#0a84ff]" />
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-2">
                            {isArabic ? 'الدردشة المباشرة' : 'Live Chat'}
                        </h3>
                        <p className="text-white/70 text-sm mb-2">
                            {isArabic ? 'متاح من 9 صباحًا - 6 مساءً' : 'Available 9am - 6pm'}
                        </p>
                        <button className="text-[#0a84ff] hover:underline">
                            {isArabic ? 'ابدأ الدردشة' : 'Start Chat'}
                        </button>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Form */}
                    <div className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-semibold text-white mb-6">
                            {isArabic ? 'أرسل لنا رسالة' : 'Send Us a Message'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name */}
                            <div>
                                <label htmlFor="name" className="block text-white/80 text-sm font-medium mb-2">
                                    {isArabic ? 'الاسم' : 'Name'} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#0a84ff]/50"
                                    placeholder={isArabic ? 'اسمك الكامل' : 'Your full name'}
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-white/80 text-sm font-medium mb-2">
                                    {isArabic ? 'البريد الإلكتروني' : 'Email'} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#0a84ff]/50"
                                    placeholder={isArabic ? 'بريدك الإلكتروني' : 'your@email.com'}
                                />
                            </div>

                            {/* Subject */}
                            <div>
                                <label htmlFor="subject" className="block text-white/80 text-sm font-medium mb-2">
                                    {isArabic ? 'الموضوع' : 'Subject'} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#0a84ff]/50"
                                >
                                    <option value="">
                                        {isArabic ? 'اختر موضوعًا' : 'Select a subject'}
                                    </option>
                                    <option value="general">
                                        {isArabic ? 'استفسار عام' : 'General Inquiry'}
                                    </option>
                                    <option value="support">
                                        {isArabic ? 'الدعم الفني' : 'Technical Support'}
                                    </option>
                                    <option value="billing">
                                        {isArabic ? 'الفوترة والدفع' : 'Billing & Payment'}
                                    </option>
                                    <option value="courses">
                                        {isArabic ? 'استفسار عن الدورات' : 'Course Inquiry'}
                                    </option>
                                    <option value="partnership">
                                        {isArabic ? 'الشراكة' : 'Partnership'}
                                    </option>
                                </select>
                            </div>

                            {/* Message */}
                            <div>
                                <label htmlFor="message" className="block text-white/80 text-sm font-medium mb-2">
                                    {isArabic ? 'الرسالة' : 'Message'} <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    rows={5}
                                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#0a84ff]/50 resize-none"
                                    placeholder={isArabic ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                                ></textarea>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full px-6 py-4 bg-[#0a84ff] hover:bg-[#0a84ff]/90 disabled:bg-[#0a84ff]/50 text-white font-semibold rounded-full transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        {isArabic ? 'جاري الإرسال...' : 'Sending...'}
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        {isArabic ? 'إرسال الرسالة' : 'Send Message'}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Additional Information */}
                    <div className="space-y-8">
                        {/* Office Location */}
                        <div className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 bg-[#0a84ff]/20 rounded-full flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-6 h-6 text-[#0a84ff]" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">
                                        {isArabic ? 'مكتبنا' : 'Our Office'}
                                    </h3>
                                    <p className="text-white/70 leading-relaxed">
                                        {isArabic
                                            ? 'القاهرة، مصر\nشارع التحرير، وسط البلد\nمبنى برايم للتعليم، الطابق الخامس'
                                            : 'Cairo, Egypt\nTahrir Street, Downtown\nPrime Education Building, 5th Floor'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Business Hours */}
                        <div className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10">
                            <h3 className="text-xl font-semibold text-white mb-4">
                                {isArabic ? 'ساعات العمل' : 'Business Hours'}
                            </h3>
                            <div className="space-y-3 text-white/70">
                                <div className="flex justify-between">
                                    <span>{isArabic ? 'الأحد - الخميس' : 'Sunday - Thursday'}</span>
                                    <span>{isArabic ? '9:00 صباحًا - 6:00 مساءً' : '9:00 AM - 6:00 PM'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{isArabic ? 'الجمعة' : 'Friday'}</span>
                                    <span>{isArabic ? 'مغلق' : 'Closed'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{isArabic ? 'السبت' : 'Saturday'}</span>
                                    <span>{isArabic ? '10:00 صباحًا - 4:00 مساءً' : '10:00 AM - 4:00 PM'}</span>
                                </div>
                            </div>
                        </div>

                        {/* FAQ Link */}
                        <div className="bg-gradient-to-r from-[#0a84ff]/20 to-transparent rounded-2xl p-8 border border-[#0a84ff]/30">
                            <h3 className="text-xl font-semibold text-white mb-2">
                                {isArabic ? 'هل لديك سؤال؟' : 'Have a Question?'}
                            </h3>
                            <p className="text-white/70 mb-4">
                                {isArabic
                                    ? 'تحقق من مركز المساعدة لدينا للحصول على إجابات فورية'
                                    : 'Check out our Help Center for instant answers'}
                            </p>
                            <button
                                onClick={() => window.location.href = `/${locale}/help`}
                                className="px-6 py-3 bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white font-semibold rounded-full transition-all"
                            >
                                {isArabic ? 'زيارة مركز المساعدة' : 'Visit Help Center'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
