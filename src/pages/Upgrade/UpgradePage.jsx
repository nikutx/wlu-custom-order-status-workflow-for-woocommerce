import React from "react";
import { Box, Typography, Paper, Button, Grid, useTheme, alpha } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import SmsIcon from "@mui/icons-material/Sms";
import BoltIcon from "@mui/icons-material/Bolt";
import BuildIcon from "@mui/icons-material/Build";

export default function UpgradePage() {
    const theme = useTheme();

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, px: 2 }}>
            <Paper variant="outlined" sx={{ p: { xs: 4, md: 6 }, maxWidth: 800, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.02), borderColor: alpha(theme.palette.primary.main, 0.2) }}>

                <Box sx={{ width: 64, height: 64, bgcolor: 'primary.main', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3, color: '#fff', boxShadow: '0 4px 14px rgba(124, 77, 255, 0.4)' }}>
                    <BoltIcon sx={{ fontSize: 32 }} />
                </Box>

                <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, textAlign: 'center' }}>
                    Supercharge Your WooCommerce Store
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 6, lineHeight: 1.6, maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
                    WLU Workflow Pro unlocks an entire automation engine. Stop managing orders manually and instantly trigger custom emails, SMS text messages, and webhooks the exact moment an order changes status.
                </Typography>

                <Grid container spacing={4} sx={{ mb: 6 }}>
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
                                <Typography variant="subtitle1" fontWeight={700}>Premium Support</Typography>
                                <Typography variant="body2" color="text.secondary">Get direct, priority access to our development team right from your WordPress dashboard.</Typography>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>

                <Box sx={{ textAlign: 'center' }}>
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        sx={{ fontWeight: 800, px: 6, py: 1.5, fontSize: '1.1rem', borderRadius: 2, '&:hover': { color: '#ffffff' } }}
                        href="https://weblevelup.co.uk/plugins/custom-order-status-workflow-for-woocommerce/"
                        target="_blank"
                    >
                        Get WLU Workflow Pro
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}