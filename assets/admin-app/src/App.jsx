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
} from "@mui/material";
import OrderStatusesPage from "./pages/OrderStatuses/OrderStatuses.jsx";

export default function App() {
    const cfg = window.WLU_OW;

    const menu = useMemo(
        () => [
            { key: "statuses", label: "Order Statuses" },
            { key: "workflow", label: "Workflow Rules" },
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
                    {menu.map((item) => (
                        <ListItemButton
                            key={item.key}
                            selected={active === item.key}
                            onClick={() => setActive(item.key)}
                        >
                            <ListItemText primary={item.label} />
                        </ListItemButton>
                    ))}
                </List>

                <Divider />

                <Box sx={{ padding: 1 }}>
                    <Button fullWidth variant="outlined" onClick={doPing}>
                        Ping REST
                    </Button>
                </Box>
            </Paper>

            {/* Main content */}
            <Paper sx={{ flex: 1, padding: 2 }}>
                {active === "statuses" && (
                    <>
                        <OrderStatusesPage />
                    </>
                )}

                {active === "workflow" && (
                    <>
                        <Typography variant="h5" sx={{ mb: 1 }}>
                            Workflow Rules
                        </Typography>
                        <Typography color="text.secondary">
                            Coming next: rule builder + transitions
                        </Typography>
                    </>
                )}

                {active === "settings" && (
                    <>
                        <Typography variant="h5" sx={{ mb: 1 }}>
                            Settings
                        </Typography>
                        <Typography color="text.secondary">
                            Coming next: toggles + defaults
                        </Typography>
                    </>
                )}

                {active === "debug" && (
                    <>
                        <Typography variant="h5" sx={{ mb: 1 }}>
                            Debug
                        </Typography>

                        <Typography sx={{ mb: 1 }} color="text.secondary">
                            REST response:
                        </Typography>

                        <Paper variant="outlined" sx={{ p: 1, fontFamily: "monospace" }}>
              <pre style={{ margin: 0 }}>
                {JSON.stringify(ping, null, 2)}
              </pre>
                        </Paper>

                        <Typography sx={{ mt: 2, mb: 1 }} color="text.secondary">
                            Config:
                        </Typography>

                        <Paper variant="outlined" sx={{ p: 1, fontFamily: "monospace" }}>
              <pre style={{ margin: 0 }}>
                {JSON.stringify(cfg, null, 2)}
              </pre>
                        </Paper>
                    </>
                )}
            </Paper>
        </Box>
    );
}
