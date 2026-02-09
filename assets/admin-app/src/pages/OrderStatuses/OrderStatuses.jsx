// src/pages/OrderStatuses/OrderStatuses.jsx

import * as React from "react";
import {
    Alert, Box, Button, Chip, Snackbar, Stack, Input, Typography, Paper,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
    FormControl, InputLabel, Select, MenuItem, Switch,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";
import LockIcon from "@mui/icons-material/Lock";

import { StatusesAPI } from "../../api/statuses";

// ---------- helpers ----------
function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toSlug(input) {
    return String(input || "")
        .trim()
        .toLowerCase()
        .replace(/[\s\W-]+/g, "-")
        .replace(/^-+|-+$/g, "");
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
        _draft: row._draft || false
    };
}

// ---------- styles ----------
const inputStyle = {
    fontSize: '0.875rem',
    '& input': {
        border: 'none !important',
        boxShadow: 'none !important',
        borderRadius: '0 !important',
        background: 'transparent !important',
        padding: '4px 0 !important',
        height: 'auto !important',
        minHeight: 'auto !important',
        lineHeight: '1.5 !important'
    },
    '&:before': { borderBottom: '1px solid rgba(0,0,0,0.42)' },
    '&:after': { borderBottom: '2px solid #1976d2' }
};

const switchStyle = {
    '& .MuiSwitch-input': {
        margin: '0 !important',
        top: 0,
        left: 0,
        opacity: '0 !important',
        width: '100% !important',
        height: '100% !important'
    },
    '& .MuiSwitch-input:before': { display: 'none !important' },
    '& .MuiSwitch-input:after': { display: 'none !important' }
};

