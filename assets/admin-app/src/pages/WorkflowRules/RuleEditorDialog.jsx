// src/pages/WorkflowRules/RuleEditorDialog.jsx

import React, { useState, useEffect } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, MenuItem, Stack, Typography,
    Divider, Box, useTheme, alpha, Paper, Chip, ListSubheader,
    Input, FormHelperText // <--- Switched to raw Input
} from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import SendIcon from "@mui/icons-material/Send";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CodeIcon from "@mui/icons-material/Code";
import CircleIcon from "@mui/icons-material/Circle";

// --- EXACT STYLE FROM OrderStatuses.jsx ---
const inputStyle = {
    fontSize: '0.875rem',
    color: 'text.primary',
    width: '100%',
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

export default function RuleEditorDialog({ open, onClose, onSave, initialData, statuses }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // --- STATE ---
    const [form, setForm] = useState({
        name: "",
        trigger_type: "order_status_change",
        trigger_value: "",
        action_type: "send_email",
        action_payload: {
            to: "customer",
            custom_email: "",
            subject: "Order #{order_number} Update",
            heading: "Order #{order_number}",
            message: "Hi {customer_name}, your order is now {status}..."
        }
    });

    const [errors, setErrors] = useState({});

    // --- LOAD DATA ---
    useEffect(() => {
        if (open) {
            setErrors({});
            if (initialData) {
                setForm({
                    ...initialData,
                    action_payload: typeof initialData.action_payload === 'string'
                        ? JSON.parse(initialData.action_payload)
                        : initialData.action_payload
                });
            } else {
                setForm({
                    name: "",
                    trigger_type: "order_status_change",
                    trigger_value: "",
                    action_type: "send_email",
                    action_payload: {
                        to: "customer", custom_email: "",
                        subject: "Order #{order_number} Update",
                        heading: "Order #{order_number}",
                        message: "Hi {customer_name}, your order is now {status}..."
                    }
                });
            }
        }
    }, [open, initialData]);

    // --- HANDLERS ---
    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const handlePayloadChange = (field, value) => {
        setForm(prev => ({ ...prev, action_payload: { ...prev.action_payload, [field]: value } }));
    };

    const handleSubmit = () => {
        const newErrors = {};
        if (!form.name?.trim()) newErrors.name = "Rule Name is required";
        if (!form.trigger_value) newErrors.trigger_value = "Please select a status";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        onSave(form);
    };

    // --- STATUS OPTIONS LOGIC ---
    const customStatuses = statuses || [];
    const coreStatuses = [
        { slug: 'pending', label: 'Pending payment', color: '#e5e5e5' },
        { slug: 'processing', label: 'Processing', color: '#7ad03a' },
        { slug: 'on-hold', label: 'On hold', color: '#ffba00' },
        { slug: 'completed', label: 'Completed', color: '#2ea2cc' },
        { slug: 'cancelled', label: 'Cancelled', color: '#a00' },
        { slug: 'refunded', label: 'Refunded', color: '#b3afaf' },
        { slug: 'failed', label: 'Failed', color: '#d9534f' }
    ];
    const filteredCore = coreStatuses.filter(core => !customStatuses.some(c => c.slug === core.slug));

    const renderStatusItem = (label, color) => (
        <Stack direction="row" alignItems="center" spacing={1.5}>
            <CircleIcon sx={{ fontSize: 12, color: color || '#ccc' }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{label}</Typography>
        </Stack>
    );

    // Style for the "Dividers" (Headers)
    const headerStyle = {
        lineHeight: '32px',
        fontWeight: 700,
        color: isDark ? theme.palette.primary.light : theme.palette.primary.main,
        bgcolor: isDark ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.primary.main, 0.05),
        borderBottom: '1px solid',
        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 800, borderBottom: 1, borderColor: 'divider', color: 'text.primary' }}>
                {initialData ? "Edit Automation" : "New Automation"}
            </DialogTitle>

            <DialogContent sx={{ p: 3, bgcolor: 'background.paper' }}>

                <Stack spacing={0}>

                    {/* 1. RULE NAME (Now using Raw Input) */}
                    <Box sx={{ mb: 4, mt: 1 }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                            RULE NAME
                        </Typography>
                        <Input
                            placeholder="e.g. Send 'Thank You' email when Completed"
                            fullWidth
                            value={form.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            error={!!errors.name}
                            sx={inputStyle}
                        />
                        {errors.name && <FormHelperText error>{errors.name}</FormHelperText>}
                    </Box>

                    {/* 2. TRIGGER SECTION */}
                    <Paper variant="outlined" sx={{ p: 2, pb: 3, bgcolor: alpha(theme.palette.primary.main, 0.04), borderColor: alpha(theme.palette.primary.main, 0.2), borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none' }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, color: 'primary.main' }}>
                            <BoltIcon fontSize="small" />
                            <Typography variant="subtitle2" fontWeight={800}>WHEN...</Typography>
                        </Stack>

                        <Stack direction="row" spacing={3}>
                            <TextField
                                select
                                label="Event"
                                variant="standard"
                                value={form.trigger_type}
                                fullWidth
                                disabled
                                sx={{ '& .MuiInput-underline:before': { borderBottom: '1px solid rgba(150,150,150,0.42)' } }}
                            >
                                <MenuItem value="order_status_change">Order Status Changes</MenuItem>
                            </TextField>

                            <TextField
                                select
                                label="To Status *"
                                variant="standard"
                                value={form.trigger_value}
                                onChange={(e) => handleChange("trigger_value", e.target.value)}
                                fullWidth
                                error={!!errors.trigger_value}
                                helperText={errors.trigger_value}
                                sx={{ '& .MuiInput-underline:before': { borderBottom: '1px solid rgba(150,150,150,0.42)' } }}
                            >
                                <MenuItem value="" disabled>Select Status...</MenuItem>
                                {customStatuses.length > 0 && <ListSubheader sx={headerStyle}>YOUR CUSTOM STATUSES</ListSubheader>}
                                {customStatuses.map(s => <MenuItem key={s.slug} value={s.slug}>{renderStatusItem(s.label, s.color || s.colour)}</MenuItem>)}
                                <ListSubheader sx={headerStyle}>WOOCOMMERCE CORE</ListSubheader>
                                {filteredCore.map(s => <MenuItem key={s.slug} value={s.slug}>{renderStatusItem(s.label, s.color)}</MenuItem>)}
                            </TextField>
                        </Stack>
                    </Paper>

                    {/* CONNECTOR ARROW */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', zIndex: 1, my: -1.5 }}>
                        <Box sx={{ bgcolor: 'background.paper', p: 0.5, borderRadius: '50%', border: 1, borderColor: 'divider', boxShadow: 1 }}>
                            <ArrowDownwardIcon color="action" fontSize="small" />
                        </Box>
                    </Box>

                    {/* 3. ACTION SECTION */}
                    <Paper variant="outlined" sx={{ p: 2, pt: 3, bgcolor: alpha(theme.palette.secondary.main, 0.04), borderColor: alpha(theme.palette.secondary.main, 0.2), borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, color: 'secondary.main' }}>
                            <SendIcon fontSize="small" />
                            <Typography variant="subtitle2" fontWeight={800}>THEN...</Typography>
                        </Stack>

                        <TextField
                            select
                            label="Action"
                            variant="standard"
                            value={form.action_type}
                            fullWidth
                            sx={{ mb: 3, '& .MuiInput-underline:before': { borderBottom: '1px solid rgba(150,150,150,0.42)' } }}
                            disabled
                        >
                            <MenuItem value="send_email">Send an Email</MenuItem>
                        </TextField>

                        {/* EMAIL CONFIG */}
                        <Box sx={{
                            p: 2,
                            borderRadius: 1,
                            bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#fff',
                            border: 1,
                            borderColor: 'divider'
                        }}>
                            <Stack spacing={2}>
                                <TextField
                                    select
                                    label="Send To"
                                    variant="standard"
                                    value={form.action_payload.to}
                                    onChange={(e) => handlePayloadChange("to", e.target.value)}
                                    fullWidth
                                    sx={{ '& .MuiInput-underline:before': { borderBottom: '1px solid rgba(150,150,150,0.42)' } }}
                                >
                                    <MenuItem value="customer">Customer (Billing Email)</MenuItem>
                                    <MenuItem value="admin">Site Admin</MenuItem>
                                    <MenuItem value="custom">Custom Email Address...</MenuItem>
                                </TextField>

                                {form.action_payload.to === "custom" && (
                                    <Input
                                        placeholder="Enter Email Address"
                                        fullWidth
                                        value={form.action_payload.custom_email}
                                        onChange={(e) => handlePayloadChange("custom_email", e.target.value)}
                                        sx={inputStyle}
                                    />
                                )}

                                {/* SUBJECT LINE (Now using Raw Input) */}
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Subject Line</Typography>
                                    <Input
                                        fullWidth
                                        value={form.action_payload.subject}
                                        onChange={(e) => handlePayloadChange("subject", e.target.value)}
                                        sx={inputStyle}
                                    />
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary">Message Body</Typography>
                                    <Input
                                        multiline
                                        rows={4}
                                        fullWidth
                                        value={form.action_payload.message}
                                        onChange={(e) => handlePayloadChange("message", e.target.value)}
                                        placeholder="Hi {customer_name}, your order is now {status}..."
                                        sx={inputStyle}
                                    />
                                </Box>

                                {/* VARIABLE CHIPS */}
                                <Box sx={{ pt: 1 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <CodeIcon fontSize="inherit" /> AVAILABLE VARIABLES
                                    </Typography>
                                    <Stack direction="row" flexWrap="wrap" gap={1}>
                                        {['{order_number}', '{customer_name}', '{order_total}', '{status}'].map(v => (
                                            <Chip
                                                key={v}
                                                label={v}
                                                size="small"
                                                onClick={() => handlePayloadChange("message", form.action_payload.message + " " + v)}
                                                sx={{
                                                    fontFamily: 'monospace',
                                                    bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#e0e0e0',
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    '&:hover': { bgcolor: 'primary.main', color: 'white', borderColor: 'primary.main' }
                                                }}
                                            />
                                        ))}
                                    </Stack>
                                </Box>
                            </Stack>
                        </Box>
                    </Paper>
                </Stack>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ fontWeight: 700, px: 3 }}>
                    {initialData ? "Update Automation" : "Create Automation"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}