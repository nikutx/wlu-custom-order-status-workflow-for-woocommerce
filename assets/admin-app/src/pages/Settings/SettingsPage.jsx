import React, { useState, useEffect } from "react";
import {
    Box, Typography, Paper, Switch, FormGroup, FormControlLabel,
    Divider, TextField, Button, Stack, Snackbar, Alert, InputAdornment
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { SettingsAPI } from "../../api/settings";

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        cleanOnUninstall: false,
        disableNativeEmails: false,
        licenseKey: ""
    });
    const [snack, setSnack] = useState(null);

    // Load real settings on mount
    useEffect(() => {
        SettingsAPI.get().then(data => setSettings(data));
    }, []);

    const handleChange = (field) => (e) => {
        setSettings({ ...settings, [field]: e.target.checked });
    };

    const handleTextChange = (field) => (e) => {
        setSettings({ ...settings, [field]: e.target.value });
    };

    const handleSave = async () => {
        try {
            await SettingsAPI.save(settings);
            setSnack({ severity: 'success', message: 'Settings Saved' });
        } catch (e) {
            setSnack({ severity: 'error', message: 'Save Failed' });
        }
    };

    return (
        <Box sx={{ maxWidth: 800 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Plugin Settings
            </Typography>

            {/* GENERAL SETTINGS */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    General Configuration
                </Typography>

                <FormGroup>
                    <FormControlLabel
                        control={<Switch checked={settings.disableNativeEmails} onChange={handleChange('disableNativeEmails')} />}
                        label={
                            <Box>
                                <Typography variant="body2" fontWeight={600}>Disable WooCommerce Default Emails</Typography>
                                <Typography variant="caption" color="text.secondary">Prevent double emails if you replace standard statuses.</Typography>
                            </Box>
                        }
                        sx={{ mb: 2, alignItems: 'flex-start' }}
                    />

                    <Divider sx={{ my: 1 }} />

                    <FormControlLabel
                        control={<Switch color="error" checked={settings.cleanOnUninstall} onChange={handleChange('cleanOnUninstall')} />}
                        label={
                            <Box>
                                <Typography variant="body2" fontWeight={600} color="error">Uninstall Cleanup</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Delete all custom statuses and rules when deleting the plugin.
                                </Typography>
                            </Box>
                        }
                        sx={{ mt: 1, alignItems: 'flex-start' }}
                    />
                </FormGroup>
            </Paper>

            {/* PRO LICENSE SECTION - UI FIX */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: '#f8fdff', borderColor: '#b3e5fc' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0277bd', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VpnKeyIcon fontSize="small" /> Pro License
                </Typography>

                <Stack direction="row" spacing={0} sx={{ alignItems: "stretch" }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Paste your license key here..."
                        value={settings.licenseKey}
                        onChange={handleTextChange('licenseKey')}
                        sx={{
                            bgcolor: '#fff',
                            '& .MuiOutlinedInput-root': {
                                borderTopRightRadius: 0,
                                borderBottomRightRadius: 0
                            }
                        }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disableElevation
                        sx={{
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 3
                        }}
                    >
                        Save Key
                    </Button>
                </Stack>
                {settings.licenseKey && (
                    <Typography variant="caption" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
                        <CheckCircleIcon fontSize="inherit" /> License key saved locally.
                    </Typography>
                )}
            </Paper>

            <Button variant="contained" size="large" startIcon={<SaveIcon />} onClick={handleSave}>
                Save All Settings
            </Button>

            <Snackbar open={Boolean(snack)} autoHideDuration={2000} onClose={() => setSnack(null)}>
                {snack && <Alert severity={snack.severity}>{snack.message}</Alert>}
            </Snackbar>
        </Box>
    );
}