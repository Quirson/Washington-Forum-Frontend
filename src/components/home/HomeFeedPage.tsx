import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { homeService, HomeItem, HomeSection } from '@/services/home.service.ts';
import { CreateHomePostModal } from './CreateHomePostModal';
import { ImageViewerModal } from './ImageViewerModal';

import { EmbedCard } from './EmbedCard';
import './HomeFeed.css';
import './EmbedCard.css';
import { resolveMediaUrl } from '@/utils/url';

type Props = {
    section: HomeSection;
    title: string;
    subtitle: string;
    canCreate: boolean;
};

export const HomeFeedPage = ({ section, title, subtitle, canCreate }: Props) => {
    const [openCreate, setOpenCreate] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerSrc, setViewerSrc] = useState('');
    const [viewerAlt, setViewerAlt] = useState('');


    const { data, isLoading, refetch } = useQuery({
        queryKey: ['home', section],
        queryFn: async () => homeService.list(section),
    });

    const items: HomeItem[] = useMemo(() => {
        const raw = data?.items || data?.announcements || [];
        return Array.isArray(raw) ? raw : [];
    }, [data]);

    return (
        <div className={`home-feed-page ${section === 'content' ? 'content-wide' : ''}`}>
        <div className={section === 'content' ? 'container-wide' : 'container-custom'}>
            {/* Hero Section */}
                <div className="feed-hero card">
                    <div>
                        <h1 className="feed-title">{title}</h1>
                        <p className="feed-subtitle">{subtitle}</p>
                    </div>

                    {canCreate && (
                        <button className="btn-primary" onClick={() => setOpenCreate(true)}>
                            Create
                        </button>
                    )}
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="loading-container">
                        <div className="spinner" />
                    </div>
                ) : (
                    /* Feed List */
                    <div className="feed-list">
                        {items.length === 0 ? (
                            /* Empty State */
                            <div className="card empty-card">
                                <div className="empty-title">No posts yet</div>
                                <div className="empty-sub">Be the first to post here.</div>
                            </div>
                        ) : (
                            /* Feed Items */
                            items.map((item) => (
                                <div key={item.id} className="card feed-card">
                                    {/* Card Header - Author Info */}
                                    <div className="feed-head">
                                        <div className="feed-author">
                                            <img
                                                className="author-avatar"
                                                src={item.author?.avatar_url || ''}
                                                alt={item.author?.username || 'User'}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                            <div className="author-meta">
                                                <div className="author-name">
                                                    {item.author?.username}
                                                    {item.author?.highest_role && (
                                                        <span
                                                            className="role-badge"
                                                            style={{
                                                                borderColor: item.author.role_color || '#333',
                                                                color: item.author.role_color || '#fff'
                                                            }}
                                                        >
                                                            {item.author.highest_role}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="author-time">{item.created_at}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Body - Content */}
                                    <div className="feed-body">
                                        <div className="feed-item-title">{item.title}</div>
                                        <div className="feed-item-content">{item.content}</div>

                                        {/* Image */}
                                        {item.image_url && (
                                            <div className="feed-image-wrap">
                                                <img
                                                    className="feed-image clickable"
                                                    src={resolveMediaUrl(item.image_url)}
                                                    alt={item.title}
                                                    onClick={() => {
                                                        setViewerSrc(resolveMediaUrl(item.image_url || ''));
                                                        setViewerAlt(item.title || '');
                                                        setViewerOpen(true);
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* Embed (YouTube, TikTok, Instagram, Twitch) */}
                                        {item.embed_url && (
                                            <EmbedCard
                                                url={item.embed_url}
                                                provider={item.embed_provider || ''}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Create Post Modal */}
            <CreateHomePostModal
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                section={section}
                onCreated={async () => {
                    setOpenCreate(false);
                    await refetch();
                }}
            />
            <ImageViewerModal
                open={viewerOpen}
                src={viewerSrc}
                alt={viewerAlt}
                onClose={() => setViewerOpen(false)}
            />
        </div>
    );
};