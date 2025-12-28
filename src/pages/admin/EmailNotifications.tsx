import React, { useState, useEffect } from 'react';
import {
    Mail, Send, Users, FileText, Clock, CheckCircle, XCircle,
    RefreshCw, Edit2, Save, X, AlertCircle, Trash2, Search, Eye
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import emailService, { EmailTemplate, EmailLog, NotificationSubscriber } from '../../services/api/emailService';
import RichTextEditor from '../../components/admin/RichTextEditor';

type Tab = 'send' | 'templates' | 'logs' | 'subscribers';

// Reusable Card Component
const Card: React.FC<{ children: React.ReactNode; className?: string; hover?: boolean }> = ({
    children, className = '', hover = false
}) => (
    <div className={`
        rounded-2xl border border-slate-200 dark:border-slate-700 
        bg-white dark:bg-slate-800 p-5 shadow-sm 
        ${hover ? 'transition-all duration-200 hover:shadow-md hover:scale-[1.01]' : ''}
        ${className}
    `}>
        {children}
    </div>
);

// Toast Component (bottom-right)
const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'warning'; onClose: () => void }> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const styles = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        warning: 'bg-amber-50 border-amber-200 text-amber-800',
    };
    const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : AlertCircle;

    return (
        <div className={`fixed bottom-4 right-4 z-[9999] ${styles[type]} border px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-in`}>
            <Icon size={18} />
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity"><X size={16} /></button>
        </div>
    );
};

// Confirm Dialog Component
const ConfirmDialog: React.FC<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    type?: 'info' | 'warning' | 'danger';
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ isOpen, title, message, confirmText = 'Tamam', type = 'info', onConfirm, onCancel }) => {
    if (!isOpen) return null;

    const buttonStyles = {
        info: 'bg-slate-900 hover:bg-slate-800',
        warning: 'bg-amber-500 hover:bg-amber-600',
        danger: 'bg-red-500 hover:bg-red-600',
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-md w-full mx-4 overflow-hidden">
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
                </div>
                <div className="flex gap-3 p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors">
                        İptal
                    </button>
                    <button onClick={onConfirm} className={`flex-1 px-4 py-2.5 rounded-xl ${buttonStyles[type]} text-white font-medium transition-colors`}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Status Badge Component
const StatusBadge: React.FC<{ status: 'sent' | 'failed' | 'pending' }> = ({ status }) => {
    const styles = {
        sent: 'bg-green-50 text-green-700 border-green-200',
        failed: 'bg-red-50 text-red-700 border-red-200',
        pending: 'bg-amber-50 text-amber-700 border-amber-200',
    };
    const labels = { sent: 'Gönderildi', failed: 'Başarısız', pending: 'Bekliyor' };

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
            {status === 'failed' && <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>}
            {labels[status]}
        </span>
    );
};

// Preview Modal Component
const PreviewModal: React.FC<{ content: string; subject: string; onClose: () => void }> = ({ content, subject, onClose }) => (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                    <Eye size={18} className="text-slate-500" />
                    <h3 className="font-semibold text-slate-900 dark:text-white">E-posta Önizleme</h3>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <X size={18} className="text-slate-500" />
                </button>
            </div>
            <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">Konu:</p>
                <p className="font-medium text-slate-900 dark:text-white">{subject || '(Konu belirtilmedi)'}</p>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content || '<p class="text-slate-400">İçerik boş</p>' }} />
            </div>
        </div>
    </div>
);

