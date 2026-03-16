import React, { useEffect, useState, useRef } from "react";
import {
    Box, Typography, Paper, Stack, Button, useTheme, alpha,
    Input, FormControl, FormLabel, CircularProgress, Chip,
    IconButton, Divider, Avatar, Tabs, Tab,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from "@mui/material";

// MUI Icons
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ForumIcon from "@mui/icons-material/Forum";
import LockIcon from "@mui/icons-material/Lock";

// Shared Input Style
const inputStyle = {
    fontSize: '0.875rem', color: 'text.primary',
    '& input, & textarea': { border: 'none !important', boxShadow: 'none !important', borderRadius: '0 !important', background: 'transparent !important', padding: '8px 0 !important', lineHeight: '1.5 !important', color: 'inherit' },
    '&:before': { borderBottom: '1px solid rgba(150, 150, 150, 0.42)' },
    '&:after': { borderBottom: '2px solid #7c4dff' }
};

export default function SupportPage() {
    const theme = useTheme();
    const isPro = window.WEBLEVELUP_STATUS?.isPro === true || window.WEBLEVELUP_STATUS?.isPro === "1";

    // --- SUPPORT STATES ---
    const [view, setView] = useState('list'); // 'list', 'create', 'single'
    const [tickets, setTickets] = useState([]);
    const [activeTicket, setActiveTicket] = useState(null);
    const [filterTab, setFilterTab] = useState('open'); // 'open', 'closed', 'all'

    // Modal State
    const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    const [newTicket, setNewTicket] = useState({ subject: '', message: '' });
    const [replyMessage, setReplyMessage] = useState('');
    const fileInputRef = useRef(null);
    const replyFileInputRef = useRef(null);

    // --- PAYWALL INTERCEPT ---
    if (!isPro) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10, textAlign: 'center' }}>
                <Paper elevation={0} sx={{ p: 6, maxWidth: 600, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.02), border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.1) }}>
                    <Box sx={{ width: 64, height: 64, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                        <LockIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>Premium Developer Support</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
                        Get direct access to the WLU development team right from your WordPress dashboard. Skip the forums and get priority assistance for your custom workflows.
                    </Typography>
                    <Button variant="contained" color="primary" size="large" sx={{ fontWeight: 700, px: 4, py: 1.5, '&:hover': { color: '#ffffff' } }} href={window.WEBLEVELUP_STATUS?.upgradeUrl} target="_blank">
                        Upgrade to WLU Pro
                    </Button>
                </Paper>
            </Box>
        );
    }

    // --- API HELPERS ---
    const getHeaders = () => ({ "X-WP-Nonce": window.WEBLEVELUP_STATUS?.nonce || "" });
    const getRestBase = () => window.WEBLEVELUP_STATUS?.restUrl || "/wp-json/weblevelup-status/v1/";

    // --- DATA FETCHING ---
    const fetchTickets = async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch(getRestBase() + "support/tickets", { headers: getHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to load tickets.");
            setTickets(data.items || []);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { if (isPro) fetchTickets(); }, [isPro]);

    // --- HANDLERS ---
    const handleOpenCreate = () => setView('create');

    const submitTicket = async (e) => {
        e.preventDefault();
        setActionLoading(true); setError(null);

        const formData = new FormData();
        formData.append('subject', newTicket.subject);
        formData.append('message', newTicket.message);
        if (fileInputRef.current?.files.length) {
            Array.from(fileInputRef.current.files).forEach(file => formData.append('screenshots[]', file));
        }
        formData.append('environment_data', JSON.stringify({ source: 'dashboard_form', browser: navigator.userAgent }));

        try {
            const res = await fetch(getRestBase() + "support/tickets", { method: "POST", headers: getHeaders(), body: formData });
            if (!res.ok) throw new Error((await res.json()).message || "Failed to submit ticket.");
            setNewTicket({ subject: '', message: '' });
            if (fileInputRef.current) fileInputRef.current.value = "";
            setFilterTab('open');
            await fetchTickets();
            setView('list');
        } catch (err) { setError(err.message); }
        finally { setActionLoading(false); }
    };

    const handleOpenTicket = async (id) => {
        setLoading(true); setView('single'); setError(null);
        try {
            const res = await fetch(getRestBase() + `support/tickets/${id}`, { headers: getHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to load ticket.");
            setActiveTicket(data.ticket);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    const submitReply = async (e) => {
        e.preventDefault();
        if (!replyMessage.trim()) return;
        setActionLoading(true);
        const formData = new FormData();
        formData.append('message', replyMessage);
        if (replyFileInputRef.current?.files.length) {
            Array.from(replyFileInputRef.current.files).forEach(file => formData.append('screenshots[]', file));
        }
        try {
            const res = await fetch(getRestBase() + `support/tickets/${activeTicket.id}/reply`, { method: "POST", headers: getHeaders(), body: formData });
            if (!res.ok) throw new Error((await res.json()).message || "Failed to send reply.");
            setReplyMessage('');
            if (replyFileInputRef.current) replyFileInputRef.current.value = "";
            await handleOpenTicket(activeTicket.id);
            fetchTickets();
        } catch (err) { setError(err.message); }
        finally { setActionLoading(false); }
    };

    // NEW BEAUTIFUL CLOSE TICKET LOGIC
    const confirmCloseTicket = async () => {
        setConfirmCloseOpen(false); // Close modal
        setActionLoading(true);
        try {
            const res = await fetch(getRestBase() + `support/tickets/${activeTicket.id}/close`, { method: "POST", headers: getHeaders() });
            if (!res.ok) throw new Error((await res.json()).message || "Failed to close ticket.");
            await handleOpenTicket(activeTicket.id);
            fetchTickets();
        } catch (err) { setError(err.message); }
        finally { setActionLoading(false); }
    };

    // --- FILTER LOGIC ---
    const openTickets = tickets.filter(t => !['closed', 'resolved'].includes((t.status || '').toLowerCase()));
    const closedTickets = tickets.filter(t => ['closed', 'resolved'].includes((t.status || '').toLowerCase()));
    const displayedTickets = filterTab === 'open' ? openTickets : filterTab === 'closed' ? closedTickets : tickets;

    // --- RENDER HELPERS ---
    const StatusBadge = ({ status }) => {
        const s = (status || 'open').toLowerCase().replace(/ /g, '_');
        let label = s;
        let color = 'default';
        let icon = <CheckCircleIcon fontSize="inherit" />;

        if (['open', 'new', 'needs_reply'].includes(s)) {
            label = 'Open'; color = 'info'; icon = <ErrorOutlineIcon fontSize="inherit" />;
        } else if (['pending', 'waiting', 'answered', 'waiting_on_customer'].includes(s)) {
            label = 'Answered'; color = 'success'; icon = <CheckCircleIcon fontSize="inherit" />;
        } else if (['resolved', 'closed'].includes(s)) {
            label = 'Closed'; color = 'default'; icon = <CheckCircleIcon fontSize="inherit" />;
        }

        return <Chip label={label} color={color} size="small" icon={icon} sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', height: 20 }} />;
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 900 }}>
            {/* HEADER */}
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                        {view !== 'list' && <IconButton size="small" onClick={() => { setView('list'); setActiveTicket(null); }}><ArrowBackIcon /></IconButton>}
                        <SupportAgentIcon color="primary" /> Premium Support
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: view !== 'list' ? 5 : 4 }}>
                        {view === 'list' ? 'Manage your support requests.' : view === 'create' ? 'Open a new request.' : `Ticket #${activeTicket?.id} — ${activeTicket?.subject}`}
                    </Typography>
                </Box>
                {view === 'list' && (
                    <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={handleOpenCreate} sx={{ fontWeight: 700, '&:hover': { color: '#ffffff' } }}>
                        New Ticket
                    </Button>
                )}
            </Stack>

            {/* Global Error Banner */}
            {error && <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main' }}>{error}</Paper>}

            {/* LOADING STATE */}
            {loading && view === 'list' ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}><CircularProgress /><Typography sx={{ mt: 2, color: 'text.secondary' }}>Loading tickets...</Typography></Box>
            ) : null}

            {/* VIEW 1: LIST TICKETS */}
            {!loading && view === 'list' && (
                <Box>
                    {/* FILTER TABS */}
                    {tickets.length > 0 && (
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                            <Tabs value={filterTab} onChange={(e, v) => setFilterTab(v)} textColor="primary" indicatorColor="primary">
                                <Tab label={`Open (${openTickets.length})`} value="open" sx={{ fontWeight: 700 }} />
                                <Tab label={`Closed (${closedTickets.length})`} value="closed" sx={{ fontWeight: 700 }} />
                                <Tab label={`All (${tickets.length})`} value="all" sx={{ fontWeight: 700 }} />
                            </Tabs>
                        </Box>
                    )}

                    {tickets.length === 0 ? (
                        <Paper variant="outlined" sx={{ p: 8, textAlign: 'center', borderRadius: 2 }}>
                            <SupportAgentIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
                            <Typography variant="h6" fontWeight={700}>How can we help you today?</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto', mb: 3 }}>
                                You don't have any support tickets yet. Create a new ticket to get in touch with our developers.
                            </Typography>
                            <Button variant="contained" onClick={handleOpenCreate} sx={{ fontWeight: 700, '&:hover': { color: '#ffffff' } }}>Open a Ticket</Button>
                        </Paper>
                    ) : displayedTickets.length === 0 ? (
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                            <Typography color="text.secondary">No {filterTab} tickets found.</Typography>
                        </Box>
                    ) : (
                        <Paper variant="outlined">
                            {displayedTickets.map((ticket, i) => (
                                <React.Fragment key={ticket.id}>
                                    <Box onClick={() => handleOpenTicket(ticket.id)} sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                                        <Box>
                                            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 0.5 }}>
                                                <Typography variant="subtitle2" fontWeight={700}>{ticket.subject}</Typography>
                                                <StatusBadge status={ticket.status} />
                                            </Stack>
                                            <Typography variant="body2" color="text.secondary">
                                                {ticket.product_name || 'General Inquiry'} • Updated {new Date(ticket.updated_at).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <ForumIcon color="action" />
                                    </Box>
                                    {i < displayedTickets.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </Paper>
                    )}
                </Box>
            )}

            {/* VIEW 2: CREATE TICKET */}
            {view === 'create' && (
                <Paper variant="outlined" sx={{ p: 4 }}>
                    <form onSubmit={submitTicket}>
                        <Stack spacing={3}>
                            <FormControl fullWidth>
                                <FormLabel sx={{ fontWeight: 700, mb: 1, fontSize: '0.8rem' }}>SUBJECT</FormLabel>
                                <Input placeholder="Briefly describe the issue..." value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} required sx={inputStyle} />
                            </FormControl>
                            <FormControl fullWidth>
                                <FormLabel sx={{ fontWeight: 700, mb: 1, fontSize: '0.8rem' }}>DETAILED DESCRIPTION</FormLabel>
                                <Input multiline minRows={4} placeholder="Please provide as much detail as possible..." value={newTicket.message} onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })} required sx={inputStyle} />
                            </FormControl>
                            <FormControl fullWidth>
                                <FormLabel sx={{ fontWeight: 700, mb: 1, fontSize: '0.8rem' }}>ATTACHMENTS (OPTIONAL)</FormLabel>
                                <input type="file" multiple accept="image/*" ref={fileInputRef} />
                            </FormControl>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                <Button type="submit" variant="contained" disabled={actionLoading} startIcon={actionLoading ? <CircularProgress size={20} /> : <SendIcon />} sx={{ '&:hover': { color: '#ffffff' } }}>
                                    Submit Ticket
                                </Button>
                            </Box>
                        </Stack>
                    </form>
                </Paper>
            )}

            {/* VIEW 3: SINGLE TICKET */}
            {view === 'single' && activeTicket && (
                <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: 600, overflow: 'hidden' }}>

                    {/* UPDATED HEADER: Now triggers the sleek MUI Modal */}
                    <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="subtitle2" fontWeight={800}>{activeTicket.product_name}</Typography>
                            <Typography variant="caption" color="text.secondary">Ticket #{activeTicket.id} created {new Date(activeTicket.created_at).toLocaleDateString()}</Typography>
                        </Box>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <StatusBadge status={activeTicket.status} />
                            {activeTicket.status !== 'closed' && activeTicket.status !== 'resolved' && (
                                <Button variant="outlined" color="success" size="small" onClick={() => setConfirmCloseOpen(true)} disabled={actionLoading} sx={{ fontWeight: 700 }}>
                                    {actionLoading ? <CircularProgress size={16} /> : "Mark as Resolved"}
                                </Button>
                            )}
                        </Stack>
                    </Box>

                    <Box sx={{ flex: 1, p: 3, overflowY: 'auto', bgcolor: 'background.default', display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box> : (
                            activeTicket.messages.map((msg, idx) => {
                                const isCustomer = msg.sender_type === 'customer';
                                return (
                                    <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: isCustomer ? 'flex-end' : 'flex-start' }}>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, px: 1 }}>
                                            {isCustomer ? 'You' : 'WLU Support'} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Typography>
                                        <Box sx={{ maxWidth: '80%', p: 2, borderRadius: 2, bgcolor: isCustomer ? 'primary.main' : 'background.paper', color: isCustomer ? 'white' : 'text.primary', border: isCustomer ? 'none' : '1px solid', borderColor: 'divider', borderTopRightRadius: isCustomer ? 0 : 8, borderTopLeftRadius: isCustomer ? 8 : 0 }}>
                                            <Typography variant="body2" dangerouslySetInnerHTML={{ __html: msg.message }} sx={{ '& p': { m: 0 } }} />
                                            {msg.attachments?.length > 0 && (
                                                <Stack direction="row" spacing={1} sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: isCustomer ? 'rgba(255,255,255,0.2)' : 'divider' }}>
                                                    {msg.attachments.map((url, i) => <a key={i} href={url} target="_blank" rel="noopener noreferrer"><Avatar variant="rounded" src={url} sx={{ width: 60, height: 60 }} /></a>)}
                                                </Stack>
                                            )}
                                        </Box>
                                    </Box>
                                );
                            })
                        )}
                    </Box>

                    {activeTicket.status !== 'closed' && activeTicket.status !== 'resolved' ? (
                        <Box component="form" onSubmit={submitReply} sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
                            <Stack direction="row" spacing={2} alignItems="flex-end">
                                <Box sx={{ flex: 1 }}>
                                    <Input multiline placeholder="Type your reply..." value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} sx={{ ...inputStyle, '& textarea': { minHeight: 40 } }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                        <IconButton component="label" size="small"><AttachFileIcon fontSize="small" /><input type="file" multiple hidden ref={replyFileInputRef} /></IconButton>
                                        <Typography variant="caption" color="text.secondary">Attach files</Typography>
                                    </Box>
                                </Box>
                                <Button type="submit" variant="contained" disabled={actionLoading || !replyMessage.trim()} sx={{ height: 40, '&:hover': { color: '#ffffff' } }}>
                                    {actionLoading ? <CircularProgress size={20} color="inherit" /> : "Reply"}
                                </Button>
                            </Stack>
                        </Box>
                    ) : (
                        <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover', borderTop: 1, borderColor: 'divider' }}><Typography variant="body2" color="text.secondary" fontWeight={600}>This ticket is closed.</Typography></Box>
                    )}
                </Paper>
            )}

            {/* BEAUTIFUL MUI CONFIRMATION MODAL */}
            <Dialog open={confirmCloseOpen} onClose={() => setConfirmCloseOpen(false)}>
                <DialogTitle sx={{ fontWeight: 800 }}>Resolve Ticket?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to mark this ticket as resolved? You won't be able to send any more replies once it is closed.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setConfirmCloseOpen(false)} color="inherit" sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button onClick={confirmCloseTicket} variant="contained" color="success" sx={{ fontWeight: 700, '&:hover': { color: '#ffffff' } }}>Mark as Resolved</Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}