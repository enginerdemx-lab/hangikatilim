// Validation utilities for registration and user data

// Profanity filter - Turkish bad words list
const TURKISH_BAD_WORDS = [
    'amk', 'aq', 'oç', 'orospu', 'piç', 'sikik', 'siktir', 'yarrak', 'göt', 'meme',
    'am', 'taşak', 'dalyarak', 'pezevenk', 'kahpe', 'ibne', 'top', 'gavat', 'mal',
    'aptal', 'gerizekalı', 'salak', 'dangalak', 'şerefsiz', 'haysiyetsiz', 'bok',
    'siktirgit', 'anan', 'babanı', 'anasını', 'fuck', 'shit', 'bitch', 'ass', 'dick',
    'pussy', 'cock', 'whore', 'bastard', 'damn', 'crap', 'asshole'
];

// Disposable/temporary email domains list
const DISPOSABLE_EMAIL_DOMAINS = [
    'tempmail.com', 'temp-mail.org', 'guerrillamail.com', 'guerrillamail.org',
    'mailinator.com', 'maildrop.cc', '10minutemail.com', 'minutemail.com',
    'throwaway.email', 'fakeemail.net', 'trashmail.com', 'tempinbox.com',
    'mohmal.com', 'yopmail.com', 'getairmail.com', 'getnada.com', 'tmpmail.org',
    'tmpmail.net', 'discard.email', 'sharklasers.com', 'mailnesia.com',
    'spambox.us', 'tempmailaddress.com', 'burnermail.io', 'mytemp.email',
    'emailondeck.com', 'fakeinbox.com', 'mailcatch.com', 'temp-mail.io',
    '33mail.com', 'guerrillamailblock.com', 'spam4.me', '20minutemail.com',
    'dropmail.me', 'emailfake.com', 'email-fake.com', 'tempail.com',
    'crazymailing.com', 'emkei.cz', 'fakemailgenerator.com', 'emailtemporar.ro',
    'mail.tm', 'internxt.com', 'easytrashmail.com'
];

/**
 * Check if name contains any bad words
 */
export const containsProfanity = (text: string): boolean => {
    const normalizedText = text.toLowerCase()
        .replace(/[ı]/g, 'i')
        .replace(/[ğ]/g, 'g')
        .replace(/[ü]/g, 'u')
        .replace(/[ş]/g, 's')
        .replace(/[ö]/g, 'o')
        .replace(/[ç]/g, 'c')
        .replace(/[0-9]/g, '')
        .replace(/[^a-z\s]/g, '');

    const words = normalizedText.split(/\s+/);

    for (const word of words) {
        if (TURKISH_BAD_WORDS.includes(word)) {
            return true;
        }
        // Check if any bad word is contained within the word
        for (const badWord of TURKISH_BAD_WORDS) {
            if (badWord.length >= 3 && word.includes(badWord)) {
                return true;
            }
        }
    }
    return false;
};

/**
 * Check if email is from a disposable email provider
 */
export const isDisposableEmail = (email: string): boolean => {
    const domain = email.toLowerCase().split('@')[1];
    if (!domain) return false;

    return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
};

/**
 * Validate email format
 */
export const isValidEmailFormat = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Check if name is valid (not too short, contains only valid characters)
 */
export const isValidName = (name: string): { valid: boolean; error?: string } => {
    const trimmedName = name.trim();

    if (trimmedName.length < 3) {
        return { valid: false, error: 'Ad soyad en az 3 karakter olmalıdır.' };
    }

    if (trimmedName.length > 50) {
        return { valid: false, error: 'Ad soyad en fazla 50 karakter olabilir.' };
    }

    // Check for at least one space (first name and last name)
    if (!trimmedName.includes(' ')) {
        return { valid: false, error: 'Lütfen adınızı ve soyadınızı ayrı yazın.' };
    }

    // Check for invalid characters
    if (!/^[a-zA-ZğüşöçıİĞÜŞÖÇ\s]+$/.test(trimmedName)) {
        return { valid: false, error: 'Ad soyad sadece harf içerebilir.' };
    }

    // Check for profanity
    if (containsProfanity(trimmedName)) {
        return { valid: false, error: 'Lütfen uygun bir isim girin.' };
    }

    return { valid: true };
};

/**
 * Validate email for registration
 */
export const validateEmailForRegistration = (email: string): { valid: boolean; error?: string } => {
    if (!isValidEmailFormat(email)) {
        return { valid: false, error: 'Geçerli bir e-posta adresi girin.' };
    }

    if (isDisposableEmail(email)) {
        return { valid: false, error: 'Geçici e-posta adresleri kabul edilmemektedir. Lütfen gerçek bir e-posta adresi kullanın.' };
    }

    return { valid: true };
};
