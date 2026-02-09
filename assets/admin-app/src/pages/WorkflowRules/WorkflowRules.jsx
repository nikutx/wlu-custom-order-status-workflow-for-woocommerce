// src/pages/WorkflowRules/WorkflowRules.jsx

import React, { useState, useEffect } from "react";
import {
    Box, Button, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, IconButton, Switch,
    Stack, Alert, CircularProgress, Snackbar, Dialog, DialogTitle,
    DialogContent, DialogContentText, DialogActions, useTheme, alpha,
    Input, InputAdornment
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import BoltIcon from "@mui/icons-material/Bolt";
import StarIcon from "@mui/icons-material/Star";
import SearchIcon from "@mui/icons-material/Search";

import { RulesAPI } from "../../api/rules";
import { StatusesAPI } from "../../api/statuses";
import RuleEditorDialog from "./RuleEditorDialog";

// Shared Style for Search Input
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

export default function WorkflowRulesPage() {
    const theme = useTheme();
    const [rules, setRules] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [snack, setSnack] = useState(null);
    const [searchTerm, setSearchTerm] = useState(""); // <--- Search State

    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' });
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingRule, setEditingRule] = useState(null);

    const MAX_FREE_RULES = 2;
    const isPro = false;
    const isLimitReached = !isPro && rules.length >= MAX_FREE_RULES;

    const refresh = async () => {
        setLoading(true);
        try {
            const [rulesData, statusData] = await Promise.all([RulesAPI.list(), StatusesAPI.list()]);
            setRules(rulesData);
            setStatuses(statusData || []);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };
    useEffect(() => { refresh(); }, []);

    const handleToggle = async (id, currentStatus) => {
        setRules(prev => prev.map(r => r.id === id ? { ...r, is_active: !currentStatus } : r));
        try { await RulesAPI.update(id, { is_active: !currentStatus }); }
        catch (e) { refresh(); setSnack({ severity: 'error', message: 'Failed' }); }
    };

    const handleSaveRule = async (formData) => {
        try {
            if (editingRule) await RulesAPI.update(editingRule.id, formData);
            else await RulesAPI.create(formData);
            setSnack({ severity: 'success', message: 'Saved successfully' });
            refresh();
            setEditorOpen(false);
        } catch (e) {
            setSnack({ severity: 'error', message: e.message });
        }
    };

    const performDelete = async () => {
        try {
            await RulesAPI.delete(deleteDialog.id);
            setRules(prev => prev.filter(r => r.id !== deleteDialog.id));
            setSnack({ severity: 'success', message: 'Deleted' });
        } catch (e) { setSnack({ severity: 'error', message: 'Delete failed' }); }
        finally { setDeleteDialog({ open: false, id: null, name: '' }); }
    };

    // --- FILTER RULES ---
    const filteredRules = rules.filter(r => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (r.name || '').toLowerCase().includes(term) || (r.trigger_value || '').toLowerCase().includes(term);
    });

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Automation Rules</Typography>

                <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, justifyContent: 'flex-end' }}>
                    {/* SEARCH INPUT */}
                    <Input
                        placeholder="Search rules..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        startAdornment={
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                            </InputAdornment>
                        }
                        sx={{
                            ...inputStyle,
                            maxWidth: 250,
                            bgcolor: 'background.paper',
                            px: 1,
                            borderRadius: 1
                        }}
                    />

                    <Button
                        variant="contained"
                        startIcon={isLimitReached ? <StarIcon /> : <AddIcon />}
                        onClick={() => { setEditingRule(null); setEditorOpen(true); }}
                        disabled={isLimitReached}
                        color={isLimitReached ? "warning" : "primary"}
                    >
                        {isLimitReached ? "Pro Required" : "New Rule"}
                    </Button>
                </Stack>
            </Stack>

            {isLimitReached && (
                <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, backgroundColor: alpha(theme.palette.warning.main, 0.1), borderColor: 'warning.main' }}>
                    <Box sx={{ backgroundColor: 'warning.main', color: '#000', borderRadius: '50%', p: 1, display: 'flex' }}><StarIcon fontSize="small" /></Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>You have reached the free limit of {MAX_FREE_RULES} automation rules.</Typography>
                        <Typography variant="body2" color="text.secondary">Upgrade to WLU Pro for unlimited workflows and advanced triggers.</Typography>
                    </Box>
                    <Button variant="contained" color="warning" size="small" href="#">Upgrade</Button>
                </Paper>
            )}

            {error && <Alert severity="error">{error}</Alert>}

            <TableContainer component={Paper} variant="outlined" sx={{ border: 1, borderColor: 'divider', boxShadow: 'none' }}>
                <Table>
                    <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#fafafa' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>RULE NAME</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>TRIGGER</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>ACTION</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: 'text.secondary' }}>ACTIVE</TableCell>
                            <TableCell align="right"></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredRules.map((rule) => (
                            <TableRow key={rule.id} hover>
                                <TableCell><Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{rule.name}</Typography></TableCell>
                                <TableCell>
                                    <Chip
                                        icon={<BoltIcon />}
                                        label={rule.trigger_value ? rule.trigger_value.replace('wc-', '') : 'Unknown'}
                                        size="small"
                                        sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', fontWeight: 700, textTransform: 'capitalize' }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={rule.action_type ? rule.action_type.replace('_', ' ') : 'Action'}
                                        size="small" variant="outlined"
                                        sx={{ textTransform: 'capitalize', borderColor: 'divider' }}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Switch checked={Boolean(rule.is_active)} size="small" onChange={() => handleToggle(rule.id, rule.is_active)} />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => { setEditingRule(rule); setEditorOpen(true); }}><EditIcon /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, id: rule.id, name: rule.name })}><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && filteredRules.length === 0 && (
                            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No rules found matching your search.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <RuleEditorDialog open={editorOpen} onClose={() => setEditorOpen(false)} onSave={handleSaveRule} initialData={editingRule} statuses={statuses} />

            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null, name: '' })}>
                <DialogTitle>Delete Automation Rule?</DialogTitle>
                <DialogContent><DialogContentText>Are you sure you want to delete <strong>{deleteDialog.name}</strong>?</DialogContentText></DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, id: null, name: '' })}>Cancel</Button>
                    <Button onClick={performDelete} variant="contained" color="error">Delete</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={Boolean(snack)} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {snack && <Alert severity={snack.severity}>{snack.message}</Alert>}
            </Snackbar>
        </Box>
    );
}