import React from 'react';
import DOMPurify from 'dompurify';

interface BlogContentProps {
    html: string;
    className?: string;
}

/**
 * Safe HTML renderer for blog content with XSS protection via DOMPurify.
 * Handles both rich HTML content and plain text (legacy) content.
 */
export const BlogContent: React.FC<BlogContentProps> = ({ html, className = '' }) => {
    // If content doesn't contain HTML tags, treat as plain text
    const isPlainText = !/<[a-z][\s\S]*>/i.test(html);

    if (isPlainText) {
        // Convert plain text to paragraphs (legacy content support)
        const paragraphs = html.split('\n\n').filter(p => p.trim());
        return (
            <div className={`prose prose-lg max-w-none dark:prose-invert ${className}`}>
                {paragraphs.map((p, i) => (
                    <p key={i} style={{ marginBottom: '1.25rem', lineHeight: '1.75' }}>{p}</p>
                ))}
            </div>
        );
    }

    // Sanitize HTML content
    const sanitizedHtml = DOMPurify.sanitize(html, {
        ADD_ATTR: ['target', 'rel', 'style'],
        ADD_TAGS: ['iframe'],
        FORBID_TAGS: ['script'],
    });

    return (
        <>
            <style>{`
                .blog-content p {
                    margin-bottom: 1.25rem !important;
                    line-height: 1.75 !important;
                }
                .blog-content h2 {
                    margin-top: 2rem !important;
                    margin-bottom: 1rem !important;
                    font-size: 1.5rem !important;
                    font-weight: 700 !important;
                }
                .blog-content h3 {
                    margin-top: 1.5rem !important;
                    margin-bottom: 0.75rem !important;
                    font-size: 1.25rem !important;
                    font-weight: 600 !important;
                }
                .blog-content ul, .blog-content ol {
                    margin-top: 1rem !important;
                    margin-bottom: 1rem !important;
                    padding-left: 1.5rem !important;
                }
                .blog-content li {
                    margin-bottom: 0.5rem !important;
                }
                .blog-content img {
                    max-width: 100% !important;
                    height: auto !important;
                    border-radius: 0.5rem !important;
                    margin: 1.5rem 0 !important;
                }
                .blog-content blockquote {
                    border-left: 4px solid #3b82f6 !important;
                    padding-left: 1rem !important;
                    font-style: italic !important;
                    margin: 1.5rem 0 !important;
                }
                .blog-content a {
                    color: #2563eb !important;
                    text-decoration: underline !important;
                }
            `}</style>
            <div
                className={`blog-content prose prose-lg max-w-none dark:prose-invert ${className}`}
                dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
        </>
    );
};

export default BlogContent;
