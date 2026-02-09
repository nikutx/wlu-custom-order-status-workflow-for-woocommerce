import React, { useState, useEffect } from "react";
import {
    Box, Typography, Paper, Switch, FormGroup, FormControlLabel,
    Divider, TextField, Button, Stack, Snackbar, Alert, useTheme, alpha
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save"; // Kept only for License button
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PaletteIcon from "@mui/icons-material/Palette";
import { SettingsAPI } from "../../api/settings";

export default function SettingsPage() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [settings, setSettings] = useState({
        cleanOnUninstall: false,
        disableNativeEmails: false,
        enableAdminColors: true,
        licenseKey: ""
    });
    const [snack, setSnack] = useState(null);
    const [savingKey, setSavingKey] = useState(false); // Specific loading state for key

    // Load Settings
    useEffect(() => {
        SettingsAPI.get().then(data => {
            setSettings(prev => ({
                ...prev,
                ...data,
                enableAdminColors: data.enableAdminColors === undefined ? true : data.enableAdminColors
            }));
        });
    }, []);

    // --- INSTANT TOGGLE HANDLER ---
    const handleToggle = async (field) => {
        // 1. Determine new value
        const newValue = !settings[field];

        // 2. Optimistic Update (Update UI instantly)
        const newSettings = { ...settings, [field]: newValue };
        setSettings(newSettings);

        // 3. Save to Server immediately
        try {
            await SettingsAPI.save(newSettings);
            setSnack({ severity: 'success', message: 'Setting saved' });
        } catch (e) {
            // Revert if failed
            setSettings(prev => ({ ...prev, [field]: !newValue }));
            setSnack({ severity: 'error', message: 'Failed to save setting' });
        }
    };

    // --- LICENSE KEY HANDLER (Manual Save) ---
    // Text fields should still have a button or "onBlur" save to avoid API spam while typing
    const handleSaveKey = async () => {
        setSavingKey(true);
        try {
            await SettingsAPI.save(settings);
            setSnack({ severity: 'success', message: 'License Key Saved' });
        } catch (e) {
            setSnack({ severity: 'error', message: 'Failed to save key' });
        } finally {
            setSavingKey(false);
        }
    };

    const handleTextChange = (field) => (e) => {
        setSettings({ ...settings, [field]: e.target.value });
    };

    return (
        <Box sx={{ maxWidth: 800 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Plugin Settings
            </Typography>

            {/* GENERAL SETTINGS (AUTO-SAVE) */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    General Configuration
                </Typography>

                <FormGroup>
                    {/* ADMIN COLORS */}
                    <FormControlLabel
                        control={
                            <Switch
                                checked={!!settings.enableAdminColors}
                                onChange={() => handleToggle('enableAdminColors')}
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PaletteIcon fontSize="small" color="primary" />
                                <Box>
                                    <Typography variant="body2" fontWeight={600}>Admin Color Injection</Typography>
                                    <Typography variant="caption" color="text.secondary">Show custom status colors in the WooCommerce Orders list.</Typography>
                                </Box>
                            </Box>
                        }
                        sx={{ mb: 2, alignItems: 'flex-start' }}
                    />
                    <Divider sx={{ my: 1, opacity: 0.1 }} />

                    {/* FRONTEND COLORS */}
                    <FormControlLabel
                        control={
                            <Switch
                                checked={!!settings.enableFrontendColors}
                                onChange={() => handleToggle('enableFrontendColors')}
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PaletteIcon fontSize="small" color="secondary" />
                                <Box>
                                    <Typography variant="body2" fontWeight={600}>Customer Dashboard Colors</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Display colored status "pills" in the My Account > Orders table.
                                    </Typography>
                                </Box>
                            </Box>
                        }
                        sx={{ mb: 2, alignItems: 'flex-start' }}
                    />

                    <Divider sx={{ my: 1, opacity: 0.1 }} />

                    {/* DISABLE EMAILS */}
                    <FormControlLabel
                        control={
                            <Switch
                                checked={!!settings.disableNativeEmails}
                                onChange={() => handleToggle('disableNativeEmails')}
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body2" fontWeight={600}>Disable WooCommerce Default Emails</Typography>
                                <Typography variant="caption" color="text.secondary">Prevent double emails if you replace standard statuses.</Typography>
                            </Box>
                        }
                        sx={{ mb: 2, alignItems: 'flex-start' }}
                    />

                    <Divider sx={{ my: 1, opacity: 0.1 }} />

                    {/* CLEANUP */}
                    <FormControlLabel
                        control={
                            <Switch
                                color="error"
                                checked={!!settings.cleanOnUninstall}
                                onChange={() => handleToggle('cleanOnUninstall')}
                            />
                        }
                        label={
                            <Box>
                                <Typography variant="body2" fontWeight={600} color="error.main">Uninstall Cleanup</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Delete all custom statuses and rules when deleting the plugin.
                                </Typography>
                            </Box>
                        }
                        sx={{ mt: 1, alignItems: 'flex-start' }}
                    />
                </FormGroup>
            </Paper>

            {/* PRO LICENSE SECTION (MANUAL SAVE) */}
            <Paper variant="outlined" sx={{
                p: 3, mb: 3,
                bgcolor: isDark ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.primary.main, 0.04),
                borderColor: alpha(theme.palette.primary.main, 0.3)
            }}>
                <Typography variant="subtitle1" sx={{
                    fontWeight: 700,
                    color: isDark ? '#d1c4e9' : 'primary.main',
                    mb: 2, display: 'flex', alignItems: 'center', gap: 1
                }}>
                    <VpnKeyIcon fontSize="small" /> Pro License
                </Typography>

                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    Enter your license key to unlock unlimited statuses, SMS notifications, and audit logs.
                </Typography>

                <Box sx={{ display: 'flex', maxWidth: 500, alignItems: 'stretch' }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Paste your license key here..."
                        value={settings.licenseKey || ""}
                        onChange={handleTextChange('licenseKey')}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderTopRightRadius: 0,
                                borderBottomRightRadius: 0,
                                bgcolor: 'background.paper',
                                height: '100%'
                            }
                        }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleSaveKey}
                        disabled={savingKey}
                        disableElevation
                        startIcon={savingKey ? null : <SaveIcon />}
                        sx={{
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 3,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {savingKey ? "Saving..." : "Save Key"}
                    </Button>
                </Box>

                {settings.licenseKey && (
                    <Typography variant="caption" sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main', fontWeight: 600 }}>
                        <CheckCircleIcon fontSize="inherit" /> License key saved locally.
                    </Typography>
                )}
            </Paper>

            {/* SUPPORT LINKS */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    Need Help?
                </Typography>
                <Stack direction="row" spacing={2}>
                    <Button variant="outlined" href="https://weblevelup.co.uk/docs/wlu-order-workflow" target="_blank">
                        Documentation
                    </Button>
                    <Button variant="outlined" href="https://weblevelup.co.uk/support" target="_blank">
                        Contact Support
                    </Button>
                </Stack>
            </Paper>

            <Snackbar open={Boolean(snack)} autoHideDuration={2000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {snack && <Alert severity={snack.severity}>{snack.message}</Alert>}
            </Snackbar>
        </Box>
    );
}