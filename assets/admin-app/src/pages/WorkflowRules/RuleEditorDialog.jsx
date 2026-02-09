import React, { useState, useEffect } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, FormControl, InputLabel, Select, MenuItem,
    Stack, Typography, Box, Divider, FormHelperText
} from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import MailIcon from "@mui/icons-material/Mail";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

export default function RuleEditorDialog({ open, onClose, onSave, initialData, statuses }) {
    // Default Empty State
    const defaultState = {
        name: "",
        trigger_type: "order_status_change",
        trigger_value: "",
        action_type: "send_email",
        action_payload: { to: "customer", subject: "", body: "" },
        is_active: true
    };

    const [formData, setFormData] = useState(defaultState);
    const [errors, setErrors] = useState({}); // <--- Track errors here

    // Reset or Load Data when opening
    useEffect(() => {
        if (open) {
            setErrors({}); // Clear old errors on open
            if (initialData) {
                setFormData({
                    ...initialData,
                    action_payload: typeof initialData.action_payload === 'string'
                        ? JSON.parse(initialData.action_payload)
                        : (initialData.action_payload || {})
                });
            } else {
                setFormData(defaultState);
            }
        }
    }, [open, initialData]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error as soon as user types
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: false }));
        }
    };

    const handlePayloadChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            action_payload: { ...prev.action_payload, [key]: value }
        }));
    };

    const handleSave = () => {
        // Validate
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = true;
        if (!formData.trigger_value) newErrors.trigger_value = true;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return; // Stop if invalid
        }

        onSave(formData);
    };

    const inputStyle = {
        '& .MuiInput-root': { fontSize: '0.95rem' },
        '& .MuiInputLabel-root': { fontSize: '0.9rem' }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ pb: 1, fontWeight: 800 }}>
                {initialData ? "Edit Automation" : "New Automation"}
            </DialogTitle>

            <DialogContent>
                <Stack spacing={4} sx={{ mt: 1 }}>

                    {/* 1. RULE NAME */}
                    <TextField
                        autoFocus
                        label="Rule Name"
                        fullWidth
                        variant="standard"
                        placeholder="e.g. Send 'Thank You' email when Completed"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        sx={inputStyle}
                        InputLabelProps={{ shrink: true }}
                        error={!!errors.name} // Turn red
                        helperText={errors.name ? "Please give this rule a name" : ""} // Error Msg
                    />

                    {/* 2. THE TRIGGER */}
                    <Box>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <BoltIcon color="primary" fontSize="small" />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                WHEN...
                            </Typography>
                        </Stack>

                        <Stack direction="row" spacing={2}>
                            <FormControl fullWidth variant="standard">
                                <InputLabel shrink>Event</InputLabel>
                                <Select value="order_status_change" disabled sx={inputStyle}>
                                    <MenuItem value="order_status_change">Order Status Changes</MenuItem>
                                </Select>
                            </FormControl>

                            {/* Status Selector */}
                            <FormControl
                                fullWidth
                                variant="standard"
                                required
                                error={!!errors.trigger_value} // Turn red
                            >
                                <InputLabel shrink>To Status</InputLabel>
                                <Select
                                    value={formData.trigger_value}
                                    onChange={(e) => handleChange("trigger_value", e.target.value)}
                                    displayEmpty
                                    sx={inputStyle}
                                >
                                    <MenuItem value="" disabled><span style={{ color: '#aaa' }}>Select Status...</span></MenuItem>
                                    <MenuItem value="wc-processing">Processing</MenuItem>
                                    <MenuItem value="wc-completed">Completed</MenuItem>
                                    <MenuItem value="wc-on-hold">On Hold</MenuItem>
                                    <Divider />
                                    {statuses.map(s => (
                                        <MenuItem key={s.slug} value={s.slug.startsWith('wc-') ? s.slug : `wc-${s.slug}`}>
                                            {s.label} (Custom)
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.trigger_value && (
                                    <FormHelperText>Select which status triggers this rule</FormHelperText>
                                )}
                            </FormControl>
                        </Stack>
                    </Box>

                    {/* Arrow */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', opacity: 0.3 }}>
                        <ArrowDownwardIcon />
                    </Box>

                    {/* 3. THE ACTION */}
                    <Box>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <MailIcon color="secondary" fontSize="small" />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                                THEN...
                            </Typography>
                        </Stack>

                        <FormControl fullWidth variant="standard" sx={{ mb: 3 }}>
                            <InputLabel shrink>Action</InputLabel>
                            <Select
                                value={formData.action_type}
                                onChange={(e) => handleChange("action_type", e.target.value)}
                                sx={inputStyle}
                            >
                                <MenuItem value="send_email">Send an Email</MenuItem>
                            </Select>
                        </FormControl>

                        {/* EMAIL DETAILS */}
                        {/* EMAIL DETAILS */}
                        {formData.action_type === 'send_email' && (
                            <Stack spacing={3} sx={{ pl: 2, borderLeft: '2px solid #f0f0f0' }}>

                                {/* Recipient Dropdown */}
                                <FormControl fullWidth variant="standard">
                                    <InputLabel shrink>Send To</InputLabel>
                                    <Select
                                        value={formData.action_payload.to || 'customer'}
                                        onChange={(e) => handlePayloadChange("to", e.target.value)}
                                        sx={inputStyle}
                                    >
                                        <MenuItem value="customer">Customer (Billing Email)</MenuItem>
                                        <MenuItem value="admin">Store Admin ({window.WLU_OW?.adminEmail || 'Admin'})</MenuItem>
                                        <MenuItem value="custom">Custom Email Address...</MenuItem>
                                    </Select>
                                </FormControl>

                                {/* MISSING FIELD FIXED: Custom Email Input */}
                                {formData.action_payload.to === 'custom' && (
                                    <TextField
                                        label="Enter Email Address"
                                        fullWidth
                                        variant="standard"
                                        placeholder="warehouse@example.com"
                                        value={formData.action_payload.custom_email || ""}
                                        onChange={(e) => handlePayloadChange("custom_email", e.target.value)}
                                        sx={inputStyle}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                )}

                                <TextField
                                    label="Subject Line"
                                    fullWidth
                                    variant="standard"
                                    placeholder="Order #{order_number} Update"
                                    value={formData.action_payload.subject || ""}
                                    onChange={(e) => handlePayloadChange("subject", e.target.value)}
                                    sx={inputStyle}
                                    InputLabelProps={{ shrink: true }}
                                />

                                <TextField
                                    label="Message Body"
                                    fullWidth
                                    multiline
                                    minRows={3}
                                    maxRows={6}
                                    variant="standard"
                                    placeholder="Hi {customer_name}, your order is now {status}..."
                                    value={formData.action_payload.body || ""}
                                    onChange={(e) => handlePayloadChange("body", e.target.value)}
                                    sx={inputStyle}
                                    InputLabelProps={{ shrink: true }}
                                    helperText={
                                        <Box component="span" sx={{ display: 'block', mt: 1, fontSize: '0.75rem', color: '#666' }}>
                                            <strong>Available Variables:</strong>{' '}
                                            <Box component="span" sx={{ fontFamily: 'monospace', bgcolor: '#eee', px: 0.5, borderRadius: 0.5 }}>{'{order_number}'}</Box>{' '}
                                            <Box component="span" sx={{ fontFamily: 'monospace', bgcolor: '#eee', px: 0.5, borderRadius: 0.5 }}>{'{customer_name}'}</Box>{' '}
                                            <Box component="span" sx={{ fontFamily: 'monospace', bgcolor: '#eee', px: 0.5, borderRadius: 0.5 }}>{'{order_total}'}</Box>{' '}
                                            <Box component="span" sx={{ fontFamily: 'monospace', bgcolor: '#eee', px: 0.5, borderRadius: 0.5 }}>{'{status}'}</Box>
                                        </Box>
                                    }
                                />
                            </Stack>
                        )}                    </Box>

                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button onClick={handleSave} variant="contained" disableElevation>
                    {initialData ? "Save Changes" : "Create Automation"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}