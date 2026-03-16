// src/pages/WorkflowRules/WorkflowRules.jsx

import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Switch,
    Stack,
    Alert,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    useTheme,
    alpha,
    Input,
    InputAdornment,
    Skeleton,
    Grid
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import BoltIcon from "@mui/icons-material/Bolt";
import SearchIcon from "@mui/icons-material/Search";
import EmailIcon from "@mui/icons-material/Email";
import SmsIcon from "@mui/icons-material/Sms";
import BuildIcon from "@mui/icons-material/Build";
import LockIcon from "@mui/icons-material/Lock";

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

    // --- AUTH CHECK ---
    const isPro = window.WEBLEVELUP_STATUS?.isPro === true || window.WEBLEVELUP_STATUS?.isPro === "1";

    // --- STATE HOOKS ---
    const [rules, setRules] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [snack, setSnack] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' });
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingRule, setEditingRule] = useState(null);

    // Limit logic completely removed because Pro is unlimited!

    const refresh = async () => {
        setLoading(true);
        try {
            const [rulesData, statusData] = await Promise.all([RulesAPI.list(), StatusesAPI.list()]);
            setRules(rulesData);
            setStatuses(statusData || []);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // Only fetch if Pro is active to prevent 404 errors on the free version
    useEffect(() => {
        if (isPro) {
            refresh();
        }
    }, [isPro]);

    const handleToggle = async (id, currentStatus) => {
        setRules(prev => prev.map(r => r.id === id ? { ...r, is_active: !currentStatus } : r));
        try {
            await RulesAPI.update(id, { is_active: !currentStatus });
        } catch (e) {
            refresh();
            setSnack({ severity: 'error', message: 'Failed' });
        }
    };

    const handleSaveRule = async (formData) => {
        try {
            if (editingRule) {
                await RulesAPI.update(editingRule.id, formData);
            } else {
                await RulesAPI.create(formData);
            }
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
        } catch (e) {
            setSnack({ severity: 'error', message: 'Delete failed' });
        } finally {
            setDeleteDialog({ open: false, id: null, name: '' });
        }
    };

    // --- FILTER RULES ---
    const filteredRules = rules.filter(r => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (r.name || '').toLowerCase().includes(term) || (r.trigger_value || '').toLowerCase().includes(term);
    });

    // --- DYNAMIC LABEL HELPER ---
    const getStatusLabel = (triggerValue) => {
        if (!triggerValue) return 'Unknown';
        const cleanSlug = triggerValue.replace('wc-', '');
        const found = statuses.find(s => s.slug === cleanSlug || s.slug === `wc-${cleanSlug}`);
        if (found && found.label) return found.label;

        const coreLabels = {
            'pending': 'Pending payment', 'processing': 'Processing',
            'on-hold': 'On hold', 'completed': 'Completed',
            'cancelled': 'Cancelled', 'refunded': 'Refunded', 'failed': 'Failed'
        };
        return coreLabels[cleanSlug] || cleanSlug;
    };

    // 🚨 PAYWALL INTERCEPT (Runs after hooks to respect React rules) 🚨
    if (!isPro) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, px: 2, textAlign: 'center' }}>
                <Paper variant="outlined" sx={{ p: { xs: 4, md: 6 }, maxWidth: 800, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.02), borderColor: alpha(theme.palette.primary.main, 0.1) }}>

                    <Box sx={{ width: 64, height: 64, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                        <LockIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                    </Box>

                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
                        Automate Your WooCommerce Store
                    </Typography>

                    <Typography variant="body1" color="text.secondary" sx={{ mb: 6, lineHeight: 1.6, maxWidth: 600, mx: 'auto' }}>
                        Stop managing orders manually. Unlock the Workflow Engine to instantly trigger custom emails, SMS text messages, and webhooks the exact moment an order changes status.
                    </Typography>

                    <Grid container spacing={3} sx={{ mb: 6, textAlign: 'left' }}>
                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ mt: 0.5, color: 'primary.main' }}><EmailIcon /></Box>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={700}>Custom Email Routing</Typography>
                                    <Typography variant="body2" color="text.secondary">Send highly personalized emails to customers, suppliers, or your warehouse team using dynamic variables.</Typography>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ mt: 0.5, color: 'primary.main' }}><SmsIcon /></Box>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={700}>SMS Notifications</Typography>
                                    <Typography variant="body2" color="text.secondary">Instantly alert customers of delivery updates or VIP status changes right on their mobile phones.</Typography>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ mt: 0.5, color: 'primary.main' }}><BoltIcon /></Box>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={700}>Unlimited Workflows</Typography>
                                    <Typography variant="body2" color="text.secondary">Create an infinite number of rules connecting your custom statuses to powerful automated actions.</Typography>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ mt: 0.5, color: 'primary.main' }}><BuildIcon /></Box>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={700}>Advanced Triggers</Typography>
                                    <Typography variant="body2" color="text.secondary">Trigger automations based on specific product categories, order totals, or shipping methods.</Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>

                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        sx={{ fontWeight: 800, px: 6, py: 1.5, fontSize: '1.1rem', borderRadius: 2, '&:hover': { color: '#ffffff' } }}
                        href={window.WEBLEVELUP_STATUS.upgradeUrl}
                        target="_blank"
                    >
                        Upgrade to WLU Pro
                    </Button>
                </Paper>
            </Box>
        );
    }

    // --- PRO RENDER (Fully Unlimited UI) ---
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Automation Rules</Typography>

                <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, justifyContent: 'flex-end' }}>
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
                        startIcon={<AddIcon />}
                        onClick={() => { setEditingRule(null); setEditorOpen(true); }}
                        disabled={loading}
                        color="primary"
                        sx={{ '&:hover': { color: '#ffffff' } }}
                    >
                        New Rule
                    </Button>
                </Stack>
            </Stack>

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

                        {/* --- SKELETON LOADER --- */}
                        {loading && rules.length === 0 && Array.from(new Array(3)).map((_, i) => (
                            <TableRow key={`skeleton-${i}`}>
                                <TableCell>
                                    <Skeleton variant="text" width={180} />
                                </TableCell>
                                <TableCell>
                                    <Skeleton variant="rectangular" width={110} height={24} sx={{ borderRadius: 4 }} />
                                </TableCell>
                                <TableCell>
                                    <Skeleton variant="rectangular" width={90} height={24} sx={{ borderRadius: 1 }} />
                                </TableCell>
                                <TableCell align="center">
                                    <Skeleton variant="rectangular" width={34} height={14} sx={{ mx: 'auto', borderRadius: 2 }} />
                                </TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" justifyContent="flex-end" spacing={1}>
                                        <Skeleton variant="circular" width={28} height={28} />
                                        <Skeleton variant="circular" width={28} height={28} />
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))}

                        {!loading && filteredRules.map((rule) => (
                            <TableRow key={rule.id} hover>
                                <TableCell>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{rule.name}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        icon={<BoltIcon />}
                                        label={getStatusLabel(rule.trigger_value)}
                                        size="small"
                                        sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', fontWeight: 700 }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={rule.action_type ? rule.action_type.replace('_', ' ') : 'Action'}
                                        size="small"
                                        variant="outlined"
                                        sx={{ textTransform: 'capitalize', borderColor: 'divider' }}
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
                                    <IconButton size="small" onClick={() => { setEditingRule(rule); setEditorOpen(true); }}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, id: rule.id, name: rule.name })}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}

                        {!loading && filteredRules.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                    No rules found matching your search.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <RuleEditorDialog
                open={editorOpen}
                onClose={() => setEditorOpen(false)}
                onSave={handleSaveRule}
                initialData={editingRule}
                statuses={statuses}
            />

            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null, name: '' })}>
                <DialogTitle>Delete Automation Rule?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete <strong>{deleteDialog.name}</strong>?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, id: null, name: '' })}>Cancel</Button>
                    <Button onClick={performDelete} variant="contained" color="error">Delete</Button>
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