export const EmailNotifications: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('send');
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [logs, setLogs] = useState<EmailLog[]>([]);
    const [subscribers, setSubscribers] = useState<NotificationSubscriber[]>([]);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

    // Toast & Dialog state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; type: 'info' | 'warning' | 'danger'; onConfirm: () => void } | null>(null);

    // Send form state
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [customSubject, setCustomSubject] = useState('');
    const [customContent, setCustomContent] = useState('');
    const [sendResult, setSendResult] = useState<{ total: number; sent: number; failed: number } | null>(null);
    const [sending, setSending] = useState(false);
    const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
    const [recipientSearch, setRecipientSearch] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    const showToast = (message: string, type: 'success' | 'error' | 'warning') => setToast({ message, type });
    const showConfirm = (title: string, message: string, type: 'info' | 'warning' | 'danger', onConfirm: () => void) => {
        setConfirmDialog({ isOpen: true, title, message, type, onConfirm });
    };

    useEffect(() => { loadData(); }, []);
    useEffect(() => { setSelectedRecipients(new Set(subscribers.map(s => s.id))); }, [subscribers]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [templatesData, logsData, subscribersData] = await Promise.all([
                emailService.getTemplates(),
                emailService.getLogs(),
                emailService.getAllSubscribers()
            ]);
            setTemplates(templatesData);
            setLogs(logsData);
            setSubscribers(subscribersData);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRecipient = (id: string) => {
        setSelectedRecipients(prev => {
            const newSet = new Set(prev);
            newSet.has(id) ? newSet.delete(id) : newSet.add(id);
            return newSet;
        });
    };

    const filteredSubscribers = subscribers.filter(s =>
        s.email.toLowerCase().includes(recipientSearch.toLowerCase()) ||
        (s.full_name || '').toLowerCase().includes(recipientSearch.toLowerCase())
    );

    const handleSendBulk = async () => {
        if (!customContent) {
            showToast('Lütfen e-posta içeriği girin', 'warning');
            return;
        }
        const recipientsToSend = subscribers.filter(s => selectedRecipients.has(s.id));
        if (recipientsToSend.length === 0) {
            showToast('Lütfen en az bir alıcı seçin', 'warning');
            return;
        }

        showConfirm('E-posta Gönderimi', `${recipientsToSend.length} kişiye e-posta gönderilecek.`, 'info', async () => {
            setConfirmDialog(null);
            setSending(true);
            setSendResult(null);

            try {
                let result = { total: 0, sent: 0, failed: 0 };
                for (const subscriber of recipientsToSend) {
                    const sendResult = await emailService.sendEmail(
                        subscriber.email,
                        customSubject || 'Katılım Uzmanı Bildirimi',
                        customContent
                    );
                    result.total++;
                    sendResult.success ? result.sent++ : result.failed++;
                }
                setSendResult(result);
                await loadData();
                if (result.sent > 0) showToast(`${result.sent} e-posta gönderildi!`, 'success');
                if (result.failed > 0) showToast(`${result.failed} e-posta başarısız`, 'error');
            } catch (error) {
                console.error('Send failed:', error);
                showToast('Gönderim hatası', 'error');
            } finally {
                setSending(false);
            }
        });
    };

    const handleUpdateTemplate = async () => {
        if (!editingTemplate) return;
        try {
            await emailService.updateTemplate(editingTemplate.id, {
                subject: editingTemplate.subject,
                body_html: editingTemplate.body_html,
                body_text: editingTemplate.body_text
            });
            setEditingTemplate(null);
            await loadData();
            showToast('Şablon güncellendi', 'success');
        } catch (error) {
            showToast('Güncelleme başarısız', 'error');
        }
    };

    const tabs = [
        { id: 'send' as Tab, label: 'E-posta Gönder', icon: Send },
        { id: 'templates' as Tab, label: 'Şablonlar', icon: FileText },
        { id: 'logs' as Tab, label: 'Gönderim Geçmişi', icon: Clock },
        { id: 'subscribers' as Tab, label: 'Aboneler', icon: Users }
    ];

    const stats = {
        subscribers: subscribers.length,
        sent: logs.filter(l => l.status === 'sent').length,
        failed: logs.filter(l => l.status === 'failed').length,
    };

    const canSend = customSubject.trim() !== '' && customContent.trim() !== '' && selectedRecipients.size > 0;

    return (
        <>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">E-posta Bildirimleri</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Üyelere toplu e-posta gönderimi ve yönetimi</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={loadData} disabled={loading} className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50">
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Pill Tabs */}
                <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-600'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            <tab.icon size={16} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Send Email Tab */}
                {activeTab === 'send' && (
                    <div className="space-y-6">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card hover>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Toplam Abone</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.subscribers}</p>
                                    </div>
                                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700">
                                        <Users size={20} className="text-slate-500" />
                                    </div>
                                </div>
                            </Card>
                            <Card hover>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Gönderilen</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.sent}</p>
                                    </div>
                                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700">
                                        <CheckCircle size={20} className="text-slate-500" />
                                    </div>
                                </div>
                            </Card>
                            <Card hover>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Başarısız</p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                                            {stats.failed}
                                            {stats.failed > 0 && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                                        </p>
                                    </div>
                                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700">
                                        <XCircle size={20} className="text-slate-500" />
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* 2-Column Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left: Compose Email */}
                            <div className="lg:col-span-2">
                                <Card hover={false}>
                                    <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Yeni E-posta</h3>
                                    <div className="space-y-4">
                                        {/* Template Select */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Şablon (Opsiyonel)</label>
                                            <select
                                                value={selectedTemplate}
                                                onChange={(e) => setSelectedTemplate(e.target.value)}
                                                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                                            >
                                                <option value="">-- Özel E-posta --</option>
                                                {templates.filter(t => t.is_active).map((t) => (
                                                    <option key={t.id} value={t.name}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Subject */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Konu *</label>
                                            <input
                                                type="text"
                                                value={customSubject}
                                                onChange={(e) => setCustomSubject(e.target.value)}
                                                placeholder="E-posta konusu..."
                                                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent"
                                            />
                                        </div>

                                        {/* Content */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">İçerik *</label>
                                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                                <RichTextEditor
                                                    content={customContent}
                                                    onChange={(html) => setCustomContent(html)}
                                                    placeholder="E-posta içeriğini yazın..."
                                                />
                                            </div>
                                        </div>

                                        {/* Send Result */}
                                        {sendResult && (
                                            <div className={`p-3 rounded-xl border ${sendResult.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                                                <p className="text-sm font-medium text-slate-900">
                                                    Gönderim tamamlandı: {sendResult.sent} başarılı, {sendResult.failed} başarısız
                                                </p>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center justify-between pt-2">
                                            <button
                                                onClick={() => setShowPreview(true)}
                                                disabled={!customContent}
                                                className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-50 flex items-center gap-1"
                                            >
                                                <Eye size={14} />
                                                Önizleme
                                            </button>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-slate-500">
                                                    {selectedRecipients.size} kişiye gönderilecek
                                                </span>
                                                <button
                                                    onClick={handleSendBulk}
                                                    disabled={!canSend || sending}
                                                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white dark:text-slate-900 rounded-xl font-medium transition-colors disabled:cursor-not-allowed"
                                                >
                                                    {sending ? (
                                                        <><RefreshCw size={16} className="animate-spin" /> Gönderiliyor...</>
                                                    ) : (
                                                        <><Send size={16} /> Gönder</>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Right: Recipients */}
                            <div className="lg:col-span-1">
                                <Card hover={false} className="h-full">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Alıcılar</h3>
                                        <span className="text-xs text-slate-500">{selectedRecipients.size}/{subscribers.length}</span>
                                    </div>

                                    {/* Search */}
                                    <div className="relative mb-3">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={recipientSearch}
                                            onChange={(e) => setRecipientSearch(e.target.value)}
                                            placeholder="İsim veya e-posta ara..."
                                            className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent placeholder-slate-400"
                                        />
                                    </div>

                                    {/* Select All / Clear */}
                                    <div className="flex gap-2 mb-3">
                                        <button onClick={() => setSelectedRecipients(new Set(subscribers.map(s => s.id)))} className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Tümünü seç</button>
                                        <span className="text-slate-300">|</span>
                                        <button onClick={() => setSelectedRecipients(new Set())} className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Temizle</button>
                                    </div>

                                    {/* List */}
                                    <div className="max-h-64 overflow-y-auto space-y-1">
                                        {filteredSubscribers.map((s) => (
                                            <label
                                                key={s.id}
                                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${selectedRecipients.has(s.id) ? 'bg-slate-100 dark:bg-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRecipients.has(s.id)}
                                                    onChange={() => toggleRecipient(s.id)}
                                                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-slate-900 dark:text-white truncate">{s.full_name || s.email}</p>
                                                    <p className="text-xs text-slate-500 truncate">{s.email}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}

                {/* Templates Tab */}
                {activeTab === 'templates' && (
                    <Card hover={false}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">E-posta Şablonları</h3>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {templates.length === 0 ? (
                                <div className="py-8 text-center text-slate-500">Henüz şablon yok</div>
                            ) : templates.map((t) => (
                                <div key={t.id} className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 -mx-5 px-5 transition-colors">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-900 dark:text-white">{t.name}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {t.is_active ? 'Aktif' : 'Pasif'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-0.5">{t.subject}</p>
                                    </div>
                                    <button onClick={() => setEditingTemplate(t)} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Template Edit Modal */}
                {editingTemplate && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Şablon Düzenle: {editingTemplate.name}</h2>
                                <button onClick={() => setEditingTemplate(null)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                    <X size={18} className="text-slate-500" />
                                </button>
                            </div>
                            <div className="p-5 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Konu</label>
                                    <input
                                        type="text"
                                        value={editingTemplate.subject}
                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">HTML İçerik</label>
                                    <textarea
                                        value={editingTemplate.body_html}
                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, body_html: e.target.value })}
                                        rows={10}
                                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-slate-300"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                                <button onClick={() => setEditingTemplate(null)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                                    İptal
                                </button>
                                <button onClick={handleUpdateTemplate} className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-medium transition-colors">
                                    <Save size={16} /> Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Logs Tab */}
                {activeTab === 'logs' && (
                    <Card hover={false}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Gönderim Geçmişi</h3>
                            <span className="text-xs text-slate-500">Son 50 gönderim</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                        <th className="text-left py-2 text-xs font-medium text-slate-500 uppercase">Tarih</th>
                                        <th className="text-left py-2 text-xs font-medium text-slate-500 uppercase">Konu</th>
                                        <th className="text-left py-2 text-xs font-medium text-slate-500 uppercase">Alıcı</th>
                                        <th className="text-left py-2 text-xs font-medium text-slate-500 uppercase">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {logs.slice(0, 50).map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                            <td className="py-2.5 text-sm text-slate-600 dark:text-slate-400">
                                                {new Date(log.created_at).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="py-2.5 text-sm text-slate-900 dark:text-white truncate max-w-[200px]">{log.subject}</td>
                                            <td className="py-2.5 text-sm text-slate-600 dark:text-slate-400 truncate max-w-[200px]">{log.recipient_email}</td>
                                            <td className="py-2.5"><StatusBadge status={log.status} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {logs.length === 0 && (
                                <div className="py-8 text-center text-slate-500">Henüz gönderim yok</div>
                            )}
                        </div>
                    </Card>
                )}

                {/* Subscribers Tab */}
                {activeTab === 'subscribers' && (
                    <Card hover={false}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Aboneler</h3>
                            <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
                                {subscribers.length} kişi
                            </span>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {subscribers.length === 0 ? (
                                <div className="py-8 text-center text-slate-500">Abone yok</div>
                            ) : subscribers.map((s) => (
                                <div key={s.id} className="py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 -mx-5 px-5 transition-colors">
                                    <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 font-medium text-sm">
                                        {(s.full_name || s.email)[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{s.full_name || '-'}</p>
                                        <p className="text-xs text-slate-500">{s.email}</p>
                                    </div>
                                    <button
                                        onClick={() => showConfirm('Aboneyi Sil', `${s.email} silinsin mi?`, 'danger', async () => {
                                            setConfirmDialog(null);
                                            try {
                                                await supabase.rpc('delete_subscriber', { p_subscriber_id: s.id });
                                                showToast('Abone silindi', 'success');
                                                loadData();
                                            } catch { showToast('Silme başarısız', 'error'); }
                                        })}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>

            {/* Preview Modal */}
            {showPreview && <PreviewModal content={customContent} subject={customSubject} onClose={() => setShowPreview(false)} />}

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Confirm Dialog */}
            {confirmDialog && (
                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    type={confirmDialog.type}
                    confirmText="Tamam"
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={() => setConfirmDialog(null)}
                />
            )}
        </>
    );
};

export default EmailNotifications;
