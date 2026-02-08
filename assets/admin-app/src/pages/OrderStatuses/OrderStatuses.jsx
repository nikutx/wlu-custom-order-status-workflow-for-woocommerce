// src/pages/OrderStatuses/OrderStatuses.jsx

import * as React from "react";
import {
    Alert, Box, Button, Chip, Snackbar, Stack, TextField, Typography, Paper,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
    FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import {
    DataGrid,
    GridActionsCellItem,
    GridRowModes,
    GridRowEditStopReasons,
} from "@mui/x-data-grid";

import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";

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
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}

function normalizeRow(row, fallbackIndex = 0) {
    const id = row?.id ?? row?.Id ?? row?.slug ?? `row-${fallbackIndex}`;
    const color = row?.color ?? row?.colour ?? "#22C55E";

    const normalized = {
        ...row,
        id,
        color,
        enabled: Boolean(row?.enabled),
        sort: Number.isFinite(Number(row?.sort)) ? Number(row?.sort) : 0,
        count: Number(row?.count) || 0, // NEW: Usage count
    };

    if ("colour" in normalized) delete normalized.colour;
    return normalized;
}

// ---------- component ----------
export default function OrderStatusesPage() {
    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const [rowModesModel, setRowModesModel] = React.useState({});
    const [snack, setSnack] = React.useState(null);
    const [error, setError] = React.useState(null);

    // --- NEW: Safe Delete State ---
    const [deleteDialog, setDeleteDialog] = React.useState({ open: false, targetId: null, count: 0 });
    const [reassignTo, setReassignTo] = React.useState("");

    // --- FREEMIUM LIMIT LOGIC ---
    const MAX_FREE_STATUSES = 2;
    const isPro = false; // Hook up to window.WLU_OW.isPro later

    // We disable the button if total rows (including drafts) >= 2
    const isAddDisabled = !isPro && rows.length >= MAX_FREE_STATUSES;

    // BUT we only show the banner if they have actually SAVED 2 statuses.
    // This stops the UI from yelling at them while they are creating the 2nd one.
    const savedCount = rows.filter(r => !r.isNew && !r.__draft).length;
    const showLimitBanner = !isPro && savedCount >= MAX_FREE_STATUSES;

    const showSnack = (severity, message) => setSnack({ severity, message });

    const refresh = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const list = await StatusesAPI.list();
            const normalized = (Array.isArray(list) ? list : [])
                .map((r, i) => normalizeRow(r, i))
                .filter((r) => !r.__draft);

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

    const filteredRows = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rows;

        return rows.filter((r) => {
            const hay = [
                r.label,
                r.slug,
                r.color,
                String(r.sort ?? ""),
                r.enabled ? "enabled" : "disabled",
            ].join(" ").toLowerCase();
            return hay.includes(q);
        });
    }, [rows, query]);

    const handleRowEditStop = (params, event) => {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
    };

    const handleRowEditStart = (params, event) => {
        if (params.field === "actions") {
            event.defaultMuiPrevented = true;
        }
    };

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
                sort: (rows?.[rows.length - 1]?.sort ?? 0) + 10,
                __draft: true,
                isNew: true,
            },
            rows.length
        );

        setRows((prev) => [draft, ...prev]);
        setRowModesModel((prev) => ({
            ...prev,
            [id]: { mode: GridRowModes.Edit, fieldToFocus: "label" },
        }));
    };

    // --- NEW: Delete Flow ---
    const handleDeleteClick = (id) => {
        const row = rows.find((r) => normalizeRow(r).id === id);
        if (!row) return;

        const count = row.count || 0;

        if (count > 0) {
            // Safe Delete Mode
            setReassignTo(""); // reset selection
            setDeleteDialog({ open: true, targetId: id, count });
        } else {
            // Direct Delete
            if (window.confirm("Delete this status?")) {
                performDelete(id);
            }
        }
    };

    const performDelete = async (id, reassignSlug = null) => {
        // Capture the count BEFORE we delete, so we know how many to add to the target
        const countToMove = deleteDialog.count || 0;

        try {
            // We append reassign param if needed
            let path = `statuses/${encodeURIComponent(id)}`;
            if (reassignSlug) {
                path += `?reassign=${encodeURIComponent(reassignSlug)}`;
            }

            const cfg = window.WLU_OW;
            await fetch(cfg.restUrl + path, {
                method: 'DELETE',
                headers: { 'X-WP-Nonce': cfg.nonce }
            });

            // 1. Remove the deleted row
            setRows((prev) => {
                // Filter out the deleted row
                const remaining = prev.filter((r) => normalizeRow(r).id !== id);

                // 2. If we moved orders, find the target row and update its count immediately
                if (reassignSlug && countToMove > 0) {
                    return remaining.map(row => {
                        // Check if this is the row we moved orders TO
                        // (Handle both "slug" and "wc-slug" cases just to be safe)
                        if (row.slug === reassignSlug || row.slug === `wc-${reassignSlug}`) {
                            return {
                                ...row,
                                count: (row.count || 0) + countToMove
                            };
                        }
                        return row;
                    });
                }

                return remaining;
            });

            showSnack("success", "Deleted.");
            setDeleteDialog({ open: false, targetId: null, count: 0 });
        } catch (e) {
            showSnack("error", e?.message || "Delete failed");
        }
    };
    const confirmSafeDelete = () => {
        if (!reassignTo) {
            alert("Please select a status to move orders to.");
            return;
        }
        performDelete(deleteDialog.targetId, reassignTo);
    };

    const processRowUpdate = async (newRow, oldRow) => {
        const row = normalizeRow(newRow);
        const label = String(row.label || "").trim();
        let slug = String(row.slug || "").trim();

        if (!label) throw new Error("Label is required.");

        const isNew = Boolean(oldRow?.isNew || row?.isNew || row?.__draft);

        // Security check for limit
        if (isNew && savedCount >= MAX_FREE_STATUSES && !isPro) {
            throw new Error("Free limit reached. Upgrade to Pro.");
        }

        slug = toSlug(slug);

        const payload = {
            id: row.id,
            label,
            color: row.color || "#22C55E",
            enabled: Boolean(row.enabled),
            sort: Number(row.sort) || 0,
        };

        if (!isNew || slug) payload.slug = slug;

        const saved = isNew
            ? await StatusesAPI.create(payload)
            : await StatusesAPI.update(row.id, payload);

        const savedRow = normalizeRow(saved ?? payload);
        delete savedRow.__draft;
        delete savedRow.isNew;

        // --- FIX: Preserve count on edit ---
        // The API update response doesn't include the count (it's heavy to calc).
        // So we keep the count from the old row to avoid it flickering to 0/-.
        if (!isNew && oldRow && oldRow.count !== undefined) {
            savedRow.count = oldRow.count;
        }
        // -----------------------------------

        setRows((prev) => prev.map((r) => (normalizeRow(r).id === row.id ? savedRow : normalizeRow(r))));
        showSnack("success", isNew ? "Created." : "Saved.");
        return savedRow;
    };
    const handleEditClick = (id) => () => {
        setRowModesModel((prev) => ({ ...prev, [id]: { mode: GridRowModes.Edit } }));
    };

    const handleSaveClick = (id) => () => {
        setRowModesModel((prev) => ({ ...prev, [id]: { mode: GridRowModes.View } }));
    };

    const handleCancelClick = (id) => () => {
        setRowModesModel((prev) => ({ ...prev, [id]: { mode: GridRowModes.View, ignoreModifications: true } }));
        setRows((prev) => prev.filter((r) => normalizeRow(r).id !== id || !r.__draft));
    };

    const columns = [
        {
            field: "label",
            headerName: "Label",
            flex: 1,
            editable: true,
            renderCell: (params) => {
                const label = params.value || "(no label)";
                const color = params.row?.color || "#22C55E";
                return (
                    <Chip
                        label={label}
                        size="small"
                        sx={{ backgroundColor: color, color: "#fff", fontWeight: 700 }}
                    />
                );
            },
        },
        {
            field: "slug",
            headerName: "Slug",
            width: 150,
            editable: true,
            renderCell: (params) => (
                <Box
                    component="span"
                    sx={{
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        background: "rgba(0,0,0,0.06)",
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        color: "#666"
                    }}
                >
                    {params.value || "—"}
                </Box>
            ),
        },
        {
            field: "count",
            headerName: "Orders",
            width: 80,
            editable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                params.value > 0 ?
                    <Chip label={params.value} size="small" variant="outlined" /> :
                    <span style={{color:'#ccc'}}>-</span>
            )
        },
        {
            field: "color",
            headerName: "Color",
            width: 80, // Reduced width slightly since we removed text
            editable: true,
            headerAlign: 'center', // Center the header text
            align: 'center',       // Center the cell content
            renderCell: (params) => {
                const c = params.row?.color ?? "#22C55E";
                return (
                    // We use a Flex Box to ensure perfect centering
                    <Box sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Box sx={{
                            width: 24,
                            height: 24,
                            borderRadius: 1,
                            backgroundColor: c,
                            border: "1px solid rgba(0,0,0,0.15)",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.1)" // Added subtle shadow for pop
                        }} />
                    </Box>
                );
            },
            renderEditCell: (params) => (
                <TextField
                    type="color"
                    fullWidth
                    value={params.value ?? "#22C55E"}
                    onChange={(e) => params.api.setEditCellValue({ id: params.id, field: params.field, value: e.target.value })}
                    sx={{ "& input": { padding: 0, height: 30, cursor: 'pointer' } }}
                />
            ),
        },
        { field: "sort", headerName: "Sort", width: 80, editable: true, type: "number" },
        { field: "enabled", headerName: "On", width: 70, editable: true, type: "boolean" },
        {
            field: "actions",
            type: "actions",
            headerName: "",
            width: 100,
            getActions: (params) => {
                const id = params.id;
                const isInEditMode = rowModesModel?.[id]?.mode === GridRowModes.Edit;

                if (isInEditMode) {
                    return [
                        <GridActionsCellItem
                            key="save"
                            icon={<SaveIcon />}
                            label="Save"
                            onClick={(e) => { e.stopPropagation(); handleSaveClick(id)(); }}
                        />,
                        <GridActionsCellItem
                            key="cancel"
                            icon={<CancelIcon />}
                            label="Cancel"
                            onClick={(e) => { e.stopPropagation(); handleCancelClick(id)(); }}
                            color="inherit"
                        />,
                    ];
                }

                return [
                    <GridActionsCellItem
                        key="edit"
                        icon={<EditIcon />}
                        label="Edit"
                        onClick={(e) => { e.stopPropagation(); handleEditClick(id)(); }}
                        color="inherit"
                    />,
                    <GridActionsCellItem
                        key="delete"
                        icon={<DeleteIcon />}
                        label="Delete"
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(id); }}
                        color="inherit"
                    />,
                ];
            },
        },
    ];

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

            {/* --- UPGRADE BANNER (Conditional) --- */}
            {showLimitBanner && (
                <Paper
                    variant="outlined"
                    sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        backgroundColor: '#fff8e1',
                        borderColor: '#ffecb3'
                    }}
                >
                    <Box sx={{ backgroundColor: '#ffc107', color: '#000', borderRadius: '50%', p: 1, display: 'flex' }}>
                        <StarIcon fontSize="small" />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            You have reached the free limit of {MAX_FREE_STATUSES} statuses.
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Upgrade to WLU Pro for unlimited workflows and automation.
                        </Typography>
                    </Box>
                    <Button variant="contained" color="warning" size="small" href="#">
                        Upgrade
                    </Button>
                </Paper>
            )}

            {error ? <Alert severity="error">{error}</Alert> : null}

            <Box sx={{ height: 420, width: "100%" }}>
                <DataGrid
                    rows={filteredRows}
                    columns={columns}
                    loading={loading}
                    editMode="row"
                    rowModesModel={rowModesModel}
                    onRowModesModelChange={setRowModesModel}
                    onRowEditStart={handleRowEditStart}
                    onRowEditStop={handleRowEditStop}
                    processRowUpdate={processRowUpdate}
                    onProcessRowUpdateError={(e) => showSnack("error", e?.message || "Save failed")}
                    getRowId={(r) => r?.id ?? r?.Id ?? r?.slug}
                    pageSizeOptions={[100]}
                    disableRowSelectionOnClick
                    isCellEditable={(params) => {
                        if (params.field === 'slug') return !!params.row.isNew;
                        return true;
                    }}
                />
            </Box>

            <Snackbar
                open={Boolean(snack)}
                autoHideDuration={2500}
                onClose={() => setSnack(null)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                {snack ? (
                    <Alert severity={snack.severity} onClose={() => setSnack(null)} sx={{ width: "100%" }}>
                        {snack.message}
                    </Alert>
                ) : null}
            </Snackbar>

            {/* --- SAFE DELETE DIALOG --- */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, targetId: null, count: 0 })}>
                <DialogTitle>Cannot Delete Status</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        There are <strong>{deleteDialog.count} orders</strong> currently using this status.
                        To prevent data loss, please select a status to move these orders to.
                    </DialogContentText>

                    <FormControl fullWidth size="small">
                        <InputLabel>Reassign Orders To</InputLabel>
                        <Select
                            value={reassignTo}
                            label="Reassign Orders To"
                            onChange={(e) => setReassignTo(e.target.value)}
                        >
                            {rows
                                .filter(r => r.id !== deleteDialog.targetId && !r.__draft) // Don't show self or drafts
                                .map((r) => (
                                    <MenuItem key={r.id} value={r.slug}>
                                        {r.label}
                                    </MenuItem>
                                ))
                            }
                            {/* Option to move back to core Processing/Completed? */}
                            <MenuItem value="processing">Processing (Core)</MenuItem>
                            <MenuItem value="completed">Completed (Core)</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, targetId: null, count: 0 })}>Cancel</Button>
                    <Button onClick={confirmSafeDelete} variant="contained" color="error" disabled={!reassignTo}>
                        Move Orders & Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}