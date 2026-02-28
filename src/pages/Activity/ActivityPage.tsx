import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    Activity,
    FileText,
    RefreshCw,
    Filter,
    X,
    Eye,
    Clock,
} from "lucide-react";
import { apiClient } from "@/services/api";
import { Header } from "@/components/layout/Header";
import "./ActivityPage.css";

type PublicStatus = "all" | "pending" | "under_review" | "reviewing" | "approved" | "accepted" | "rejected" | "denied";

export const ActivityPage = () => {
    const [status, setStatus] = useState<PublicStatus>("all");
    const [selectedTemplate, setSelectedTemplate] = useState<string>(""); // code
    type Tab = "factions" | "public";
    const [tab, setTab] = useState<Tab>("factions");


    // 1) Buscar templates
    const { data: templatesData, isLoading: templatesLoading, refetch: refetchTemplates, isFetching: fetchingTemplates } =
        useQuery({
            queryKey: ["application-templates"],
            queryFn: async () => {
                const res = await apiClient.get("/applications/templates");
                const templates = Array.isArray(res) ? res : res?.templates;
                return templates || [];
            },
        });

    const publicTemplates = useMemo(
        () => (templatesData || []).filter((t: any) => t?.is_public === true && t?.is_active !== false),
        [templatesData]
    );

    // 2) Buscar logs públicos de vários templates (fan-out)
    const {
        data: publicLogsData,
        isLoading: logsLoading,
        refetch: refetchLogs,
        isFetching: fetchingLogs,
    } = useQuery({
        queryKey: ["public-logs-hub", publicTemplates.map((t: any) => t.code).join("|")],
        queryFn: async () => {
            // limita para não matar o server (podes subir depois)
            const LIMIT_PER_TEMPLATE = 15;

            const results = await Promise.all(
                publicTemplates.map(async (t: any) => {
                    try {
                        const res = await apiClient.get(
                            `/applications/public/${t.code}/submissions?page=1&limit=${LIMIT_PER_TEMPLATE}`
                        );
                        const submissions = res?.submissions || [];
                        return submissions.map((s: any) => ({
                            ...s,
                            __template: { code: t.code, name: t.name },
                        }));
                    } catch {
                        return [];
                    }
                })
            );

            // flatten
            const all = results.flat();

            // order by created_at desc (fallback)
            all.sort((a: any, b: any) => {
                const da = new Date(a.created_at || 0).getTime();
                const db = new Date(b.created_at || 0).getTime();
                return db - da;
            });

            return all;
        },
        enabled: publicTemplates.length > 0,
    });

    const allSubmissions = publicLogsData || [];

    const filtered = useMemo(() => {
        return allSubmissions.filter((s: any) => {
            if (selectedTemplate && s.__template?.code !== selectedTemplate) return false;
            if (status === "all") return true;
            const st = (s.status || "").toLowerCase();
            return st === status || (status === "accepted" && st === "approved");
        });
    }, [allSubmissions, selectedTemplate, status]);

    const isLoading = templatesLoading || logsLoading;

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const refreshAll = async () => {
        await refetchTemplates();
        await refetchLogs();
    };

    return (
        <>
            <Header />
            <div className="activity-page">
                <div className="container-custom">
                    <div className="activity-hero">
                        <div className="activity-hero-icon">
                            <Activity size={40} />
                        </div>
                        <h1>Public Applications</h1>
                        <p>All public submissions from all public forms (logs hub)</p>
                    </div>

                    {/* Controls */}
                    <div className="activity-filters">
                        <div className="activity-filter-group">
                            <label>Status</label>
                            <div className="status-chips">
                                {(
                                    ["all", "pending", "under_review", "approved", "rejected"] as const
                                ).map((s) => (
                                    <button
                                        key={s}
                                        className={`status-chip ${status === s ? "active" : ""} ${s}`}
                                        onClick={() => setStatus(s)}
                                        type="button"
                                    >
                                        {s === "all" ? <Filter size={14} /> : null}
                                        {s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="activity-filter-group">
                            <label>Form</label>
                            <div className="template-select">
                                <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
                                    <option value="">All Public Forms</option>
                                    {publicTemplates.map((t: any) => (
                                        <option key={t.id} value={t.code}>
                                            {t.name} ({t.code})
                                        </option>
                                    ))}
                                </select>

                                {selectedTemplate && (
                                    <button className="clear-btn" onClick={() => setSelectedTemplate("")} type="button">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <button className="refresh-btn" onClick={refreshAll} disabled={fetchingTemplates || fetchingLogs}>
                            <RefreshCw size={16} />
                            {fetchingTemplates || fetchingLogs ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>

                    {/* List */}
                    <div className="activity-content">
                        {isLoading ? (
                            <div className="activity-loading">
                                <div className="spinner" />
                                <p>Loading public submissions...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="activity-empty">
                                <FileText size={48} />
                                <h3>No public submissions found</h3>
                                <p>Try changing filters</p>
                            </div>
                        ) : (
                            <div className="logs-list">
                                {filtered.map((s: any) => (
                                    <Link
                                        key={s.id}
                                        to={`/applications/public/submissions/${s.id}`}
                                        className="log-item"
                                    >
                                        <div className="log-left">
                                            <div className="log-title">
                                                <span className="log-user">{s.user?.username || "Unknown"}</span>
                                                <span className="log-dot">•</span>
                                                <span className="log-form">{s.__template?.name || "Form"}</span>
                                            </div>

                                            <div className="log-sub">
                                                <span className={`log-status ${String(s.status || "").toLowerCase()}`}>{s.status}</span>
                                                <span className="log-time">
                          <Clock size={14} />
                                                    {s.created_ago || formatTimeAgo(s.created_at)}
                        </span>
                                            </div>
                                        </div>

                                        <div className="log-right">
                                            <Eye size={18} />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};