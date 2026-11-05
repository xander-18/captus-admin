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
  Lock
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

const uid = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// ───────────────────────── Datos ─────────────────────────
// a(dispositivo, usuario/correo, contraseña, { gp: clave Gmail, gmail: correo Gmail, ip, sn: serial, note })
const a = (device, user, password, o = {}) => ({
  device, user, password,
  gmail: o.gmail || '',
  gmailPassword: o.gp || '',
  ip: o.ip || '',
  serial: o.sn || '',
  note: o.note || ''
});

const DATA = [
  ['ACCESOS GENÉRICOS', [
    a('DVR DAHUA', 'admin', 'admin123'),
    a('DVR HIKVISION', 'admin', 'Hik102030')
  ]],
  ['WILTON PRDO 3', [
    a('HIKCONNECT', 'wiltonmotors9@gmail.com', '1020304050@v'),
    a('DVR HIKVISION', 'admin', 'Hik12345')
  ]],
  ['KING REAL SECURITY', [
    a('SERVIDOR', 'KR', 'KRCOM2024', { ip: '192.168.100.108' }),
    a('CENTRO DE CONTROL', 'CENTRO', 'ccontrol1823', { ip: '192.168.100.141', note: 'CARPETA OPERACIONES - OFICINA OPERACIONES' }),
    a('PC 02', 'KRSCON01', 'conta012025e', { ip: '192.168.100.42' }),
    a('HIKCONNECT - PRINCIPAL', 'cclausen@krsecuritysac.com', 'Krsec123'),
    a('HIKCONNECT - SECUNDARIO', 'jefedeoperacioneskrsecurity@gmail.com', '1020304050@Kr'),
    a('DVR HIKVISION', 'admin', 'Hik102030'),
    a('WIFI', 'KR SECURITY SAC', 'king1122'),
    a('HUELLERO HIKVISION', 'admin', 'Hik102030'),
    a('IVMS 4200', 'admin', 'Hik102030')
  ]],
  ['SERGAS VILLA EL SALVADOR', [a('DVR HIKVISION', 'admin', 'Belmon159')]],
  ['SERGAS AMAUTA', [a('DVR HIKVISION', 'admin', 'Hik12345')]],
  ['SERGAS CHINCHA', [a('HIKCONNECT - USUARIO SECUNDARIO', 'sergaschincha2026@gmail.com', '1020304050@v')]],
  ['SERGAS GENERAL', [a('HIKCONNECT', '932500787', 'BELMON159@')]],
  ['SERGAS CINEGUILLA', [
    a('DVR 8CH', 'admin', 'BELMON159', { ip: '192.168.101.36' }),
    a('DVR 4CH', 'admin', 'Hik102030', { ip: '192.168.101.34' })
  ]],
  ['ERLINDA NORABUENA', [a('APP ICSEE', 'seguridaddiciembre3@gmail.com', 'Admin@123')]],
  ['JUAN CUBA', [a('APP SMART LIFE', 'juan.cuba.t10@gmail.com', '1020304050@v')]],
  ['ALARMAS VALDIVIESO', [a('APP SMART LIFE', 'champiluisfelipe@gmail.com', '1020304050@v')]],
  ['ASOC. EL BOSQUE', [
    a('GMAIL', 'elbosquepachacamac@gmail.com', '1020304050@v'),
    a('DMSS DAHUA/APP SMART LIFE', 'elbosquepachacamac@gmail.com', 'elbosquepachacamac@102030', { gp: 'elbosquepachacamac@102030' })
  ]],
  ['FUERZA POLICIAL ATE', [a('APP SMART LIFE', 'vecinosfuerzapolicial@gmail.com', '1020304050@v')]],
  ['MILAGROS VALDIVIA', [a('APP SMART LIFE', 'mgcamayo20.22@gmail.com', 'Mariafeypaz04')]],
  ['PARQUE CACERES SJM', [
    a('DVR HIKVISION', 'admin', 'Hik102030@'),
    a('HIKCONNECT - PRINCIPAL', 'pqllamitas@gmail.com', '1020304050@v'),
    a('HIKCONNECT - SECUNDARIO', 'parquelallamita@gmail.com', '1020304050@v')
  ]],
  ['PARQUE PERÚ', [
    a('HIKCONNECT - PRINCIPAL', 'parqueperu01@gmail.com', '102030@vperu', { gp: '1020304050@v' }),
    a('HIKCONNECT - SECUNDARIO', 'parqueperu02@gmail.com', '102030@vperu', { gp: '1020304050@v' })
  ]],
  ['LEYLI CORAZON', [
    a('DMSS DAHUA', 'leylicorazon13@gmail.com', '1020304050@Vv'),
    a('DVR DAHUA - CENTRO', 'admin', 'admin123', { sn: '7H02939PAZ6D270' }),
    a('DVR DAHUA - CALLAO', 'admin', 'admin123', { sn: '8E0820CPAZCE61D' }),
    a('DVR DAHUA - ALMACEN', 'admin', 'admin123', { sn: '7A09753PAZ48EBD' })
  ]],
  ['VICTOR MARTIN CASTRO', [a('DVR HIKVISION', 'admin', 'Hik102030')]],
  ['URB. SANTA MARIA - CARABAYLLO', [a('SMART PLUG EZVIZ', 'santamarialarma@gmail.com', '1020304050@v')]],
  ['SRA. GINA - CALLE PISAGUA', [a('APP NEXXT', 'callepisagua@gmail.com', '1020304050v')]],
  ['SRA. GINA - GORRIONCITO', [a('DVR DAHUA', 'admin', 'admin123')]],
  ['SRA. GENESIS ALVARADO', [a('DVR HIKVISION', 'admin', 'Hik102030')]],
  ['LOS PINOS SANTA ANITA', [
    a('DVR HIKVISION', 'admin', 'Hik102030'),
    a('CAMARA IP', 'admin', 'Hik102030'),
    a('HIKCONNECT - PRINCIPAL', 'lospinosparque02@gmail.com', '1020304050@v'),
    a('HIKCONNECT - SECUNDARIO 1', 'lospinosparque03@gmail.com', '102030@c%'),
    a('HIKCONNECT - SECUNDARIO 2', 'lospinosparque04@gmail.com', '102030@ca%'),
    a('HIKCONNECT - SECUNDARIO 3', 'lospinosparque05@gmail.com', '102030@cap%'),
    a('APP SMART LIFE', 'lospinosparque02@gmail.com', '1020304050@v')
  ]],
  ['ROSA CHOY - SANTA ANITA', [a('DVR HIKVISION', 'admin', 'Hik102030')]],
  ['ROSA CHOY - MERCADO', [a('DVR HIKVISION', 'admin', 'admin123')]],
  ['UNIDAD VILLA - LAS TORRES', [
    a('DVR DAHUA', 'admin', 'ocho8888'),
    a('DMSS - PRINCIPAL', 'villatransportes227@gmail.com', '1020304050@v'),
    a('DMSS - SECUNDARIO', 'lastorresunidaddevilla@gmail.com', '1020304050@v'),
    a('DMSS - SECUNDARIO', 'nicolasaunidadvilla@gmail.com', '1020304050@v')
  ]],
  ['UNIDAD VILLA - MIYASHIRO', [a('DMSS DAHUA', 'miyashirounidadvilla@gmail.com', '1020304050@v')]],
  ['EDUARDO VENEGAS', [a('DVR HIKVISION', 'admin', 'Hik102030')]],
  ['BOMBONAZO ANGAMOS/AVIACIÓN', [
    a('DVR HIKVISION', 'admin', 'admin123'),
    a('HIKCONNECT', 'Ingresado por Cliente', 'Ingresado por Cliente')
  ]],
  ['RECYCLEAN - SR. PERCY', [
    a('DVR HIKVISION', 'admin', 'Hik102030'),
    a('HIKCONNECT', 'eurociclax@gmail.com', 'p3rc1r0ja5*')
  ]],
  ['CREPIER - VILLA EL SALVADOR', [
    a('NVR HIKVISION', 'admin', 'Crepier2025'),
    a('HIKCONNECT', 'angel.contreras@crepier.com', 'Pierina1145')
  ]],
  ['JESUS TRUCIOS - LOS OLIVOS', [a('DVR HIKVISION', 'admin', '159457.jesus')]],
  ['WILLY AVILA - LURIN', [
    a('DVR DAHUA', 'admin', 'admin123'),
    a('ROUTER HIKVISION', 'HIKVISION_1208', '1020304050@v')
  ]],
  ['ORG VEC SANTA ROSA - VMT', [
    a('RF3 SMART 1', 'PRINCIPAL', '1234'),
    a('RF3 SMART 2', 'CALLE LAS AMERICAS', '1111')
  ]],
  ['JESUS JOEL - VES', [
    a('DVR DAHUA TIENDA', 'admin', 'Admin102030'),
    a('DVR DAHUA TALLER', 'admin', 'Admin102030'),
    a('DMSS', 'PRIVADO', 'PRIVADO', { note: 'LO GESTIONO EL USUARIO' })
  ]],
  ['VALDERA - SJM', [a('ICSEE', 'valderapingo78@gmail.com', '1020304050@Vv')]],
  ['SRA. HERRERA - CHORRILLOS', [a('DVR HIKVISION', 'admin', 'Hik102030')]],
  ['CORPORACION JOTA - PARURO', [a('MESH HIKVISION', 'ALAMACEN-JOTA', 'Jota17@@')]],
  ['LOS PORTALES DE JAVIER PRADO - ATE', [a('APP SHOCTIX RF3 SMART', 'javierpradoportales@gmail.com', 'PORTALES1')]],
  ['SRA MELINA', [a('REPETIDORES', 'ALEXA, SALVADOR, SALA', '1020304050@')]],
  ['MIGUEL HENDRICH - VES', [a('DVR HIKVISION', 'admin', 'Hik102030')]],
  ['LA CASA DEL POLLO', [a('HIKCONNECT', 'luismary.barreto30@gmail.com', 'LacasadelPollo90')]],
  ['FERRETERIA CRUZ DE MOTUPE', [
    a('DVR HIKVISION', 'admin', 'Hik102030'),
    a('HIKCONNECT', 'ferreteriacruzdemotupe0@gmail.com', '1020304050@v', { gp: '1020304050@v' })
  ]],
  ['BELEN - SURCO', [a('ROUTER HIKVISION', 'INTERNET', 'yybt5526')]],
  ['CALLE SUECIA - PROF. MANUEL', [
    a('SMART DMS', 'admin', 'Hik12345', { sn: '7D0C9EDPAZ0D1B1' }),
    a('SMART DMS', 'admin', 'admin123', { gp: '1020304050@v', sn: '8E0820CPAZFDC1E' })
  ]],
  ['CALLE PISAGUA', [
    a('SMART DMS', 'admin', 'Hik12345', { gp: '1020304050@v', gmail: 'callepisagua@gmail.com' }),
    a('CORREO', 'fabian1112070@gmail.com', 'v14059128@')
  ]],
  ['AGUILERA - CALLE ITALIA', [
    a('GMAIL', 'italiaaguilera4@gmail.com', '1020304050@'),
    a('SMART LIFE', 'italiaaguilera4@gmail.com', '1020304050@v')
  ]],
  ['MILAGRO CUENTA MICROSOFT', [a('CORREO', 'butilerjonathan@hotmail.com', '1020304050@vV')]],
  ['PARQUE ELOISA ANGULO', [a('CORREO', 'parqueeloisaangulo@gmail.com', '1020304050@v')]],
  ['JONATHAN SMP GYM', [a('DVR HIKVISION', 'admin', 'Hik102030')]],
  ['URSULA - SURQUILLO CM', [a('DVR HIKVISION', 'admin', 'Hik102030')]],
  ['CALLE 2 DE MAYO VMT NUEVA ESPERANZA', [a('SHOCTIX', 'calle02demayo@gmail.com', '1784', { gp: '1020304050@v' })]]
];

