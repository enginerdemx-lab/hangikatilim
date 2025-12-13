
import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Save, AlertCircle, ArrowLeft, CheckCircle, Check } from 'lucide-react';
import { LegalType } from './LegalModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
  onLogin: (user: { name: string; email: string }) => void;
  onShowLegal: (type: LegalType) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultTab = 'login', onLogin, onShowLegal }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot_password'>(defaultTab);
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Registration Consents
  const [registerConsents, setRegisterConsents] = useState({
    kvkk: false,
    privacy: false,
    commercial: false
  });
  
  // Forgot Password State
  const [resetSent, setResetSent] = useState(false);
  
  // Error State
  const [errors, setErrors] = useState<{email?: string; password?: string; name?: string; agreements?: string}>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setEmail('');
      setPassword('');
      setName('');
      setRegisterConsents({ kvkk: false, privacy: false, commercial: false });
      setActiveTab(defaultTab);
      setResetSent(false);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: {email?: string; password?: string; name?: string; agreements?: string} = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      newErrors.email = 'E-posta adresi zorunludur.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz.';
    }

    if (!password) {
      newErrors.password = 'Şifre zorunludur.';
    } else if (password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır.';
    }

    if (activeTab === 'register') {
      if (!name.trim()) {
        newErrors.name = 'Ad Soyad zorunludur.';
      } else if (name.trim().length < 3) {
        newErrors.name = 'Ad Soyad en az 3 karakter olmalıdır.';
      }

      if (!registerConsents.kvkk || !registerConsents.privacy) {
          newErrors.agreements = 'Lütfen zorunlu onayları işaretleyiniz.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      // Simulate API call or submission logic
      const userName = activeTab === 'register' ? name : 'Ziyaretçi Üye';
      onLogin({
        name: userName,
        email: email
      });
      onClose();
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const newErrors: {email?: string} = {};

    if (!email.trim()) {
      newErrors.email = 'E-posta adresi zorunludur.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz.';
    }

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }
    
    // Simulate API call
    setResetSent(true);
    setErrors({});
  };

  const switchTab = (tab: 'login' | 'register' | 'forgot_password') => {
      setActiveTab(tab);
      setErrors({});
      setResetSent(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-opacity duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all scale-100 border border-transparent dark:border-slate-800 max-h-[90vh] overflow-y-auto relative">
        
        {/* Minimal Header with Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Minimal Tabs */}
        {activeTab !== 'forgot_password' && (
            <div className="flex border-b border-gray-100 dark:border-slate-800 pt-2 px-2">
            <button
                className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${activeTab === 'login' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
                onClick={() => switchTab('login')}
            >
                Giriş Yap
                {activeTab === 'login' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900 dark:bg-white rounded-t-full"></div>}
            </button>
            <button
                className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${activeTab === 'register' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
                onClick={() => switchTab('register')}
            >
                Üye Ol
                {activeTab === 'register' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900 dark:bg-white rounded-t-full"></div>}
            </button>
            </div>
        )}

        <div className="p-6 md:p-8">
          {activeTab === 'login' && (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">E-POSTA</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-3 bg-gray-50 dark:bg-slate-800 border rounded-lg focus:ring-1 focus:ring-gray-900 dark:focus:ring-white focus:border-gray-900 dark:focus:border-white outline-none transition-all text-sm text-gray-900 dark:text-white ${errors.email ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'}`}
                  placeholder="" 
                />
                {errors.email && <p className="text-xs text-red-500 flex items-center gap-1">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">ŞİFRE</label>
                    <button type="button" onClick={() => switchTab('forgot_password')} className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white font-medium">Unuttum?</button>
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-3 py-3 bg-gray-50 dark:bg-slate-800 border rounded-lg focus:ring-1 focus:ring-gray-900 dark:focus:ring-white focus:border-gray-900 dark:focus:border-white outline-none transition-all text-sm text-gray-900 dark:text-white ${errors.password ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'}`}
                  placeholder="" 
                />
                {errors.password && <p className="text-xs text-red-500 flex items-center gap-1">{errors.password}</p>}
              </div>

              <button type="submit" className="w-full bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-gray-200 dark:shadow-none">
                Giriş Yap
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {activeTab === 'register' && (
            <form className="space-y-4" onSubmit={handleSubmit}>
               {/* Simplified info box */}
               <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex gap-3 items-start mb-2 border border-blue-100 dark:border-blue-800/50">
                  <Save size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-800 dark:text-blue-300 leading-snug">Hesaplamalarınız otomatik olarak kaydedilecektir.</p>
               </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">AD SOYAD</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 py-3 bg-gray-50 dark:bg-slate-800 border rounded-lg focus:ring-1 focus:ring-gray-900 dark:focus:ring-white focus:border-gray-900 dark:focus:border-white outline-none transition-all text-sm text-gray-900 dark:text-white ${errors.name ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'}`}
                  placeholder="" 
                />
                {errors.name && <p className="text-xs text-red-500 flex items-center gap-1">{errors.name}</p>}
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">E-POSTA</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-3 bg-gray-50 dark:bg-slate-800 border rounded-lg focus:ring-1 focus:ring-gray-900 dark:focus:ring-white focus:border-gray-900 dark:focus:border-white outline-none transition-all text-sm text-gray-900 dark:text-white ${errors.email ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'}`}
                  placeholder="" 
                />
                {errors.email && <p className="text-xs text-red-500 flex items-center gap-1">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">ŞİFRE</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-3 py-3 bg-gray-50 dark:bg-slate-800 border rounded-lg focus:ring-1 focus:ring-gray-900 dark:focus:ring-white focus:border-gray-900 dark:focus:border-white outline-none transition-all text-sm text-gray-900 dark:text-white ${errors.password ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'}`}
                  placeholder="" 
                />
                {errors.password && <p className="text-xs text-red-500 flex items-center gap-1">{errors.password}</p>}
              </div>
              
              {/* Checkboxes - Simplified styles */}
              <div className="space-y-3 pt-2">
                 <label className="flex items-start gap-2 cursor-pointer group">
                    <div className="relative flex items-center mt-0.5">
                       <input 
                         type="checkbox" 
                         className="peer sr-only"
                         checked={registerConsents.kvkk}
                         onChange={(e) => setRegisterConsents({...registerConsents, kvkk: e.target.checked})}
                       />
                       <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${registerConsents.kvkk ? 'bg-gray-900 border-gray-900 dark:bg-white dark:border-white' : 'bg-white border-gray-300'}`}>
                          <Check size={10} className={`text-white dark:text-black transition-opacity ${registerConsents.kvkk ? 'opacity-100' : 'opacity-0'}`} />
                       </div>
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                       <button type="button" onClick={() => onShowLegal('CONSENT')} className="font-bold hover:underline">Açık Rıza Metni</button>'ni okudum, onaylıyorum.
                    </span>
                 </label>
                 
                 <label className="flex items-start gap-2 cursor-pointer group">
                    <div className="relative flex items-center mt-0.5">
                       <input 
                         type="checkbox" 
                         className="peer sr-only"
                         checked={registerConsents.privacy}
                         onChange={(e) => setRegisterConsents({...registerConsents, privacy: e.target.checked})}
                       />
                       <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${registerConsents.privacy ? 'bg-gray-900 border-gray-900 dark:bg-white dark:border-white' : 'bg-white border-gray-300'}`}>
                          <Check size={10} className={`text-white dark:text-black transition-opacity ${registerConsents.privacy ? 'opacity-100' : 'opacity-0'}`} />
                       </div>
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                       <button type="button" onClick={() => onShowLegal('KVKK')} className="font-bold hover:underline">Aydınlatma Metni</button>'ni okudum, onaylıyorum.
                    </span>
                 </label>

                 <label className="flex items-start gap-2 cursor-pointer group">
                    <div className="relative flex items-center mt-0.5">
                       <input 
                         type="checkbox" 
                         className="peer sr-only"
                         checked={registerConsents.commercial}
                         onChange={(e) => setRegisterConsents({...registerConsents, commercial: e.target.checked})}
                       />
                       <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${registerConsents.commercial ? 'bg-gray-900 border-gray-900 dark:bg-white dark:border-white' : 'bg-white border-gray-300'}`}>
                          <Check size={10} className={`text-white dark:text-black transition-opacity ${registerConsents.commercial ? 'opacity-100' : 'opacity-0'}`} />
                       </div>
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                       Ticari elektronik ileti gönderilmesini kabul ediyorum.
                    </span>
                 </label>

                 {errors.agreements && (
                     <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1">{errors.agreements}</p>
                 )}
              </div>

              <button type="submit" className="w-full bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-gray-200 dark:shadow-none">
                Hesap Oluştur
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {activeTab === 'forgot_password' && (
             <div className="animate-fade-in pt-4">
                 <button 
                   onClick={() => switchTab('login')} 
                   className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-xs font-bold mb-6 transition-colors uppercase tracking-wider"
                 >
                    <ArrowLeft size={14} /> Geri Dön
                 </button>

                 <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Şifre Sıfırlama</h3>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Kayıtlı e-posta adresinizi girin, size bir sıfırlama bağlantısı gönderelim.
                 </p>

                 {resetSent ? (
                     <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl p-6 text-center animate-fade-in">
                        <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
                        <h4 className="text-base font-bold text-green-800 dark:text-green-300 mb-1">E-posta Gönderildi</h4>
                        <p className="text-xs text-green-600 dark:text-green-400 mb-4">Lütfen gelen kutunuzu kontrol ediniz.</p>
                     </div>
                 ) : (
                     <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">E-POSTA</label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full px-3 py-3 bg-gray-50 dark:bg-slate-800 border rounded-lg focus:ring-1 focus:ring-gray-900 dark:focus:ring-white focus:border-gray-900 dark:focus:border-white outline-none transition-all text-sm text-gray-900 dark:text-white ${errors.email ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'}`}
                                placeholder="" 
                            />
                            {errors.email && <p className="text-xs text-red-500 flex items-center gap-1">{errors.email}</p>}
                        </div>

                        <button type="submit" className="w-full bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-bold py-3.5 rounded-lg transition-all text-sm shadow-lg shadow-gray-200 dark:shadow-none">
                            Bağlantı Gönder
                        </button>
                     </form>
                 )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
