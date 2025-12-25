import React, { useState, useEffect } from 'react';
import {
    Mail, Send, Users, FileText, Clock, CheckCircle, XCircle,
    RefreshCw, Edit2, Save, X, AlertCircle, Zap, AlertTriangle, Trash2
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import emailService, { EmailTemplate, EmailLog, NotificationSubscriber } from '../../services/api/emailService';
import RichTextEditor from '../../components/admin/RichTextEditor';

type Tab = 'send' | 'templates' | 'logs' | 'subscribers';

// Styled Toast Component
const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'warning'; onClose: () => void }> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-amber-500';
    const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : AlertTriangle;

    return (
        <div className={`fixed top-4 right-4 z-[9999] ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in`}>
            <Icon size={22} />
            <span className="font-medium text-sm">{message}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity"><X size={18} /></button>
        </div>
    );
};

// Styled Confirm Dialog Component
const ConfirmDialog: React.FC<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'info' | 'warning' | 'danger';
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ isOpen, title, message, confirmText = 'Tamam', cancelText = 'İptal', type = 'info', onConfirm, onCancel }) => {
    if (!isOpen) return null;

    const buttonColor = type === 'danger' ? 'bg-red-500 hover:bg-red-600' :
        type === 'warning' ? 'bg-amber-500 hover:bg-amber-600' :
            'bg-blue-500 hover:bg-blue-600';
    const iconColor = type === 'danger' ? 'text-red-500' :
        type === 'warning' ? 'text-amber-500' :
            'text-blue-500';
    const Icon = type === 'danger' ? XCircle : type === 'warning' ? AlertTriangle : AlertCircle;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full mx-4 overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-slate-700/50 ${iconColor}`}>
                            <Icon size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">{title}</h3>
                        </div>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
                </div>
                <div className="flex gap-3 p-4 bg-slate-900/50 border-t border-slate-700">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2.5 rounded-xl ${buttonColor} text-white font-medium transition-colors`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const EmailNotifications: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('send');
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [logs, setLogs] = useState<EmailLog[]>([]);
    const [subscribers, setSubscribers] = useState<NotificationSubscriber[]>([]);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

    // Toast state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'info' | 'warning' | 'danger';
        onConfirm: () => void;
    } | null>(null);

    // Send form state
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [customSubject, setCustomSubject] = useState('');
    const [customContent, setCustomContent] = useState('');
    const [sendResult, setSendResult] = useState<{ total: number; sent: number; failed: number } | null>(null);
    const [sending, setSending] = useState(false);
    const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
    const [showRecipientSelector, setShowRecipientSelector] = useState(false);

    const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
        setToast({ message, type });
    };

    const showConfirm = (title: string, message: string, type: 'info' | 'warning' | 'danger', onConfirm: () => void) => {
        setConfirmDialog({ isOpen: true, title, message, type, onConfirm });
    };

    useEffect(() => {
        loadData();
    }, []);

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

    // Initialize selected recipients when subscribers load
    useEffect(() => {
        setSelectedRecipients(new Set(subscribers.map(s => s.id)));
    }, [subscribers]);

    const toggleRecipient = (id: string) => {
        setSelectedRecipients(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const selectAllRecipients = () => {
        setSelectedRecipients(new Set(subscribers.map(s => s.id)));
    };

    const deselectAllRecipients = () => {
        setSelectedRecipients(new Set());
    };

    const handleSendBulk = async () => {
        if (!selectedTemplate && !customContent) {
            showToast('Lütfen bir şablon seçin veya özel içerik girin', 'warning');
            return;
        }

        const recipientsToSend = subscribers.filter(s => selectedRecipients.has(s.id));

        if (recipientsToSend.length === 0) {
            showToast('Lütfen en az bir alıcı seçin', 'warning');
            return;
        }

        showConfirm(
            'E-posta Gönderimi',
            `${recipientsToSend.length} kişiye e-posta gönderilecek. Devam etmek istiyor musunuz?`,
            'info',
            async () => {
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
                        if (sendResult.success) result.sent++;
                        else result.failed++;
                    }
                    setSendResult(result);
                    await loadData();
                    if (result.sent > 0) {
                        showToast(`${result.sent} e-posta başarıyla gönderildi!`, 'success');
                    }
                    if (result.failed > 0) {
                        showToast(`${result.failed} e-posta gönderilemedi`, 'error');
                    }
                } catch (error) {
                    console.error('Send failed:', error);
                    showToast('Gönderim sırasında hata oluştu', 'error');
                } finally {
                    setSending(false);
                }
            }
        );
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
        } catch (error) {
            console.error('Update failed:', error);
            alert('Şablon güncellenemedi');
        }
    };

    const tabs = [
        { id: 'send' as Tab, label: 'E-posta Gönder', icon: Send },
        { id: 'templates' as Tab, label: 'Şablonlar', icon: FileText },
        { id: 'logs' as Tab, label: 'Gönderim Geçmişi', icon: Clock },
        { id: 'subscribers' as Tab, label: 'Aboneler', icon: Users }
    ];

    return (
        <>
            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-600 rounded-xl">
                                <Mail className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-black">E-posta Bildirimleri</h1>
                                <p className="text-gray-600 text-sm">Üyelere toplu e-posta gönderimi ve şablon yönetimi</p>
                            </div>
                        </div>
                        <button
                            onClick={loadData}
                            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                        >
                            <RefreshCw className={`w-5 h-5 text-gray-300 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-slate-800 p-1 rounded-lg">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-all ${activeTab === tab.id
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-slate-700'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Send Email Tab */}
                {activeTab === 'send' && (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-5 rounded-xl bg-slate-800 border border-slate-700">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-blue-600/20 rounded-lg">
                                        <Users className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <span className="text-gray-400 text-sm font-medium">Toplam Abone</span>
                                </div>
                                <div className="text-3xl font-bold text-blue-400">
                                    {subscribers.length}
                                </div>
                            </div>

                            <div className="p-5 rounded-xl bg-slate-800 border border-slate-700">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-green-600/20 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                    </div>
                                    <span className="text-gray-400 text-sm font-medium">Gönderilen</span>
                                </div>
                                <div className="text-3xl font-bold text-green-400">
                                    {logs.filter(l => l.status === 'sent').length}
                                </div>
                            </div>

                            <div className="p-5 rounded-xl bg-slate-800 border border-slate-700">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-red-600/20 rounded-lg">
                                        <XCircle className="w-5 h-5 text-red-400" />
                                    </div>
                                    <span className="text-gray-400 text-sm font-medium">Başarısız</span>
                                </div>
                                <div className="text-3xl font-bold text-red-400">
                                    {logs.filter(l => l.status === 'failed').length}
                                </div>
                            </div>
                        </div>

                        {/* Send Form */}
                        <div className="p-6 rounded-xl bg-slate-800 border border-slate-700">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-600 rounded-lg">
                                    <Zap className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">Yeni E-posta Gönder</h3>
                            </div>

                            <div className="space-y-5">
                                {/* Template Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Şablon Seçin (Opsiyonel)
                                    </label>
                                    <select
                                        value={selectedTemplate}
                                        onChange={(e) => setSelectedTemplate(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    >
                                        <option value="">-- Özel E-posta --</option>
                                        {templates.filter(t => t.is_active).map((template) => (
                                            <option key={template.id} value={template.name}>
                                                {template.name} - {template.subject}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Konu
                                    </label>
                                    <input
                                        type="text"
                                        value={customSubject}
                                        onChange={(e) => setCustomSubject(e.target.value)}
                                        placeholder="E-posta konusu..."
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    />
                                </div>

                                {/* Content */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        İçerik
                                    </label>
                                    <RichTextEditor
                                        content={customContent}
                                        onChange={(html) => setCustomContent(html)}
                                        placeholder="E-posta içeriğini buraya yazın..."
                                    />
                                </div>

                                {/* Send Result */}
                                {sendResult && (
                                    <div className={`p-4 rounded-lg border ${sendResult.failed === 0
                                        ? 'bg-green-900/20 border-green-500/30'
                                        : 'bg-amber-900/20 border-amber-500/30'
                                        }`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            {sendResult.failed === 0 ? (
                                                <CheckCircle className="w-5 h-5 text-green-400" />
                                            ) : (
                                                <AlertCircle className="w-5 h-5 text-amber-400" />
                                            )}
                                            <span className="font-medium text-white">Gönderim Tamamlandı</span>
                                        </div>
                                        <div className="flex gap-4 text-sm">
                                            <span className="text-gray-400">Toplam: <span className="text-white font-medium">{sendResult.total}</span></span>
                                            <span className="text-gray-400">Başarılı: <span className="text-green-400 font-medium">{sendResult.sent}</span></span>
                                            <span className="text-gray-400">Başarısız: <span className="text-red-400 font-medium">{sendResult.failed}</span></span>
                                        </div>
                                    </div>
                                )}

                                {/* Recipient Selector */}
                                <div className="border border-slate-600 rounded-lg overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setShowRecipientSelector(!showRecipientSelector)}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-700/50 hover:bg-slate-700 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-blue-400" />
                                            <span className="text-white font-medium">Alıcıları Seç</span>
                                        </div>
                                        <span className="text-sm text-blue-400">
                                            {selectedRecipients.size} / {subscribers.length} seçili
                                        </span>
                                    </button>

                                    {showRecipientSelector && (
                                        <div className="p-4 space-y-3 bg-slate-800/50">
                                            {/* Select All / Deselect All */}
                                            <div className="flex gap-2 mb-3">
                                                <button
                                                    type="button"
                                                    onClick={selectAllRecipients}
                                                    className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                                >
                                                    Tümünü Seç
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={deselectAllRecipients}
                                                    className="px-3 py-1.5 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
                                                >
                                                    Hiçbirini Seçme
                                                </button>
                                            </div>

                                            {/* Subscriber List */}
                                            <div className="max-h-60 overflow-y-auto space-y-1">
                                                {subscribers.map((subscriber) => (
                                                    <label
                                                        key={subscriber.id}
                                                        className="flex items-center gap-3 p-2 rounded hover:bg-slate-700/50 cursor-pointer transition-colors"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRecipients.has(subscriber.id)}
                                                            onChange={() => toggleRecipient(subscriber.id)}
                                                            className="w-4 h-4 rounded border-slate-500 bg-slate-700 text-blue-500 focus:ring-blue-500"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-white truncate">
                                                                {subscriber.full_name || subscriber.email}
                                                            </p>
                                                            <p className="text-xs text-gray-500 truncate">
                                                                {subscriber.email}
                                                            </p>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Send Button */}
                                <button
                                    onClick={handleSendBulk}
                                    disabled={sending || selectedRecipients.size === 0}
                                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                                >
                                    {sending ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            Gönderiliyor...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            {selectedRecipients.size} Kişiye Gönder
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Templates Tab */}
                {activeTab === 'templates' && (
                    <div className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
                        <div className="p-4 border-b border-slate-700 flex items-center gap-3">
                            <div className="p-2 bg-purple-600 rounded-lg">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">E-posta Şablonları</h3>
                        </div>
                        <div className="divide-y divide-slate-700">
                            {templates.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    Henüz şablon eklenmemiş
                                </div>
                            ) : (
                                templates.map((template) => (
                                    <div key={template.id} className="p-4 hover:bg-slate-700/50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="font-medium text-white">{template.name}</span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${template.is_active
                                                        ? 'bg-green-600/20 text-green-400'
                                                        : 'bg-gray-600/20 text-gray-400'
                                                        }`}>
                                                        {template.is_active ? 'Aktif' : 'Pasif'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-400">{template.subject}</p>
                                            </div>
                                            <button
                                                onClick={() => setEditingTemplate(template)}
                                                className="p-2 text-gray-400 hover:text-white hover:bg-slate-600 rounded-lg transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Template Edit Modal */}
                {editingTemplate && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700">
                            <div className="flex items-center justify-between p-5 border-b border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-600 rounded-lg">
                                        <Edit2 className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-lg font-bold text-white">Şablon Düzenle: {editingTemplate.name}</h2>
                                </div>
                                <button onClick={() => setEditingTemplate(null)} className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-5 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Konu</label>
                                    <input
                                        type="text"
                                        value={editingTemplate.subject}
                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">HTML İçerik</label>
                                    <textarea
                                        value={editingTemplate.body_html}
                                        onChange={(e) => setEditingTemplate({ ...editingTemplate, body_html: e.target.value })}
                                        rows={10}
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div className="p-3 bg-slate-900 rounded-lg border border-slate-600">
                                    <p className="text-xs text-gray-400">
                                        <span className="text-purple-400 font-medium">Değişkenler:</span> {editingTemplate.variables.map(v => `{{${v}}}`).join(', ')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 p-5 border-t border-slate-700">
                                <button
                                    onClick={() => setEditingTemplate(null)}
                                    className="px-4 py-2 text-gray-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleUpdateTemplate}
                                    className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    <Save className="w-4 h-4" />
                                    Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Logs Tab */}
                {activeTab === 'logs' && (
                    <div className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
                        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-600 rounded-lg">
                                    <Clock className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">Gönderim Geçmişi</h3>
                            </div>
                            <button
                                onClick={loadData}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                Yenile
                            </button>
                        </div>
                        <div className="divide-y divide-slate-700">
                            {logs.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Mail className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-400">Henüz e-posta gönderilmemiş</p>
                                </div>
                            ) : (
                                logs.map((log) => (
                                    <div key={log.id} className="p-4 hover:bg-slate-700/50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-medium truncate">{log.recipient_email}</p>
                                                <p className="text-sm text-gray-400 truncate">{log.subject}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${log.status === 'sent' ? 'bg-green-600/20 text-green-400' :
                                                    log.status === 'failed' ? 'bg-red-600/20 text-red-400' : 'bg-amber-600/20 text-amber-400'
                                                    }`}>
                                                    {log.status === 'sent' ? <CheckCircle className="w-3 h-3" /> :
                                                        log.status === 'failed' ? <XCircle className="w-3 h-3" /> :
                                                            <Clock className="w-3 h-3" />}
                                                    {log.status === 'sent' ? 'Gönderildi' :
                                                        log.status === 'failed' ? 'Başarısız' : 'Bekliyor'}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(log.created_at).toLocaleString('tr-TR')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Subscribers Tab */}
                {activeTab === 'subscribers' && (
                    <div className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
                        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-600 rounded-lg">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">Aboneler</h3>
                            </div>
                            <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded text-sm font-medium">
                                {subscribers.length} kişi
                            </span>
                        </div>
                        <div className="divide-y divide-slate-700">
                            {subscribers.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-400">Bildirim almak isteyen abone bulunamadı</p>
                                </div>
                            ) : (
                                subscribers.map((subscriber) => (
                                    <div key={subscriber.id} className="p-4 hover:bg-slate-700/50 transition-colors flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                                            {(subscriber.full_name || subscriber.email)[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-medium">{subscriber.full_name || '-'}</p>
                                            <p className="text-sm text-gray-400">{subscriber.email}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                showConfirm(
                                                    'Aboneyi Sil',
                                                    `${subscriber.email} adresini abonelikten çıkarmak istediğinize emin misiniz?`,
                                                    'danger',
                                                    async () => {
                                                        setConfirmDialog(null);
                                                        try {
                                                            const { error } = await supabase.rpc('delete_subscriber', { p_subscriber_id: subscriber.id });
                                                            if (error) throw error;
                                                            showToast('Abone silindi', 'success');
                                                            await loadData();
                                                        } catch (err) {
                                                            console.error('Delete error:', err);
                                                            showToast('Silme başarısız', 'error');
                                                        }
                                                    }
                                                );
                                            }}
                                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                            title="Aboneyi Sil"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Toast */}
            {
                toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )
            }

            {/* Confirm Dialog */}
            {
                confirmDialog && (
                    <ConfirmDialog
                        isOpen={confirmDialog.isOpen}
                        title={confirmDialog.title}
                        message={confirmDialog.message}
                        type={confirmDialog.type}
                        confirmText="Gönder"
                        cancelText="İptal"
                        onConfirm={confirmDialog.onConfirm}
                        onCancel={() => setConfirmDialog(null)}
                    />
                )
            }
        </>
    );
};

export default EmailNotifications;

