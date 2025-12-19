import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Clock, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../src/services/supabaseClient';

// Types for contact settings and messages
interface ContactSettings {
  id: string;
  email?: string;
  phone?: string;
  address?: string;
  working_hours?: string;
  map_embed_url?: string;
}

// API functions inline to avoid import issues
const contactApi = {
  async getSettings(): Promise<ContactSettings | null> {
    const { data, error } = await supabase
      .from('contact_settings')
      .select('*')
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Failed to fetch contact settings:', error);
      return null;
    }
    return data;
  },

  async submitMessage(messageData: {
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
  }) {
    const { data, error } = await supabase
      .from('contact_messages')
      .insert([{ ...messageData, status: 'new' }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// Toast component
const Toast: React.FC<{
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slide-up ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
      }`}>
      {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">×</button>
    </div>
  );
};

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export const ContactPage: React.FC = () => {
  const [settings, setSettings] = useState<ContactSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Fetch contact settings from database
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await contactApi.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load contact settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Ad Soyad zorunludur';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-posta zorunludur';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Mesaj zorunludur';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Mesaj en az 10 karakter olmalıdır';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setToast({ message: 'Lütfen zorunlu alanları doldurun', type: 'error' });
      return;
    }

    setSubmitting(true);

    try {
      await contactApi.submitMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        subject: formData.subject.trim() || undefined,
        message: formData.message.trim(),
      });

      // Success - reset form and show toast
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
      setErrors({});
      setToast({
        message: 'Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.',
        type: 'success'
      });
    } catch (error) {
      console.error('Failed to submit message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      setToast({ message: `Mesaj gönderilemedi: ${errorMessage}`, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8 md:py-12 animate-fade-in">
      <div className="container mx-auto px-3 md:px-4 max-w-5xl">

        {/* Header */}
        <div className="text-center mb-8 md:mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">İletişim</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Sorularınız, önerileriniz veya iş ortaklığı talepleriniz için bizimle iletişime geçin.
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-10">
          {/* Email Card */}
          <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm text-center hover:-translate-y-0.5 transition-transform">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail size={20} />
            </div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">E-Posta</h3>
            {loading ? (
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-3/4 mx-auto"></div>
            ) : (
              <a href={`mailto:${settings?.email || 'info@hangikatilim.com'}`} className="text-xs md:text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">
                {settings?.email || 'info@hangikatilim.com'}
              </a>
            )}
          </div>

          {/* Phone Card */}
          <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm text-center hover:-translate-y-0.5 transition-transform">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Phone size={20} />
            </div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">Telefon</h3>
            {loading ? (
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-3/4 mx-auto"></div>
            ) : (
              <a href={`tel:${settings?.phone || ''}`} className="text-xs md:text-sm font-medium text-green-600 dark:text-green-400 hover:underline">
                {settings?.phone || '-'}
              </a>
            )}
          </div>

          {/* Address Card */}
          <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm text-center hover:-translate-y-0.5 transition-transform">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <MapPin size={20} />
            </div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">Adres</h3>
            {loading ? (
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-3/4 mx-auto"></div>
            ) : (
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {settings?.address || '-'}
              </p>
            )}
          </div>

          {/* Working Hours Card */}
          <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm text-center hover:-translate-y-0.5 transition-transform">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock size={20} />
            </div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">Çalışma Saatleri</h3>
            {loading ? (
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded animate-pulse w-3/4 mx-auto"></div>
            ) : (
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                {settings?.working_hours || '-'}
              </p>
            )}
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white dark:bg-slate-850 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-lg max-w-2xl mx-auto">
          <div className="p-6 md:p-8">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">Bize Mesaj Gönderin</h3>
            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Ad Soyad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full p-2.5 md:p-3 text-sm bg-gray-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white ${errors.name ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'
                      }`}
                    placeholder="Adınız Soyadınız"
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    E-Posta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full p-2.5 md:p-3 text-sm bg-gray-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white ${errors.email ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'
                      }`}
                    placeholder="ornek@email.com"
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Telefon</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full p-2.5 md:p-3 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white"
                    placeholder="+90 XXX XXX XX XX"
                  />
                </div>

                {/* Subject */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Konu</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full p-2.5 md:p-3 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white"
                    placeholder="Mesajınızın konusu"
                  />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Mesajınız <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full p-2.5 md:p-3 text-sm bg-gray-50 dark:bg-slate-900 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all dark:text-white resize-none ${errors.message ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'
                    }`}
                  placeholder="Nasıl yardımcı olabiliriz?"
                />
                {errors.message && <p className="text-xs text-red-500">{errors.message}</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold py-3 md:py-3.5 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 text-sm md:text-base"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Mesajı Gönder
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Map Embed */}
        {settings?.map_embed_url && (
          <div className="mt-8 md:mt-10 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 shadow-lg">
            <iframe
              src={settings.map_embed_url}
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Konum Haritası"
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
