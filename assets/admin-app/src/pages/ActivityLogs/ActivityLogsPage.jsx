import React, { useState, useEffect } from "react";
import {
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Stack, Input, InputAdornment,
    Button, Chip, useTheme, alpha
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import HistoryIcon from "@mui/icons-material/History";
import LockIcon from "@mui/icons-material/Lock"; // <--- Added Lock Icon

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

export default function ActivityLogsPage() {
    const theme = useTheme();

    // --- CHECK PRO STATUS ---
    const isPro = window.WEBLEVELUP_STATUS?.isPro === true || window.WEBLEVELUP_STATUS?.isPro === "1";

    const [searchTerm, setSearchTerm] = useState("");
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    const refresh = async () => {
        setLoading(true);
        try {
            const cfg = window.WEBLEVELUP_STATUS;
            const res = await fetch(cfg.restUrl + "logs", {
                headers: { "X-WP-Nonce": cfg.nonce }
            });
            if (!res.ok) throw new Error("Failed to fetch logs");
            const data = await res.json();
            setLogs(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Auto-load on mount
    useEffect(() => {
        // Only attempt to fetch if they are Pro to save server calls!
        if (isPro) {
            refresh();
        }
    }, [isPro]);

    // --- PRO PAYWALL OVERRIDE ---
    if (!isPro) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', p: 4 }}>
                <Paper variant="outlined" sx={{ p: 6, maxWidth: 600, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.02), borderColor: alpha(theme.palette.primary.main, 0.1) }}>
                    <Box sx={{ width: 64, height: 64, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                        <LockIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                        Unlock Activity Logs
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
                        Stop guessing what your automations are doing. The Activity Log gives you a complete, real-time audit trail of every rule fired, every email sent, and every order affected.
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        sx={{ fontWeight: 700, px: 4, py: 1.5, '&:hover': { color: '#ffffff' } }}
                        href={window.WEBLEVELUP_STATUS.upgradeUrl}
                        target="_blank"
                    >
                        Upgrade to WLU Pro
                    </Button>
                </Paper>
            </Box>
        );
    }

    // --- RENDER REAL PAGE (IF PRO) ---
    const filteredLogs = logs.filter(log => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (log.trigger_name || '').toLowerCase().includes(term) ||
            (log.action_name || '').toLowerCase().includes(term) ||
            String(log.order_id).includes(term);
    });

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon color="primary" /> Activity Logs
                </Typography>

                <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, justifyContent: 'flex-end' }}>
                    <Input
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        startAdornment={
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                            </InputAdornment>
                        }
                        sx={{ ...inputStyle, maxWidth: 250, bgcolor: 'background.paper', px: 1, borderRadius: 1 }}
                    />
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={refresh}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                </Stack>
            </Stack>

            <TableContainer component={Paper} variant="outlined" sx={{ border: 1, borderColor: 'divider', boxShadow: 'none' }}>
                <Table>
                    <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#fafafa' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>DATE & TIME</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>ORDER #</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>TRIGGER</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>ACTION PERFORMED</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredLogs.length > 0 ? (
                            filteredLogs.map((log) => (
                                <TableRow key={log.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            {new Date(log.created_at).toLocaleString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                            #{log.order_id}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={log.trigger_name}
                                            size="small"
                                            sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', fontWeight: 600 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={log.action_name.replace('_', ' ')}
                                            size="small"
                                            variant="outlined"
                                            sx={{ textTransform: 'capitalize', borderColor: 'divider' }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                                    <Box sx={{ color: 'text.secondary', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                        <HistoryIcon sx={{ fontSize: 40, opacity: 0.2 }} />
                                        <Typography variant="subtitle1" fontWeight={600}>No activity recorded yet.</Typography>
                                        <Typography variant="body2">When your automated rules fire, the exact actions will be logged here.</Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
