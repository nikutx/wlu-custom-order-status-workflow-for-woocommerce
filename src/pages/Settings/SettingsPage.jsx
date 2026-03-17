import React, { useState, useEffect } from "react";
import {
    Box, Typography, Paper, Switch, FormGroup, FormControlLabel,
    Divider, Button, Stack, Snackbar, Alert, useTheme
} from "@mui/material";
import PaletteIcon from "@mui/icons-material/Palette";
import { SettingsAPI } from "../../api/settings.js";

export default function SettingsPage() {
    const theme = useTheme();

    const [settings, setSettings] = useState({
        cleanOnUninstall: false,
        disableNativeEmails: false,
        enableAdminColors: true,
        enableFrontendColors: false // Added since it was in your UI
    });

    const [snack, setSnack] = useState(null);

    useEffect(() => {
        SettingsAPI.get().then(data => {
            setSettings(prev => ({
                ...prev,
                ...data,
                enableAdminColors: data.enableAdminColors === undefined ? true : data.enableAdminColors
            }));
        });
    }, []);

    const handleToggle = async (field) => {
        const newValue = !settings[field];
        const newSettings = { ...settings, [field]: newValue };
        setSettings(newSettings);

        try {
            await SettingsAPI.save(newSettings);
            setSnack({ severity: 'success', message: 'Setting saved' });
        } catch (e) {
            setSettings(prev => ({ ...prev, [field]: !newValue }));
            setSnack({ severity: 'error', message: 'Failed to save setting' });
        }
    };

    return (
        <Box sx={{ maxWidth: 800 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Plugin Settings
            </Typography>

            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    General Configuration
                </Typography>

                <FormGroup>
                    <FormControlLabel control={<Switch checked={!!settings.enableAdminColors} onChange={() => handleToggle('enableAdminColors')} />} label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><PaletteIcon fontSize="small" color="primary" /><Box><Typography variant="body2" fontWeight={600}>Admin Color Injection</Typography><Typography variant="caption" color="text.secondary">Show custom status colors in the WooCommerce Orders list.</Typography></Box></Box>} sx={{ mb: 2, alignItems: 'flex-start' }} />
                    <Divider sx={{ my: 1, opacity: 0.1 }} />
                    <FormControlLabel control={<Switch checked={!!settings.enableFrontendColors} onChange={() => handleToggle('enableFrontendColors')} />} label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><PaletteIcon fontSize="small" color="secondary" /><Box><Typography variant="body2" fontWeight={600}>Customer Dashboard Colors</Typography><Typography variant="caption" color="text.secondary">Display colored status "pills" in the My Account {'>'} Orders table.</Typography></Box></Box>} sx={{ mb: 2, alignItems: 'flex-start' }} />
                    <Divider sx={{ my: 1, opacity: 0.1 }} />
                    <FormControlLabel control={<Switch checked={!!settings.disableNativeEmails} onChange={() => handleToggle('disableNativeEmails')} />} label={<Box><Typography variant="body2" fontWeight={600}>Disable WooCommerce Default Emails</Typography><Typography variant="caption" color="text.secondary">Prevent double emails if you replace standard statuses.</Typography></Box>} sx={{ mb: 2, alignItems: 'flex-start' }} />
                    <Divider sx={{ my: 1, opacity: 0.1 }} />
                    <FormControlLabel control={<Switch color="error" checked={!!settings.cleanOnUninstall} onChange={() => handleToggle('cleanOnUninstall')} />} label={<Box><Typography variant="body2" fontWeight={600} color="error.main">Uninstall Cleanup</Typography><Typography variant="caption" color="text.secondary">Delete all custom statuses and rules when deleting the plugin.</Typography></Box>} sx={{ mt: 1, alignItems: 'flex-start' }} />
                </FormGroup>
            </Paper>

            {/* 🚨 THIS IS THE MAGIC SLOT 🚨 */}
            {/* The Pro plugin will look for this exact ID and render the License UI inside it! */}
            <Box id="wlu-pro-settings-slot"></Box>

            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Need Help?</Typography>
                <Stack direction="row" spacing={2}>
                    <Button variant="outlined" href="https://weblevelup.co.uk" target="_blank">Documentation</Button>
                    <Button variant="outlined" href="https://weblevelup.co.uk/support" target="_blank">Contact Support</Button>
                </Stack>
            </Paper>

            <Snackbar open={Boolean(snack)} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {snack && <Alert severity={snack.severity} sx={{ width: '100%' }}>{snack.message}</Alert>}
            </Snackbar>
        </Box>
    );
}