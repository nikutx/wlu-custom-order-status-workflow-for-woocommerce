// src/pages/OrderStatuses/OrderStatuses.jsx

import * as React from "react";
import {
    Alert, Box, Button, Chip, Snackbar, Stack, Input, Typography, Paper,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
    FormControl, InputLabel, Select, MenuItem, Switch, Skeleton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip,
    useTheme, alpha, InputAdornment
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import LockIcon from "@mui/icons-material/Lock";
import SearchIcon from "@mui/icons-material/Search";

import { StatusesAPI } from "../../api/statuses.js";


// ---------- helpers ----------
function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toSlug(input) {
    return String(input || "").trim().toLowerCase().replace(/[\s\W-]+/g, "-").replace(/^-+|-+$/g, "");
}

function normalizeRow(row, fallbackIndex = 0) {
    const id = row?.id ?? row?.Id ?? row?.slug ?? `row-${fallbackIndex}`;
    const color = row?.color ?? row?.colour ?? "#22C55E";

    return {
        ...row,
        id,
        color,
        enabled: Boolean(row?.enabled),
        sort: Number.isFinite(Number(row?.sort)) ? Number(row?.sort) : 0,
        count: Number(row?.count) || 0,
        _isEditing: row._isEditing || false,
        _draft: row._draft || false,
        _isCore: row._isCore || false
    };
}

const CORE_STATUSES = [
    { slug: 'wc-pending', label: 'Pending payment', color: '#e5e5e5', sort: 0 },
    { slug: 'wc-processing', label: 'Processing', color: '#7ad03a', sort: 1 },
    { slug: 'wc-on-hold', label: 'On hold', color: '#ffba00', sort: 2 },
    { slug: 'wc-completed', label: 'Completed', color: '#2ea2cc', sort: 3 },
    { slug: 'wc-cancelled', label: 'Cancelled', color: '#a00000', sort: 4 },
    { slug: 'wc-refunded', label: 'Refunded', color: '#b3afaf', sort: 5 },
    { slug: 'wc-failed', label: 'Failed', color: '#d9534f', sort: 6 }
];

const inputStyle = {
    fontSize: '0.875rem',
    color: 'text.primary',
    '& input': {
        border: 'none !important',
        boxShadow: 'none !important',
        borderRadius: '0 !important',
        background: 'transparent !important',
        padding: '4px 0 !important',
        height: 'auto !important',
        minHeight: 'auto !important',
        lineHeight: '1.5 !important',
        color: 'inherit'
    },
    '&:before': { borderBottom: '1px solid rgba(150, 150, 150, 0.42)' },
    '&:after': { borderBottom: '2px solid #7c4dff' }
};

const switchStyle = {
    '& .MuiSwitch-input': { margin: 0, top: 0, left: 0, opacity: 0, width: '100%', height: '100%' },
    '& .MuiSwitch-input:before': { display: 'none !important' },
    '& .MuiSwitch-input:after': { display: 'none !important' }
};

export default function OrderStatusesPage() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [snack, setSnack] = React.useState(null);
    const [error, setError] = React.useState(null);
    const [searchTerm, setSearchTerm] = React.useState("");

    // Added affectedRules array for Smart Delete warning
    const [deleteDialog, setDeleteDialog] = React.useState({
        open: false,
        targetId: null,
        count: 0,
        label: '',
        affectedRules: []
    });
    const [reassignTo, setReassignTo] = React.useState("");

    const showSnack = (severity, message) => setSnack({ severity, message });

    // Delete this line: const [rules, setRules] = React.useState([]);

    const refresh = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // 🚨 CLEANUP: Just fetch statuses now!
            const list = await StatusesAPI.list();
            const dbRows = (Array.isArray(list) ? list : []).map(r => normalizeRow(r));

            const coreRows = CORE_STATUSES.map(core => {
                const override = dbRows.find(db => db.slug === core.slug || db.slug === core.slug.replace('wc-', ''));
                if (override) return { ...override, _isCore: true, label: core.label };
                return { ...core, id: core.slug, _isCore: true, count: 0, enabled: true };
            });

            const customRows = dbRows.filter(db => !CORE_STATUSES.some(c => c.slug === db.slug || c.slug === `wc-${db.slug}`));
            customRows.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
            setRows([...customRows, ...coreRows]);

        } catch (e) {
            setError(e?.message || "Failed to load statuses");
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => { refresh(); }, [refresh]);

    // --- ACTIONS ---
    const handleAdd = () => {
        const id = makeId();
        const draft = normalizeRow({
            id,
            label: "",
            slug: "",
            color: "#22C55E",
            enabled: true,
            sort: (rows.filter(r => !r._isCore).length * 10) + 10,
            _draft: true,
            _isEditing: true,
            _isCore: false
        });
        setRows(prev => [draft, ...prev]);
    };

    const handleEditClick = (id) => setRows(prev => prev.map(r => r.id === id ? { ...r, _isEditing: true } : r));

    const handleCancelClick = (id) => setRows(prev => {
        const row = prev.find(r => r.id === id);
        if (row && row._draft) return prev.filter(r => r.id !== id);
        return prev.map(r => r.id === id ? { ...r, _isEditing: false } : r);
    });

    const handleSaveClick = async (id) => {
        const row = rows.find(r => r.id === id);
        if (!row) return;

        if (!row._isCore) {
            if (!String(row.label || "").trim()) { showSnack("error", "Label is required"); return; }
        }

        try {
            const slug = toSlug(row.slug || row.label);
            const payload = { id: row.id, label: row.label, color: row.color || "#22C55E", enabled: Boolean(row.enabled), sort: Number(row.sort) || 0 };
            if (!row._draft || slug) payload.slug = slug;

            let saved;
            if (row._isCore && typeof row.id === 'string' && row.id.startsWith('wc-')) {
                saved = await StatusesAPI.create(payload);
            } else {
                saved = row._draft ? await StatusesAPI.create(payload) : await StatusesAPI.update(row.id, payload);
            }

            const savedRow = normalizeRow(saved ?? payload);
            savedRow._isCore = row._isCore;
            if (!row._draft && row.count !== undefined) savedRow.count = row.count;

            setRows(prev => prev.map(r => r.id === id ? { ...savedRow, _isEditing: false } : r));
            showSnack("success", "Saved.");
        } catch (e) { showSnack("error", e.message || "Save failed"); }
    };

    const handleKeyDown = (e, id) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveClick(id);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancelClick(id);
        }
    };

    const handleLabelChange = (id, newLabel) => setRows(prev => prev.map(r => r.id === id && !r._isCore ? { ...r, label: newLabel, slug: r._draft ? toSlug(newLabel) : r.slug } : r));
    const updateRow = (id, field, value) => setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));

    // --- SMART DELETE LOGIC ---
    const handleDeleteClick = (id) => {
        const row = rows.find((r) => r.id === id);
        if (!row) return;
        setReassignTo("");

        // 🚨 CLEANUP: Instantly read the rule count from the injected PHP variable!
        const usageStats = window.WEBLEVELUP_STATUS?.proUsageStats?.rules || {};
        const cleanSlug = (row.slug || '').replace('wc-', '');
        const ruleCount = usageStats[cleanSlug] || 0;

        setDeleteDialog({
            open: true,
            targetId: id,
            count: row.count,
            label: row.label || 'this status',
            affectedRulesCount: ruleCount // Note: Changed to a simple number!
        });
    };
    const performDelete = async () => {
        const { targetId, count } = deleteDialog;
        const countToMove = count || 0;

        try {
            // 🚨 CLEANUP: We deleted the RulesAPI loop! The Pro backend PHP handles it automatically.
            let path = `statuses/${encodeURIComponent(targetId)}`;
            if (count > 0 && reassignTo) path += `?reassign=${encodeURIComponent(reassignTo)}`;

            const cfg = window.WEBLEVELUP_STATUS;
            await fetch(cfg.restUrl + path, { method: 'DELETE', headers: { 'X-WP-Nonce': cfg.nonce } });

            // Update Local UI State
            setRows(prev => {
                const remaining = prev.filter(r => r.id !== targetId);
                if (countToMove > 0 && reassignTo) {
                    return remaining.map(row => {
                        const rowSlug = (row.slug || '').replace('wc-', '');
                        const targetSlug = reassignTo.replace('wc-', '');

                        if (rowSlug === targetSlug) {
                            return { ...row, count: (row.count || 0) + countToMove };
                        }
                        return row;
                    });
                }
                return remaining;
            });

            showSnack("success", "Status deleted & workflow data synced.");
            setDeleteDialog({ open: false, targetId: null, count: 0, label: '', affectedRulesCount: 0 });
        } catch (e) {
            showSnack("error", e?.message || "Delete failed");
        }
    };
    // --- RENDER HELPERS ---
    const renderRow = (row) => (
        <TableRow
            key={row.id}
            sx={{
                backgroundColor: row._isEditing ? alpha(theme.palette.primary.main, 0.08) : 'inherit',
                '&:hover': { backgroundColor: row._isEditing ? alpha(theme.palette.primary.main, 0.12) : 'action.hover' }
            }}
        >
            <TableCell>
                {row._isEditing && !row._isCore ? (
                    <Input
                        fullWidth
                        autoFocus
                        value={row.label}
                        onChange={(e) => handleLabelChange(row.id, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, row.id)}
                        sx={inputStyle}
                    />
                ) : (
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: row._isCore ? 'text.secondary' : 'text.primary' }}>
                            {row.label}
                        </Typography>
                        {row._isCore && <LockIcon sx={{ fontSize: 14, color: 'text.disabled' }} />}
                    </Stack>
                )}
            </TableCell>
            <TableCell>
                {row._isEditing && row._draft ? (
                    <Input
                        fullWidth
                        value={row.slug}
                        onChange={(e) => updateRow(row.id, 'slug', e.target.value)}
                        sx={{ ...inputStyle, fontFamily: 'monospace', color: 'text.secondary' }}
                    />
                ) : (
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: '0.8rem', bgcolor: 'action.selected', px: 1, borderRadius: 1, display: 'inline-block' }}>
                        {row.slug || "—"}
                    </Typography>
                )}
            </TableCell>
            <TableCell align="center">
                <span style={{ color: theme.palette.text.disabled }}>
                    {row.count > 0 ? row.count : '-'}
                </span>
            </TableCell>
            <TableCell align="center">
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    {row._isEditing ? (
                        <Box sx={{ position: 'relative', width: 24, height: 24, borderRadius: '50%', bgcolor: row.color, border: '2px solid #fff', boxShadow: `0 0 0 2px ${theme.palette.primary.main}`, cursor: 'pointer' }}>
                            <input
                                type="color"
                                value={row.color}
                                onChange={(e) => updateRow(row.id, 'color', e.target.value)}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                            />
                        </Box>
                    ) : (
                        <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: row.color, border: '2px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }} />
                    )}
                </Box>
            </TableCell>
            <TableCell align="center">
                {row._isEditing && !row._isCore ? (
                    <Input
                        type="number"
                        value={row.sort}
                        onChange={(e) => updateRow(row.id, 'sort', e.target.value)}
                        sx={{ ...inputStyle, width: 40, '& input': { textAlign: 'center' } }}
                    />
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        {row.sort}
                    </Typography>
                )}
            </TableCell>

            {/* 🚨 THE UPDATED TOGGLE CELL 🚨 */}
            <TableCell align="center">
                {!row._isCore ? (
                    <Switch
                        size="small"
                        checked={!!row.enabled}
                        disabled={!row._isEditing}
                        onChange={(e) => updateRow(row.id, 'enabled', e.target.checked)}
                        sx={{ ...switchStyle, opacity: row._isEditing ? 1 : 0.6 }}
                    />
                ) : (
                    <span style={{ color: theme.palette.text.disabled }}>—</span>
                )}
            </TableCell>

            <TableCell align="right">
                {row._isEditing ? (
                    <Stack direction="row" justifyContent="flex-end">
                        <Tooltip title="Save">
                            <IconButton size="small" onClick={() => handleSaveClick(row.id)} color="primary">
                                <SaveIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                            <IconButton size="small" onClick={() => handleCancelClick(row.id)}>
                                <CancelIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                ) : (
                    <Stack direction="row" justifyContent="flex-end">
                        <Tooltip title={row._isCore ? "Edit Color" : "Edit"}>
                            <IconButton size="small" onClick={() => handleEditClick(row.id)}>
                                <EditIcon />
                            </IconButton>
                        </Tooltip>
                        {!row._isCore && (
                            <Tooltip title="Delete">
                                <IconButton size="small" onClick={() => handleDeleteClick(row.id)} color="error">
                                    <DeleteIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Stack>
                )}
            </TableCell>
        </TableRow>
    );

    // --- SEARCH ---
    const filteredRows = rows.filter(r => !searchTerm || (r.label||'').toLowerCase().includes(searchTerm.toLowerCase()));
    const customList = filteredRows.filter(r => !r._isCore);
    const coreList = filteredRows.filter(r => r._isCore);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Order Statuses</Typography>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, justifyContent: 'flex-end' }}>
                    <Input
                        placeholder="Search statuses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        startAdornment={<InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment>}
                        sx={{ ...inputStyle, maxWidth: 250, bgcolor: 'background.paper', px: 1, borderRadius: 1 }}
                    />
                    <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={refresh} disabled={loading}>
                        Refresh
                    </Button>
                    <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={handleAdd} color="primary" sx={{ '&:hover': { color: '#ffffff' } }}>
                        Add
                    </Button>
                </Stack>
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}

            <TableContainer component={Paper} variant="outlined" sx={{ border: 1, borderColor: 'divider', boxShadow: 'none' }}>
                <Table size="medium">
                    <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#fafafa' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', width: '30%' }}>LABEL</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', width: '25%' }}>SLUG</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: 'text.secondary', width: '10%' }}>ORDERS</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: 'text.secondary', width: '10%' }}>COLOR</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: 'text.secondary', width: '10%' }}>SORT</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: 'text.secondary', width: '5%' }}>ON</TableCell>
                            <TableCell align="right" sx={{ width: '10%' }}></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {/* LOADING SKELETON */}
                        {loading && rows.length === 0 && Array.from(new Array(5)).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton variant="text" width={120} /></TableCell>
                                <TableCell><Skeleton variant="text" width={80} /></TableCell>
                                <TableCell align="center"><Skeleton variant="circular" width={20} height={20} sx={{ mx: 'auto' }} /></TableCell>
                                <TableCell align="center"><Skeleton variant="circular" width={20} height={20} sx={{ mx: 'auto' }} /></TableCell>
                                <TableCell align="center"><Skeleton variant="text" width={20} sx={{ mx: 'auto' }} /></TableCell>
                                <TableCell align="center"><Skeleton variant="rectangular" width={30} height={15} sx={{ mx: 'auto', borderRadius: 1 }} /></TableCell>
                                <TableCell />
                            </TableRow>
                        ))}

                        {!loading && customList.length > 0 && (
                            <TableRow>
                                <TableCell colSpan={7} sx={{ bgcolor: isDark ? alpha(theme.palette.primary.main, 0.1) : '#e3f2fd', py: 1, fontWeight: 700, color: 'primary.main', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                    MY CUSTOM STATUSES
                                </TableCell>
                            </TableRow>
                        )}
                        {!loading && customList.map(renderRow)}

                        {!loading && (
                            <TableRow>
                                <TableCell colSpan={7} sx={{ bgcolor: isDark ? alpha(theme.palette.secondary.main, 0.1) : '#f3e5f5', py: 1, fontWeight: 700, color: 'secondary.main', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                    WOOCOMMERCE CORE (COLOR OVERRIDES)
                                </TableCell>
                            </TableRow>
                        )}
                        {!loading && coreList.map(renderRow)}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* DELETE DIALOG (With Smart Rules Warning) */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, targetId: null, count: 0, label: '', affectedRules: [] })}>
                <DialogTitle>Delete Status?</DialogTitle>
                <DialogContent>

                    {/* Change .length to > 0 */}
                    {deleteDialog.affectedRulesCount > 0 && (
                        <DialogContentText sx={{ mb: 2, color: 'error.main', p: 1.5, bgcolor: alpha(theme.palette.error.main, 0.1), borderRadius: 1 }}>
                            <strong>Warning:</strong> This status is currently used by <strong>{deleteDialog.affectedRulesCount} automation rule(s)</strong>.
                            Reassigning orders below will also reassign the rules. Otherwise, the rules will be deleted.
                        </DialogContentText>
                    )}

                    {deleteDialog.count > 0 ? (
                        <>
                            <DialogContentText sx={{ mb: 2, color: 'error.main' }}>
                                <strong>Warning:</strong> Status used by <strong>{deleteDialog.count} orders</strong>.
                            </DialogContentText>
                            <FormControl fullWidth size="small">
                                <InputLabel>Reassign Orders To</InputLabel>
                                <Select value={reassignTo} label="Reassign Orders To" onChange={(e) => setReassignTo(e.target.value)}>
                                    {rows
                                        .filter(r => r.id !== deleteDialog.targetId && !r._draft)
                                        .map(r => <MenuItem key={r.slug} value={r.slug}>{r.label}</MenuItem>)
                                    }
                                </Select>
                            </FormControl>
                        </>
                    ) : (
                        <DialogContentText>
                            Are you sure you want to delete <strong>{deleteDialog.label}</strong>?
                        </DialogContentText>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, targetId: null, count: 0, label: '', affectedRules: [] })}>
                        Cancel
                    </Button>
                    <Button onClick={performDelete} variant="contained" color="error" disabled={deleteDialog.count > 0 && !reassignTo}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={Boolean(snack)}
                autoHideDuration={2500}
                onClose={() => setSnack(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity={snack?.severity} onClose={() => setSnack(null)}>
                    {snack?.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}