const initialClients = DATA.map(([client, items], ci) => ({
  id: `seed-${ci}`,
  client,
  accesses: items.map((it, ri) => ({
    id: `seed-${ci}-${ri}`,
    ...it,
    lastUpdated: '',
    history: []
  }))
}));

const emptyAccess = () => ({
  id: uid(), device: '', user: '', password: '', gmail: '', gmailPassword: '', ip: '', serial: '', note: '', lastUpdated: '', history: []
});

const STORAGE_KEY = 'accesos-v3';
const loadClients = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) { /* sin almacenamiento: se usan los datos iniciales */ }
  return initialClients;
};

// ───────────────────────── Copiar ─────────────────────────
async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) { /* se intenta el método alternativo */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    return false;
  }
}

// ───────────────────────── Línea con su botón de copiar ─────────────────────────
// Copia SOLO el valor de esta línea.
function CopyLine({ label, value, secret, onCopy, color }) {
  const [show, setShow] = useState(false);
  if (!value) return null;
  const hidden = secret && !show;

  return (
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minHeight: 32 }}>
      <Typography variant="caption" color="text.secondary" sx={{ width: 72, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography
        sx={{
          flexGrow: 1,
          minWidth: 0,
          fontFamily: 'monospace',
          fontSize: '0.88rem',
          fontWeight: 600,
          color: color || 'text.primary',
          wordBreak: 'break-all'
        }}
      >
        {hidden ? '••••••••' : value}
      </Typography>
      {secret && (
        <IconButton size="small" onClick={() => setShow(s => !s)} title="Ver/Ocultar">
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </IconButton>
      )}
      <IconButton
        size="small"
        onClick={() => onCopy(value, label)}
        title={`Copiar ${label.toLowerCase()}`}
        sx={{ color: 'primary.main' }}
      >
        <Copy size={17} />
      </IconButton>
    </Stack>
  );
}

