import { useMemo, useState } from "react";
import {
    Box,
    Button,
    Divider,
    List,
    ListItemButton,
    ListItemText,
    Paper,
    Typography,
    Tooltip
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock"; // <--- Import Lock Icon

// --- PAGES ---
import OrderStatusesPage from "./pages/OrderStatuses/OrderStatuses.jsx";
import WorkflowRulesPage from "./pages/WorkflowRules/WorkflowRules.jsx";
import SettingsPage from "./pages/Settings/SettingsPage.jsx";

export default function App() {
    const cfg = window.WLU_OW;

    // Defined the menu with a new "Locked" item
    const menu = useMemo(
        () => [
            { key: "statuses", label: "Order Statuses" },
            { key: "workflow", label: "Workflow Rules" },
            { key: "logs", label: "Activity Logs", locked: true }, // <--- The Ghost Tab
            { key: "settings", label: "Settings" },
            { key: "debug", label: "Debug" },
        ],
        []
    );

    const [active, setActive] = useState("statuses");
    const [ping, setPing] = useState(null);

    async function doPing() {
        const res = await fetch(cfg.restUrl + "ping", {
            headers: {
                "X-WP-Nonce": cfg.nonce,
            },
            credentials: "same-origin",
        });
        const json = await res.json();
        setPing(json);
    }

    return (
        <Box sx={{ display: "flex", gap: 2, padding: 2 }}>
            {/* Left menu */}
            <Paper sx={{ width: 260, padding: 1 }}>
                <Typography sx={{ fontWeight: 700, padding: 1 }}>
                    WLU Order Workflow
                </Typography>

                <Divider />

                <List>
                    {menu.map((item) => {
                        // Logic for the Locked Tab
                        const isLocked = item.locked;

                        const button = (
                            <ListItemButton
                                key={item.key}
                                selected={active === item.key}
                                onClick={() => !isLocked && setActive(item.key)} // Prevent click if locked
                                sx={isLocked ? { opacity: 0.6, cursor: 'default' } : {}}
                            >
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        fontWeight: active === item.key ? 700 : 400
                                    }}
                                />
                                {isLocked && <LockIcon fontSize="small" sx={{ color: 'text.disabled' }} />}
                            </ListItemButton>
                        );

                        // Wrap locked items in a Tooltip
                        if (isLocked) {
                            return (
                                <Tooltip key={item.key} title="Upgrade to Pro to view logs" placement="right">
                                    <Box>{button}</Box>
                                </Tooltip>
                            );
                        }

                        return button;
                    })}
                </List>

                <Divider />

                <Box sx={{ padding: 1 }}>
                    <Button fullWidth variant="outlined" onClick={doPing} size="small" sx={{ color: 'text.secondary', borderColor: 'rgba(0,0,0,0.12)' }}>
                        Test Connection
                    </Button>
                </Box>
            </Paper>

            {/* Main content */}
            <Paper sx={{ flex: 1, padding: 2, minHeight: 500 }}>

                {active === "statuses" && <OrderStatusesPage />}

                {active === "workflow" && <WorkflowRulesPage />}

                {active === "settings" && <SettingsPage />}

                {active === "debug" && (
                    <>
                        <Typography variant="h5" sx={{ mb: 1 }}>Debug</Typography>
                        <Paper variant="outlined" sx={{ p: 1, fontFamily: "monospace", mb: 2 }}>
                            <pre style={{ margin: 0 }}>{JSON.stringify(ping, null, 2)}</pre>
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 1, fontFamily: "monospace" }}>
                            <pre style={{ margin: 0 }}>{JSON.stringify(cfg, null, 2)}</pre>
                        </Paper>
                    </>
                )}
            </Paper>
        </Box>
    );
}