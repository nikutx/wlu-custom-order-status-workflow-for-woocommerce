import { useMemo, useState, useEffect } from "react";
import {
    Box, Divider, List, ListItemButton, ListItemText, Paper,
    Typography, IconButton, createTheme, ThemeProvider,
    CssBaseline, Stack, alpha
} from "@mui/material";

import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import BoltIcon from "@mui/icons-material/Bolt";
import CodeIcon from "@mui/icons-material/Code";

import OrderStatusesPage from "./pages/OrderStatuses/OrderStatuses.jsx";
import SettingsPage from "./pages/Settings/SettingsPage.jsx";
import UpgradePage from "./pages/Upgrade/UpgradePage.jsx";
import { WLUBus, WLU_EVENTS } from './utils/EventBus';
export default function App() {
    const isDev = import.meta.env.DEV;

    const [mode, setMode] = useState(() => localStorage.getItem("wlu_theme") || "light");

    const toggleTheme = () => {
        const newMode = mode === "light" ? "dark" : "light";
        setMode(newMode);
        localStorage.setItem("wlu_theme", newMode);
    };

    const theme = useMemo(() => createTheme({
        palette: {
            mode,
            primary: { main: "#7c4dff" },
            background: {
                default: mode === "light" ? "#f5f5f5" : "#121212",
                paper: mode === "light" ? "#ffffff" : "#1e1e1e",
            },
        },
        typography: {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            h6: { fontWeight: 700 },
        },
        components: { MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } } }
    }), [mode]);

    // Make sure proTabs doesn't trigger endless re-renders
    const proTabs = useMemo(() => window.WEBLEVELUP_STATUS?.proTabs || [], []);

    const menu = useMemo(() => {
        const baseMenu = [
            { key: "statuses", label: "Order Statuses" },
            ...proTabs,
            { key: "settings", label: "Settings" },
        ];

        if (proTabs.length === 0) {
            baseMenu.splice(1, 0, { key: "upgrade", label: "🌟 Get Pro" });
        }

        return baseMenu;
    }, [proTabs]);

    // --- BULLETPROOF HASH ROUTING ---
    const [active, setActive] = useState(() => {
        const hash = window.location.hash.replace(/^#\/?/, "");
        return hash || "statuses";
    });

    useEffect(() => {
        const validKeys = menu.map(m => m.key);

        const handleHashChange = () => {
            const hash = window.location.hash.replace(/^#\/?/, "");
            let newActiveTab = "statuses"; // Default fallback

            if (validKeys.includes(hash)) {
                newActiveTab = hash;
            }

            setActive(newActiveTab);

            // 🚨 THE SHOUT: Tell the Pro plugin the URL hash just changed!
            // We send the exact hash key (e.g., 'workflow') so the Pro plugin knows if it's visible.
            WLUBus.shout(WLU_EVENTS.TAB_CHANGED, { activeTab: newActiveTab });
        };

        window.addEventListener("hashchange", handleHashChange);

        // Run once on mount to ensure URL matches state
        handleHashChange();

        return () => window.removeEventListener("hashchange", handleHashChange);
    }, [menu]);



    const handleNavChange = (key) => {
        // 1. Update the React state immediately for a snappy UI
        setActive(key);

        // 2. Update the URL bar silently (this bypasses the strict linter!)
        window.history.pushState(null, "", `#/${key}`);

        // 3. 🚨 THE SHOUT: Tell the Pro plugin right away
        WLUBus.shout(WLU_EVENTS.TAB_CHANGED, { activeTab: key });
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />

            <Box sx={{
                display: "flex", height: "calc(100vh - 50px)",
                backgroundColor: "background.default", borderRadius: 2,
                overflow: "hidden", border: 1, borderColor: "divider", mt: 2, mr: 2
            }}>

                <Paper elevation={0} sx={{ width: 260, flexShrink: 0, borderRight: 1, borderColor: "divider", display: "flex", flexDirection: "column", borderRadius: 0, zIndex: 2 }}>

                    <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 36, height: 36, bgcolor: 'primary.main', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(124, 77, 255, 0.3)' }}>
                            <BoltIcon />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>WLU Workflow</Typography>
                            <Typography variant="caption" color="text.secondary">v0.1.0</Typography>
                        </Box>
                    </Box>
                    <Divider />

                    <List sx={{ flex: 1, px: 2, py: 2, overflowY: 'auto' }}>
                        {menu.map((item) => {
                            const isSelected = active === item.key;
                            return (
                                <ListItemButton
                                    key={item.key}
                                    selected={isSelected}
                                    onClick={() => handleNavChange(item.key)}
                                    sx={{
                                        borderRadius: 1, mb: 0.5,
                                        '&.Mui-selected': {
                                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                                            borderLeft: '4px solid',
                                            borderColor: 'primary.main',
                                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.12) }
                                        }
                                    }}
                                >
                                    <ListItemText
                                        primary={item.label}
                                        primaryTypographyProps={{ fontWeight: isSelected ? 700 : 500, fontSize: '0.9rem' }}
                                    />
                                </ListItemButton>
                            );
                        })}
                    </List>

                    {isDev && (
                        <Box sx={{ px: 2, pb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.2), borderRadius: 1, p: 1 }}>
                                <CodeIcon fontSize="small" />
                                <Typography variant="caption" fontWeight={800} sx={{ letterSpacing: 1 }}>DEV MODE</Typography>
                            </Box>
                        </Box>
                    )}
                    <Divider />

                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
                        <Typography variant="caption" color="text.secondary">Appearance</Typography>
                        <IconButton onClick={toggleTheme} size="small">
                            {mode === "light" ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
                        </IconButton>
                    </Stack>
                </Paper>

                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", position: 'relative', overflow: "hidden" }}>
                    <Box sx={{ p: 4, overflowY: "auto", height: "100%", scrollBehavior: 'smooth' }}>

                        {active === "statuses" && <OrderStatusesPage />}
                        {active === "settings" && <SettingsPage />}
                        {active === "upgrade" && <UpgradePage />}

                        {proTabs.map(tab => (
                            <Box key={tab.key} id={`wlu-pro-page-${tab.key}`} sx={{ display: active === tab.key ? 'block' : 'none' }}></Box>
                        ))}

                        <Box sx={{ height: 100 }} />
                    </Box>
                </Box>

            </Box>
        </ThemeProvider>
    );
}