// ───────────────────────── App ─────────────────────────
function PasswordApp() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  const [clients, setClients] = useState(loadClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState(() => new Set());
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [currentPage, setCurrentPage] = useState(1);
  const clientsPerPage = 8;

  // Menú
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuAccess, setMenuAccess] = useState(null);
  const [menuClient, setMenuClient] = useState(null);

  // Agregar / editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editClientId, setEditClientId] = useState(null);
  const [formClient, setFormClient] = useState('');
  const [formAccesses, setFormAccesses] = useState([]);

  // Historial
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyAccess, setHistoryAccess] = useState(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(clients)); } catch (e) { /* ignorar */ }
  }, [clients]);

  // ── búsqueda / paginación ──
  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return clients;
    return clients
      .map(c => {
        if (c.client.toLowerCase().includes(term)) return c;
        const matches = c.accesses.filter(x =>
          [x.device, x.user, x.gmail, x.ip, x.serial, x.note].some(v => (v || '').toLowerCase().includes(term))
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
  const toast = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const copy = async (text, label) => {
    if (!text) return;
    const ok = await copyText(text);
    toast(ok ? `${label} copiado` : `No se pudo copiar ${label.toLowerCase()}`, ok ? 'success' : 'error');
  };

  const toggleExpanded = (clientId) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(clientId) ? next.delete(clientId) : next.add(clientId);
      return next;
    });
  };

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
    // Se busca el cliente completo (la vista filtrada puede mostrar solo parte de sus accesos)
    const full = clients.find(c => c.id === clientEntry.id) || clientEntry;
    setEditClientId(full.id);
    setFormClient(full.client);
    setFormAccesses(full.accesses.map(x => ({ ...x })));
    setIsModalOpen(true);
  };
  const openQuickAdd = (clientEntry) => {
    const full = clients.find(c => c.id === clientEntry.id) || clientEntry;
    setEditClientId(full.id);
    setFormClient(full.client);
    setFormAccesses([...full.accesses.map(x => ({ ...x })), emptyAccess()]);
    setIsModalOpen(true);
  };
  const closeModal = () => { setIsModalOpen(false); setEditClientId(null); setFormAccesses([]); };

  const updateFormAccess = (index, field, value) =>
    setFormAccesses(prev => prev.map((x, i) => (i === index ? { ...x, [field]: value } : x)));
  const addFormAccessRow = () => setFormAccesses(prev => [...prev, emptyAccess()]);
  const removeFormAccessRow = (index) => setFormAccesses(prev => prev.filter((_, i) => i !== index));

  const isFormValid = formClient.trim() && formAccesses.length > 0 &&
    formAccesses.every(x => x.device.trim());

  const clean = (x) => ({
    ...x,
    device: x.device.trim(),
    user: (x.user || '').trim(),
    password: (x.password || '').trim(),
    gmail: (x.gmail || '').trim(),
    gmailPassword: (x.gmailPassword || '').trim(),
    ip: (x.ip || '').trim(),
    serial: (x.serial || '').trim(),
    note: (x.note || '').trim()
  });

  const saveClient = () => {
    if (!isFormValid) return;
    const currentDate = new Date().toLocaleString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    if (editClientId) {
      setClients(prev => prev.map(c => {
        if (c.id !== editClientId) return c;
        const prevById = Object.fromEntries(c.accesses.map(x => [x.id, x]));
        const newAccesses = formAccesses.map(raw => {
          const x = clean(raw);
          const old = prevById[x.id];
          if (!old) return { ...x, lastUpdated: currentDate, history: [] };
          const changed = old.password !== x.password || (old.gmailPassword || '') !== x.gmailPassword;
          const history = changed
            ? [{ password: old.password || '', gmailPassword: old.gmailPassword || '', date: currentDate }, ...(old.history || [])]
            : old.history || [];
          return { ...x, lastUpdated: changed ? currentDate : old.lastUpdated, history };
        });
        return { ...c, client: formClient.trim(), accesses: newAccesses };
      }));
    } else {
      const newId = uid();
      setClients(prev => [
        { id: newId, client: formClient.trim(), accesses: formAccesses.map(raw => ({ ...clean(raw), lastUpdated: currentDate, history: [] })) },
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
      prev.map(c => (c.id === clientId ? { ...c, accesses: c.accesses.filter(x => x.id !== accessId) } : c))
        .filter(c => c.accesses.length > 0)
    );
    toast('Acceso eliminado');
  };

  const openHistory = (access) => { setHistoryAccess(access); setIsHistoryOpen(true); };

  // El historial se lee siempre del dato actual
  const liveHistoryAccess = useMemo(() => {
    if (!historyAccess) return null;
    for (const c of clients) {
      const f = c.accesses.find(x => x.id === historyAccess.id);
      if (f) return f;
    }
    return historyAccess;
  }, [clients, historyAccess]);

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
            placeholder="Buscar cliente, dispositivo, usuario, IP o serial..."
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

              <Collapse in={isOpen} timeout={150} unmountOnExit>
                <Divider />
                <List disablePadding>
                  {clientEntry.accesses.map((access) => (
                    <Box key={access.id} sx={{ px: 2, py: 1.25, borderBottom: '1px solid #F3F4F6', '&:last-of-type': { borderBottom: 'none' } }}>
                      <Stack direction="row" alignItems="center">
                        <Typography sx={{ flexGrow: 1, fontWeight: 700, fontSize: '0.9rem' }} noWrap>
                          {access.device}
                        </Typography>
                        <IconButton size="small" onClick={(e) => openMenu(e, clientEntry, access)} title="Más opciones">
                          <MoreVertical size={17} />
                        </IconButton>
                      </Stack>

                      <CopyLine
                        label={(access.user || '').includes('@') ? 'Correo' : 'Usuario'}
                        value={access.user}
                        onCopy={copy}
                      />
                      <CopyLine label="Contraseña" value={access.password} secret onCopy={copy} color="#B45309" />
                      <CopyLine label="Gmail" value={access.gmail} onCopy={copy} />
                      <CopyLine label="Clave Gmail" value={access.gmailPassword} secret onCopy={copy} color="#B45309" />

                      {(access.ip || access.serial || access.note) && (
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mt: 0.6, rowGap: 0.5 }}>
                          {access.ip && (
                            <Chip
                              size="small" variant="outlined" clickable
                              label={`IP ${access.ip}`}
                              onClick={() => copy(access.ip, 'IP')}
                              sx={{ fontSize: '0.75rem', height: 24 }}
                            />
                          )}
                          {access.serial && (
                            <Chip
                              size="small" variant="outlined" clickable
                              label={`S/N ${access.serial}`}
                              onClick={() => copy(access.serial, 'Serial')}
                              sx={{ fontSize: '0.75rem', height: 24 }}
                            />
                          )}
                          {access.note && (
                            <Chip
                              size="small" variant="outlined"
                              label={access.note}
                              sx={{ fontSize: '0.75rem', height: 24, maxWidth: '100%' }}
                            />
                          )}
                        </Stack>
                      )}
                    </Box>
                  ))}
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

      {/* ── Agregar cliente ── */}
      <Fab
        color="primary"
        onClick={openNewClient}
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        aria-label="Agregar cliente"
      >
        <Plus size={24} />
      </Fab>

      {/* ── Menú por acceso ── */}
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
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

      {/* ── Crear / editar cliente ── */}
      <Dialog open={isModalOpen} onClose={closeModal} fullScreen={isMobile} fullWidth maxWidth="sm">
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
                      fullWidth size="small" label="Correo Gmail (opcional)" placeholder="Solo si aplica"
                      value={access.gmail} onChange={(e) => updateFormAccess(index, 'gmail', e.target.value)}
                    />
                    <TextField
                      fullWidth size="small" label="Clave Gmail (opcional)" placeholder="Solo si aplica"
                      value={access.gmailPassword} onChange={(e) => updateFormAccess(index, 'gmailPassword', e.target.value)}
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
                  <TextField
                    fullWidth size="small" label="Nota (opcional)"
                    value={access.note} onChange={(e) => updateFormAccess(index, 'note', e.target.value)}
                  />
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
              onClick={() => { const id = editClientId; closeModal(); deleteClient(id); }}
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

      {/* ── Historial ── */}
      <Dialog open={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <History size={20} /> Historial de cambios
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Contraseñas anteriores de <strong>{liveHistoryAccess?.device}</strong>
          </Typography>
          {liveHistoryAccess?.history?.length > 0 ? (
            <Stack spacing={1}>
              {liveHistoryAccess.history.map((h, index) => (
                <Box key={index} sx={{ border: '1px solid #E5E7EB', borderRadius: 2, p: 1.2 }}>
                  <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.25 }}>
                    <Clock size={14} color="#9CA3AF" />
                    <Typography variant="caption" color="text.secondary">{h.date}</Typography>
                  </Stack>
                  <CopyLine label="Contraseña" value={h.password} secret onCopy={copy} />
                  <CopyLine label="Clave Gmail" value={h.gmailPassword} secret onCopy={copy} />
                  {!h.password && !h.gmailPassword && (
                    <Typography variant="body2" color="text.secondary">(vacía)</Typography>
                  )}
                </Box>
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

      {/* ── Aviso ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={1800}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 5 }}>
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