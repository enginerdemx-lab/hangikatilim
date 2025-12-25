import { supabase } from '../supabaseClient';

// SMTP configuration - Uses Natro cPanel SMTP
const SMTP_CONFIG = {
    host: '', // Will be set from environment or admin settings
    port: 465,
    secure: true,
    user: '',
    pass: '',
    from: 'bildirim@katilimuzmani.com'
};

// Email template interface
export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body_html: string;
    body_text?: string;
    variables: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// Email log interface
export interface EmailLog {
    id: string;
    user_id?: string;
    template_id?: string;
    recipient_email: string;
    subject: string;
    status: 'pending' | 'sent' | 'failed';
    error_message?: string;
    sent_at?: string;
    created_at: string;
}

// Subscriber interface
export interface NotificationSubscriber {
    id: string;
    email: string;
    full_name: string;
    unsubscribe_token?: string;
    source?: string;
    is_member?: boolean;
}

// Replace template variables
function replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
    }
    return result;
}

export const emailService = {
    // Get all email templates
    async getTemplates(): Promise<EmailTemplate[]> {
        const { data, error } = await supabase
            .from('email_templates')
            .select('*')
            .order('name');

        if (error) throw error;
        return data || [];
    },

    // Get template by name
    async getTemplateByName(name: string): Promise<EmailTemplate | null> {
        const { data, error } = await supabase
            .from('email_templates')
            .select('*')
            .eq('name', name)
            .single();

        if (error) return null;
        return data;
    },

    // Update template
    async updateTemplate(id: string, updates: Partial<EmailTemplate>): Promise<void> {
        const { error } = await supabase
            .from('email_templates')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    },

    // Get notification subscribers
    async getSubscribers(): Promise<NotificationSubscriber[]> {
        const { data, error } = await supabase.rpc('get_notification_subscribers');

        if (error) throw error;
        return data || [];
    },

    // Log email
    async logEmail(
        recipientEmail: string,
        subject: string,
        status: 'pending' | 'sent' | 'failed',
        userId?: string,
        templateId?: string,
        errorMessage?: string
    ): Promise<void> {
        const { error } = await supabase
            .from('email_logs')
            .insert({
                user_id: userId,
                template_id: templateId,
                recipient_email: recipientEmail,
                subject,
                status,
                error_message: errorMessage,
                sent_at: status === 'sent' ? new Date().toISOString() : null
            });

        if (error) console.error('Failed to log email:', error);
    },

    // Get email logs
    async getLogs(limit = 50): Promise<EmailLog[]> {
        const { data, error } = await supabase
            .from('email_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },

    // Send email via backend API (PHP on Natro)
    async sendEmail(
        to: string,
        subject: string,
        htmlBody: string,
        textBody?: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            // Use absolute URL for production
            const API_URL = window.location.hostname === 'localhost'
                ? '/api/send-email.php'
                : 'https://katilimuzmani.com/api/send-email.php';

            // Add automatic footer to email
            const emailFooter = '<div style="margin-top:30px;padding-top:15px;border-top:1px solid #ccc;font-size:11px;color:#666;"><p>Bu ileti Katilim Uzmani tarafindan iletilmistir.</p><p><a href="https://katilimuzmani.com/profil">Iletisim tercihlerinizi guncellemek icin tiklayin</a></p><p>Iletisim: destek@katilimuzmani.com</p></div>';

            const fullHtmlBody = htmlBody + emailFooter;

            // Call PHP backend for SMTP sending
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to,
                    subject,
                    html: fullHtmlBody,
                    text: textBody || fullHtmlBody.replace(/<[^>]*>/g, '')
                })
            });

            const result = await response.json();

            if (result.success) {
                await this.logEmail(to, subject, 'sent');
                return { success: true };
            } else {
                await this.logEmail(to, subject, 'failed', undefined, undefined, result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            await this.logEmail(to, subject, 'failed', undefined, undefined, errorMsg);
            return { success: false, error: errorMsg };
        }
    },

    // Send bulk notification
    async sendBulkNotification(
        templateName: string,
        customVariables: Record<string, string> = {}
    ): Promise<{ total: number; sent: number; failed: number }> {
        const template = await this.getTemplateByName(templateName);
        if (!template) throw new Error('Template not found');

        const subscribers = await this.getSubscribers();
        const result = { total: subscribers.length, sent: 0, failed: 0 };

        for (const subscriber of subscribers) {
            const variables = {
                full_name: subscriber.full_name || 'Değerli Üyemiz',
                unsubscribe_url: `${window.location.origin}/unsubscribe/${subscriber.unsubscribe_token}`,
                ...customVariables
            };

            const subject = replaceVariables(template.subject, variables);
            const htmlBody = replaceVariables(template.body_html, variables);
            const textBody = template.body_text ? replaceVariables(template.body_text, variables) : undefined;

            const sendResult = await this.sendEmail(subscriber.email, subject, htmlBody, textBody);

            if (sendResult.success) {
                result.sent++;
            } else {
                result.failed++;
            }

            // Rate limiting - wait 100ms between emails
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return result;
    },

    // Unsubscribe by token
    async unsubscribe(token: string): Promise<boolean> {
        const { data, error } = await supabase.rpc('unsubscribe_by_token', { p_token: token });

        if (error) {
            console.error('Unsubscribe error:', error);
            return false;
        }

        return data === true;
    },

    // Update user notification preference
    async updateNotificationPreference(userId: string, enabled: boolean): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .update({ email_notifications: enabled })
            .eq('id', userId);

        if (error) throw error;
    },

    // Subscribe to newsletter (for non-members)
    async subscribeNewsletter(email: string, name?: string): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            const { data, error } = await supabase.rpc('subscribe_newsletter', {
                p_email: email,
                p_name: name || null,
                p_source: 'footer'
            });

            if (error) throw error;
            return data as { success: boolean; message?: string; error?: string };
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            return { success: false, error: 'Abonelik sırasında hata oluştu' };
        }
    },

    // Get all subscribers (both newsletter and members)
    async getAllSubscribers(): Promise<NotificationSubscriber[]> {
        try {
            const { data, error } = await supabase.rpc('get_all_subscribers');
            if (error) throw error;
            return data || [];
        } catch (error) {
            // Fallback to original function if new one doesn't exist
            console.error('get_all_subscribers error, falling back:', error);
            return this.getSubscribers();
        }
    }
};

export default emailService;

