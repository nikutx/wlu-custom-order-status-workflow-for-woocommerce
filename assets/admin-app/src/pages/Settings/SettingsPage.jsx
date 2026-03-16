import React, { useState, useEffect } from "react";
import {
    Box, Typography, Paper, Switch, FormGroup, FormControlLabel,
    Divider, TextField, Button, Stack, Snackbar, Alert, useTheme, alpha,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import PaletteIcon from "@mui/icons-material/Palette";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import { SettingsAPI } from "../../api/settings";

export default function SettingsPage() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // --- AUTH CHECK ---
    const isPro = window.WEBLEVELUP_STATUS?.isPro === true || window.WEBLEVELUP_STATUS?.isPro === "1";
    const isProInstalled = window.WEBLEVELUP_STATUS?.isProInstalled === true || window.WEBLEVELUP_STATUS?.isProInstalled === "1";

    const [settings, setSettings] = useState({
        cleanOnUninstall: false,
        disableNativeEmails: false,
        enableAdminColors: true,
        licenseKey: "",
        licenseStatus: "inactive",
    });

    const [draftKey, setDraftKey] = useState("");
    const [snack, setSnack] = useState(null);
    const [savingKey, setSavingKey] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

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

    const handleSaveKey = async () => {
        setSavingKey(true);
        try {
            const keyToSubmit = draftKey.trim() !== "" ? draftKey : settings.licenseKey;

            // 🚨 ADDED THE PLUGIN SLUG TO THE PAYLOAD 🚨
            const data = await SettingsAPI.verifyLicense({
                license_key: keyToSubmit,
                plugin_slug: 'wlu-workflow-pro',
                action: 'verify'
            });

            setSnack({ severity: 'success', message: data.message || 'License activated!' });
            setTimeout(() => { window.location.reload(); }, 1200);
        } catch (e) {
            setSnack({ severity: 'error', message: e.message });
            setSavingKey(false);
        }
    };

    const confirmDisconnect = async () => {
        setConfirmOpen(false);
        setSavingKey(true);
        try {
            // 🚨 ADDED THE PLUGIN SLUG HERE AS WELL 🚨
            const data = await SettingsAPI.verifyLicense({
                plugin_slug: 'wlu-workflow-pro',
                action: 'disconnect'
            });
            setSnack({ severity: 'info', message: data.message || 'License disconnected.' });
            setTimeout(() => { window.location.reload(); }, 800);
        } catch (e) {
            setSnack({ severity: 'error', message: e.message });
            setSavingKey(false);
        }
    };

    const isLicenseActive = settings.licenseStatus === 'active';
    const hasSavedKey = Boolean(settings.licenseKey && settings.licenseKey.length > 5);

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

            <Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: isDark ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.primary.main, 0.04), borderColor: alpha(theme.palette.primary.main, 0.3) }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#d1c4e9' : 'primary.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VpnKeyIcon fontSize="small" /> Pro License
                </Typography>

                {!isProInstalled ? (
                    <Box>
                        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                            To unlock unlimited workflows, SMS notifications, and premium support, you need the WLU Workflow Pro add-on.
                        </Typography>

                        <Alert severity="info" sx={{ mb: 3, '& .MuiAlert-message': { width: '100%' } }}>
                            <Typography variant="subtitle2" fontWeight={700} mb={0.5}>How to activate Pro:</Typography>
                            <ol style={{ margin: 0, paddingLeft: '1.2rem', color: 'inherit' }}>
                                <li style={{ marginBottom: '4px' }}>Purchase a license from the Web Level Up website.</li>
                                <li style={{ marginBottom: '4px' }}>Download the <strong>wlu-workflow-pro.zip</strong> file from your account dashboard.</li>
                                <li>Navigate to <strong>Plugins &gt; Add New Plugin &gt; Upload Plugin</strong> in WordPress and install the zip file.</li>
                            </ol>
                        </Alert>

                        <Button
                            variant="contained"
                            color="primary"
                            href={window.WEBLEVELUP_STATUS?.upgradeUrl || "https://weblevelup.co.uk"}
                            target="_blank"
                            startIcon={<CloudDownloadIcon />}
                            disableElevation
                            sx={{ fontWeight: 700, '&:hover': { color: '#ffffff' } }}
                        >
                            Get Pro Add-on
                        </Button>
                    </Box>
                ) : (
                    <Box>
                        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                            {isLicenseActive ? "Your site is connected to a valid Pro license. Auto-updates and premium support are unlocked." : "Enter your license key to activate auto-updates and premium developer support."}
                        </Typography>

                        {hasSavedKey ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {settings.licenseStatus === 'revoked_license' && <Alert severity="error">License revoked. Please renew your subscription.</Alert>}
                                {settings.licenseStatus === 'expired_license' && <Alert severity="warning">License expired. Please renew to receive updates.</Alert>}

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#fff', borderRadius: 2, border: '1px solid', borderColor: isLicenseActive ? 'success.light' : 'error.light' }}>
                                    {isLicenseActive ? <CheckCircleIcon color="success" /> : <ErrorOutlineIcon color="error" />}
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" fontWeight="bold" color={isLicenseActive ? "success.main" : "error.main"}>
                                            {isLicenseActive ? "License Active" : "License Issue Detected"}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '14px' }}>
                                            ••••••••••••{settings.licenseKey ? settings.licenseKey.slice(-4) : "••••"}
                                        </Typography>
                                    </Box>

                                    <Button variant="outlined" color="error" size="small" onClick={() => setConfirmOpen(true)} disabled={savingKey} sx={{ textTransform: 'none', fontWeight: 600 }}>
                                        {savingKey ? "Disconnecting..." : "Disconnect"}
                                    </Button>
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', maxWidth: 500, alignItems: 'stretch' }}>
                                <TextField
                                    fullWidth size="small" placeholder="Paste your license key here..."
                                    value={draftKey} onChange={(e) => setDraftKey(e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderTopRightRadius: 0, borderBottomRightRadius: 0, bgcolor: 'background.paper', height: '100%' } }}
                                />
                                <Button
                                    variant="contained" onClick={handleSaveKey} disabled={savingKey || draftKey.trim() === ""} disableElevation
                                    startIcon={savingKey ? null : <SaveIcon />}
                                    sx={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, textTransform: 'none', fontWeight: 700, px: 3, whiteSpace: 'nowrap', '&:hover': { color: '#ffffff' } }}
                                >
                                    {savingKey ? "Activating..." : "Activate Key"}
                                </Button>
                            </Box>
                        )}
                    </Box>
                )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Need Help?</Typography>
                <Stack direction="row" spacing={2}>
                    <Button variant="outlined" href={window.WEBLEVELUP_STATUS?.upgradeUrl || "https://weblevelup.co.uk"} target="_blank">Documentation</Button>
                    <Button variant="outlined" href="https://weblevelup.co.uk/support" target="_blank">Contact Support</Button>
                </Stack>
            </Paper>

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 800, borderBottom: 1, borderColor: 'divider' }}>Disconnect License?</DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <DialogContentText sx={{ color: 'text.secondary' }}>
                        Are you sure you want to remove this license key? You will no longer receive automatic updates or premium support.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button onClick={() => setConfirmOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
                    <Button onClick={confirmDisconnect} variant="contained" color="error" disableElevation sx={{ fontWeight: 700 }}>
                        Disconnect
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={Boolean(snack)} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                {snack && <Alert severity={snack.severity} sx={{ width: '100%' }}>{snack.message}</Alert>}
            </Snackbar>
        </Box>
    );
}