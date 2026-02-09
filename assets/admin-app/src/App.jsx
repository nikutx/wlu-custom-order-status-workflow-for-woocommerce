import { useMemo, useState } from "react";
import {
    Box,
    Divider,
    List,
    ListItemButton,
    ListItemText,
    Paper,
    Typography,
    Tooltip,
    IconButton,
    createTheme,
    ThemeProvider,
    CssBaseline,
    Stack,
    alpha
} from "@mui/material";

// --- ICONS ---
import LockIcon from "@mui/icons-material/Lock";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import BoltIcon from "@mui/icons-material/Bolt";
import CodeIcon from "@mui/icons-material/Code";

// --- PAGES ---
import OrderStatusesPage from "./pages/OrderStatuses/OrderStatuses.jsx";
import WorkflowRulesPage from "./pages/WorkflowRules/WorkflowRules.jsx";
import SettingsPage from "./pages/Settings/SettingsPage.jsx";

export default function App() {
    // --- 1. DETECT DEV MODE ---
    const isDev = import.meta.env.DEV;

    // --- 2. THEME ENGINE ---
    const [mode, setMode] = useState(() => localStorage.getItem("wlu_theme") || "light");

    const toggleTheme = () => {
        const newMode = mode === "light" ? "dark" : "light";
        setMode(newMode);
        localStorage.setItem("wlu_theme", newMode);
    };

    const theme = useMemo(() => createTheme({
        palette: {
            mode,
            primary: {
                main: "#7c4dff",
            },
            background: {
                default: mode === "light" ? "#f5f5f5" : "#121212",
                paper: mode === "light" ? "#ffffff" : "#1e1e1e",
            },
        },
        typography: {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            h6: { fontWeight: 700 },
        },
        components: {
            MuiPaper: {
                styleOverrides: {
                    root: { backgroundImage: 'none' }
                }
            }
        }
    }), [mode]);

    // --- MENU CONFIG ---
    const menu = useMemo(() => [
        { key: "statuses", label: "Order Statuses" },
        { key: "workflow", label: "Workflow Rules" },
        { key: "logs", label: "Activity Logs", locked: true },
        { key: "settings", label: "Settings" },
    ], []);

    const [active, setActive] = useState("statuses");

    // --- RENDER ---
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />

            {/* MAIN LAYOUT CONTAINER
               - Fixed Height: Fits exactly in the WP Admin window
               - Overflow Hidden: Prevents the whole page from scrolling
            */}
            <Box sx={{
                display: "flex",
                height: "calc(100vh - 50px)", // <--- FIXED HEIGHT (Sidebar won't move)
                backgroundColor: "background.default",
                borderRadius: 2,
                overflow: "hidden", // <--- Clip overflow
                border: 1,
                borderColor: "divider",
                mt: 2,
                mr: 2
            }}>

                {/* --- SIDEBAR (Fixed) --- */}
                <Paper
                    elevation={0}
                    sx={{
                        width: 260,
                        flexShrink: 0,
                        borderRight: 1,
                        borderColor: "divider",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: 0,
                        zIndex: 2
                    }}
                >
                    {/* BRANDING AREA */}
                    <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                            width: 36, height: 36,
                            bgcolor: 'primary.main',
                            borderRadius: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(124, 77, 255, 0.3)'
                        }}>
                            <BoltIcon />
                        </Box>

                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                                WLU Workflow
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                v0.1.0
                            </Typography>
                        </Box>
                    </Box>

                    <Divider />

                    {/* NAVIGATION */}
                    <List sx={{ flex: 1, px: 2, py: 2, overflowY: 'auto' }}>
                        {menu.map((item) => {
                            const isLocked = item.locked;
                            const isSelected = active === item.key;

                            const button = (
                                <ListItemButton
                                    key={item.key}
                                    selected={isSelected}
                                    onClick={() => !isLocked && setActive(item.key)}
                                    sx={{
                                        borderRadius: 1,
                                        mb: 0.5,
                                        opacity: isLocked ? 0.6 : 1,
                                        cursor: isLocked ? 'default' : 'pointer',
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
                                        primaryTypographyProps={{
                                            fontWeight: isSelected ? 700 : 500,
                                            fontSize: '0.9rem'
                                        }}
                                    />
                                    {isLocked && <LockIcon fontSize="small" sx={{ color: 'text.disabled', fontSize: 16 }} />}
                                </ListItemButton>
                            );

                            return isLocked ? (
                                <Tooltip key={item.key} title="Available in Pro Version" placement="right">
                                    <Box>{button}</Box>
                                </Tooltip>
                            ) : button;
                        })}
                    </List>

                    {/* DEV MODE INDICATOR */}
                    {isDev && (
                        <Box sx={{ px: 2, pb: 2 }}>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1,
                                bgcolor: alpha(theme.palette.error.main, 0.1),
                                color: 'error.main',
                                border: '1px solid',
                                borderColor: alpha(theme.palette.error.main, 0.2),
                                borderRadius: 1,
                                p: 1
                            }}>
                                <CodeIcon fontSize="small" />
                                <Typography variant="caption" fontWeight={800} sx={{ letterSpacing: 1 }}>
                                    DEV MODE
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    <Divider />

                    {/* FOOTER */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                            Appearance
                        </Typography>
                        <IconButton onClick={toggleTheme} size="small">
                            {mode === "light" ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
                        </IconButton>
                    </Stack>
                </Paper>

                {/* --- CONTENT AREA (Scrolls independently) --- */}
                <Box sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    position: 'relative',
                    overflow: "hidden" // Clip children
                }}>
                    <Box sx={{
                        p: 4,
                        overflowY: "auto", // <--- THIS is the key: Only this box scrolls
                        height: "100%",
                        scrollBehavior: 'smooth'
                    }}>
                        {active === "statuses" && <OrderStatusesPage />}
                        {active === "workflow" && <WorkflowRulesPage />}
                        {active === "settings" && <SettingsPage />}

                        {/* Extra padding at bottom for comfortable scrolling */}
                        <Box sx={{ height: 100 }} />
                    </Box>
                </Box>

            </Box>
        </ThemeProvider>
    );
}