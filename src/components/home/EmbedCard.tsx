import { useMemo } from 'react';

type Props = {
    url: string;
    provider: string;
};

export const EmbedCard = ({ url, provider }: Props) => {
    const embedContent = useMemo(() => {
        if (!url) return null;

        const lowerProvider = provider.toLowerCase();
        const lowerUrl = url.toLowerCase();

        // ========================================
        // YOUTUBE - PLAYER EMBUTIDO
        // ========================================
        if (lowerProvider.includes('youtube') || lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
            let videoId = '';

            // youtu.be/VIDEO_ID
            if (lowerUrl.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1]?.split('?')[0]?.split('/')[0] || '';
            }
            // youtube.com/watch?v=VIDEO_ID
            else if (lowerUrl.includes('youtube.com/watch?v=')) {
                const params = new URLSearchParams(url.split('?')[1]);
                videoId = params.get('v') || '';
            }
            // youtube.com/embed/VIDEO_ID
            else if (lowerUrl.includes('youtube.com/embed/')) {
                videoId = url.split('embed/')[1]?.split('?')[0]?.split('/')[0] || '';
            }
            // youtube.com/shorts/VIDEO_ID
            else if (lowerUrl.includes('youtube.com/shorts/')) {
                videoId = url.split('shorts/')[1]?.split('?')[0]?.split('/')[0] || '';
            }

            if (videoId) {
                return {
                    type: 'youtube',
                    content: (
                        <div className="embed-wrapper">
                            <div className="embed-responsive">
                                <iframe
                                    className="embed-iframe"
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    title="YouTube video player"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    )
                };
            }
        }

        // ========================================
        // TWITCH - PLAYER EMBUTIDO
        // ========================================
        if (lowerProvider.includes('twitch') || lowerUrl.includes('twitch.tv')) {
            let channel = '';
            let video = '';

            // twitch.tv/CHANNEL
            if (lowerUrl.includes('twitch.tv/') && !lowerUrl.includes('/videos/')) {
                const parts = url.split('twitch.tv/')[1]?.split('?')[0]?.split('/');
                channel = parts?.[0] || '';
            }
            // twitch.tv/videos/VIDEO_ID
            else if (lowerUrl.includes('/videos/')) {
                video = url.split('/videos/')[1]?.split('?')[0] || '';
            }

            if (channel) {
                return {
                    type: 'twitch',
                    content: (
                        <div className="embed-wrapper">
                            <div className="embed-responsive">
                                <iframe
                                    className="embed-iframe"
                                    src={`https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}`}
                                    title="Twitch player"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    )
                };
            } else if (video) {
                return {
                    type: 'twitch',
                    content: (
                        <div className="embed-wrapper">
                            <div className="embed-responsive">
                                <iframe
                                    className="embed-iframe"
                                    src={`https://player.twitch.tv/?video=${video}&parent=${window.location.hostname}`}
                                    title="Twitch player"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    )
                };
            }
        }

        // ========================================
        // TIKTOK - LINK ESTILIZADO
        // ========================================
        if (lowerProvider.includes('tiktok') || lowerUrl.includes('tiktok.com')) {
            return {
                type: 'tiktok',
                content: (
                    <div className="embed-link-wrapper">
                        <div className="embed-link-card">
                            <div className="embed-icon">📱</div>
                            <div className="embed-info">
                                <div className="embed-platform">TikTok</div>
                                <div className="embed-description">View video on TikTok</div>
                            </div>
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="embed-button"
                            >
                                Open →
                            </a>
                        </div>
                    </div>
                )
            };
        }

        // ========================================
        // INSTAGRAM - LINK ESTILIZADO
        // ========================================
        if (lowerProvider.includes('instagram') || lowerUrl.includes('instagram.com')) {
            return {
                type: 'instagram',
                content: (
                    <div className="embed-link-wrapper">
                        <div className="embed-link-card">
                            <div className="embed-icon">📸</div>
                            <div className="embed-info">
                                <div className="embed-platform">Instagram</div>
                                <div className="embed-description">View post on Instagram</div>
                            </div>
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="embed-button"
                            >
                                Open →
                            </a>
                        </div>
                    </div>
                )
            };
        }

        // ========================================
        // FALLBACK - LINK GENÉRICO
        // ========================================
        return {
            type: 'generic',
            content: (
                <div className="embed-link-wrapper">
                    <div className="embed-link-card">
                        <div className="embed-icon">🔗</div>
                        <div className="embed-info">
                            <div className="embed-platform">External Link</div>
                            <div className="embed-description">View external content</div>
                        </div>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="embed-button"
                        >
                            Open →
                        </a>
                    </div>
                </div>
            )
        };
    }, [url, provider]);

    if (!embedContent) return null;

    return <div className={`embed-card embed-${embedContent.type}`}>{embedContent.content}</div>;
};