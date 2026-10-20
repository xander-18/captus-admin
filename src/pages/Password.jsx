import React, { useState, useMemo, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Collapse,
  Chip,
  Stack,
  Menu,
  MenuItem,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Fab,
  Snackbar,
  Alert,
  Pagination,
  Paper,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Search,
  Plus,
  Copy,
  Eye,
  EyeOff,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit,
  History,
  X,
  Clock,
  Lock,
  Mail,
  ExternalLink
} from 'lucide-react';

// ───────────────────────── Theme ─────────────────────────
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2F6FE4' },
    secondary: { main: '#0D9488' },
    warning: { main: '#B45309' },
    error: { main: '#DC2626' },
    background: { default: '#F7F8FA', paper: '#FFFFFF' },
    text: { primary: '#111827', secondary: '#6B7280' }
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    h6: { fontWeight: 700 }
  }
});

const AVATAR_COLORS = ['#2F6FE4', '#0D9488', '#B45309', '#7C3AED', '#DB2777', '#0891B2', '#65A30D', '#DC2626'];
const colorForName = (name) => {
  const sum = [...(name || '?')].reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
};
const initialsForName = (name) =>
  (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

let idCounter = 1000;
const nextId = () => idCounter++;

// ───────────────────────── Seed data ─────────────────────────
const initialClients = [
  {
    id: nextId(),
    client: 'ACCESOS GENÉRICOS',
    accesses: [
      { id: nextId(), device: 'DVR DAHUA', user: 'admin', password: 'admin123', gmailPassword: '', ip: '', serial: '', url: '', lastUpdated: '16 May 2024', history: [] },
      { id: nextId(), device: 'DVR HIKVISION', user: 'admin', password: 'Hik102030', gmailPassword: '', ip: '', serial: '', url: '', lastUpdated: '16 May 2024', history: [] }
    ]
  },
  {
    id: nextId(),
    client: 'WILTON PRDO 3',
    accesses: [
      { id: nextId(), device: 'HIKCONNECT', user: 'wiltonmotors9@gmail.com', password: '1020304050@v', gmailPassword: '', ip: '', serial: '', url: '', lastUpdated: '16 May 2024', history: [] },
      { id: nextId(), device: 'DVR HIKVISION', user: 'admin', password: 'Hik12345', gmailPassword: '', ip: '', serial: '', url: '', lastUpdated: '16 May 2024', history: [] }
    ]
  },
  {
    id: nextId(),
    client: 'KING REAL SECURITY',
    accesses: [
      { id: nextId(), device: 'SERVIDOR', user: 'KR', password: 'KRCOM2024', gmailPassword: '', ip: '192.168.100.108', serial: '', url: '', lastUpdated: '16 May 2024', history: [] },
      { id: nextId(), device: 'PC 02', user: 'KRSCON01', password: 'conta012025e', gmailPassword: '', ip: '192.168.100.42', serial: '', url: '', lastUpdated: '16 May 2024', history: [] },
      { id: nextId(), device: 'HIKCONNECT - PRINCIPAL', user: 'cclausen@krsecuritysac.com', password: 'Krsec123', gmailPassword: '', ip: '', serial: '', url: '', lastUpdated: '16 May 2024', history: [] },
      { id: nextId(), device: 'HIKCONNECT - SECUNDARIO', user: 'jefedeoperacioneskrsecurity@gmail.com', password: '1020304050@Kr', gmailPassword: '', ip: '', serial: '', url: '', lastUpdated: '16 May 2024', history: [] },
      { id: nextId(), device: 'DVR HIKVISION', user: 'admin', password: 'Hik102030', gmailPassword: '', ip: '', serial: '', url: '', lastUpdated: '16 May 2024', history: [] },
      { id: nextId(), device: 'WIFI', user: 'KR SECURITY SAC', password: 'king1122', gmailPassword: '', ip: '', serial: '', url: '', lastUpdated: '16 May 2024', history: [] },
      { id: nextId(), device: 'HUELLERO HIKVISION', user: 'admin', password: 'Hik102030', gmailPassword: '', ip: '', serial: '', url: '', lastUpdated: '16 May 2024', history: [] },
      { id: nextId(), device: 'IVMS 4200', user: 'admin', password: 'Hik102030', gmailPassword: '', ip: '', serial: '', url: '', lastUpdated: '16 May 2024', history: [] }
    ]
  },
  {
    id: nextId(),
    client: 'SERGAS VILLA EL SALVADOR',
    accesses: [
      { id: nextId(), device: 'DVR HIKVISION', user: 'admin', password: 'Belmon159', gmailPassword: '', ip: '', serial: '', url: '', lastUpdated: '16 May 2024', history: [] }
    ]
  }
];

const emptyAccess = () => ({
  id: nextId(), device: '', user: '', password: '', gmailPassword: '', ip: '', serial: '', url: '', lastUpdated: '', history: []
});

// ───────────────────────── Inner app ─────────────────────────
function PasswordApp() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  const [clients, setClients] = useState(initialClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState(() => new Set());
  const [revealed, setRevealed] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const clientsPerPage = 8;

  // Overflow menu
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuAccess, setMenuAccess] = useState(null);
  const [menuClient, setMenuClient] = useState(null);

  // Add / edit dialog
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editClientId, setEditClientId] = useState(null);
  const [formClient, setFormClient] = useState('');
  const [formAccesses, setFormAccesses] = useState([]);

  // History dialog
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyAccess, setHistoryAccess] = useState(null);
  const [historyRevealed, setHistoryRevealed] = useState({});

  // ── search / pagination ──
  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return clients;
    return clients
      .map(c => {
        const clientMatches = c.client.toLowerCase().includes(term);
        if (clientMatches) return c;
        const matches = c.accesses.filter(
          a => a.device.toLowerCase().includes(term) || a.user.toLowerCase().includes(term)
        );
        return matches.length ? { ...c, accesses: matches } : null;
      })
      .filter(Boolean);
  }, [clients, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
    if (searchTerm.trim()) {
      setExpanded(new Set(filteredClients.map(c => c.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / clientsPerPage));
  const pagedClients = filteredClients.slice(
    (currentPage - 1) * clientsPerPage,
    currentPage * clientsPerPage
  );
  const totalAccesses = filteredClients.reduce((s, c) => s + c.accesses.length, 0);

  // ── helpers ──
  const toast = (message) => setSnackbar({ open: true, message });

  const copy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast(`${label} copiado`);
  };

  const toggleExpanded = (clientId) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(clientId) ? next.delete(clientId) : next.add(clientId);
      return next;
    });
  };

  const toggleReveal = (accessId) => setRevealed(prev => ({ ...prev, [accessId]: !prev[accessId] }));

  const openMenu = (event, client, access) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuClient(client);
    setMenuAccess(access);
  };
  const closeMenu = () => { setMenuAnchor(null); setMenuAccess(null); setMenuClient(null); };

  // ── CRUD ──
  const openNewClient = () => {
    setEditClientId(null); setFormClient(''); setFormAccesses([emptyAccess()]); setIsModalOpen(true);
  };
  const openEditClient = (clientEntry) => {
    setEditClientId(clientEntry.id);
    setFormClient(clientEntry.client);
    setFormAccesses(clientEntry.accesses.map(a => ({ ...a })));
    setIsModalOpen(true);
  };
  const openQuickAdd = (clientEntry) => {
    setEditClientId(clientEntry.id);
    setFormClient(clientEntry.client);
    setFormAccesses([...clientEntry.accesses.map(a => ({ ...a })), emptyAccess()]);
    setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); setEditClientId(null); setFormAccesses([]); };

  const updateFormAccess = (index, field, value) =>
    setFormAccesses(prev => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  const addFormAccessRow = () => setFormAccesses(prev => [...prev, emptyAccess()]);
  const removeFormAccessRow = (index) => setFormAccesses(prev => prev.filter((_, i) => i !== index));

  const isFormValid = formClient.trim() && formAccesses.length > 0 &&
    formAccesses.every(a => a.device.trim() && a.password.trim());

  const saveClient = () => {
    if (!isFormValid) return;
    const currentDate = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });

    if (editClientId) {
      setClients(prev => prev.map(c => {
        if (c.id !== editClientId) return c;
        const prevById = Object.fromEntries(c.accesses.map(a => [a.id, a]));
        const newAccesses = formAccesses.map(a => {
          const prevAccess = prevById[a.id];
          if (!prevAccess) return { ...a, lastUpdated: currentDate, history: [] };
          const changed = prevAccess.password !== a.password || prevAccess.gmailPassword !== a.gmailPassword;
          const history = changed
            ? [{ password: prevAccess.password, gmailPassword: prevAccess.gmailPassword, date: prevAccess.lastUpdated || currentDate }, ...(prevAccess.history || [])]
            : prevAccess.history || [];
          return { ...a, lastUpdated: changed ? currentDate : prevAccess.lastUpdated, history };
        });
        return { ...c, client: formClient.trim(), accesses: newAccesses };
      }));
    } else {
      const newId = nextId();
      setClients(prev => [
        { id: newId, client: formClient.trim(), accesses: formAccesses.map(a => ({ ...a, lastUpdated: currentDate, history: [] })) },
        ...prev
      ]);
      setExpanded(prev => new Set(prev).add(newId));
    }
    closeModal();
    toast('Cliente guardado');
  };

  const deleteClient = (clientId) => {
    if (!window.confirm('¿Borrar este cliente y todos sus accesos? Esta acción no se puede deshacer.')) return;
    setClients(prev => prev.filter(c => c.id !== clientId));
    toast('Cliente eliminado');
  };

  const deleteAccess = (clientId, accessId) => {
    if (!window.confirm('¿Eliminar este acceso?')) return;
    setClients(prev =>
      prev.map(c => (c.id === clientId ? { ...c, accesses: c.accesses.filter(a => a.id !== accessId) } : c))
        .filter(c => c.accesses.length > 0)
    );
    toast('Acceso eliminado');
  };

  const openHistory = (access) => { setHistoryAccess(access); setHistoryRevealed({}); setIsHistoryOpen(true); };

  // ───────────────────────── Render ─────────────────────────
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 10 }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'primary.main' }}>
        <Toolbar sx={{ gap: 1 }}>
          <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: '10px', p: 0.8, display: 'flex' }}>
            <Lock size={20} color="#fff" />
          </Box>
          <Typography variant="h6" sx={{ flexGrow: 1, color: '#fff', fontSize: '1.1rem' }}>
            Accesos
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
            {filteredClients.length} clientes · {totalAccesses} accesos
          </Typography>
        </Toolbar>
        <Box sx={{ px: 2, pb: 1.5 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar cliente, dispositivo o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              bgcolor: '#fff',
              borderRadius: 2,
              '& .MuiOutlinedInput-root': { borderRadius: 2 },
              '& fieldset': { border: 'none' }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color={muiTheme.palette.text.secondary} />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <X size={16} />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>
      </AppBar>

      {/* ── Lista agrupada por cliente ── */}
      <Box sx={{ maxWidth: 720, mx: 'auto', px: { xs: 0, sm: 2 }, pt: 1 }}>
        {pagedClients.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <Search size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
            <Typography>No se encontraron resultados.</Typography>
            <Typography variant="body2">Intenta con otra palabra o agrega un nuevo cliente.</Typography>
          </Box>
        )}

        {pagedClients.map((clientEntry) => {
          const isOpen = expanded.has(clientEntry.id);
          return (
            <Paper
              key={clientEntry.id}
              elevation={0}
              sx={{ mb: 1.25, border: '1px solid #E5E7EB', borderRadius: 2.5, overflow: 'hidden', bgcolor: 'background.paper' }}
            >
              <ListItemButton onClick={() => toggleExpanded(clientEntry.id)} sx={{ py: 1.4 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: colorForName(clientEntry.client), fontSize: '0.85rem', fontWeight: 700 }}>
                    {initialsForName(clientEntry.client)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={clientEntry.client}
                  secondary={`${clientEntry.accesses.length} ${clientEntry.accesses.length === 1 ? 'acceso' : 'accesos'}`}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }}
                  secondaryTypographyProps={{ fontSize: '0.8rem' }}
                />
                <IconButton size="small" onClick={(e) => { e.stopPropagation(); openQuickAdd(clientEntry); }} sx={{ mr: 0.5 }} title="Añadir equipo">
                  <Plus size={18} />
                </IconButton>
                {isOpen ? <ChevronDown size={20} color="#9CA3AF" /> : <ChevronRight size={20} color="#9CA3AF" />}
              </ListItemButton>

              <Collapse in={isOpen} timeout={150}>
                <Divider />
                <List disablePadding>
                  {clientEntry.accesses.map((access) => {
                    const isRevealed = !!revealed[access.id];
                    return (
                      <Box key={access.id} sx={{ px: 2, py: 1.25, borderBottom: '1px solid #F3F4F6', '&:last-of-type': { borderBottom: 'none' } }}>
                        <Stack direction="row" alignItems="flex-start" spacing={1}>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }} noWrap>
                              {access.device}
                            </Typography>
                            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25 }}>
                              <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 150 }}>
                                {access.user || 'Sin usuario'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">·</Typography>
                              <Typography
                                variant="body2"
                                sx={{ fontFamily: 'monospace', letterSpacing: 0.5, color: '#B45309', fontWeight: 600 }}
                              >
                                {isRevealed ? access.password : '••••••••'}
                              </Typography>
                            </Stack>
                            {(access.ip || access.serial || access.url) && (
                              <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mt: 0.6, rowGap: 0.5 }}>
                                {access.ip && <Chip size="small" variant="outlined" label={`IP ${access.ip}`} sx={{ fontSize: '0.7rem', height: 22 }} />}
                                {access.serial && <Chip size="small" variant="outlined" label={`S/N ${access.serial}`} sx={{ fontSize: '0.7rem', height: 22 }} />}
                                {access.url && (
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    icon={<ExternalLink size={12} />}
                                    label="Abrir enlace"
                                    clickable
                                    component="a"
                                    href={access.url.startsWith('http') ? access.url : `https://${access.url}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    sx={{ fontSize: '0.7rem', height: 22 }}
                                  />
                                )}
                              </Stack>
                            )}
                          </Box>
                          <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
                            <IconButton size="small" onClick={() => toggleReveal(access.id)} title="Ver/Ocultar contraseña">
                              {isRevealed ? <EyeOff size={17} /> : <Eye size={17} />}
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => copy(access.password, 'Contraseña')}
                              title="Copiar contraseña"
                              sx={{ color: 'primary.main' }}
                            >
                              <Copy size={17} />
                            </IconButton>
                            <IconButton size="small" onClick={(e) => openMenu(e, clientEntry, access)} title="Más opciones">
                              <MoreVertical size={17} />
                            </IconButton>
                          </Stack>
                        </Stack>
                      </Box>
                    );
                  })}
                </List>
              </Collapse>
            </Paper>
          );
        })}

        {totalPages > 1 && (
          <Stack alignItems="center" sx={{ mt: 2 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_, v) => setCurrentPage(v)}
              color="primary"
              size={isMobile ? 'small' : 'medium'}
            />
          </Stack>
        )}
      </Box>

      {/* ── FAB agregar cliente ── */}
      <Fab
        color="primary"
        onClick={openNewClient}
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        aria-label="Agregar cliente"
      >
        <Plus size={24} />
      </Fab>

      {/* ── Menú contextual por acceso ── */}
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
        {menuAccess?.user && (
          <MenuItem onClick={() => { copy(menuAccess.user, 'Usuario'); closeMenu(); }}>
            <Copy size={16} style={{ marginRight: 10 }} /> Copiar usuario
          </MenuItem>
        )}
        {menuAccess?.gmailPassword && (
          <MenuItem onClick={() => { copy(menuAccess.gmailPassword, 'Contraseña Gmail'); closeMenu(); }}>
            <Mail size={16} style={{ marginRight: 10 }} /> Copiar clave Gmail
          </MenuItem>
        )}
        <MenuItem onClick={() => { openHistory(menuAccess); closeMenu(); }}>
          <History size={16} style={{ marginRight: 10 }} /> Ver historial
        </MenuItem>
        <MenuItem onClick={() => { openEditClient(menuClient); closeMenu(); }}>
          <Edit size={16} style={{ marginRight: 10 }} /> Editar cliente
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => { deleteAccess(menuClient.id, menuAccess.id); closeMenu(); }}
          sx={{ color: 'error.main' }}
        >
          <Trash2 size={16} style={{ marginRight: 10 }} /> Eliminar acceso
        </MenuItem>
      </Menu>

      {/* ── Diálogo: crear/editar cliente ── */}
      <Dialog
        open={isModalOpen}
        onClose={closeModal}
        fullScreen={isMobile}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isMobile && (
            <IconButton edge="start" onClick={closeModal} sx={{ mr: 0.5 }}>
              <X size={20} />
            </IconButton>
          )}
          {editClientId ? 'Editar cliente' : 'Agregar nuevo cliente'}
          {!isMobile && (
            <IconButton onClick={closeModal} sx={{ ml: 'auto' }}>
              <X size={20} />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Nombre del cliente"
            placeholder="Ej. King Real Security"
            value={formClient}
            onChange={(e) => setFormClient(e.target.value)}
            sx={{ mb: 3 }}
            autoFocus
          />
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
            Dispositivos / accesos
          </Typography>
          <Stack spacing={2}>
            {formAccesses.map((access, index) => (
              <Paper key={access.id} variant="outlined" sx={{ p: 2, borderRadius: 2, position: 'relative', bgcolor: '#FAFAFA' }}>
                {formAccesses.length > 1 && (
                  <IconButton
                    size="small"
                    onClick={() => removeFormAccessRow(index)}
                    sx={{ position: 'absolute', top: 8, right: 8, bgcolor: '#FEE2E2', '&:hover': { bgcolor: '#FECACA' } }}
                  >
                    <X size={14} color="#DC2626" />
                  </IconButton>
                )}
                <Stack spacing={1.5}>
                  <TextField
                    fullWidth size="small" label="Dispositivo / acceso" placeholder="Ej. DVR Hikvision"
                    value={access.device} onChange={(e) => updateFormAccess(index, 'device', e.target.value)}
                  />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField
                      fullWidth size="small" label="Usuario / correo" placeholder="admin / correo@..."
                      value={access.user} onChange={(e) => updateFormAccess(index, 'user', e.target.value)}
                    />
                    <TextField
                      fullWidth size="small" label="Contraseña" placeholder="Contraseña"
                      value={access.password} onChange={(e) => updateFormAccess(index, 'password', e.target.value)}
                    />
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField
                      fullWidth size="small" label="Contraseña Gmail (opcional)" placeholder="Solo si aplica"
                      value={access.gmailPassword} onChange={(e) => updateFormAccess(index, 'gmailPassword', e.target.value)}
                    />
                    <TextField
                      fullWidth size="small" label="Enlace (opcional)" placeholder="www.pagina.com"
                      value={access.url} onChange={(e) => updateFormAccess(index, 'url', e.target.value)}
                    />
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <TextField
                      fullWidth size="small" label="IP (opcional)" placeholder="192.168.1.1"
                      value={access.ip} onChange={(e) => updateFormAccess(index, 'ip', e.target.value)}
                    />
                    <TextField
                      fullWidth size="small" label="Serial (opcional)" placeholder="N° de serie"
                      value={access.serial} onChange={(e) => updateFormAccess(index, 'serial', e.target.value)}
                    />
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
          <Button
            fullWidth
            onClick={addFormAccessRow}
            startIcon={<Plus size={18} />}
            sx={{ mt: 2, py: 1.3, border: '2px dashed #C7D2FE', borderRadius: 2 }}
          >
            Agregar otro dispositivo
          </Button>

          {editClientId && (
            <Button
              fullWidth
              onClick={() => { closeModal(); deleteClient(editClientId); }}
              startIcon={<Trash2 size={16} />}
              sx={{ mt: 3, color: 'error.main', bgcolor: '#FEE2E2', '&:hover': { bgcolor: '#FECACA' } }}
            >
              Eliminar cliente completo
            </Button>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeModal} color="inherit">Cancelar</Button>
          <Button variant="contained" onClick={saveClient} disabled={!isFormValid}>
            {editClientId ? 'Guardar cambios' : 'Guardar cliente'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Diálogo: historial ── */}
      <Dialog open={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <History size={20} /> Historial de cambios
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Contraseñas anteriores de <strong>{historyAccess?.device}</strong>
          </Typography>
          {historyAccess?.history?.length > 0 ? (
            <Stack spacing={1}>
              {historyAccess.history.map((h, index) => (
                <Stack
                  key={index}
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ border: '1px solid #E5E7EB', borderRadius: 2, p: 1.2 }}
                >
                  <Clock size={14} color="#9CA3AF" />
                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: 78 }}>
                    {h.date}
                  </Typography>
                  <Typography sx={{ fontFamily: 'monospace', flexGrow: 1 }}>
                    {historyRevealed[index] ? h.password : '••••••••'}
                  </Typography>
                  <IconButton size="small" onClick={() => setHistoryRevealed(p => ({ ...p, [index]: !p[index] }))}>
                    {historyRevealed[index] ? <EyeOff size={15} /> : <Eye size={15} />}
                  </IconButton>
                  <IconButton size="small" onClick={() => copy(h.password, 'Contraseña anterior')}>
                    <Copy size={15} />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary', border: '1px dashed #D1D5DB', borderRadius: 2 }}>
              <History size={28} style={{ opacity: 0.4, marginBottom: 6 }} />
              <Typography variant="body2">Aún no hay cambios registrados.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button fullWidth variant="outlined" onClick={() => setIsHistoryOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar de confirmación ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" sx={{ borderRadius: 5 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default function Password() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PasswordApp />
    </ThemeProvider>
  );
}