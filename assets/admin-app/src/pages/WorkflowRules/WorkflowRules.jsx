// src/pages/WorkflowRules/WorkflowRules.jsx

import React, { useState, useEffect } from "react";
import {
    Box, Button, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, IconButton, Switch,
    Stack, Alert, CircularProgress, Snackbar, Dialog, DialogTitle,
    DialogContent, DialogContentText, DialogActions
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import BoltIcon from "@mui/icons-material/Bolt";
import StarIcon from "@mui/icons-material/Star"; // <--- For Pro Badge

import { RulesAPI } from "../../api/rules";
import { StatusesAPI } from "../../api/statuses";
import RuleEditorDialog from "./RuleEditorDialog";

export default function WorkflowRulesPage() {
    const [rules, setRules] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [snack, setSnack] = useState(null);

    // --- Dialog States ---
    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' });
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingRule, setEditingRule] = useState(null);

    // --- LIMIT LOGIC ---
    const MAX_FREE_RULES = 2;
    const isPro = false; // Placeholder for future Pro logic
    const ruleCount = rules.length;
    const isLimitReached = !isPro && ruleCount >= MAX_FREE_RULES;

    // --- Load Data ---
    const refresh = async () => {
        setLoading(true);
        try {
            // Fetch Rules AND Statuses in parallel
            const [rulesData, statusData] = await Promise.all([
                RulesAPI.list(),
                StatusesAPI.list()
            ]);
            setRules(rulesData);
            setStatuses(statusData || []);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    // --- Actions ---
    const handleToggle = async (id, currentStatus) => {
        const originalRules = [...rules];
        // Optimistic update
        setRules(prev => prev.map(r => r.id === id ? { ...r, is_active: !currentStatus } : r));

        try {
            await RulesAPI.update(id, { is_active: !currentStatus });
        } catch (e) {
            // Revert if failed
            setRules(originalRules);
            setSnack({ severity: 'error', message: 'Failed to update status' });
        }
    };

    // --- Editor Handling ---
    const handleOpenCreator = () => {
        setEditingRule(null); // Clear data for new rule
        setEditorOpen(true);
    };

    const handleOpenEditor = (rule) => {
        setEditingRule(rule); // Load existing data
        setEditorOpen(true);
    };

    const handleSaveRule = async (formData) => {
        try {
            if (editingRule) {
                // Update existing
                await RulesAPI.update(editingRule.id, formData);
                setSnack({ severity: 'success', message: 'Rule updated' });
            } else {
                // Create new
                await RulesAPI.create(formData);
                setSnack({ severity: 'success', message: 'Rule created' });
            }
            refresh(); // Reload list
            setEditorOpen(false);
        } catch (e) {
            setSnack({ severity: 'error', message: 'Save failed: ' + e.message });
        }
    };

    // --- Delete Handling ---
    const handleDeleteClick = (rule) => {
        setDeleteDialog({ open: true, id: rule.id, name: rule.name });
    };

    const performDelete = async () => {
        const { id } = deleteDialog;
        try {
            await RulesAPI.delete(id);
            setRules(prev => prev.filter(r => r.id !== id));
            setSnack({ severity: 'success', message: 'Rule deleted' });
        } catch (e) {
            setSnack({ severity: 'error', message: 'Delete failed' });
        } finally {
            setDeleteDialog({ open: false, id: null, name: '' });
        }
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Automation Rules
                </Typography>

                {/* BUTTON WITH LIMIT CHECK */}
                <Button
                    variant="contained"
                    startIcon={isLimitReached ? <StarIcon /> : <AddIcon />}
                    onClick={handleOpenCreator}
                    disabled={isLimitReached}
                    color={isLimitReached ? "warning" : "primary"}
                >
                    {isLimitReached ? "Pro Required" : "New Rule"}
                </Button>
            </Stack>

            {/* LIMIT BANNER */}
            {isLimitReached && (
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
                            You have reached the free limit of {MAX_FREE_RULES} automation rules.
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Upgrade to WLU Pro for unlimited workflows and advanced triggers.
                        </Typography>
                    </Box>
                    <Button variant="contained" color="warning" size="small" href="#">
                        Upgrade
                    </Button>
                </Paper>
            )}

            {error && <Alert severity="error">{error}</Alert>}

            <TableContainer component={Paper} variant="outlined" sx={{ border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#fafafa' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: '#666' }}>RULE NAME</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#666' }}>TRIGGER</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#666' }}>ACTION</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: '#666' }}>ACTIVE</TableCell>
                            <TableCell align="right"></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading && rules.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress size={30} /></TableCell>
                            </TableRow>
                        ) : rules.map((rule) => (
                            <TableRow key={rule.id} hover>
                                <TableCell>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                        {rule.name}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        icon={<BoltIcon />}
                                        label={rule.trigger_value ? rule.trigger_value.replace('wc-', '') : 'Unknown'}
                                        size="small"
                                        sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 600, textTransform: 'capitalize' }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={rule.action_type ? rule.action_type.replace('_', ' ') : 'Action'}
                                        size="small"
                                        variant="outlined"
                                        sx={{ textTransform: 'capitalize' }}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Switch
                                        checked={Boolean(rule.is_active)}
                                        size="small"
                                        onChange={() => handleToggle(rule.id, rule.is_active)}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => handleOpenEditor(rule)}><EditIcon /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleDeleteClick(rule)}><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && rules.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#999' }}>
                                    No rules found. Click "New Rule" to start.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* --- EDITOR DIALOG --- */}
            <RuleEditorDialog
                open={editorOpen}
                onClose={() => setEditorOpen(false)}
                onSave={handleSaveRule}
                initialData={editingRule}
                statuses={statuses}
            />

            {/* --- DELETE CONFIRMATION DIALOG --- */}
            <Dialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, id: null, name: '' })}
            >
                <DialogTitle>Delete Automation Rule?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete <strong>{deleteDialog.name}</strong>?
                        <br/><br/>
                        This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, id: null, name: '' })}>Cancel</Button>
                    <Button onClick={performDelete} variant="contained" color="error">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={Boolean(snack)}
                autoHideDuration={3000}
                onClose={() => setSnack(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                {snack && <Alert severity={snack.severity}>{snack.message}</Alert>}
            </Snackbar>
        </Box>
    );
}