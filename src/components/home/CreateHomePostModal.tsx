import { useState } from 'react';
import { homeService, HomeSection } from '@/services/home.service';
import {mediaService} from "@/services/media.service.ts";

type Props = {
    open: boolean;
    onClose: () => void;
    section: HomeSection;
    onCreated: () => void;
};

export const CreateHomePostModal = ({ open, onClose, section, onCreated }: Props) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [embedUrl, setEmbedUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [imageUploading, setImageUploading] = useState(false);

    if (!open) return null;

    const handleSubmit = async () => {
        // Validation
        if (!title.trim()) {
            setError('Title is required');
            return;
        }
        if (!content.trim()) {
            setError('Content is required');
            return;
        }

        setSaving(true);
        setError('');

        try {
            await homeService.create(section, {
                title: title.trim(),
                content: content.trim(),
                image_url: imageUrl.trim() || undefined,
                embed_url: embedUrl.trim() || undefined,
                is_pinned: false,
            });

            // Success - reset and close
            setTitle('');
            setContent('');
            setImageUrl('');
            setEmbedUrl('');
            onCreated();
        } catch (err: any) {
            console.error('Failed to create post:', err);
            setError(err?.message || 'Failed to create post. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        if (!saving) {
            setTitle('');
            setContent('');
            setImageUrl('');
            setEmbedUrl('');
            setError('');
            onClose();
        }
    };
    const fileToDataUrl = (file: File) =>
        new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });


    return (
        <div className="modal-backdrop" onClick={handleClose}>
            <div className="modal card" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="modal-title">Create Post</div>
                    <button
                        className="btn-ghost"
                        onClick={handleClose}
                        disabled={saving}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body">
                    {/* Error Message */}
                    {error && (
                        <div style={{
                            padding: '0.75rem 1rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '0.5rem',
                            color: '#f87171',
                            fontSize: '0.875rem'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Title Field */}
                    <label className="field">
                        <div className="field-label">Title *</div>
                        <input
                            className="input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter post title..."
                            maxLength={200}
                            disabled={saving}
                        />
                    </label>

                    {/* Content Field */}
                    <label className="field">
                        <div className="field-label">Content *</div>
                        <textarea
                            className="textarea"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={5}
                            placeholder="Write your post content..."
                            maxLength={5000}
                            disabled={saving}
                        />
                    </label>

                    {/* Image URL Field */}
                    <label className="field">
                        <div className="field-label">Image (optional)</div>
                        <input
                            className="input"
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                                const f = e.target.files?.[0];
                                if (!f) return;
                                setImageUploading(true);
                                try {
                                    const dataUrl = await fileToDataUrl(f);
                                    const res = await mediaService.uploadBase64(dataUrl, 'home');
                                    const url = res?.url || res?.data?.url; // depende do teu apiClient
                                    if (url) setImageUrl(url);
                                } finally {
                                    setImageUploading(false);
                                }
                            }}
                        />
                        {imageUploading && <div style={{ opacity: 0.8, marginTop: 8 }}>Uploading...</div>}
                        {!!imageUrl && <div style={{ opacity: 0.8, marginTop: 8 }}>Uploaded: {imageUrl}</div>}
                    </label>

                    {/* Embed URL Field */}
                    <label className="field">
                        <div className="field-label">Embed URL (optional)</div>
                        <input
                            className="input"
                            value={embedUrl}
                            onChange={(e) => setEmbedUrl(e.target.value)}
                            placeholder="YouTube, TikTok, Instagram, or Twitch URL"
                            disabled={saving}
                        />
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            Supported: YouTube, Twitch (embedded player), TikTok, Instagram (link card)
                        </div>
                    </label>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button
                        className="btn-ghost"
                        onClick={handleClose}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleSubmit}
                        disabled={saving || !title.trim() || !content.trim()}
                    >
                        {saving ? 'Posting...' : 'Post'}
                    </button>
                </div>
            </div>
        </div>
    );
};