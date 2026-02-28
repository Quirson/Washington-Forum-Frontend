import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    Shield,
    MessageSquare,
    ClipboardList,
    Users,
    Settings,
    Lock,
    SendHorizontal,
    BadgeCheck,
    Ban,
    UserPlus,
    UserMinus,
    Crown,
    RefreshCw,
} from "lucide-react";

import { apiClient } from "@/services/api";
import { Header } from "@/components/layout/Header";
import "./FactionPage.css";

type Permissions = {
    can_view?: boolean;
    can_chat?: boolean;
    can_manage_members?: boolean;
    can_set_leader?: boolean;
    can_edit_ranks?: boolean;
    can_review_applications?: boolean;
};
type ThreadItem = {
    id: string;
    title: string;
    slug: string;
    content: string;
    image_url?: string;
    author_name?: string;
    author_avatar?: string;
    is_pinned?: boolean;
    is_locked?: boolean;
    reply_count?: number;
    view_count?: number;
    created_at?: string;
    last_reply_at?: string | null;
};

type Faction = {
    id: string;
    name: string;
    tag: string;
    type: string;
    description?: string | null;
    color?: string | null;
    is_hidden?: boolean;
    max_members?: number | null;
    leader_user_id?: string | null;
    created_at?: string;
    updated_at?: string;
    members_count?: number;
    logo_url?: string | null; // se tu já tens no backend, show. Se não, ignora.
};

type Member = {
    user_id: string;
    username: string;
    avatar_url?: string | null;
    rank_title?: string | null;
    rank_level?: number | null;
    is_leader?: boolean;
};

type Message = {
    id: string;
    faction_id: string;
    user_id: string;
    username: string;
    avatar_url?: string | null;
    content: string;
    created_at: string;
};

type Application = {
    id: string;
    faction_id: string;
    user_id: string;
    username: string;
    avatar_url?: string | null;

    status: "pending" | "accepted" | "rejected" | string;

    full_name: string;
    phone_number: string;
    residence_location: string;
    join_reason: string;
    qualification_text: string;

    has_driving_licence: boolean;
    was_past_member: boolean;
    timezone_country: string;
    punished_before: boolean;
    knows_faction_rules: boolean;

    reviewed_by?: string | null;
    reviewed_at?: string | null;
    reviewed_by_username?: string | null;  // ← ADICIONA ISTO
    review_note?: string | null;

    created_at: string;
    updated_at?: string | null;
};

type UserLite = {
    id: string;
    username: string;
    avatar_url?: string | null;
    samp_name?: string | null;
};

function safeColor(hex?: string | null) {
    if (!hex) return "#2dd4bf";
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) return hex;
    return "#2dd4bf";
}

function prettyType(t: string) {
    const map: Record<string, string> = {
        legal: "Legal",
        gang: "Gang",
        mafia: "Mafia",
        department: "Department",
        government: "Government",
        illegal: "Illegal",
    };
    return map[t] || (t?.charAt(0).toUpperCase() + t?.slice(1) || "Unknown");
}

function formatTime(iso: string) {
    try {
        const d = new Date(iso);
        return d.toLocaleString();
    } catch {
        return iso;
    }
}

