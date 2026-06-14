import React, { useCallback, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    Heading2, Heading3, List, ListOrdered, Quote,
    AlignLeft, AlignCenter, AlignRight, Link as LinkIcon,
    Image as ImageIcon, Undo, Redo, Palette, Highlighter,
    Pilcrow, Maximize2, Minimize2, Trash2, Code
} from 'lucide-react';
import { mediaApi } from '../../services/api/media';
import { marked } from 'marked';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

// Compress image before upload
const compressImage = (file: File, maxWidth = 1600, quality = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error('Compression failed'));
                    },
                    'image/webp',
                    quality
                );
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    content,
    onChange,
    placeholder = 'İçerik yazın...'
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showImageSizeModal, setShowImageSizeModal] = useState(false);
    const [imageWidth, setImageWidth] = useState('100');
    const [showHtmlModal, setShowHtmlModal] = useState(false);
    const [htmlInput, setHtmlInput] = useState('');
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');
    const [showImageUrlModal, setShowImageUrlModal] = useState(false);
    const [imageUrlInput, setImageUrlInput] = useState('');

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [2, 3],
                },
                // Disable extensions that we add manually to avoid duplicates
                // @ts-ignore
                link: false,
                // @ts-ignore
                underline: false,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    rel: 'noopener noreferrer',
                    target: '_blank',
                },
            }),
            Image.configure({
                inline: false,
                allowBase64: true,
                HTMLAttributes: {
                    class: 'resizable-image',
                },
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TextStyle,
            Color,
            Highlight.configure({
                multicolor: true,
            }),
        ],
        content: content || '',
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[300px] max-h-[65vh] overflow-y-auto px-4 py-3',
            },
            handleDrop: (view, event, slice, moved) => {
                if (!moved && event.dataTransfer?.files.length) {
                    const file = event.dataTransfer.files[0];
                    if (file.type.startsWith('image/')) {
                        handleImageUpload(file);
                        return true;
                    }
                }
                return false;
            },
            handlePaste: (view, event) => {
                const items = event.clipboardData?.items;
                if (items) {
                    for (const item of items) {
                        if (item.type.startsWith('image/')) {
                            const file = item.getAsFile();
                            if (file) {
                                handleImageUpload(file);
                                return true;
                            }
                        }
                    }
                }
                // --- Markdown yapıştırma → otomatik zengin metne dönüştür ---
                // AI'dan kopyalanan "## Başlık", "**Kalın**", "* Madde", "[link](url)"
                // gibi düz metin Markdown'ı HTML'e çevirip ekler. Zaten biçimli (HTML)
                // içerik yapıştırılırsa dokunmaz; görsel yapıştırma yukarıda ele alınır.
                const text = event.clipboardData?.getData('text/plain') ?? '';
                const html = event.clipboardData?.getData('text/html');
                const looksMarkdown = /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+\.\s|>\s)|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)/.test(text);
                if (editor && text && !html && looksMarkdown) {
                    const rendered = (marked.parse(text, { breaks: true }) as string)
                        .replace(/<(\/?)h1\b/g, '<$1h2'); // editör yalnızca H2/H3 destekliyor
                    editor.chain().focus().insertContent(rendered).run();
                    return true;
                }
                return false;
            },
        },
    });

    const handleImageUpload = useCallback(async (file: File) => {
        if (!editor) return;

        // Check file size (max 5MB before compression)
        if (file.size > 5 * 1024 * 1024) {
            alert('Görsel boyutu 5MB\'dan küçük olmalı');
            return;
        }

        try {
            // Show loading state
            editor.chain().focus().insertContent('<p>📷 Görsel yükleniyor...</p>').run();

            // Compress image
            const compressed = await compressImage(file);

            // Convert Blob to File
            const compressedFile = new File([compressed], `blog-inline-${Date.now()}.webp`, {
                type: 'image/webp'
            });

            // Upload to Supabase
            const url = await mediaApi.uploadImage(compressedFile, 'blog-content');

            // Remove loading text and insert image
            editor.chain()
                .focus()
                .undo() // Remove loading text
                .setImage({ src: url })
                .run();

        } catch (error) {
            console.error('Image upload failed:', error);
            editor.chain().focus().undo().run(); // Remove loading text
            alert('Görsel yüklenemedi');
        }
    }, [editor]);

    const openLinkModal = useCallback(() => {
        if (!editor) return;
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to, '');

        // Check if cursor is on existing link
        const existingLink = editor.getAttributes('link').href || '';

        setLinkText(selectedText || '');
        setLinkUrl(existingLink);
        setShowLinkModal(true);
    }, [editor]);

    const applyLink = useCallback(() => {
        if (!editor || !linkUrl.trim()) return;

        const url = linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`;

        if (linkText.trim() && editor.state.selection.empty) {
            // No selection — insert new text with link
            editor.chain().focus()
                .insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText.trim()}</a>`)
                .run();
        } else {
            // Has selection — apply link to selected text
            editor.chain().focus().setLink({ href: url }).run();
        }

        setShowLinkModal(false);
        setLinkUrl('');
        setLinkText('');
    }, [editor, linkUrl, linkText]);

    const removeLink = useCallback(() => {
        if (!editor) return;
        editor.chain().focus().unsetLink().run();
        setShowLinkModal(false);
        setLinkUrl('');
        setLinkText('');
    }, [editor]);

    const applyImageUrl = useCallback(() => {
        if (!editor || !imageUrlInput.trim()) return;
        editor.chain().focus().setImage({ src: imageUrlInput.trim() }).run();
        setShowImageUrlModal(false);
        setImageUrlInput('');
    }, [editor, imageUrlInput]);

    const setColor = useCallback((color: string) => {
        if (!editor) return;
        editor.chain().focus().setColor(color).run();
    }, [editor]);

    const setHighlight = useCallback((color: string) => {
        if (!editor) return;
        editor.chain().focus().setHighlight({ color }).run();
    }, [editor]);

    // Image size functions
    const resizeSelectedImage = useCallback((widthPercent: string) => {
        if (!editor) return;

        const { state } = editor;
        const { selection } = state;
        const node = state.doc.nodeAt(selection.from);

        if (node?.type.name === 'image' && node.attrs.src) {
            editor.chain().focus().setImage({
                src: node.attrs.src,
                alt: node.attrs.alt || '',
                title: node.attrs.title || '',
            }).run();

            // Apply width via DOM manipulation after render
            setTimeout(() => {
                const images = document.querySelectorAll('.ProseMirror img');
                images.forEach((img) => {
                    if ((img as HTMLImageElement).src === node.attrs.src) {
                        (img as HTMLImageElement).style.width = `${widthPercent}%`;
                    }
                });
                onChange(editor.getHTML());
            }, 50);
        }
        setShowImageSizeModal(false);
    }, [editor, onChange]);

    const deleteSelectedImage = useCallback(() => {
        if (!editor) return;
        editor.chain().focus().deleteSelection().run();
        setShowImageSizeModal(false);
    }, [editor]);

    if (!editor) {
        return <div className="h-[400px] bg-gray-100 animate-pulse rounded-lg" />;
    }

    const ToolbarButton: React.FC<{
        onClick: () => void;
        isActive?: boolean;
        disabled?: boolean;
        children: React.ReactNode;
        title?: string;
    }> = ({ onClick, isActive, disabled, children, title }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {children}
        </button>
    );

    const ToolbarDivider = () => (
        <div className="w-px h-6 bg-gray-300 mx-1" />
    );

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-gray-200 bg-gray-50">
                {/* Text formatting */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="Kalın"
                >
                    <Bold size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="İtalik"
                >
                    <Italic size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive('underline')}
                    title="Altı çizili"
                >
                    <UnderlineIcon size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive('strike')}
                    title="Üstü çizili"
                >
                    <Strikethrough size={18} />
                </ToolbarButton>

                <ToolbarDivider />

                {/* Headings */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    title="Başlık 2"
                >
                    <Heading2 size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    isActive={editor.isActive('heading', { level: 3 })}
                    title="Başlık 3"
                >
                    <Heading3 size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setParagraph().run()}
                    isActive={editor.isActive('paragraph')}
                    title="Paragraf"
                >
                    <Pilcrow size={18} />
                </ToolbarButton>

                <ToolbarDivider />

                {/* Lists */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="Madde listesi"
                >
                    <List size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    title="Numaralı liste"
                >
                    <ListOrdered size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    title="Alıntı"
                >
                    <Quote size={18} />
                </ToolbarButton>

                <ToolbarDivider />

                {/* Alignment */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    isActive={editor.isActive({ textAlign: 'left' })}
                    title="Sola hizala"
                >
                    <AlignLeft size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    isActive={editor.isActive({ textAlign: 'center' })}
                    title="Ortala"
                >
                    <AlignCenter size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    isActive={editor.isActive({ textAlign: 'right' })}
                    title="Sağa hizala"
                >
                    <AlignRight size={18} />
                </ToolbarButton>

                <ToolbarDivider />

                {/* Link & Image */}
                <ToolbarButton
                    onClick={openLinkModal}
                    isActive={editor.isActive('link')}
                    title="Link ekle / düzenle"
                >
                    <LinkIcon size={18} />
                </ToolbarButton>
                <div className="relative group">
                    <ToolbarButton
                        onClick={() => { }}
                        title="Görsel ekle"
                    >
                        <ImageIcon size={18} />
                    </ToolbarButton>
                    <div className="absolute top-full left-0 hidden group-hover:flex flex-col bg-white shadow-lg rounded-lg border border-gray-200 py-1 z-10 min-w-[160px]">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                            <ImageIcon size={14} />
                            Dosyadan Yükle
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowImageUrlModal(true)}
                            className="px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                            <LinkIcon size={14} />
                            URL ile Ekle
                        </button>
                    </div>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                        e.target.value = '';
                    }}
                />

                {/* Image Size Controls */}
                {editor.isActive('image') && (
                    <>
                        <ToolbarDivider />
                        <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                            <span className="text-xs text-blue-600 font-medium mr-1">Görsel:</span>
                            <button
                                type="button"
                                onClick={() => resizeSelectedImage('25')}
                                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100"
                                title="25%"
                            >
                                25%
                            </button>
                            <button
                                type="button"
                                onClick={() => resizeSelectedImage('50')}
                                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100"
                                title="50%"
                            >
                                50%
                            </button>
                            <button
                                type="button"
                                onClick={() => resizeSelectedImage('75')}
                                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100"
                                title="75%"
                            >
                                75%
                            </button>
                            <button
                                type="button"
                                onClick={() => resizeSelectedImage('100')}
                                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100"
                                title="100%"
                            >
                                100%
                            </button>
                            <button
                                type="button"
                                onClick={deleteSelectedImage}
                                className="p-1 text-red-500 hover:bg-red-50 rounded ml-1"
                                title="Görseli sil"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </>
                )}

                <ToolbarDivider />

                {/* Colors */}
                <div className="relative group">
                    <ToolbarButton onClick={() => { }} title="Metin rengi">
                        <Palette size={18} />
                    </ToolbarButton>
                    <div className="absolute top-full left-0 hidden group-hover:flex bg-white shadow-lg rounded p-2 gap-1 z-10">
                        {['#000000', '#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#7c3aed'].map((color) => (
                            <button
                                key={color}
                                type="button"
                                className="w-6 h-6 rounded"
                                style={{ backgroundColor: color }}
                                onClick={() => setColor(color)}
                            />
                        ))}
                    </div>
                </div>
                <div className="relative group">
                    <ToolbarButton onClick={() => { }} title="Vurgulama">
                        <Highlighter size={18} />
                    </ToolbarButton>
                    <div className="absolute top-full left-0 hidden group-hover:flex bg-white shadow-lg rounded p-2 gap-1 z-10">
                        {['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff'].map((color) => (
                            <button
                                key={color}
                                type="button"
                                className="w-6 h-6 rounded"
                                style={{ backgroundColor: color }}
                                onClick={() => setHighlight(color)}
                            />
                        ))}
                    </div>
                </div>

                <ToolbarDivider />

                {/* Undo/Redo */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Geri al"
                >
                    <Undo size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="İleri al"
                >
                    <Redo size={18} />
                </ToolbarButton>

                <ToolbarDivider />

                {/* HTML Yapıştır */}
                <ToolbarButton
                    onClick={() => setShowHtmlModal(true)}
                    title="HTML olarak yapıştır"
                >
                    <Code size={18} />
                </ToolbarButton>
            </div>

            {/* HTML Paste Modal */}
            {showHtmlModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">HTML İçerik Yapıştır</h3>
                            <button
                                type="button"
                                onClick={() => { setShowHtmlModal(false); setHtmlInput(''); }}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6">
                            <textarea
                                value={htmlInput}
                                onChange={(e) => setHtmlInput(e.target.value)}
                                rows={12}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={'HTML kodunu buraya yapıştırın...\n\nÖrnek:\n<h2>Başlık</h2>\n<p>Paragraf metni...</p>'}
                            />
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowHtmlModal(false); setHtmlInput(''); }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    İptal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (editor && htmlInput.trim()) {
                                            editor.commands.setContent(htmlInput, { emitUpdate: true });
                                            onChange(editor.getHTML());
                                        }
                                        setShowHtmlModal(false);
                                        setHtmlInput('');
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                >
                                    İçeriği Uygula
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Link Modal */}
            {showLinkModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">Link Ekle / Düzenle</h3>
                            <button
                                type="button"
                                onClick={() => { setShowLinkModal(false); setLinkUrl(''); setLinkText(''); }}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                                <input
                                    type="text"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    placeholder="https://ornek.com"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    autoFocus
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyLink(); } }}
                                />
                            </div>
                            {editor?.state.selection.empty && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Görünecek Metin</label>
                                    <input
                                        type="text"
                                        value={linkText}
                                        onChange={(e) => setLinkText(e.target.value)}
                                        placeholder="Tıklanacak metin"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyLink(); } }}
                                    />
                                </div>
                            )}
                            <div className="flex justify-between pt-2">
                                <div>
                                    {linkUrl && editor?.isActive('link') && (
                                        <button
                                            type="button"
                                            onClick={removeLink}
                                            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                                        >
                                            Linki Kaldır
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => { setShowLinkModal(false); setLinkUrl(''); setLinkText(''); }}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={applyLink}
                                        disabled={!linkUrl.trim()}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Uygula
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Image URL Modal */}
            {showImageUrlModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-bold text-gray-900">URL ile Görsel Ekle</h3>
                            <button
                                type="button"
                                onClick={() => { setShowImageUrlModal(false); setImageUrlInput(''); }}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Görsel URL</label>
                                <input
                                    type="text"
                                    value={imageUrlInput}
                                    onChange={(e) => setImageUrlInput(e.target.value)}
                                    placeholder="https://ornek.com/gorsel.jpg"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    autoFocus
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyImageUrl(); } }}
                                />
                            </div>
                            {imageUrlInput.trim() && (
                                <div className="border border-gray-200 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 mb-2">Önizleme:</p>
                                    <img
                                        src={imageUrlInput.trim()}
                                        alt="Önizleme"
                                        className="max-h-40 rounded object-contain mx-auto"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        onLoad={(e) => { (e.target as HTMLImageElement).style.display = 'block'; }}
                                    />
                                </div>
                            )}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowImageUrlModal(false); setImageUrlInput(''); }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    İptal
                                </button>
                                <button
                                    type="button"
                                    onClick={applyImageUrl}
                                    disabled={!imageUrlInput.trim()}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Ekle
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <EditorContent editor={editor} />

            {/* Placeholder styling */}
            <style>{`
                .ProseMirror p.is-editor-empty:first-child::before {
                    content: '${placeholder}';
                    color: #9ca3af;
                    pointer-events: none;
                    float: left;
                    height: 0;
                }
                .ProseMirror img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px;
                    margin: 1em 0;
                    cursor: pointer;
                    transition: box-shadow 0.2s, outline 0.2s;
                }
                .ProseMirror img:hover {
                    outline: 2px solid #3b82f6;
                }
                .ProseMirror img.ProseMirror-selectednode {
                    outline: 3px solid #3b82f6;
                    box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.2);
                }
                .ProseMirror blockquote {
                    border-left: 4px solid #3b82f6;
                    padding-left: 1em;
                    margin-left: 0;
                    font-style: italic;
                    color: #4b5563;
                }
            `}</style>
        </div>
    );
};

export default RichTextEditor;

