import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    Search,
    Grid,
    List,
    Shield,
    BadgeCheck,
    Ban,
    Users,
    Filter,
    ArrowLeft,
    ArrowRight,
} from "lucide-react";

import { apiClient } from "@/services/api";
import { Header } from "@/components/layout/Header";
import "../FactionsPage.css";

type FactionType =
    | "legal"
    | "gang"
    | "mafia"
    | "department"
    | "government"
    | "illegal"
    | string;

type Faction = {
    logo_url?: string | null;
    id: string;
    name: string;
    tag: string;
    type: FactionType;
    description?: string | null;
    color?: string | null;
    is_hidden?: boolean;
    members_count?: number;
};
const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.washingtongaming.tech";
const TYPE_TABS: { key: string; label: string; icon: any }[] = [
    { key: "all", label: "All", icon: Filter },
    { key: "legal", label: "Legal", icon: BadgeCheck },
    { key: "government", label: "Government", icon: Shield },
    { key: "department", label: "Departments", icon: Users },
    { key: "gang", label: "Gangs", icon: Ban },
    { key: "mafia", label: "Mafias", icon: Shield },
    { key: "illegal", label: "Illegal", icon: Ban },
];

function safeColor(hex?: string | null) {
    if (!hex) return "#2dd4bf";
    // aceita #RRGGBB
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

export const FactionsPage = () => {
    const [tab, setTab] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<"name" | "members" | "type">("name");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Paginação (sem scroll infinito)
    const pageSize = 12;
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ["factions"],
        queryFn: async () => {
            const res = await apiClient.get("/factions");
            return res;
        },
    });


    const factions: Faction[] = data?.factions || [];

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();

        let items = factions.filter((f) => !f?.is_hidden);

        if (tab !== "all") {
            items = items.filter((f) => (f.type || "").toLowerCase() === tab);
        }

        if (q) {
            items = items.filter((f) => {
                const n = (f.name || "").toLowerCase();
                const tag = (f.tag || "").toLowerCase();
                const desc = (f.description || "").toLowerCase();
                return n.includes(q) || tag.includes(q) || desc.includes(q);
            });
        }

        items.sort((a, b) => {
            if (sortBy === "members") {
                return (b.members_count || 0) - (a.members_count || 0);
            }
            if (sortBy === "type") {
                return (a.type || "").localeCompare(b.type || "");
            }
            return (a.name || "").localeCompare(b.name || "");
        });

        return items;
    }, [factions, tab, search, sortBy]);

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const paged = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page]);

    // sempre que filtro mudar, volta pra page 1
    const resetPage = () => setPage(1);

    const legalCount = factions.filter((f) => f.type === "legal" && !f.is_hidden).length;
    const gangCount = factions.filter((f) => f.type === "gang" && !f.is_hidden).length;


    return (
        <>
            <Header />

            <div className="factions-wrap">
                <div className="container-custom">
                    {/* Breadcrumb */}
                    <div className="factions-breadcrumb">
                        <Link to="/" className="factions-crumb-link">Home</Link>
                        <span className="factions-crumb-sep">›</span>
                        <span className="factions-crumb-current">Factions</span>
                    </div>

                    {/* Top Header */}
                    <div className="factions-head">
                        <div className="factions-title">
                            <h1>Factions</h1>
                            <p>Choose your path. Apply to legal factions, or discover the underground.</p>
                        </div>

                        <div className="factions-mini-stats">
                            <div className="mini-stat">
                                <Users size={14} />
                                <span>{factions.filter((f) => !f.is_hidden).length} Total</span>
                            </div>
                            <div className="mini-stat">
                                <BadgeCheck size={14} />
                                <span>{legalCount} Legal</span>
                            </div>
                            <div className="mini-stat">
                                <Ban size={14} />
                                <span>{gangCount} Gangs</span>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="factions-controls">
                        <div className="factions-search">
                            <Search size={16} className="factions-search-icon" />
                            <input
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    resetPage();
                                }}
                                placeholder="Search factions..."
                            />
                        </div>

                        <select
                            className="factions-select"
                            value={sortBy}
                            onChange={(e) => {
                                setSortBy(e.target.value as any);
                                resetPage();
                            }}
                        >
                            <option value="name">Sort: Name</option>
                            <option value="members">Sort: Members</option>
                            <option value="type">Sort: Type</option>
                        </select>

                        <div className="factions-view-toggle">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={viewMode === "grid" ? "active" : ""}
                                aria-label="Grid view"
                            >
                                <Grid size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={viewMode === "list" ? "active" : ""}
                                aria-label="List view"
                            >
                                <List size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="factions-tabs">
                        {TYPE_TABS.map((t) => {
                            const Icon = t.icon;
                            const active = tab === t.key;
                            return (
                                <button
                                    key={t.key}
                                    className={`factions-tab ${active ? "active" : ""}`}
                                    onClick={() => {
                                        setTab(t.key);
                                        resetPage();
                                    }}
                                >
                                    <Icon size={14} />
                                    <span>{t.label}</span>
                                    <span className="tab-dot" />
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    {isLoading ? (
                        <div className="factions-loading">
                            <div className="spinner" />
                            <p>Loading factions…</p>
                        </div>
                    ) : total === 0 ? (
                        <div className="factions-empty">
                            <Filter size={32} />
                            <h3>No factions found</h3>
                            <p>Try changing the tab or your search.</p>
                        </div>
                    ) : viewMode === "grid" ? (
                        <div className="factions-grid">
                            {paged.map((f) => {
                                const color = safeColor(f.color);
                                const isLegal = (f.type || "").toLowerCase() === "legal";
                                const logoSrc = f.logo_url
                                    ? (f.logo_url.startsWith("http") ? f.logo_url : `${API_BASE}${f.logo_url}`)
                                    : "/default-faction.jpg";

                                return (
                                    <Link
                                        key={f.id}
                                        to={`/factions/${f.id}`}
                                        className="faction-card faction-card--hero"
                                        style={{ ["--faction-color" as any]: color }}
                                    >
                                        {/* imagem grande */}
                                        <div className="faction-hero-media">
                                            <img
                                                src={logoSrc || "/default-faction.jpg"}
                                                alt={f.name}
                                                loading="lazy"
                                            />
                                            <div className="faction-hero-overlay" />
                                            <div className="faction-hero-accent" />
                                        </div>

                                        {/* conteúdo em cima da imagem */}
                                        <div className="faction-hero-content">
                                            <div className="faction-badges">
                                                <span className="badge type">{prettyType(f.type)}</span>
                                                <span className="badge tag">{f.tag}</span>
                                                {isLegal ? <span className="badge apply">Apply</span> : <span className="badge noapply">No Apply</span>}
                                            </div>

                                            <h3 className="faction-hero-title" title={f.name}>{f.name}</h3>
                                            <p className="faction-hero-desc">{f.description || "No description provided."}</p>

                                            <div className="faction-hero-footer">
                                                <div className="faction-meta">
                                                    <Users size={14} />
                                                    <span>{f.members_count || 0} members</span>
                                                </div>
                                                <div className="faction-cta">
                                                    <span>Open</span>
                                                    <span className="arrow">→</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="factions-list">
                            {paged.map((f) => {
                                const color = safeColor(f.color);
                                const isLegal = (f.type || "").toLowerCase() === "legal";

                                return (
                                    <Link
                                        key={f.id}
                                        to={`/factions/${f.id}`}
                                        className="faction-row"
                                        style={{ ["--faction-color" as any]: color }}
                                    >
                                        <div className="row-left">
                                            <div className="row-pill" />
                                            <div className="row-main">
                                                <div className="row-title">
                                                    <h3>{f.name}</h3>
                                                    <span className="badge tag">{f.tag}</span>
                                                    <span className="badge type">{prettyType(f.type)}</span>
                                                    {isLegal ? (
                                                        <span className="badge apply">Apply</span>
                                                    ) : (
                                                        <span className="badge noapply">No Apply</span>
                                                    )}
                                                </div>
                                                <p>{f.description || "No description provided."}</p>
                                            </div>
                                        </div>

                                        <div className="row-right">
                                            <div className="faction-meta">
                                                <Users size={14} />
                                                <span>{f.members_count || 0}</span>
                                            </div>
                                            <span className="open">Open →</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {!isLoading && total > 0 && (
                        <div className="factions-pagination">
                            <button
                                className="page-btn"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                            >
                                <ArrowLeft size={16} />
                                Prev
                            </button>

                            <div className="page-info">
                                Page <b>{page}</b> / {totalPages} <span className="muted">•</span>{" "}
                                <span className="muted">{total} results</span>
                            </div>

                            <button
                                className="page-btn"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                            >
                                Next
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

