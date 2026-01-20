import * as React from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    IconButton,
    Snackbar,
    Stack,
    TextField,
    Tooltip,
    Typography,
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

import { StatusesAPI } from "../../api/statuses";

// -------- helpers --------
function makeId() {
    // crypto.randomUUID not always available
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }
    return `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeRow(row, fallbackIndex = 0) {
    const id = row?.id ?? row?.Id ?? row?.slug ?? `row_${fallbackIndex}`;
    const color = row?.color ?? row?.colour ?? "#22C55E";

    // Ensure consistent keys (UK spelling in UI label, but data key is `color`)
    const normalized = {
        ...row,
        id,
        color,
        enabled: Boolean(row?.enabled),
        sort: Number.isFinite(Number(row?.sort)) ? Number(row?.sort) : 0,
    };

    // remove legacy key to prevent UI using stale values
    if ("colour" in normalized) delete normalized.colour;

    return normalized;
}

function toSlug(input) {
    return String(input || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}

// -------- component --------
export default function OrderStatusesPage() {
    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const [rowModesModel, setRowModesModel] = React.useState({});
    const [snack, setSnack] = React.useState(null); // { severity, message }
    const [error, setError] = React.useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = React.useState(null);

    const showSnack = (severity, message) => setSnack({ severity, message });

    const refresh = React.useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const list = await StatusesAPI.list();

            // Drop any accidental “draft” rows on refresh
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
            ]
                .join(" ")
                .toLowerCase();
            return hay.includes(q);
        });
    }, [rows, query]);

    const handleRowEditStop = (params, event) => {
        // Prevent leaving edit mode when clicking inside inputs
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
    };

    const handleAdd = () => {
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

    const processRowUpdate = async (newRow, oldRow) => {
        const row = normalizeRow(newRow);

        // Basic validation
        const label = String(row.label || "").trim();
        let slug = String(row.slug || "").trim();

        if (!label) throw new Error("Label is required.");
        if (!slug) slug = toSlug(label);
        slug = toSlug(slug);

        const payload = {
            id: row.id,
            label,
            slug,
            color: row.color || "#22C55E",
            enabled: Boolean(row.enabled),
            sort: Number(row.sort) || 0,
        };

        // Decide create vs update (use `isNew` flag)
        const isNew = Boolean(oldRow?.isNew || row?.isNew || row?.__draft);

        try {
            const saved = isNew
                ? await StatusesAPI.create(payload)
                : await StatusesAPI.update(row.id, payload);

            const savedRow = normalizeRow(saved ?? payload);

            // Ensure draft flags removed
            delete savedRow.__draft;
            delete savedRow.isNew;

            setRows((prev) =>
                prev.map((r) => (normalizeRow(r).id === row.id ? savedRow : normalizeRow(r)))
            );

            showSnack("success", isNew ? "Created." : "Saved.");
            return savedRow;
        } catch (e) {
            throw new Error(e?.message || "Save failed");
        }
    };

    const handleEditClick = (id) => () => {
        setRowModesModel((prev) => ({
            ...prev,
            [id]: { mode: GridRowModes.Edit },
        }));
    };

    const handleSaveClick = (id) => () => {
        setRowModesModel((prev) => ({
            ...prev,
            [id]: { mode: GridRowModes.View },
        }));
    };

    const handleCancelClick = (id) => () => {
        setRowModesModel((prev) => ({
            ...prev,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        }));

        // If draft row, remove it entirely
        setRows((prev) => prev.filter((r) => normalizeRow(r).id !== id || !r.__draft));
        setConfirmDeleteId(null);
    };

    const handleDeleteClick = (id) => () => {
        setConfirmDeleteId(id);
    };

    const confirmDelete = (id) => async () => {
        try {
            await StatusesAPI.remove(id);
            setRows((prev) => prev.filter((r) => normalizeRow(r).id !== id));
            showSnack("success", "Deleted.");
        } catch (e) {
            showSnack("error", e?.message || "Delete failed");
        } finally {
            setConfirmDeleteId(null);
        }
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
                        sx={{
                            backgroundColor: color,
                            color: "#fff",
                            fontWeight: 700,
                        }}
                    />
                );
            },
        },
        {
            field: "slug",
            headerName: "Slug",
            flex: 1,
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
                    }}
                >
                    {params.value || "—"}
                </Box>
            ),
        },
        {
            field: "color",
            headerName: "Colour",
            width: 180,
            editable: true,
            valueGetter: (params) => params?.row?.color ?? "#22C55E",
            renderCell: (params) => {
                const c = params.row?.color ?? "#22C55E";
                return (
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                            sx={{
                                width: 18,
                                height: 18,
                                borderRadius: 0.75,
                                backgroundColor: c,
                                border: "1px solid rgba(0,0,0,0.2)",
                            }}
                        />
                        <Box
                            component="span"
                            sx={{
                                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                background: "rgba(0,0,0,0.06)",
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                            }}
                        >
                            {c}
                        </Box>
                    </Stack>
                );
            },
            renderEditCell: (params) => {
                const value = params.value || "#22C55E";
                return (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%" }}>
                        <TextField
                            type="color"
                            size="small"
                            value={value}
                            onChange={(e) =>
                                params.api.setEditCellValue({
                                    id: params.id,
                                    field: params.field,
                                    value: e.target.value,
                                })
                            }
                            sx={{ width: 56, minWidth: 56 }}
                            inputProps={{ style: { padding: 2, height: 34 } }}
                        />
                        <TextField
                            size="small"
                            value={value}
                            onChange={(e) =>
                                params.api.setEditCellValue({
                                    id: params.id,
                                    field: params.field,
                                    value: e.target.value,
                                })
                            }
                            sx={{ flex: 1 }}
                        />
                    </Stack>
                );
            },
        },
        {
            field: "sort",
            headerName: "Sort",
            width: 100,
            editable: true,
            type: "number",
        },
        {
            field: "enabled",
            headerName: "Enabled",
            width: 120,
            editable: true,
            type: "boolean",
        },
        {
            field: "actions",
            type: "actions",
            headerName: "",
            width: 120,
            getActions: (params) => {
                const id = params.id;
                const isInEditMode = rowModesModel?.[id]?.mode === GridRowModes.Edit;

                if (confirmDeleteId === id) {
                    return [
                        <GridActionsCellItem
                            key="confirm"
                            icon={<SaveIcon />}
                            label="Confirm delete"
                            onClick={confirmDelete(id)}
                            showInMenu={false}
                        />,
                        <GridActionsCellItem
                            key="cancelDelete"
                            icon={<CancelIcon />}
                            label="Cancel"
                            onClick={() => setConfirmDeleteId(null)}
                            showInMenu={false}
                        />,
                    ];
                }

                if (isInEditMode) {
                    return [
                        <GridActionsCellItem
                            key="save"
                            icon={<SaveIcon />}
                            label="Save"
                            onClick={handleSaveClick(id)}
                        />,
                        <GridActionsCellItem
                            key="cancel"
                            icon={<CancelIcon />}
                            label="Cancel"
                            onClick={handleCancelClick(id)}
                            color="inherit"
                        />,
                    ];
                }

                return [
                    <GridActionsCellItem
                        key="edit"
                        icon={<EditIcon />}
                        label="Edit"
                        onClick={handleEditClick(id)}
                        color="inherit"
                    />,
                    <GridActionsCellItem
                        key="delete"
                        icon={<DeleteIcon />}
                        label="Delete"
                        onClick={handleDeleteClick(id)}
                        color="inherit"
                    />,
                ];
            },
        },
    ];

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Order Statuses
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                        size="small"
                        placeholder="Search statuses…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />

                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={refresh}
                        disabled={loading}
                    >
                        Refresh
                    </Button>

                    <Button
                        size="small"
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAdd}
                    >
                        Add
                    </Button>
                </Stack>
            </Stack>

            {error ? <Alert severity="error">{error}</Alert> : null}

            <Box sx={{ height: 420, width: "100%" }}>
                <DataGrid
                    rows={filteredRows}
                    columns={columns}
                    loading={loading}
                    editMode="row"
                    rowModesModel={rowModesModel}
                    onRowModesModelChange={setRowModesModel}
                    onRowEditStop={handleRowEditStop}
                    processRowUpdate={processRowUpdate}
                    onProcessRowUpdateError={(e) => showSnack("error", e?.message || "Save failed")}
                    getRowId={(r) => r?.id ?? r?.Id ?? r?.slug}
                    pageSizeOptions={[10, 25, 50, 100]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 100, page: 0 } },
                    }}
                    disableRowSelectionOnClick
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
        </Box>
    );
}
