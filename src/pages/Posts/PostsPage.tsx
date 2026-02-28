import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
    Image as ImageIcon,
    Loader2,
    Send,
    Heart,
    MessageCircle,
    RefreshCw,
    X,
    MoreVertical,
    EyeOff,
    Eye,
    Trash2,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { postsService, PostItem } from "@/services/posts.service";
import type { CommentItem } from "@/services/posts.service";
import "./Posts.css";

const LIMIT = 20;

function timeAgo(dateStr: string) {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    return `${days}d ago`;
}

export default function PostsPage() {
    const { isAuthenticated, user } = useAuthStore();

    const [posts, setPosts] = useState<PostItem[]>([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // Create post UI
    const [content, setContent] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Moderation UI
    const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);

    // Comments UI
    const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
    const [commentsByPost, setCommentsByPost] = useState<Record<string, CommentItem[]>>({});
    const [loadingCommentsPostId, setLoadingCommentsPostId] = useState<string | null>(null);
    const [commentText, setCommentText] = useState("");
    const [sendingComment, setSendingComment] = useState(false);

    // ✅ staff/mod check (tu já tens role_priority no user)
    const canModerate = useMemo(() => {
        const u: any = user;

        const rp = Number(u?.role_priority ?? u?.rolePriority ?? 0);
        const highest = String(u?.highest_role ?? u?.highestRole ?? "");
        const roles: string[] = Array.isArray(u?.roles) ? u.roles : [];

        // Founder sempre moderador
        if (highest === "Founder") return true;
        if (roles.includes("Founder")) return true;

        // fallback por prioridade
        return rp >= 300;
    }, [user]);

    useEffect(() => {
        void refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const canPost = useMemo(() => {
        const hasText = content.trim().length > 0;
        return isAuthenticated && !creating && (hasText || !!file);
    }, [content, file, isAuthenticated, creating]);

    async function refresh() {
        setLoading(true);
        try {
            const res: any = await postsService.list(LIMIT, 0);
            setPosts(res.posts || []);
            setOffset(res.posts?.length || 0);
            setHasMore((res.posts?.length || 0) >= LIMIT);
        } catch (e: any) {
            toast.error(e?.message || "Failed to load posts");
        } finally {
            setLoading(false);
        }
    }

    async function loadMore() {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        try {
            const res: any = await postsService.list(LIMIT, offset);
            const incoming = res.posts || [];
            setPosts((prev) => [...prev, ...incoming]);
            setOffset((prev) => prev + incoming.length);
            setHasMore(incoming.length >= LIMIT);
        } catch (e: any) {
            toast.error(e?.message || "Failed to load more");
        } finally {
            setLoadingMore(false);
        }
    }

    async function handleCreatePost() {
        if (!canPost) return;

        setCreating(true);
        const t = toast.loading("Posting...");

        try {
            let imageUrl: string | null = null;

            if (file) {
                imageUrl = await postsService.uploadMedia(file);
            }

            const res: any = await postsService.create({
                content,
                image_url: imageUrl,
            });

            const created = res?.post;

            if (created) {
                setPosts((prev) => [created, ...prev]);
            } else {
                await refresh();
            }

            setContent("");
            setFile(null);
            toast.success("Posted!", { id: t });
        } catch (e: any) {
            toast.error(e?.message || "Failed to create post", { id: t });
        } finally {
            setCreating(false);
        }
    }

    async function toggleLike(p: PostItem) {
        if (!isAuthenticated) {
            toast.error("You must be logged in to like posts.");
            return;
        }

        const wasLiked = !!p.is_liked;

        setPosts((prev) =>
            prev.map((x) =>
                x.id === p.id
                    ? {
                        ...x,
                        is_liked: !wasLiked,
                        like_count: Math.max(0, x.like_count + (wasLiked ? -1 : 1)),
                    }
                    : x
            )
        );

        try {
            if (wasLiked) await postsService.unlike(p.id);
            else await postsService.like(p.id);
        } catch {
            setPosts((prev) =>
                prev.map((x) =>
                    x.id === p.id
                        ? {
                            ...x,
                            is_liked: wasLiked,
                            like_count: Math.max(0, x.like_count + (wasLiked ? 1 : -1)),
                        }
                        : x
                )
            );
            toast.error("Failed to update like");
        }
    }

    const avatarFallback = (name?: string) => {
        const safe = encodeURIComponent(name || "User");
        return `https://ui-avatars.com/api/?name=${safe}&background=ff0000&color=fff`;
    };

    function resolvePostAuthor(p: any) {
        const authorName = p.author?.username || p.username || "Unknown";
        const authorAvatar = p.author?.avatar_url || p.avatar_url || avatarFallback(authorName);
        const role = p.author?.highest_role || p.highest_role || "";
        const rolePriority = p.author?.role_priority ?? p.role_priority;
        return { authorName, authorAvatar, role, rolePriority };
    }

    function isPostOwner(p: any) {
        const meId = (user as any)?.id || (user as any)?.user_id;
        if (!meId) return false;
        return p.author_id === meId || p.author?.id === meId || p.user_id === meId;
    }

    function resolveCommentAuthor(c: any) {
        const name = c.author?.username || c.username || "Unknown";
        const avatar = c.author?.avatar_url || c.avatar_url || avatarFallback(name);
        const role = c.author?.highest_role || c.highest_role || "";
        return { name, avatar, role };
    }

    function isCommentOwner(c: any) {
        const meId = (user as any)?.id;
        if (!meId) return false;
        return c.user_id === meId || c.author_id === meId || c.author?.id === meId;
    }

    async function handleHideToggle(p: PostItem) {
        if (!canModerate) return;
        const t = toast.loading(p.is_hidden ? "Unhiding..." : "Hiding...");

        // optimistic
        setPosts((prev) =>
            prev.map((x) => (x.id === p.id ? { ...x, is_hidden: !x.is_hidden } : x))
        );
        setOpenMenuPostId(null);

        try {
            if (p.is_hidden) await postsService.unhide(p.id);
            else await postsService.hide(p.id);
            toast.success("Done", { id: t });
        } catch (e: any) {
            // rollback
            setPosts((prev) =>
                prev.map((x) => (x.id === p.id ? { ...x, is_hidden: p.is_hidden } : x))
            );
            toast.error(e?.message || "Failed", { id: t });
        }
    }

    async function handleDeletePost(p: PostItem) {
        const allowed = canModerate || isPostOwner(p as any);
        if (!allowed) return;

        if (!confirm("Delete this post?")) return;

        const t = toast.loading("Deleting...");
        setOpenMenuPostId(null);

        // optimistic remove
        const old = posts;
        setPosts((prev) => prev.filter((x) => x.id !== p.id));

        try {
            await postsService.deletePost(p.id);
            toast.success("Deleted", { id: t });
        } catch (e: any) {
            setPosts(old);
            toast.error(e?.message || "Failed to delete", { id: t });
        }
    }

    async function openComments(postId: string) {
        if (openCommentsPostId === postId) {
            setOpenCommentsPostId(null);
            return;
        }

        setOpenCommentsPostId(postId);
        setOpenMenuPostId(null);
        setCommentText("");

        // se já temos cache, mostra já e atualiza em background
        setLoadingCommentsPostId(postId);

        try {
            const res: any = await postsService.listComments(postId);
            setCommentsByPost((prev) => ({ ...prev, [postId]: res.comments || [] }));
        } catch (e: any) {
            toast.error(e?.message || "Failed to load comments");
        } finally {
            setLoadingCommentsPostId(null);
        }
    }

    async function sendComment(postId: string) {
        if (!isAuthenticated) {
            toast.error("Login to comment.");
            return;
        }
        const txt = commentText.trim();
        if (!txt) return;

        setSendingComment(true);
        const t = toast.loading("Sending...");

        try {
            await postsService.createComment(postId, txt);
            setCommentText("");

            // reload comments
            const res: any = await postsService.listComments(postId);
            setCommentsByPost((prev) => ({ ...prev, [postId]: res.comments || [] }));

            // increment comment_count locally
            setPosts((prev) =>
                prev.map((x) => (x.id === postId ? { ...x, comment_count: (x.comment_count || 0) + 1 } : x))
            );

            toast.success("Commented", { id: t });
        } catch (e: any) {
            toast.error(e?.message || "Failed to comment", { id: t });
        } finally {
            setSendingComment(false);
        }
    }

    async function removeComment(postId: string, c: CommentItem) {
        const allowed = canModerate || isCommentOwner(c as any);
        if (!allowed) return;

        if (!confirm("Delete this comment?")) return;

        const t = toast.loading("Deleting comment...");

        // optimistic remove
        const old = commentsByPost[postId] || [];
        setCommentsByPost((prev) => ({
            ...prev,
            [postId]: (prev[postId] || []).filter((x) => x.id !== c.id),
        }));

        try {
            await postsService.deleteComment(c.id);

            // decrement comment_count locally
            setPosts((prev) =>
                prev.map((x) =>
                    x.id === postId ? { ...x, comment_count: Math.max(0, (x.comment_count || 0) - 1) } : x
                )
            );

            toast.success("Deleted", { id: t });
        } catch (e: any) {
            setCommentsByPost((prev) => ({ ...prev, [postId]: old }));
            toast.error(e?.message || "Failed to delete comment", { id: t });
        }
    }

    return (
        <div className="posts-page">
            <div className="container-custom posts-layout">
                {/* LEFT */}
                <section className="posts-feed">
                    <div className="posts-topbar">
                        <div className="posts-title">
                            <h2>Community Posts</h2>
                            <p>Share quick updates, images, and announcements.</p>
                        </div>

                        <button className="btn-ghost posts-refresh" onClick={refresh} disabled={loading}>
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                    </div>

                    {/* CREATE */}
                    <div className="card posts-create">
                        <div className="posts-create-head">
                            <div className="posts-create-user">
                                <img
                                    className="posts-avatar"
                                    src={
                                        user?.avatar_url?.startsWith("data:")
                                            ? user.avatar_url
                                            : user?.avatar_url || avatarFallback(user?.username)
                                    }
                                    alt={user?.username || "User"}
                                />
                                <div className="posts-create-meta">
                                    <div className="posts-create-name">{user?.username || "Guest"}</div>
                                    <div className="posts-create-sub">
                                        {isAuthenticated ? "Create a new post" : "Login to create posts"}
                                    </div>
                                </div>
                            </div>

                            {file && (
                                <button
                                    className="posts-clear-file"
                                    onClick={() => setFile(null)}
                                    title="Remove image"
                                    type="button"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        <textarea
                            className="posts-textarea"
                            placeholder="What's happening?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={!isAuthenticated || creating}
                            rows={3}
                        />

                        {previewUrl && (
                            <div className="posts-preview">
                                <img src={previewUrl} alt="preview" className="posts-preview-img" />
                            </div>
                        )}

                        <div className="posts-create-actions">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,.gif"
                                style={{ display: "none" }}
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (!f) return;
                                    if (f.size > 10 * 1024 * 1024) {
                                        toast.error("Max file size is 10MB.");
                                        return;
                                    }
                                    setFile(f);
                                }}
                            />

                            <button
                                className="btn-secondary posts-attach"
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={!isAuthenticated || creating}
                            >
                                <ImageIcon size={16} />
                                Attach Image/GIF
                            </button>

                            <button
                                className="btn-primary posts-submit"
                                type="button"
                                onClick={handleCreatePost}
                                disabled={!canPost}
                            >
                                {creating ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                                Post
                            </button>
                        </div>
                    </div>

                    {/* LIST */}
                    {loading ? (
                        <div className="card posts-loading">
                            <span className="spinner" /> Loading posts...
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="card posts-empty">
                            <h3>No posts yet</h3>
                            <p>Be the first to post something.</p>
                        </div>
                    ) : (
                        <div className="posts-list">
                            {posts.map((p: any) => {
                                const { authorName, authorAvatar, role } = resolvePostAuthor(p);
                                const canDeleteThis = canModerate || isPostOwner(p);
                                const canHideThis = canModerate;

                                return (
                                    <article key={p.id} className="card posts-item">
                                        <div className="posts-item-head">
                                            <div className="posts-item-user">
                                                <img
                                                    className="posts-avatar"
                                                    src={authorAvatar}
                                                    alt={authorName}
                                                    onError={(e) => {
                                                        e.currentTarget.src = avatarFallback(authorName);
                                                    }}
                                                />
                                                <div className="posts-item-meta">
                                                    <div className="posts-item-name">
                                                        {authorName}
                                                        {p.is_hidden && (
                                                            <span
                                                                style={{
                                                                    marginLeft: 10,
                                                                    fontSize: 12,
                                                                    padding: "2px 8px",
                                                                    borderRadius: 999,
                                                                    border: "1px solid rgba(255,255,255,0.15)",
                                                                    color: "rgba(255,255,255,0.7)",
                                                                    background: "rgba(0,0,0,0.25)",
                                                                }}
                                                            >
                                Hidden
                              </span>
                                                        )}
                                                    </div>
                                                    <div className="posts-item-time">{timeAgo(p.created_at)}</div>
                                                </div>
                                            </div>

                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                {role ? <span className="badge role-verified">{role}</span> : null}

                                                {(canDeleteThis || canHideThis) && (
                                                    <div style={{ position: "relative" }}>
                                                        <button
                                                            type="button"
                                                            className="btn-ghost"
                                                            onClick={() => setOpenMenuPostId(openMenuPostId === p.id ? null : p.id)}
                                                            title="Actions"
                                                            style={{
                                                                width: 36,
                                                                height: 36,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                            }}
                                                        >
                                                            <MoreVertical size={18} />
                                                        </button>

                                                        {openMenuPostId === p.id && (
                                                            <div
                                                                className="card"
                                                                style={{
                                                                    position: "absolute",
                                                                    right: 0,
                                                                    top: 42,
                                                                    zIndex: 50,
                                                                    padding: 8,
                                                                    minWidth: 180,
                                                                }}
                                                            >
                                                                {canHideThis && (
                                                                    <button
                                                                        className="btn-ghost"
                                                                        type="button"
                                                                        onClick={() => handleHideToggle(p)}
                                                                        style={{
                                                                            width: "100%",
                                                                            display: "flex",
                                                                            gap: 10,
                                                                            alignItems: "center",
                                                                            justifyContent: "flex-start",
                                                                            padding: "10px 12px",
                                                                        }}
                                                                    >
                                                                        {p.is_hidden ? <Eye size={18} /> : <EyeOff size={18} />}
                                                                        {p.is_hidden ? "Unhide post" : "Hide post"}
                                                                    </button>
                                                                )}

                                                                {canDeleteThis && (
                                                                    <button
                                                                        className="btn-ghost"
                                                                        type="button"
                                                                        onClick={() => handleDeletePost(p)}
                                                                        style={{
                                                                            width: "100%",
                                                                            display: "flex",
                                                                            gap: 10,
                                                                            alignItems: "center",
                                                                            justifyContent: "flex-start",
                                                                            padding: "10px 12px",
                                                                            color: "#ef4444",
                                                                        }}
                                                                    >
                                                                        <Trash2 size={18} />
                                                                        Delete post
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {p.content?.trim() && <div className="posts-item-content">{p.content}</div>}

                                        {p.image_url && (
                                            <div className="posts-item-media">
                                                <img
                                                    src={p.image_url}
                                                    alt="post media"
                                                    className="posts-item-img"
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        if (p.image_url?.startsWith("/uploads/")) {
                                                            e.currentTarget.src = `${
                                                                import.meta.env.VITE_API_URL?.replace("/api/v1", "") || "https://api.washingtongaming.tech"
                                                            }${p.image_url}`;
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}

                                        <div className="posts-item-actions">
                                            <button
                                                className={`posts-action ${p.is_liked ? "liked" : ""}`}
                                                onClick={() => toggleLike(p)}
                                                type="button"
                                            >
                                                <Heart size={16} />
                                                <span>{p.like_count}</span>
                                            </button>

                                            <button
                                                className="posts-action"
                                                type="button"
                                                onClick={() => openComments(p.id)}
                                            >
                                                <MessageCircle size={16} />
                                                <span>{p.comment_count}</span>
                                            </button>
                                        </div>

                                        {/* COMMENTS PANEL */}
                                        {openCommentsPostId === p.id && (
                                            <div
                                                className="card"
                                                style={{
                                                    marginTop: 12,
                                                    padding: 12,
                                                    border: "1px solid var(--border-color)",
                                                    background: "rgba(20, 20, 26, 0.75)",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        marginBottom: 10,
                                                        gap: 10,
                                                    }}
                                                >
                                                    <div style={{ fontFamily: "Orbitron", fontWeight: 800 }}>
                                                        Comments
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="btn-ghost"
                                                        onClick={() => setOpenCommentsPostId(null)}
                                                    >
                                                        Close
                                                    </button>
                                                </div>

                                                {loadingCommentsPostId === p.id ? (
                                                    <div style={{ display: "flex", gap: 10, alignItems: "center", opacity: 0.85 }}>
                                                        <Loader2 className="spin" size={16} />
                                                        Loading comments...
                                                    </div>
                                                ) : (
                                                    <>
                                                        {(commentsByPost[p.id] || []).length === 0 ? (
                                                            <div style={{ opacity: 0.8 }}>No comments yet.</div>
                                                        ) : (
                                                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                                                {(commentsByPost[p.id] || []).map((c: any) => {
                                                                    const { name, avatar, role: cRole } = resolveCommentAuthor(c);
                                                                    const canDeleteComment = canModerate || isCommentOwner(c);

                                                                    return (
                                                                        <div key={c.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                                                            <img
                                                                                src={avatar}
                                                                                className="posts-avatar"
                                                                                style={{ width: 34, height: 34 }}
                                                                            />
                                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                                <div
                                                                                    style={{
                                                                                        display: "flex",
                                                                                        justifyContent: "space-between",
                                                                                        alignItems: "center",
                                                                                        gap: 10,
                                                                                    }}
                                                                                >
                                                                                    <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                                                                                        <div style={{ fontFamily: "Orbitron", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                                                            {name}
                                                                                        </div>
                                                                                        {cRole ? (
                                                                                            <span className="badge role-verified" style={{ fontSize: 12 }}>
                                                {cRole}
                                              </span>
                                                                                        ) : null}
                                                                                    </div>

                                                                                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                                                        <div style={{ fontSize: 12, opacity: 0.75 }}>
                                                                                            {timeAgo(c.created_at)}
                                                                                        </div>

                                                                                        {canDeleteComment && (
                                                                                            <button
                                                                                                type="button"
                                                                                                className="btn-ghost"
                                                                                                title="Delete comment"
                                                                                                onClick={() => removeComment(p.id, c)}
                                                                                                style={{
                                                                                                    width: 34,
                                                                                                    height: 34,
                                                                                                    display: "flex",
                                                                                                    alignItems: "center",
                                                                                                    justifyContent: "center",
                                                                                                    color: "#ef4444",
                                                                                                }}
                                                                                            >
                                                                                                <Trash2 size={16} />
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                <div style={{ marginTop: 6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                                                                    {c.content}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {isAuthenticated && (
                                                            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                                                                <input
                                                                    value={commentText}
                                                                    onChange={(e) => setCommentText(e.target.value)}
                                                                    placeholder="Write a comment..."
                                                                    disabled={sendingComment}
                                                                    style={{
                                                                        flex: 1,
                                                                        padding: "12px 12px",
                                                                        borderRadius: 12,
                                                                        border: "1px solid var(--border-color)",
                                                                        background: "rgba(20,20,26,0.8)",
                                                                        color: "white",
                                                                        outline: "none",
                                                                    }}
                                                                />
                                                                <button
                                                                    className="btn-primary"
                                                                    type="button"
                                                                    disabled={sendingComment || commentText.trim().length === 0}
                                                                    onClick={() => sendComment(p.id)}
                                                                    style={{ minWidth: 110, display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}
                                                                >
                                                                    {sendingComment ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
                                                                    Send
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    )}

                    {/* LOAD MORE */}
                    <div className="posts-loadmore">
                        {hasMore && !loading && (
                            <button className="btn-secondary" onClick={loadMore} disabled={loadingMore}>
                                {loadingMore ? (
                                    <>
                                        <Loader2 className="spin" size={16} /> Loading...
                                    </>
                                ) : (
                                    "Load More"
                                )}
                            </button>
                        )}
                    </div>
                </section>

                {/* RIGHT SIDEBAR */}
                <aside className="posts-sidebar">
                    <div className="card">
                        <h3>Posting Rules</h3>
                        <ul className="posts-rules">
                            <li>Be respectful.</li>
                            <li>No spam or scams.</li>
                            <li>Images/GIFs only.</li>
                            <li>Keep it SA-MP related.</li>
                        </ul>
                    </div>

                    <div className="card">
                        <h3>Tips</h3>
                        <p className="posts-tip">Use GIFs for quick reactions and short updates.</p>
                    </div>

                    {canModerate && (
                        <div className="card">
                            <h3>Staff</h3>
                            <p className="posts-tip">
                                You can <b>hide/unhide</b> and <b>delete</b> posts/comments.
                            </p>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
