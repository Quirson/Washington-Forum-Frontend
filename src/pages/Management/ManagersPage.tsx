import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Shield,
    Search,
    Users,
    UserCheck,
    Building2,
    Grid,
    List,
    X,
    Ban,
    CheckCircle2,
    UserX,
    Trash2,
    Plus,
} from "lucide-react";

import { useAuthStore } from "@/store/auth.store";
import { managementService, MgUser, RoleItem } from "@/services/management.service";

const getRoleColor = (priority: number = 1) => {
    if (priority >= 1000) return "#FF0000";
    if (priority >= 900) return "#FF8C00";
    if (priority >= 450) return "#00FF7F";
    if (priority >= 300) return "#7CFC00";
    if (priority >= 200) return "#20B2AA";
    if (priority >= 80) return "#FF1493";
    if (priority >= 15) return "#00FF00";
    return "#808080";
};

const canTouchRole = (actorPriority: number, role: RoleItem) => {
    if (actorPriority >= 1000) return true;
    if (role.priority >= 1000 || role.name?.toLowerCase() === "founder") return false;
    return role.priority < actorPriority;
};

const roleTagStyle = (color: string) => ({
    border: `1px solid ${color}55`,
    boxShadow: `0 0 18px ${color}25`,
    color,
});

export const ManagersPage = () => {
    const navigate = useNavigate();
    const qc = useQueryClient();
    const { user, isAuthenticated, isLoading } = useAuthStore();

    // ✅ Ajusta o threshold real do teu servidor:
    // Founder(1000), Server Manager(900), Management(450), Head of Staff(300)
    const actorPriority = user?.role_priority ?? 0;
    const canAccess = actorPriority >= 300;

    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated) return navigate("/login");
        if (!canAccess) return navigate("/unauthorized");
    }, [isLoading, isAuthenticated, canAccess, navigate]);

    // UI state
    const [searchQuery, setSearchQuery] = useState("");
    const [staffOnly, setStaffOnly] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const [limit] = useState(30);
    const [page, setPage] = useState(0);
    const offset = page * limit;

    const [selected, setSelected] = useState<MgUser | null>(null);

    // Modals
    const [banReason, setBanReason] = useState("Banned by staff");
    const [banDays, setBanDays] = useState(7);
    const [showBanModal, setShowBanModal] = useState(false);

    const [deleteConfirm, setDeleteConfirm] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Queries
    const usersQuery = useQuery({
        queryKey: ["mg_users", searchQuery, staffOnly, limit, offset],
        queryFn: () =>
            managementService.listUsers({
                search: searchQuery,
                staffOnly,
                limit,
                offset,
            }),
        enabled: canAccess,
    });

    const allRolesQuery = useQuery({
        queryKey: ["mg_roles_all"],
        queryFn: () => managementService.getAllRoles(),
        enabled: canAccess,
        staleTime: 5 * 60 * 1000,
    });

    const userRolesQuery = useQuery({
        queryKey: ["mg_user_roles", selected?.id],
        queryFn: () => managementService.getUserRoles(selected!.id),
        enabled: !!selected?.id && canAccess,
    });

    const users = usersQuery.data?.users ?? [];
    const total = usersQuery.data?.count ?? 0;

    const onlineCount = users.filter((u: any) => u.is_online).length; // se vier do backend
    const staffCount = users.filter((u: any) => u.is_staff_member).length;

    const rolesAll = allRolesQuery.data?.roles ?? [];
    const selectedRoles = userRolesQuery.data?.roles ?? [];

    const availableRolesToAdd = useMemo(() => {
        const current = new Set(selectedRoles.map((r) => r.id));
        return rolesAll
            .filter((r) => !current.has(r.id))
            .filter((r) => canTouchRole(actorPriority, r))
            .sort((a, b) => b.priority - a.priority);
    }, [rolesAll, selectedRoles, actorPriority]);

    const refreshSelected = async () => {
        if (!selected) return;
        await qc.invalidateQueries({ queryKey: ["mg_user_roles", selected.id] });
        await qc.invalidateQueries({ queryKey: ["mg_users"] });
    };

    const addRole = async (roleId: string) => {
        if (!selected) return;
        const role = rolesAll.find((r) => r.id === roleId);
        if (!role) return;

        if (!canTouchRole(actorPriority, role)) return toast.error("You Cant Give this Role.");

        const t = toast.loading("Issuing Role...");
        try {
            const res = await managementService.patchUserRoles(selected.id, { add: [roleId] });
            if (!res.success) throw new Error(res.error || "Failed");
            toast.success("Role Ussued!", { id: t });
            await refreshSelected();
        } catch (e: any) {
            toast.error(e?.message || "Error Ussing Role", { id: t });
        }
    };

    const removeRole = async (roleId: string) => {
        if (!selected) return;
        const role = selectedRoles.find((r) => r.id === roleId);
        if (!role) return;

        if (!canTouchRole(actorPriority, role)) return toast.error("You Cant Remove this role .");

        const t = toast.loading("Removing Role...");
        try {
            const res = await managementService.patchUserRoles(selected.id, { remove: [roleId] });
            if (!res.success) throw new Error(res.error || "Failed");
            toast.success("Role Removed!", { id: t });
            await refreshSelected();
        } catch (e: any) {
            toast.error(e?.message || "Error Removing Role", { id: t });
        }
    };

    const doBan = async () => {
        if (!selected) return;
        const t = toast.loading("Applying Ban...");
        try {
            const res = await managementService.banUser(selected.id, {
                reason: banReason.trim() || "Banned by staff",
                days: Number.isFinite(banDays) ? banDays : 0,
            });
            if (!res.success) throw new Error(res.error || "Failed");
            toast.success("Account Banned!", { id: t });
            setShowBanModal(false);
            await qc.invalidateQueries({ queryKey: ["mg_users"] });
        } catch (e: any) {
            toast.error(e?.message || "Error trying to Ban", { id: t });
        }
    };

    const doUnban = async () => {
        if (!selected) return;
        const t = toast.loading("Removing Ban...");
        try {
            const res = await managementService.unbanUser(selected.id);
            if (!res.success) throw new Error(res.error || "Failed");
            toast.success("Ban Removed!", { id: t });
            await qc.invalidateQueries({ queryKey: ["mg_users"] });
        } catch (e: any) {
            toast.error(e?.message || "Error Removing Ban", { id: t });
        }
    };

    const doDelete = async () => {
        if (!selected) return;
        const expected = `DELETE ${selected.username}`;
        if (deleteConfirm.trim() !== expected) return toast.error(`Type Exactly This : ${expected}`);

        const t = toast.loading("Delecting User...");
        try {
            const res = await managementService.deleteUser(selected.id);
            if (!res.success) throw new Error(res.error || "Falhou");
            toast.success("Account Deleted Permantly IF YOU DONE THIS BY MISTAKE CONTACT WALTER NOW.", { id: t });
            setShowDeleteModal(false);
            setSelected(null);
            await qc.invalidateQueries({ queryKey: ["mg_users"] });
        } catch (e: any) {
            toast.error(e?.message || "Error Deleting! Check your Perms or Contact Walter", { id: t });
        }
    };

    // Responsive: mobile sheet if small screen
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 980);
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const renderUserCardGrid = (u: MgUser) => {
        const roleColor = u.role_color || getRoleColor(u.role_priority || 1);
        const active = selected?.id === u.id;

        return (
            <button
                key={u.id}
                onClick={() => setSelected(u)}
                style={{
                    textAlign: "left",
                    padding: "1rem",
                    background: active ? "rgba(255,0,0,0.08)" : "#1a1a1f",
                    borderRadius: "8px",
                    border: active ? "1px solid rgba(255,0,0,0.40)" : "1px solid #2a2a32",
                    transition: "all 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.65rem",
                    color: "white",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                        <img
                            src={
                                u.avatar_url?.startsWith("data:")
                                    ? u.avatar_url
                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}&size=100&background=${roleColor.replace(
                                        "#",
                                        ""
                                    )}&color=fff`
                            }
                            alt={u.username}
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: `2px solid ${roleColor}`,
                            }}
                        />
                        {u.is_banned && (
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: -2,
                                    right: -2,
                                    width: 14,
                                    height: 14,
                                    background: "#ef4444",
                                    borderRadius: "50%",
                                    border: "2px solid #1a1a1f",
                                }}
                            />
                        )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                fontSize: "1rem",
                                fontWeight: 700,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {u.username}
                        </div>
                        <div
                            style={{
                                fontSize: "0.8rem",
                                opacity: 0.7,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {u.email}
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span
              style={{
                  ...roleTagStyle(roleColor),
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 800,
              }}
          >
            {u.highest_role || "Member"} • {u.role_priority || 0}
          </span>

                    {u.is_staff_member && (
                        <span
                            style={{
                                padding: "4px 10px",
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 800,
                                border: "1px solid rgba(34,197,94,0.35)",
                                color: "#22c55e",
                            }}
                        >
              STAFF
            </span>
                    )}

                    {u.is_banned && (
                        <span
                            style={{
                                padding: "4px 10px",
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 800,
                                border: "1px solid rgba(239,68,68,0.45)",
                                color: "#ef4444",
                            }}
                        >
              BANNED
            </span>
                    )}
                </div>

                <div style={{ fontSize: "0.8rem", opacity: 0.65 }}>
                    Last seen: {u.last_seen}
                </div>
            </button>
        );
    };

    const renderUserRowList = (u: MgUser) => {
        const roleColor = u.role_color || getRoleColor(u.role_priority || 1);
        const active = selected?.id === u.id;

        return (
            <button
                key={u.id}
                onClick={() => setSelected(u)}
                style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "1rem",
                    background: active ? "rgba(255,0,0,0.08)" : "#1a1a1f",
                    borderRadius: "8px",
                    border: active ? "1px solid rgba(255,0,0,0.40)" : "1px solid #2a2a32",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    color: "white",
                }}
            >
                <div style={{ position: "relative", flexShrink: 0 }}>
                    <img
                        src={
                            u.avatar_url?.startsWith("data:")
                                ? u.avatar_url
                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username)}&size=100&background=${roleColor.replace(
                                    "#",
                                    ""
                                )}&color=fff`
                        }
                        alt={u.username}
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: `2px solid ${roleColor}`,
                        }}
                    />
                    {u.is_banned && (
                        <div
                            style={{
                                position: "absolute",
                                bottom: -2,
                                right: -2,
                                width: 14,
                                height: 14,
                                background: "#ef4444",
                                borderRadius: "50%",
                                border: "2px solid #1a1a1f",
                            }}
                        />
                    )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ fontSize: "1rem", fontWeight: 700 }}>{u.username}</div>
                        <span
                            style={{
                                ...roleTagStyle(roleColor),
                                padding: "4px 10px",
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 800,
                            }}
                        >
              {u.highest_role || "Member"} • {u.role_priority || 0}
            </span>
                    </div>
                    <div style={{ fontSize: "0.85rem", opacity: 0.7, marginTop: 2 }}>
                        {u.email} • Last seen: {u.last_seen}
                    </div>
                </div>
            </button>
        );
    };

    const SelectedPanel = () => {
        if (!selected) return null;

        const roleColor = selected.role_color || getRoleColor(selected.role_priority || 1);

        const content = (
            <div style={{ padding: 14, display: "grid", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img
                        src={
                            selected.avatar_url?.startsWith("data:")
                                ? selected.avatar_url
                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(selected.username)}&size=120&background=${roleColor.replace(
                                    "#",
                                    ""
                                )}&color=fff`
                        }
                        style={{
                            width: 54,
                            height: 54,
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: `2px solid ${roleColor}`,
                        }}
                    />
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 900, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {selected.username}
                        </div>
                        <div style={{ fontSize: 13, opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {selected.email}
                        </div>
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                        <button
                            onClick={() => setSelected(null)}
                            style={{ background: "transparent", border: "none", color: "white", opacity: 0.85, cursor: "pointer" }}
                        >
                            <X />
                        </button>
                    </div>
                </div>

                {/* Roles */}
                <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                        <div style={{ fontWeight: 900 }}>Roles</div>

                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <select
                                onChange={(e) => {
                                    const v = e.target.value;
                                    if (v) addRole(v);
                                    e.currentTarget.value = "";
                                }}
                                style={{
                                    borderRadius: 8,
                                    padding: "0.6rem 0.8rem",
                                    fontSize: "0.9rem",
                                    background: "#1a1a1f",
                                    border: "1px solid rgba(255,0,0,0.25)",
                                    color: "white",
                                    cursor: "pointer",
                                    maxWidth: 240,
                                }}
                                defaultValue=""
                            >
                                <option value="" disabled>
                                    + Add role
                                </option>
                                {availableRolesToAdd.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.display || r.name} ({r.priority})
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={() => userRolesQuery.refetch()}
                                style={{
                                    borderRadius: 8,
                                    padding: "0.6rem 0.7rem",
                                    border: "1px solid rgba(255,255,255,0.10)",
                                    background: "rgba(0,0,0,0.20)",
                                    color: "white",
                                    cursor: "pointer",
                                }}
                                title="Refresh roles"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>

                    {userRolesQuery.isLoading ? (
                        <div style={{ opacity: 0.7 }}>Loading roles...</div>
                    ) : (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {selectedRoles.map((r) => {
                                const removable = canTouchRole(actorPriority, r);
                                return (
                                    <span
                                        key={r.id}
                                        style={{
                                            ...roleTagStyle(r.color || "#ff0000"),
                                            padding: "7px 10px",
                                            borderRadius: 999,
                                            fontSize: 12,
                                            fontWeight: 900,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 8,
                                        }}
                                    >
                    {r.display || r.name} ({r.priority})
                    <button
                        onClick={() => removable && removeRole(r.id)}
                        disabled={!removable}
                        title={!removable ? "Você não tem permissão" : "Remover role"}
                        style={{
                            width: 22,
                            height: 22,
                            borderRadius: 999,
                            border: "1px solid rgba(255,255,255,0.14)",
                            background: removable ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.10)",
                            color: "white",
                            opacity: removable ? 1 : 0.35,
                            display: "grid",
                            placeItems: "center",
                            cursor: removable ? "pointer" : "not-allowed",
                        }}
                    >
                      <X size={14} />
                    </button>
                  </span>
                                );
                            })}
                            {selectedRoles.length === 0 && <div style={{ opacity: 0.7 }}>No roles</div>}
                        </div>
                    )}
                </div>

                {/* Moderation */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12, display: "grid", gap: 10 }}>
                    <div style={{ fontWeight: 900 }}>Moderation</div>

                    {!selected.is_banned ? (
                        <button
                            onClick={() => {
                                setBanReason("Banned by staff");
                                setBanDays(7);
                                setShowBanModal(true);
                            }}
                            style={{
                                borderRadius: 10,
                                padding: "12px 12px",
                                border: "1px solid rgba(239,68,68,0.35)",
                                background: "rgba(239,68,68,0.10)",
                                color: "white",
                                fontWeight: 900,
                                display: "flex",
                                gap: 10,
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                            }}
                        >
                            <UserX size={18} /> Ban User
                        </button>
                    ) : (
                        <button
                            onClick={doUnban}
                            style={{
                                borderRadius: 10,
                                padding: "12px 12px",
                                border: "1px solid rgba(34,197,94,0.30)",
                                background: "rgba(34,197,94,0.10)",
                                color: "white",
                                fontWeight: 900,
                                display: "flex",
                                gap: 10,
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                            }}
                        >
                            <CheckCircle2 size={18} /> Unban User
                        </button>
                    )}

                    <button
                        onClick={() => {
                            setDeleteConfirm("");
                            setShowDeleteModal(true);
                        }}
                        style={{
                            borderRadius: 10,
                            padding: "12px 12px",
                            border: "1px solid rgba(255,0,0,0.30)",
                            background: "rgba(255,0,0,0.12)",
                            color: "white",
                            fontWeight: 900,
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                        }}
                    >
                        <Trash2 size={18} /> Delete Account
                    </button>

                    <div style={{ opacity: 0.65, fontSize: 12, lineHeight: 1.35 }}>
                        ⚠️ UI only shows Proly Actions , but the real protection is server-side based, Abuse of this Perms Directly Kick For Staff.
                    </div>
                </div>
            </div>
        );

        // Desktop drawer
        if (!isMobile) {
            return (
                <div
                    style={{
                        borderRadius: 12,
                        border: "1px solid rgba(255,0,0,0.22)",
                        background: "linear-gradient(180deg, rgba(20,20,28,0.70) 0%, rgba(30,10,10,0.55) 100%)",
                        overflow: "hidden",
                        position: "sticky",
                        top: 160,
                        height: "fit-content",
                    }}
                >
                    <div style={{ padding: 14, borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: 900 }}>
                        Manage User
                    </div>
                    {content}
                </div>
            );
        }

        // Mobile bottom sheet
        return (
            <div
                onClick={() => setSelected(null)}
                style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.55)",
                    zIndex: 9998,
                    display: "grid",
                    alignItems: "end",
                }}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: "100%",
                        maxHeight: "82vh",
                        overflow: "auto",
                        borderTopLeftRadius: 18,
                        borderTopRightRadius: 18,
                        border: "1px solid rgba(255,0,0,0.25)",
                        background: "rgba(18,18,26,0.98)",
                    }}
                >
                    <div style={{ padding: 12, display: "flex", justifyContent: "center" }}>
                        <div style={{ width: 44, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.18)" }} />
                    </div>
                    {content}
                </div>
            </div>
        );
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "var(--background-primary)",
                paddingTop: "140px",
                paddingBottom: "3rem",
            }}
        >
            <div className="container-custom">
                {/* Breadcrumb */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    <Link to="/" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                        Home
                    </Link>
                    <span style={{ color: "var(--text-secondary)" }}>›</span>
                    <span style={{ color: "var(--text-primary)" }}>Management</span>
                </div>

                {/* Header */}
                <div style={{ marginBottom: "2rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                        <div>
                            <h1 style={{ fontSize: "1.75rem", fontFamily: "Orbitron, sans-serif", fontWeight: 700, color: "white", marginBottom: "0.25rem" }}>
                                Management Panel
                            </h1>
                            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", maxWidth: 680 }}>
                                Search any member, manage roles (multi-role), ban/unban and delete Ethenically Abuse - KICK.
                            </p>
                        </div>

                        {/* Stats */}
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <Users size={14} />
                                <span>{total} Users</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <UserCheck size={14} />
                                <span>{staffCount} Staff</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <Building2 size={14} />
                                <span>{onlineCount} Online</span>
                            </div>
                        </div>
                    </div>

                    {/* Search / Filters row (Members-like) */}
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ flex: "1 1 320px", maxWidth: 520 }}>
                            <div style={{ position: "relative" }}>
                                <Search
                                    size={16}
                                    style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}
                                />
                                <input
                                    type="text"
                                    placeholder="Search username, email, samp..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setPage(0);
                                    }}
                                    style={{
                                        width: "100%",
                                        padding: "0.625rem 0.875rem 0.625rem 2.5rem",
                                        fontSize: "0.9rem",
                                        background: "#1a1a1f",
                                        border: "1px solid #2a2a32",
                                        borderRadius: 6,
                                        color: "white",
                                    }}
                                />
                            </div>
                        </div>

                        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                            <input
                                type="checkbox"
                                checked={staffOnly}
                                onChange={(e) => {
                                    setStaffOnly(e.target.checked);
                                    setPage(0);
                                }}
                            />
                            Staff only
                        </label>

                        <button
                            onClick={() => usersQuery.refetch()}
                            style={{
                                padding: "0.625rem 0.875rem",
                                fontSize: "0.9rem",
                                background: "rgba(255,0,0,0.10)",
                                border: "1px solid rgba(255,0,0,0.25)",
                                borderRadius: 6,
                                color: "white",
                                cursor: "pointer",
                                fontWeight: 800,
                            }}
                        >
                            Refresh
                        </button>

                        <div style={{ display: "flex", gap: "0.25rem", background: "#1a1a1f", padding: "0.25rem", borderRadius: 6, border: "1px solid #2a2a32" }}>
                            <button
                                onClick={() => setViewMode("grid")}
                                style={{
                                    padding: "0.5rem",
                                    background: viewMode === "grid" ? "rgba(255,0,0,0.75)" : "transparent",
                                    color: viewMode === "grid" ? "white" : "var(--text-secondary)",
                                    border: "none",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                    display: "grid",
                                    placeItems: "center",
                                }}
                                title="Grid"
                            >
                                <Grid size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                style={{
                                    padding: "0.5rem",
                                    background: viewMode === "list" ? "rgba(255,0,0,0.75)" : "transparent",
                                    color: viewMode === "list" ? "white" : "var(--text-secondary)",
                                    border: "none",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                    display: "grid",
                                    placeItems: "center",
                                }}
                                title="List"
                            >
                                <List size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main layout: list + drawer (desktop) */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: !isMobile && selected ? "1.25fr 0.75fr" : "1fr",
                        gap: "0.875rem",
                    }}
                >
                    {/* Users */}
                    <div>
                        {usersQuery.isLoading ? (
                            <div style={{ textAlign: "center", padding: "3rem 0" }}>
                                <div className="spinner" style={{ width: "40px", height: "40px" }} />
                            </div>
                        ) : users.length === 0 ? (
                            <div style={{ padding: "2rem", textAlign: "center", background: "#1a1a1f", border: "1px solid #2a2a32", borderRadius: 8 }}>
                                <Shield size={32} style={{ margin: "0 auto 0.75rem", opacity: 0.3 }} />
                                <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem", color: "var(--text-primary)", fontWeight: 600 }}>
                                    No users found
                                </h3>
                                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Try adjusting your search</p>
                            </div>
                        ) : viewMode === "grid" ? (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.875rem" }}>
                                {users.map(renderUserCardGrid)}
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                {users.map(renderUserRowList)}
                            </div>
                        )}

                        {/* Pagination */}
                        {users.length > 0 && (
                            <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                                <button
                                    disabled={page === 0}
                                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                                    style={{
                                        opacity: page === 0 ? 0.4 : 1,
                                        borderRadius: 8,
                                        padding: "0.625rem 0.875rem",
                                        border: "1px solid rgba(255,255,255,0.10)",
                                        background: "rgba(0,0,0,0.25)",
                                        color: "white",
                                        fontWeight: 800,
                                        cursor: page === 0 ? "not-allowed" : "pointer",
                                    }}
                                >
                                    Prev
                                </button>

                                <button
                                    onClick={() => setPage((p) => p + 1)}
                                    style={{
                                        borderRadius: 8,
                                        padding: "0.625rem 0.875rem",
                                        border: "1px solid rgba(255,0,0,0.25)",
                                        background: "rgba(255,0,0,0.10)",
                                        color: "white",
                                        fontWeight: 800,
                                        cursor: "pointer",
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Selected panel (desktop drawer or mobile sheet) */}
                    {selected && <SelectedPanel />}
                </div>

                {/* Ban Modal */}
                {showBanModal && selected && (
                    <div
                        onClick={() => setShowBanModal(false)}
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(0,0,0,0.65)",
                            display: "grid",
                            placeItems: "center",
                            padding: 16,
                            zIndex: 9999,
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: "min(560px, 96vw)",
                                borderRadius: 14,
                                border: "1px solid rgba(255,0,0,0.30)",
                                background: "rgba(18,18,26,0.95)",
                                padding: 16,
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                                <div style={{ fontWeight: 900 }}>Ban: {selected.username}</div>
                                <button onClick={() => setShowBanModal(false)} style={{ background: "transparent", border: "none", color: "white", opacity: 0.8 }}>
                                    <X />
                                </button>
                            </div>

                            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                                <label style={{ fontSize: 13, opacity: 0.85 }}>Reason</label>
                                <input
                                    value={banReason}
                                    onChange={(e) => setBanReason(e.target.value)}
                                    style={{
                                        borderRadius: 8,
                                        padding: "0.625rem 0.875rem",
                                        background: "#1a1a1f",
                                        border: "1px solid #2a2a32",
                                        color: "white",
                                    }}
                                />

                                <label style={{ fontSize: 13, opacity: 0.85 }}>Days (0 = permanent)</label>
                                <input
                                    type="number"
                                    value={banDays}
                                    onChange={(e) => setBanDays(parseInt(e.target.value || "0", 10))}
                                    style={{
                                        borderRadius: 8,
                                        padding: "0.625rem 0.875rem",
                                        background: "#1a1a1f",
                                        border: "1px solid #2a2a32",
                                        color: "white",
                                    }}
                                />

                                <button
                                    onClick={doBan}
                                    style={{
                                        marginTop: 8,
                                        borderRadius: 10,
                                        padding: "12px 12px",
                                        border: "1px solid rgba(239,68,68,0.35)",
                                        background: "rgba(239,68,68,0.12)",
                                        color: "white",
                                        fontWeight: 900,
                                        display: "flex",
                                        gap: 10,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                    }}
                                >
                                    <Ban size={18} /> Confirm Ban
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Modal */}
                {showDeleteModal && selected && (
                    <div
                        onClick={() => setShowDeleteModal(false)}
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(0,0,0,0.65)",
                            display: "grid",
                            placeItems: "center",
                            padding: 16,
                            zIndex: 9999,
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: "min(560px, 96vw)",
                                borderRadius: 14,
                                border: "1px solid rgba(255,0,0,0.35)",
                                background: "rgba(18,18,26,0.95)",
                                padding: 16,
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                                <div style={{ fontWeight: 900, color: "#ef4444" }}>Delete Account</div>
                                <button onClick={() => setShowDeleteModal(false)} style={{ background: "transparent", border: "none", color: "white", opacity: 0.8 }}>
                                    <X />
                                </button>
                            </div>

                            <div style={{ marginTop: 10, opacity: 0.8, fontSize: 13, lineHeight: 1.35 }}>
                                This is Real Deleting. Type Exactly to confirm:
                            </div>

                            <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "rgba(255,0,0,0.08)", border: "1px solid rgba(255,0,0,0.20)", fontWeight: 900 }}>
                                DELETE {selected.username}
                            </div>

                            <input
                                value={deleteConfirm}
                                onChange={(e) => setDeleteConfirm(e.target.value)}
                                placeholder="Digite aqui..."
                                style={{
                                    marginTop: 12,
                                    width: "100%",
                                    borderRadius: 8,
                                    padding: "0.625rem 0.875rem",
                                    background: "#1a1a1f",
                                    border: "1px solid #2a2a32",
                                    color: "white",
                                }}
                            />

                            <button
                                onClick={doDelete}
                                style={{
                                    marginTop: 12,
                                    borderRadius: 10,
                                    padding: "12px 12px",
                                    border: "1px solid rgba(255,0,0,0.35)",
                                    background: "rgba(255,0,0,0.14)",
                                    color: "white",
                                    fontWeight: 900,
                                    display: "flex",
                                    gap: 10,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                }}
                            >
                                <Trash2 size={18} /> Confirm Delete
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
        input:focus, select:focus { outline: none; border-color: rgba(255,0,0,0.55) !important; }
        button:hover { transform: translateY(-1px); }
        @media (max-width: 980px){
          .container-custom{ padding-left: 14px; padding-right: 14px; }
        }
      `}</style>
        </div>
    );
};

export default ManagersPage;