// ---------- component ----------
export default function OrderStatusesPage() {
    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [snack, setSnack] = React.useState(null);
    const [error, setError] = React.useState(null);

    // --- Safe Delete State ---
    // Added 'label' so we can show "Delete 'Validation'?" in the text
    const [deleteDialog, setDeleteDialog] = React.useState({ open: false, targetId: null, count: 0, label: '' });
    const [reassignTo, setReassignTo] = React.useState("");

    // --- Limits ---
    const MAX_FREE_STATUSES = 2;
    const isPro = false;

    const savedCount = rows.filter(r => !r._draft).length;
    const isAddDisabled = !isPro && savedCount >= MAX_FREE_STATUSES;
    const showLimitBanner = !isPro && savedCount >= MAX_FREE_STATUSES;

    const showSnack = (severity, message) => setSnack({ severity, message });

    const refresh = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const list = await StatusesAPI.list();
            const normalized = (Array.isArray(list) ? list : [])
                .map((r, i) => normalizeRow(r, i));

            normalized.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
            setRows(normalized);
        } catch (e) {
            setError(e?.message || "Failed to load statuses");
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        refresh();
    }, [refresh]);

    // --- ACTIONS ---

    const handleAdd = () => {
        if (isAddDisabled) {
            showSnack("warning", "Limit reached. Upgrade to Pro!");
            return;
        }

        const id = makeId();
        const draft = normalizeRow(
            {
                id,
                label: "",
                slug: "",
                color: "#22C55E",
                enabled: true,
                sort: (rows.length > 0 ? Math.max(...rows.map(r => r.sort)) : 0) + 10,
                _draft: true,
                _isEditing: true
            },
            rows.length
        );

        setRows((prev) => [draft, ...prev]);
    };

    const handleEditClick = (id) => {
        setRows(prev => prev.map(r => r.id === id ? { ...r, _isEditing: true } : r));
    };

    const handleCancelClick = (id) => {
        setRows(prev => {
            const row = prev.find(r => r.id === id);
            if (row && row._draft) {
                return prev.filter(r => r.id !== id);
            }
            return prev.map(r => r.id === id ? { ...r, _isEditing: false } : r);
        });
    };

    const handleSaveClick = async (id) => {
        const row = rows.find(r => r.id === id);
        if (!row) return;

        const label = String(row.label || "").trim();
        let slug = String(row.slug || "").trim();

        if (!label) {
            showSnack("error", "Label is required");
            return;
        }

        if (row._draft && savedCount >= MAX_FREE_STATUSES && !isPro) {
            showSnack("error", "Free limit reached. Upgrade to Pro.");
            return;
        }

        try {
            slug = toSlug(slug);
            const payload = {
                id: row.id,
                label,
                color: row.color || "#22C55E",
                enabled: Boolean(row.enabled),
                sort: Number(row.sort) || 0,
            };

            if (!row._draft || slug) payload.slug = slug;

            const saved = row._draft
                ? await StatusesAPI.create(payload)
                : await StatusesAPI.update(row.id, payload);

            const savedRow = normalizeRow(saved ?? payload);
            if (!row._draft && row.count !== undefined) {
                savedRow.count = row.count;
            }

            setRows(prev => prev.map(r => r.id === id ? savedRow : r));
            showSnack("success", "Saved.");

        } catch (e) {
            showSnack("error", e.message || "Save failed");
        }
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

    const handleLabelChange = (id, newLabel) => {
        setRows(prev => prev.map(r => {
            if (r.id !== id) return r;

            const updates = { label: newLabel };
            if (r._draft) {
                updates.slug = toSlug(newLabel);
            }
            return { ...r, ...updates };
        }));
    };

    const updateRow = (id, field, value) => {
        setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    // --- DELETE LOGIC (UNIFIED) ---
    const handleDeleteClick = (id) => {
        const row = rows.find((r) => r.id === id);
        if (!row) return;

        // Reset dialog state and open it for BOTH cases (0 orders or >0 orders)
        setReassignTo("");
        setDeleteDialog({
            open: true,
            targetId: id,
            count: row.count,
            label: row.label || 'this status'
        });
    };

    const performDelete = async () => {
        const { targetId, count } = deleteDialog;
        const countToMove = count || 0;
        const reassignSlug = reassignTo; // From state

        try {
            let path = `statuses/${encodeURIComponent(targetId)}`;
            if (count > 0 && reassignSlug) {
                path += `?reassign=${encodeURIComponent(reassignSlug)}`;
            }

            const cfg = window.WLU_OW;
            await fetch(cfg.restUrl + path, {
                method: 'DELETE',
                headers: { 'X-WP-Nonce': cfg.nonce }
            });

            setRows((prev) => {
                const remaining = prev.filter((r) => r.id !== targetId);
                if (count > 0 && reassignSlug) {
                    return remaining.map(row => {
                        if (row.slug === reassignSlug || row.slug === `wc-${reassignSlug}`) {
                            return { ...row, count: (row.count || 0) + countToMove };
                        }
                        return row;
                    });
                }
                return remaining;
            });

            showSnack("success", "Deleted.");
            setDeleteDialog({ open: false, targetId: null, count: 0, label: '' });
        } catch (e) {
            showSnack("error", e?.message || "Delete failed");
        }
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Order Statuses
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={refresh} disabled={loading}>
                        Refresh
                    </Button>
                    <Button
                        size="small"
                        variant="contained"
                        startIcon={isAddDisabled ? <StarIcon /> : <AddIcon />}
                        onClick={handleAdd}
                        disabled={isAddDisabled}
                        color={isAddDisabled ? "warning" : "primary"}
                    >
                        {isAddDisabled ? "Pro Required" : "Add"}
                    </Button>
                </Stack>
            </Stack>

            {showLimitBanner && (
                <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, backgroundColor: '#fff8e1', borderColor: '#ffecb3' }}>
                    <Box sx={{ backgroundColor: '#ffc107', color: '#000', borderRadius: '50%', p: 1, display: 'flex' }}><StarIcon fontSize="small" /></Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>You have reached the free limit of {MAX_FREE_STATUSES} statuses.</Typography>
                        <Typography variant="body2" color="text.secondary">Upgrade to WLU Pro for unlimited workflows and automation.</Typography>
                    </Box>
                    <Button variant="contained" color="warning" size="small" href="#">Upgrade</Button>
                </Paper>
            )}

            {error ? <Alert severity="error">{error}</Alert> : null}

            <TableContainer component={Paper} variant="outlined" sx={{ border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                <Table size="medium">
                    <TableHead sx={{ backgroundColor: '#fafafa' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: '#666', width: '30%' }}>LABEL</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#666', width: '25%' }}>SLUG</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: '#666', width: '10%' }}>ORDERS</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: '#666', width: '10%' }}>COLOR</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: '#666', width: '10%' }}>SORT</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: '#666', width: '5%' }}>ON</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#666', width: '10%' }}></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow
                                key={row.id}
                                sx={{
                                    backgroundColor: row._isEditing ? 'rgba(25, 118, 210, 0.04)' : 'inherit',
                                    '&:hover': { backgroundColor: row._isEditing ? 'rgba(25, 118, 210, 0.04)' : '#fafafa' }
                                }}
                            >
                                <TableCell>
                                    {row._isEditing ? (
                                        <Input
                                            fullWidth
                                            autoFocus
                                            value={row.label}
                                            onChange={(e) => handleLabelChange(row.id, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, row.id)}
                                            placeholder="Status Label"
                                            sx={inputStyle}
                                        />
                                    ) : (
                                        <Chip
                                            label={row.label || "(no label)"}
                                            size="small"
                                            sx={{
                                                bgcolor: row.color,
                                                color: '#fff',
                                                fontWeight: 700,
                                                height: 24,
                                                border: '1px solid rgba(0,0,0,0.05)'
                                            }}
                                        />
                                    )}
                                </TableCell>

                                <TableCell>
                                    {row._isEditing && row._draft ? (
                                        <Input
                                            fullWidth
                                            value={row.slug}
                                            onChange={(e) => updateRow(row.id, 'slug', e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, row.id)}
                                            placeholder="auto-generated"
                                            sx={{ ...inputStyle, fontFamily: 'monospace', color: '#666' }}
                                        />
                                    ) : (
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            {row._isEditing && !row._draft && <LockIcon sx={{ fontSize: 14, color: '#999' }} />}
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#666', fontSize: '0.8rem', bgcolor: 'rgba(0,0,0,0.04)', display: 'inline-block', px: 1, borderRadius: 1 }}>
                                                {row.slug || "—"}
                                            </Typography>
                                        </Stack>
                                    )}
                                </TableCell>

                                <TableCell align="center">
                                    {row.count > 0 ? (
                                        <span style={{ fontWeight: 700, color: '#444' }}>{row.count}</span>
                                    ) : (
                                        <span style={{ color: '#ccc' }}>-</span>
                                    )}
                                </TableCell>

                                <TableCell align="center">
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        {row._isEditing ? (
                                            <Box sx={{
                                                position: 'relative', width: 24, height: 24, borderRadius: '50%',
                                                bgcolor: row.color, border: '2px solid #fff', boxShadow: '0 0 0 2px #1976d2', cursor: 'pointer'
                                            }}>
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
                                    {row._isEditing ? (
                                        <Input
                                            type="number"
                                            value={row.sort}
                                            onChange={(e) => updateRow(row.id, 'sort', e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, row.id)}
                                            sx={{ ...inputStyle, width: 40, '& input': { textAlign: 'center !important' } }}
                                        />
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">{row.sort}</Typography>
                                    )}
                                </TableCell>

                                <TableCell align="center">
                                    <Switch
                                        size="small"
                                        checked={!!row.enabled}
                                        disabled={!row._isEditing}
                                        onChange={(e) => updateRow(row.id, 'enabled', e.target.checked)}
                                        sx={{
                                            ...switchStyle,
                                            opacity: row._isEditing ? 1 : 0.8
                                        }}
                                    />
                                </TableCell>

                                <TableCell align="right">
                                    {row._isEditing ? (
                                        <Stack direction="row" justifyContent="flex-end">
                                            <Tooltip title="Save"><IconButton size="small" onClick={() => handleSaveClick(row.id)} color="primary"><SaveIcon /></IconButton></Tooltip>
                                            <Tooltip title="Cancel"><IconButton size="small" onClick={() => handleCancelClick(row.id)}><CancelIcon /></IconButton></Tooltip>
                                        </Stack>
                                    ) : (
                                        <Stack direction="row" justifyContent="flex-end">
                                            <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEditClick(row.id)}><EditIcon /></IconButton></Tooltip>
                                            <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDeleteClick(row.id)} color="error"><DeleteIcon /></IconButton></Tooltip>
                                        </Stack>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {rows.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#999' }}>
                                    No custom statuses found. Click "Add" to create one.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* --- UNIFIED DELETE DIALOG --- */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, targetId: null, count: 0, label: '' })}>
                <DialogTitle>Delete Status?</DialogTitle>
                <DialogContent>
                    {deleteDialog.count > 0 ? (
                        <>
                            <DialogContentText sx={{ mb: 2, color: 'error.main' }}>
                                <strong>Warning:</strong> This status is currently used by <strong>{deleteDialog.count} orders</strong>.
                            </DialogContentText>
                            <DialogContentText sx={{ mb: 2 }}>
                                You must reassign these orders to another status before deleting.
                            </DialogContentText>
                            <FormControl fullWidth size="small">
                                <InputLabel>Reassign Orders To</InputLabel>
                                <Select
                                    value={reassignTo}
                                    label="Reassign Orders To"
                                    onChange={(e) => setReassignTo(e.target.value)}
                                >
                                    {rows
                                        .filter(r => r.id !== deleteDialog.targetId && !r._draft)
                                        .map((r) => (
                                            <MenuItem key={r.id} value={r.slug}>{r.label}</MenuItem>
                                        ))
                                    }
                                    <MenuItem value="processing">Processing (Core)</MenuItem>
                                    <MenuItem value="completed">Completed (Core)</MenuItem>
                                </Select>
                            </FormControl>
                        </>
                    ) : (
                        <DialogContentText>
                            Are you sure you want to delete <strong>{deleteDialog.label}</strong>?
                            <br/><br/>
                            This action cannot be undone.
                        </DialogContentText>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, targetId: null, count: 0, label: '' })}>Cancel</Button>
                    <Button
                        onClick={performDelete}
                        variant="contained"
                        color="error"
                        // Disable if orders exist but no reassignment selected
                        disabled={deleteDialog.count > 0 && !reassignTo}
                    >
                        {deleteDialog.count > 0 ? "Reassign & Delete" : "Delete"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={Boolean(snack)} autoHideDuration={2500} onClose={() => setSnack(null)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
                {snack ? <Alert severity={snack.severity} onClose={() => setSnack(null)} sx={{ width: "100%" }}>{snack.message}</Alert> : null}
            </Snackbar>
        </Box>
    );
}