function statusLabel(s?: string | null) {
    const v = (s || "pending").toLowerCase();
    if (v.includes("accept")) return "accepted";
    if (v.includes("reject")) return "rejected";
    return "pending";
}
function ApplicationDetails({
                                app,
                                canReview,
                                onClose,
                                onReview,
                                onReviewed,
                                isReviewing,
                            }: {
    app: Application;
    canReview: boolean;
    onClose: () => void;
    onReview: (payload: { appId: string; action: "accept" | "reject"; note?: string }) => void;
    onReviewed: () => void;
    isReviewing: boolean;
}) {
    const [note, setNote] = useState("");
    const st = statusLabel(app.status);

    return (
        <div className="app-modal-backdrop" onMouseDown={onClose} role="dialog" aria-modal="true">
            <div className="app-modal" onMouseDown={(e) => e.stopPropagation()}>
                <div className="app-modal-head">
                    <div className="app-modal-user">
                        <img
                            className="app-modal-avatar"
                            src={
                                app.avatar_url ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(app.username || "User")}&size=160`
                            }
                            alt={app.username}
                        />
                        <div className="app-modal-userinfo">
                            <div className="app-modal-title">
                                <b>{app.username}</b>
                                <span className={`app-status ${st}`}>{st}</span>
                            </div>
                            <div className="app-modal-sub">
                                <span>{app.full_name}</span>
                                <span className="dotsep">•</span>
                                <span>{app.phone_number}</span>
                            </div>
                        </div>
                    </div>

                    <button className="btn ghost small" onClick={onClose} type="button">
                        Close
                    </button>
                </div>

                <div className="app-modal-body">
                    <div className="app-detail-grid">
                        <div className="kv">
                            <div className="k">Residence</div>
                            <div className="v">{app.residence_location}</div>
                        </div>
                        <div className="kv">
                            <div className="k">Timezone & Country</div>
                            <div className="v">{app.timezone_country}</div>
                        </div>
                        <div className="kv">
                            <div className="k">Driving licence</div>
                            <div className="v">{app.has_driving_licence ? "Yes" : "No"}</div>
                        </div>
                        <div className="kv">
                            <div className="k">Past member</div>
                            <div className="v">{app.was_past_member ? "Yes" : "No"}</div>
                        </div>
                        <div className="kv">
                            <div className="k">Punished before</div>
                            <div className="v">{app.punished_before ? "Yes" : "No"}</div>
                        </div>
                        <div className="kv">
                            <div className="k">Knows rules</div>
                            <div className="v">{app.knows_faction_rules ? "Yes" : "No"}</div>
                        </div>
                    </div>

                    <div className="app-block">
                        <div className="app-block-title">Join reason</div>
                        <div className="app-block-text">{app.join_reason}</div>
                    </div>

                    <div className="app-block">
                        <div className="app-block-title">Qualification</div>
                        <div className="app-block-text">{app.qualification_text}</div>
                    </div>

                    <div className="app-review-meta">
                        <div><span className="muted">Created:</span> {formatTime(app.created_at)}</div>
                        {app.reviewed_at ? <div><span className="muted">Reviewed:</span> {formatTime(app.reviewed_at)}</div> : null}
                        {app.reviewed_by_username ? <div><span className="muted">Reviewed by:</span> {app.reviewed_by_username}</div> : null}
                        {app.review_note ? <div><span className="muted">Review note:</span> {app.review_note}</div> : null}
                    </div>
                </div>

                {canReview && st === "pending" ? (  // <--- ADICIONA: && st === "pending"
                    <div className="app-modal-footer">
                        <input
                            className="app-note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Optional note…"
                            disabled={isReviewing}
                        />
                        <button
                            className="btn success"
                            disabled={isReviewing}
                            onClick={() => {
                                onReview({ appId: app.id, action: "accept", note });
                                onReviewed();
                            }}
                            type="button"
                        >
                            Accept
                        </button>
                        <button
                            className="btn danger"
                            disabled={isReviewing}
                            onClick={() => {
                                onReview({ appId: app.id, action: "reject", note });
                                onReviewed();
                            }}
                            type="button"
                        >
                            Reject
                        </button>
                    </div>
                ) : (
                    <div className="app-modal-footer readonly">
                        <span className="muted">
                            {st !== "pending"
                                ? `This application has been ${st}.`
                                : "Review actions are restricted to authorized roles."}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

export const FactionPage = () => {
    const { id } = useParams();
    const queryClient = useQueryClient();

    const [tab, setTab] = useState<
        "overview" | "chat" | "threads" | "applications" | "members" | "settings"
    >("overview");

    const [chatText, setChatText] = useState("");
    // Threads UI
    const [threadTitle, setThreadTitle] = useState("");
    const [threadContent, setThreadContent] = useState("");
    const [threadImageB64, setThreadImageB64] = useState<string>(""); // base64 (data:image/...)
    const [threadImagePreview, setThreadImagePreview] = useState<string>("");
    const [creatingThread, setCreatingThread] = useState(false);
    // Applications UI
    const [appsFilter, setAppsFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all");
    const [appsSearch, setAppsSearch] = useState("");
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);

// Apply form fields
    const [applyFullName, setApplyFullName] = useState("");
    const [applyPhone, setApplyPhone] = useState("");
    const [applyResidence, setApplyResidence] = useState("");
    const [applyTimezoneCountry, setApplyTimezoneCountry] = useState("");
    const [applyJoinReason, setApplyJoinReason] = useState("");
    const [applyQualification, setApplyQualification] = useState("");
    const [applyHasDL, setApplyHasDL] = useState(false);
    const [applyPastMember, setApplyPastMember] = useState(false);
    const [applyPunishedBefore, setApplyPunishedBefore] = useState(false);
    const [applyKnowsRules, setApplyKnowsRules] = useState(false);

    // Settings: user picker + rank
    const [userSearch, setUserSearch] = useState("");
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [rankTitle, setRankTitle] = useState("Recruit");
    const [rankLevel, setRankLevel] = useState<number>(1);

    // Applications: optional review note
    const [reviewNote, setReviewNote] = useState("");

    const factionQueryKey = ["faction", id];
    const messagesQueryKey = ["faction-messages", id];
    const appsQueryKey = ["faction-applications", id];
    const usersQueryKey = ["users-search", userSearch];

    // ===== Fetch Faction details =====
    const {
        data: factionData,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: factionQueryKey,
        enabled: !!id,
        queryFn: async () => {
            return apiClient.get(`/factions/${id}`);
        },
        retry: false,
    });

    const faction: Faction | null = factionData?.faction || null;
    const members: Member[] = factionData?.members || [];
    const permissions: Permissions = factionData?.permissions || {};

    const fType = (faction?.type || "").toLowerCase();
    const isLegal = ["legal", "government", "department"].includes(fType);

    const locationsQueryKey = ["sa-locations"];

    const { data: locData } = useQuery({
        queryKey: locationsQueryKey,
        enabled: tab === "applications" && ["legal", "government", "department"].includes((factionData?.faction?.type || "").toLowerCase()),
        queryFn: async () => apiClient.get("/meta/sa-locations"),
        retry: false,
    });

    const saLocations: string[] = locData?.locations || locData?.data?.locations || locData?.sa_locations || [];
    const mainColor = safeColor(faction?.color);

    const forbidden = false; // ← SEMPRE FALSE agora

    // ===== Tabs visibility =====
    const canSeeChatTab = !!permissions?.can_chat;
    const canSeeAppsTab = isLegal; // qualquer um pode ver (público)
    const canSeeMembersTab = true;
    const canSeeSettingsTab =
        !!permissions?.can_manage_members ||
        !!permissions?.can_edit_ranks ||
        !!permissions?.can_set_leader;

    const tabs = [
        { key: "overview", label: "Overview", icon: Shield, show: true },
        { key: "chat", label: "Chat", icon: MessageSquare, show: canSeeChatTab },
        { key: "applications", label: "Applications", icon: ClipboardList, show: canSeeAppsTab },
        { key: "members", label: "Members", icon: Users, show: canSeeMembersTab },
        { key: "settings", label: "Settings", icon: Settings, show: canSeeSettingsTab },
        { key: "threads", label: "Threads", icon: MessageSquare, show: true }, // ou cria permission can_view_threads no json
    ].filter((t) => t.show);

    const typeBadge = useMemo(() => {
        if (isLegal) return { icon: BadgeCheck, text: "Apply Open" };
        return { icon: Ban, text: "No Apply" };
    }, [isLegal]);

    // ===== Messages =====
    const { data: msgData, isLoading: msgsLoading } = useQuery({
        queryKey: messagesQueryKey,
        enabled: !!id && !!permissions?.can_chat && !forbidden && tab === "chat",
        queryFn: async () => apiClient.get(`/factions/${id}/messages?limit=50`),
        retry: false,
    });

    const messages: Message[] = msgData?.messages || [];

    const sendMsgMutation = useMutation({
        mutationFn: async (content: string) => {
            return apiClient.post(`/factions/${id}/messages`, { content });
        },
        onSuccess: async () => {
            setChatText("");
            await queryClient.invalidateQueries({ queryKey: messagesQueryKey });
        },
    });
    const threadsQueryKey = ["faction-threads", id];

    const { data: threadsData, isLoading: threadsLoading } = useQuery({
        queryKey: threadsQueryKey,
        enabled: !!id && tab === "threads",
        queryFn: async () => apiClient.get(`/factions/${id}/threads?limit=50`),
        retry: false,
    });

    const threads: ThreadItem[] = threadsData?.threads || [];
    const uploadThreadImageMutation = useMutation({
        mutationFn: async (base64: string) => {
            return apiClient.post(`/media/upload/base64`, { base64 });
        },
    });

    const createThreadMutation = useMutation({
        mutationFn: async (payload: { title: string; content: string; image_url?: string }) =>
            apiClient.post(`/factions/${id}/threads`, payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: threadsQueryKey });

            // reset form
            setThreadTitle("");
            setThreadContent("");
            setThreadImageB64("");
            setThreadImagePreview("");
            setCreatingThread(false);
        },
    });
    function fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    async function handleCreateThread() {
        const title = threadTitle.trim();
        const content = threadContent.trim();
        if (!title || !content) return;

        let image_url: string | undefined = undefined;

        // se tiver imagem, faz upload primeiro
        if (threadImageB64) {
            const res = await apiClient.post(`/media/upload/base64`, {
                image: threadImageB64, // data:image/png;base64,...
                type: "thread",
            });

            const image_url = res?.url || res?.data?.url;

            // se não vier url, continua sem (pra não travar teu sono)
            if (!image_url) {
                console.warn("Upload done but no url returned, creating thread without image_url", res);
            }
        }

        createThreadMutation.mutate({ title, content, image_url });
    }

    // ===== Applications (público para facções legais) =====
    const { data: appsData, isLoading: appsLoading } = useQuery({
        queryKey: appsQueryKey,
        enabled: !!id && tab === "applications" && isLegal,
        queryFn: async () => apiClient.get(`/factions/${id}/applications?limit=50`),
        retry: false,
    });

    const applications: Application[] = appsData?.applications || [];

    // REVIEW (só quem tem perms)
    const reviewAppMutation = useMutation({
        mutationFn: async (payload: { appId: string; action: "accept" | "reject"; note?: string }) => {
            return apiClient.patch(`/factions/${id}/applications/${payload.appId}/review`, {
                action: payload.action,
                note: payload.note || "",
            });
        },
        onSuccess: async () => {
            setReviewNote("");
            await queryClient.invalidateQueries({ queryKey: appsQueryKey });
        },
    });
    const submitAppMutation = useMutation({
        mutationFn: async () => {
            return apiClient.post(`/factions/${id}/applications`, {
                full_name: applyFullName.trim(),
                phone_number: applyPhone.trim(),
                residence_location: applyResidence.trim(),
                join_reason: applyJoinReason.trim(),
                qualification_text: applyQualification.trim(),
                has_driving_licence: !!applyHasDL,
                was_past_member: !!applyPastMember,
                timezone_country: applyTimezoneCountry.trim(),
                punished_before: !!applyPunishedBefore,
                knows_faction_rules: !!applyKnowsRules,
            });
        },
        onSuccess: async () => {
            // limpa
            setApplyFullName("");
            setApplyPhone("");
            setApplyResidence("");
            setApplyTimezoneCountry("");
            setApplyJoinReason("");
            setApplyQualification("");
            setApplyHasDL(false);
            setApplyPastMember(false);
            setApplyPunishedBefore(false);
            setApplyKnowsRules(false);

            await queryClient.invalidateQueries({ queryKey: appsQueryKey });
        },
    });

    // ===== Users search (Settings) =====
    const { data: usersData, isLoading: usersLoading } = useQuery({
        queryKey: usersQueryKey,
        enabled: tab === "settings" && !!userSearch.trim(),
        queryFn: async () => {
            const q = encodeURIComponent(userSearch.trim());
            return apiClient.get(`/users?limit=25&search=${q}`);
        },
        retry: false,
    });

    const users: UserLite[] = usersData?.users || [];

    // ===== Settings mutations =====
    const addMemberMutation = useMutation({
        mutationFn: async () => {
            return apiClient.post(`/factions/${id}/members`, {
                user_id: selectedUserId,
                rank_title: rankTitle,
                rank_level: Number(rankLevel),
            });
        },
        onSuccess: async () => {
            setSelectedUserId("");
            await queryClient.invalidateQueries({ queryKey: factionQueryKey });
        },
    });

    const removeMemberMutation = useMutation({
        mutationFn: async (userId: string) => {
            return apiClient.delete(`/factions/${id}/members/${userId}`);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: factionQueryKey });
        },
    });

    const setLeaderMutation = useMutation({
        mutationFn: async (userId: string) => {
            return apiClient.put(`/factions/${id}/leader`, { user_id: userId });
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: factionQueryKey });
        },
    });

    const filteredApps = useMemo(() => {
        const q = appsSearch.trim().toLowerCase();

        return (applications || [])
            .filter((a) => {
                const st = statusLabel(a.status);
                if (appsFilter !== "all" && st !== appsFilter) return false;
                if (!q) return true;

                const hay = [
                    a.username,
                    a.full_name,
                    a.phone_number,
                    a.residence_location,
                    a.timezone_country,
                    a.status,
                    a.id,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return hay.includes(q);
            })
            .sort((a, b) => {
                // pending primeiro
                const pa = statusLabel(a.status) === "pending" ? 0 : 1;
                const pb = statusLabel(b.status) === "pending" ? 0 : 1;
                if (pa !== pb) return pa - pb;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
    }, [applications, appsFilter, appsSearch]);
    // ===== Page states =====
    if (isLoading) {
        return (
            <>
                <Header />
                <div className="faction-wrap">
                    <div className="container-custom">
                        <div className="faction-loading">
                            <div className="spinner" />
                            <p>Loading faction…</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (isError || !faction) {
        return (
            <>
                <Header />
                <div className="faction-wrap">
                    <div className="container-custom">
                        <div className="faction-error">
                            <h2>Something went wrong</h2>
                            <p>Could not load faction details. Try again.</p>
                            <Link to="/factions" className="btn ghost">
                                <ArrowLeft size={16} />
                                Back
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const TypeIcon = typeBadge.icon;

    const busy =
        sendMsgMutation.isPending ||
        reviewAppMutation.isPending ||
        addMemberMutation.isPending ||
        removeMemberMutation.isPending ||
        setLeaderMutation.isPending;

    return (
        <>
            <Header />
            <div className="faction-wrap">
                <div className="container-custom">
                    {/* Breadcrumb */}
                    <div className="faction-breadcrumb">
                        <Link to="/factions" className="crumb-link">
                            <ArrowLeft size={16} /> Factions
                        </Link>
                        <span className="crumb-sep">›</span>
                        <span className="crumb-current">{faction.name}</span>
                    </div>

                    {/* HERO */}
                    <div className="faction-hero" style={{ ["--faction-color" as any]: mainColor }}>
                        <div className="hero-left">
                            <div className="hero-badges">
                                <span className="badge tag">{faction.tag}</span>
                                <span className="badge type">{prettyType(faction.type)}</span>
                                <span className={`badge ${isLegal ? "apply" : "noapply"}`}>
                  <TypeIcon size={14} />
                                    {typeBadge.text}
                </span>
                            </div>

                            <div className="hero-title">
                                <h1>{faction.name}</h1>
                                <span className="hero-color-pip" />
                            </div>

                            <p className="hero-desc">{faction.description || "No description provided."}</p>

                            <div className="hero-stats">
                                <div className="hero-stat">
                                    <Users size={14} />
                                    <span>{faction.members_count || 0} members</span>
                                </div>
                                <div className="hero-stat">
                                    <span className="dot" />
                                    <span>Type: {prettyType(faction.type)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="hero-right">
                            <div className="perm-box">
                                <div className="perm-title">Your permissions</div>

                                <div className="perm-grid">
                                    <div className={`perm-pill ${permissions.can_view ? "on" : "off"}`}>View</div>
                                    <div className={`perm-pill ${permissions.can_chat ? "on" : "off"}`}>Chat</div>
                                    <div className={`perm-pill ${permissions.can_review_applications ? "on" : "off"}`}>Review</div>
                                    <div className={`perm-pill ${permissions.can_manage_members ? "on" : "off"}`}>Members</div>
                                    <div className={`perm-pill ${permissions.can_set_leader ? "on" : "off"}`}>Leader</div>
                                    <div className={`perm-pill ${permissions.can_edit_ranks ? "on" : "off"}`}>Ranks</div>
                                </div>

                                <button
                                    className="btn ghost tiny refresh"
                                    onClick={() => queryClient.invalidateQueries({ queryKey: factionQueryKey })}
                                    disabled={busy}
                                    title="Refresh"
                                >
                                    <RefreshCw size={14} />
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* TABS */}
                    <div className="faction-tabs">
                        {tabs.map((t) => {
                            const Icon = t.icon;
                            const active = tab === t.key;
                            return (
                                <button
                                    key={t.key}
                                    className={`faction-tab ${active ? "active" : ""}`}
                                    onClick={() => setTab(t.key as any)}
                                >
                                    <Icon size={16} />
                                    <span>{t.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* PANELS */}
                    {tab === "overview" && (
                        <div className="panel">
                            <div className="panel-card">
                                <h3>About this faction</h3>
                                <p>{faction.description || "No description provided."}</p>

                                <div className="panel-grid">
                                    <div className="kv">
                                        <div className="k">Faction ID</div>
                                        <div className="v mono">{faction.id}</div>
                                    </div>
                                    <div className="kv">
                                        <div className="k">Tag</div>
                                        <div className="v">{faction.tag}</div>
                                    </div>
                                    <div className="kv">
                                        <div className="k">Type</div>
                                        <div className="v">{prettyType(faction.type)}</div>
                                    </div>
                                    <div className="kv">
                                        <div className="k">Hidden</div>
                                        <div className="v">{faction.is_hidden ? "Yes" : "No"}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="panel-card">
                                <h3>Recruitment</h3>
                                {isLegal ? (
                                    <>
                                        <p>
                                            This is a <b>legal faction</b>. Applications are available.
                                        </p>
                                        <div className="hint">
                                            Go to <b>Applications</b> to apply or see the status.
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p>
                                            This faction is not legal. Applications are <b>closed</b>.
                                        </p>
                                        <div className="hint warn">No Apply — recruitment handled in-game or privately.</div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {tab === "chat" && (
                        <div className="panel">
                            {!permissions?.can_chat ? (
                                <div className="locked-card compact">
                                    <div className="locked-icon">
                                        <Lock size={18} />
                                    </div>
                                    <h3>Chat locked</h3>
                                    <p>Only members can read and write in this faction chat.</p>
                                </div>
                            ) : (
                                <div className="panel-card chat-card">
                                    <div className="chat-head">
                                        <h3>Faction Chat</h3>
                                        <span className="sub">Latest 50 messages</span>
                                    </div>

                                    {msgsLoading ? (
                                        <div className="chat-loading">
                                            <div className="spinner small" />
                                            <span>Loading messages…</span>
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="chat-empty">
                                            <MessageSquare size={24} />
                                            <h4>No messages yet</h4>
                                            <p>Be the first to send a message.</p>
                                        </div>
                                    ) : (
                                        <div className="chat-list">
                                            {messages.map((m) => (
                                                <div key={m.id} className="chat-item">
                                                    <img
                                                        className="chat-avatar"
                                                        src={
                                                            m.avatar_url ||
                                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(m.username)}&size=100`
                                                        }
                                                        alt={m.username}
                                                    />
                                                    <div className="chat-body">
                                                        <div className="chat-meta">
                                                            <span className="chat-user">{m.username}</span>
                                                            <span className="chat-time">{formatTime(m.created_at)}</span>
                                                        </div>
                                                        <div className="chat-text">{m.content}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="chat-send">
                                        <input
                                            value={chatText}
                                            onChange={(e) => setChatText(e.target.value)}
                                            placeholder="Write a message…"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && chatText.trim()) {
                                                    sendMsgMutation.mutate(chatText.trim());
                                                }
                                            }}
                                            disabled={sendMsgMutation.isPending}
                                        />
                                        <button
                                            className="send-btn"
                                            onClick={() => chatText.trim() && sendMsgMutation.mutate(chatText.trim())}
                                            disabled={sendMsgMutation.isPending || !chatText.trim()}
                                        >
                                            <SendHorizontal size={16} />
                                            Send
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === "applications" && (
                        <div className="panel">
                            {!isLegal ? (
                                <div className="locked-card compact">
                                    <div className="locked-icon">
                                        <Lock size={18} />
                                    </div>
                                    <h3>Applications disabled</h3>
                                    <p>This faction does not accept applications.</p>
                                </div>
                            ) : (
                                <div className="panel-card">
                                    <div className="panel-head">
                                        <div>
                                            <h3>Applications</h3>
                                            <p className="muted">
                                                Applications are public. Only authorized roles can accept/reject.
                                            </p>
                                        </div>

                                        <button
                                            className="btn ghost small"
                                            onClick={() => queryClient.invalidateQueries({ queryKey: appsQueryKey })}
                                            disabled={busy}
                                        >
                                            <RefreshCw size={14} />
                                            Refresh
                                        </button>
                                    </div>

                                    {/* APPLY FORM */}
                                    <div className="apps-apply">
                                        <div className="apps-apply-head">
                                            <div>
                                                <div className="apps-apply-title">Submit your application</div>
                                                <div className="apps-apply-sub">
                                                    Fill all fields. Qualification must be <b>60+ words</b>.
                                                </div>
                                            </div>
                                        </div>

                                        <div className="apps-form-grid">
                                            <div className="apps-field">
                                                <label>Your name</label>
                                                <input value={applyFullName} onChange={(e) => setApplyFullName(e.target.value)} placeholder="John Doe" />
                                            </div>

                                            <div className="apps-field">
                                                <label>Your phone number</label>
                                                <input value={applyPhone} onChange={(e) => setApplyPhone(e.target.value)} placeholder="+258..." />
                                            </div>

                                            <div className="apps-field full">
                                                <label>Where do you live?</label>

                                                {saLocations?.length ? (
                                                    <select value={applyResidence} onChange={(e) => setApplyResidence(e.target.value)}>
                                                        <option value="">Select a location…</option>
                                                        <option value="Idlewood motel">Idlewood motel</option>
                                                        {saLocations.map((loc) => (
                                                            <option key={loc} value={loc}>{loc}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        value={applyResidence}
                                                        onChange={(e) => setApplyResidence(e.target.value)}
                                                        placeholder="Idlewood motel / your house location"
                                                    />
                                                )}
                                            </div>

                                            <div className="apps-field full">
                                                <label>(( Your timezone & country ))</label>
                                                <input
                                                    value={applyTimezoneCountry}
                                                    onChange={(e) => setApplyTimezoneCountry(e.target.value)}
                                                    placeholder="Africa/Maputo, Mozambique"
                                                />
                                            </div>

                                            <div className="apps-field full">
                                                <label>Why do you want to join our organization?</label>
                                                <textarea
                                                    value={applyJoinReason}
                                                    onChange={(e) => setApplyJoinReason(e.target.value)}
                                                    placeholder="Explain your reasons…"
                                                    rows={4}
                                                />
                                            </div>

                                            <div className="apps-field full">
                                                <label>What makes you more qualified than others? (60+ words)</label>
                                                <textarea
                                                    value={applyQualification}
                                                    onChange={(e) => setApplyQualification(e.target.value)}
                                                    placeholder="Write at least 60 words…"
                                                    rows={5}
                                                />
                                                <div className="apps-help">
                                                    Words: <b>{applyQualification.trim() ? applyQualification.trim().split(/\s+/).length : 0}</b>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="apps-checks">
                                            <label className="apps-check">
                                                <input type="checkbox" checked={applyHasDL} onChange={(e) => setApplyHasDL(e.target.checked)} />
                                                Do you have driving licence?
                                            </label>

                                            <label className="apps-check">
                                                <input type="checkbox" checked={applyPastMember} onChange={(e) => setApplyPastMember(e.target.checked)} />
                                                Have you ever been a past member of this Organization?
                                            </label>

                                            <label className="apps-check">
                                                <input type="checkbox" checked={applyPunishedBefore} onChange={(e) => setApplyPunishedBefore(e.target.checked)} />
                                                (( have you ever got punished for breaking rules? ))
                                            </label>

                                            <label className="apps-check">
                                                <input type="checkbox" checked={applyKnowsRules} onChange={(e) => setApplyKnowsRules(e.target.checked)} />
                                                (( Do you know all faction rules ))
                                            </label>
                                        </div>

                                        <div className="apps-apply-actions">
                                            <button
                                                className="btn primary"
                                                disabled={
                                                    submitAppMutation.isPending ||
                                                    !applyFullName.trim() ||
                                                    !applyPhone.trim() ||
                                                    !applyResidence.trim() ||
                                                    !applyTimezoneCountry.trim() ||
                                                    !applyJoinReason.trim() ||
                                                    !applyQualification.trim()
                                                }
                                                onClick={() => submitAppMutation.mutate()}
                                            >
                                                <ClipboardList size={16} />
                                                Submit Application
                                            </button>

                                            {submitAppMutation.isPending && (
                                                <div className="apps-saving">
                                                    <div className="spinner small" />
                                                    Submitting…
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="hr" />

                                    {/* FILTER BAR */}
                                    <div className="apps-toolbar">
                                        <div className="apps-filters">
                                            {(["all", "pending", "accepted", "rejected"] as const).map((k) => (
                                                <button
                                                    key={k}
                                                    className={`apps-chip ${appsFilter === k ? "active" : ""} ${k}`}
                                                    onClick={() => setAppsFilter(k)}
                                                    type="button"
                                                >
                                                    {k}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="apps-search">
                                            <input
                                                value={appsSearch}
                                                onChange={(e) => setAppsSearch(e.target.value)}
                                                placeholder="Search user, location, id…"
                                            />
                                        </div>
                                    </div>

                                    {/* LIST */}
                                    {appsLoading ? (
                                        <div className="chat-loading">
                                            <div className="spinner small" />
                                            <span>Loading applications…</span>
                                        </div>
                                    ) : filteredApps.length === 0 ? (
                                        <div className="empty-soft">
                                            <ClipboardList size={26} />
                                            <h4>No applications found</h4>
                                            <p>Try changing filters or search.</p>
                                        </div>
                                    ) : (
                                        <div className="apps-grid">
                                            {filteredApps.map((a) => {
                                                const st = statusLabel(a.status);
                                                return (
                                                    <button
                                                        key={a.id}
                                                        className="app-card"
                                                        type="button"
                                                        onClick={() => setSelectedApp(a)}
                                                    >
                                                        <div className="app-card-left">
                                                            <img
                                                                className="app-card-avatar"
                                                                src={
                                                                    a.avatar_url ||
                                                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(a.username || "User")}&size=120`
                                                                }
                                                                alt={a.username}
                                                            />
                                                            <div className="app-card-info">
                                                                <div className="app-card-top">
                                                                    <div className="app-card-name">{a.username}</div>
                                                                    <span className={`app-status ${st}`}>{st}</span>
                                                                </div>
                                                                <div className="app-card-sub">
                                                                    <span>{a.residence_location}</span>
                                                                    <span className="dotsep">•</span>
                                                                    <span>{a.timezone_country}</span>
                                                                </div>
                                                                <div className="app-card-meta">
                                                                    <span>{formatTime(a.created_at)}</span>
                                                                    {a.reviewed_by_username ? (
                                                                        <>
                                                                            <span className="dotsep">•</span>
                                                                            <span className="muted">reviewed by {a.reviewed_by_username}</span>
                                                                        </>
                                                                    ) : null}
                                                                    <span className="mono">#{a.id}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="app-card-right">
                                                            <span className="app-open">Open</span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* DETAILS MODAL / DRAWER */}
                                    {selectedApp && (
                                        <ApplicationDetails
                                            app={selectedApp}
                                            canReview={!!permissions?.can_review_applications}
                                            onClose={() => setSelectedApp(null)}
                                            onReviewed={async () => {
                                                setSelectedApp(null);
                                                await queryClient.invalidateQueries({ queryKey: appsQueryKey });
                                            }}
                                            onReview={(payload) => reviewAppMutation.mutate(payload)}
                                            isReviewing={reviewAppMutation.isPending}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {tab === "threads" && (
                        <div className="panel">
                            <div className="panel-card">
                                <div className="panel-head">
                                    <div>
                                        <h3>Faction Threads</h3>
                                        <p className="muted">Internal discussions for this faction.</p>
                                    </div>

                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button
                                            className="btn ghost small"
                                            onClick={() => queryClient.invalidateQueries({ queryKey: threadsQueryKey })}
                                            disabled={busy}
                                        >
                                            <RefreshCw size={14} />
                                            Refresh
                                        </button>

                                        {/* Se quiseres só leader criar, muda o show aqui:
              {permissions?.can_set_leader && (...) } ou cria permission própria */}
                                        <button
                                            className="btn primary small"
                                            onClick={() => setCreatingThread(true)}
                                            disabled={busy}
                                            title="Create thread"
                                        >
                                            <ClipboardList size={14} />
                                            New Thread
                                        </button>
                                    </div>
                                </div>

                                {/* CREATE MODAL */}
                                {creatingThread && (
                                    <div className="app-modal-backdrop" onMouseDown={() => setCreatingThread(false)} role="dialog" aria-modal="true">
                                        <div className="app-modal" onMouseDown={(e) => e.stopPropagation()}>
                                            <div className="app-modal-head">
                                                <div className="app-modal-title">
                                                    <b>Create Thread</b>
                                                </div>

                                                <button className="btn ghost small" onClick={() => setCreatingThread(false)} type="button">
                                                    Close
                                                </button>
                                            </div>

                                            <div className="app-modal-body">
                                                <div className="apps-form-grid">
                                                    <div className="apps-field full">
                                                        <label>Title</label>
                                                        <input
                                                            value={threadTitle}
                                                            onChange={(e) => setThreadTitle(e.target.value)}
                                                            placeholder="Thread title…"
                                                        />
                                                    </div>

                                                    <div className="apps-field full">
                                                        <label>Content</label>
                                                        <textarea
                                                            value={threadContent}
                                                            onChange={(e) => setThreadContent(e.target.value)}
                                                            placeholder="Write the main post…"
                                                            rows={6}
                                                        />
                                                    </div>

                                                    <div className="apps-field full">
                                                        <label>Optional image</label>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={async (e) => {
                                                                const f = e.target.files?.[0];
                                                                if (!f) return;
                                                                const b64 = await fileToBase64(f);
                                                                setThreadImageB64(b64);
                                                                setThreadImagePreview(b64);
                                                            }}
                                                        />

                                                        {threadImagePreview ? (
                                                            <div style={{ marginTop: 10, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-color)" }}>
                                                                <img src={threadImagePreview} alt="preview" style={{ width: "100%", display: "block" }} />
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="app-modal-footer">
                                                <button
                                                    className="btn primary"
                                                    disabled={
                                                        createThreadMutation.isPending ||
                                                        uploadThreadImageMutation.isPending ||
                                                        !threadTitle.trim() ||
                                                        !threadContent.trim()
                                                    }
                                                    onClick={handleCreateThread}
                                                    type="button"
                                                >
                                                    {uploadThreadImageMutation.isPending ? "Uploading…" : createThreadMutation.isPending ? "Creating…" : "Create"}
                                                </button>

                                                <button
                                                    className="btn ghost"
                                                    onClick={() => {
                                                        setThreadTitle("");
                                                        setThreadContent("");
                                                        setThreadImageB64("");
                                                        setThreadImagePreview("");
                                                    }}
                                                    type="button"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* LIST */}
                                {threadsLoading ? (
                                    <div className="chat-loading">
                                        <div className="spinner small" />
                                        <span>Loading threads…</span>
                                    </div>
                                ) : threads.length === 0 ? (
                                    <div className="empty-soft">
                                        <ClipboardList size={26} />
                                        <h4>No threads yet</h4>
                                        <p>Create the first discussion for this faction.</p>
                                    </div>
                                ) : (
                                    <div className="apps-grid">
                                        {threads.map((t) => (
                                            <div key={t.id} className="app-card" style={{ cursor: "default" }}>
                                                <div className="app-card-left">
                                                    <img
                                                        className="app-card-avatar"
                                                        src={
                                                            t.author_avatar ||
                                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(t.author_name || "User")}&size=120`
                                                        }
                                                        alt={t.author_name || "Author"}
                                                    />

                                                    <div className="app-card-info">
                                                        <div className="app-card-top">
                                                            <div className="app-card-name" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                {t.title}
                                                                {t.is_pinned ? <span className="badge tag">Pinned</span> : null}
                                                                {t.is_locked ? <span className="badge noapply">Locked</span> : null}
                                                            </div>
                                                        </div>

                                                        <div className="app-card-sub">
                                                            <span className="muted">by {t.author_name || "Unknown"}</span>
                                                            <span className="dotsep">•</span>
                                                            <span className="muted">{t.created_at ? formatTime(t.created_at) : ""}</span>
                                                            <span className="dotsep">•</span>
                                                            <span className="muted">{t.reply_count ?? 0} replies</span>
                                                            <span className="dotsep">•</span>
                                                            <span className="muted">{t.view_count ?? 0} views</span>
                                                        </div>

                                                        <div className="app-card-meta">
                    <span className="muted">
                      {(t.content || "").length > 120 ? (t.content || "").slice(0, 120) + "…" : (t.content || "")}
                    </span>
                                                        </div>

                                                        {t.image_url ? (
                                                            <div style={{ marginTop: 10, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-color)" }}>
                                                                <img src={t.image_url} alt={t.title} style={{ width: "100%", display: "block" }} />
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                {/* Se quiseres abrir uma página ThreadDetails depois:
                                                     <Link to={`/factions/${id}/threads/${t.slug}`} className="app-card-right">Open</Link>
                                                */}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {tab === "members" && (
                        <div className="panel">
                            <div className="panel-card">
                                <div className="panel-head">
                                    <div>
                                        <h3>Members</h3>
                                        <p className="muted">Current faction roster.</p>
                                    </div>
                                </div>

                                {members.length === 0 ? (
                                    <div className="empty-soft">
                                        <Users size={26} />
                                        <h4>No members yet</h4>
                                        <p>When members are added, they will appear here.</p>
                                    </div>
                                ) : (
                                    <div className="members-grid">
                                        {members.map((m) => (
                                            <div key={m.user_id} className="member-card">
                                                <img
                                                    src={
                                                        m.avatar_url ||
                                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(m.username || "User")}&size=120`
                                                    }
                                                    className="member-avatar"
                                                    alt={m.username}
                                                />
                                                <div className="member-info">
                                                    <div className="member-name">
                                                        {m.username} {m.is_leader ? <span className="leader-star">★</span> : null}
                                                    </div>
                                                    <div className="member-sub">
                                                        {(m.rank_title || "Member")} · lvl {m.rank_level ?? 0}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {tab === "settings" && (
                        <div className="panel">
                            {!canSeeSettingsTab ? (
                                <div className="locked-card compact">
                                    <div className="locked-icon">
                                        <Lock size={18} />
                                    </div>
                                    <h3>No access</h3>
                                    <p>You don’t have permission to manage this faction.</p>
                                </div>
                            ) : (
                                <>
                                    {(permissions?.can_manage_members || permissions?.can_set_leader) && (
                                        <div className="panel-card">
                                            <div className="panel-head">
                                                <div>
                                                    <h3>Add member</h3>
                                                    <p className="muted">Search a forum user and add them to the faction.</p>
                                                </div>
                                            </div>

                                            <div className="form-row">
                                                <input
                                                    value={userSearch}
                                                    onChange={(e) => setUserSearch(e.target.value)}
                                                    placeholder="Search users… (username)"
                                                />
                                            </div>

                                            {!!userSearch.trim() && (
                                                <div className="picker">
                                                    {usersLoading ? (
                                                        <div className="chat-loading">
                                                            <div className="spinner small" /> <span>Searching…</span>
                                                        </div>
                                                    ) : users.length === 0 ? (
                                                        <div className="empty-soft small">
                                                            <Users size={18} />
                                                            <p>No users found.</p>
                                                        </div>
                                                    ) : (
                                                        users.map((u) => (
                                                            <button
                                                                key={u.id}
                                                                className={`pick-item ${selectedUserId === u.id ? "active" : ""}`}
                                                                onClick={() => setSelectedUserId(u.id)}
                                                                type="button"
                                                            >
                                                                <img
                                                                    src={
                                                                        u.avatar_url ||
                                                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}&size=80`
                                                                    }
                                                                    className="pick-avatar"
                                                                    alt={u.username}
                                                                />
                                                                <div className="pick-info">
                                                                    <b>{u.username}</b>
                                                                    <span className="muted">
                                    {u.samp_name ? u.samp_name : "No SA-MP character"}
                                  </span>
                                                                </div>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}

                                            <div className="form-grid">
                                                <input
                                                    value={rankTitle}
                                                    onChange={(e) => setRankTitle(e.target.value)}
                                                    placeholder="Rank title"
                                                />
                                                <input
                                                    type="number"
                                                    value={rankLevel}
                                                    onChange={(e) => setRankLevel(Number(e.target.value))}
                                                    placeholder="Rank level"
                                                    min={0}
                                                />
                                            </div>

                                            <button
                                                className="btn primary"
                                                disabled={!selectedUserId || addMemberMutation.isPending}
                                                onClick={() => addMemberMutation.mutate()}
                                            >
                                                <UserPlus size={16} />
                                                Add member
                                            </button>
                                        </div>
                                    )}

                                    <div className="panel-card">
                                        <div className="panel-head">
                                            <div>
                                                <h3>Manage members</h3>
                                                <p className="muted">Remove members or set a leader (if permitted).</p>
                                            </div>
                                        </div>

                                        {members.length === 0 ? (
                                            <div className="empty-soft">
                                                <Users size={24} />
                                                <p>No members yet.</p>
                                            </div>
                                        ) : (
                                            <div className="manage-list">
                                                {members.map((m) => (
                                                    <div key={m.user_id} className="manage-row">
                                                        <div className="manage-left">
                                                            <img
                                                                src={
                                                                    m.avatar_url ||
                                                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(m.username)}&size=80`
                                                                }
                                                                className="manage-avatar"
                                                                alt={m.username}
                                                            />
                                                            <div className="manage-info">
                                                                <div className="manage-name">
                                                                    <b>{m.username}</b>
                                                                    {m.is_leader ? (
                                                                        <span className="leader-pill">
                                      <Crown size={14} /> Leader
                                    </span>
                                                                    ) : null}
                                                                </div>
                                                                <div className="muted">
                                                                    {(m.rank_title || "Member")} · lvl {m.rank_level ?? 0}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="manage-actions">
                                                            {permissions?.can_set_leader && (
                                                                <button
                                                                    className="btn small"
                                                                    disabled={setLeaderMutation.isPending}
                                                                    onClick={() => setLeaderMutation.mutate(m.user_id)}
                                                                >
                                                                    <Crown size={14} />
                                                                    Set Leader
                                                                </button>
                                                            )}

                                                            {(permissions?.can_manage_members || permissions?.can_set_leader) && (
                                                                <button
                                                                    className="btn small danger"
                                                                    disabled={removeMemberMutation.isPending || !!m.is_leader}
                                                                    onClick={() => removeMemberMutation.mutate(m.user_id)}
                                                                    title={m.is_leader ? "Remove leader first (set another leader)" : "Remove member"}
                                                                >
                                                                    <UserMinus size={14} />
                                                                    Remove
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default FactionPage;
