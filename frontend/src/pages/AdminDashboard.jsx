import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import jsQR from 'jsqr';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';

const theme = {
  bg: '#0A0A0F',
  sidebar: '#10101A',
  card: '#18181F',
  cardHover: '#22222D',
  border: '#22222D',
  borderLight: '#2E2E3A',
  accent: '#B14EFF',
  accentLight: '#C97FFF',
  accentDark: '#9940E0',
  text: '#F2F0F5',
  textSec: '#9A9A9A',
  textMuted: '#6B6B80',
  chartGrid: '#1C1C28',
  success: '#4ade80',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#60a5fa',
};

const COLORS = ['#B14EFF', '#60a5fa', '#f59e0b', '#ef4444', '#C97FFF', '#ec4899', '#4ade80', '#22d3ee'];

const SIDEBAR_ITEMS = [
  { id: 'overview', label: 'Dashboard', icon: 'D' },
  { id: 'eventos', label: 'Eventos', icon: 'E' },
  { id: 'artistas', label: 'Artistas', icon: 'A' },
  { id: 'compras', label: 'Compras', icon: 'C' },
  { id: 'usuarios', label: 'Usuarios', icon: 'U' },
  { id: 'combos', label: 'Combos', icon: '🎁' },
  { id: 'canjes', label: 'Canjes', icon: 'G' },
  { id: 'regalos', label: 'Regalar Boletas', icon: 'R' },
  { id: 'puerta', label: 'Puerta', icon: 'Q' },
  { id: 'sorteos', label: 'Sorteos', icon: 'T' },
  { id: 'cupones', label: 'Cupones', icon: 'K' },
  { id: 'promotores', label: 'Promotores', icon: 'P' },
  { id: 'campanas', label: 'Campañas', icon: 'N' },
  { id: 'sugerencias', label: 'Sugerencias', icon: 'I' },
  { id: 'visitas', label: 'Visitas', icon: 'V' },
  { id: 'sets', label: 'Sets', icon: 'M' },
  { id: 'graffiti', label: 'Graffiti', icon: '🎨' },
  { id: 'seguridad', label: 'Seguridad', icon: 'S' },
];

const navBtnStyle = (active) => ({
  display: 'flex', alignItems: 'center', gap: '12px',
  width: '100%', padding: '12px 16px', borderRadius: '10px',
  border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: active ? 700 : 500,
  background: active ? 'rgba(177, 78, 255, 0.12)' : 'transparent',
  color: active ? theme.accentLight : theme.textMuted,
  transition: 'all 0.2s',
  textAlign: 'left',
});

const inputStyle = {
  width: '100%', padding: '10px 16px',
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${theme.border}`,
  borderRadius: '8px', color: theme.text, fontSize: '0.875rem',
  marginBottom: '16px', outline: 'none', boxSizing: 'border-box',
};

const btnPrimary = {
  padding: '10px 24px', borderRadius: '8px', border: 'none',
  background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`,
  color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem',
};

const btnGhost = {
  padding: '10px 24px', borderRadius: '8px', border: `1px solid ${theme.borderLight}`,
  background: 'transparent', color: theme.textSec, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
};

const badgeStyle = (color) => ({
  display: 'inline-block', padding: '3px 10px',
  borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
  background: `${color}18`, color, border: `1px solid ${color}44`,
});

// ── Icons ──
const Icon = ({ name, size = 20 }) => {
  const icons = {
    users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={size} height={size}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    scan: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={size} height={size}><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>,
    ticket: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={size} height={size}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>,
    money: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={size} height={size}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    chart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={size} height={size}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
    shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={size} height={size}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={size} height={size}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={size} height={size}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    refresh: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={size} height={size}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
    music: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={size} height={size}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
    lock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={size} height={size}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    calendar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={size} height={size}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    gift: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={size} height={size}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
    edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={size} height={size}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={size} height={size}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={size} height={size}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    star: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={size} height={size}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={size} height={size}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    smartphone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={size} height={size}><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
  };
  return icons[name] || null;
};

const SvgIcon = ({ letter }) => (
  <div style={{
    width: '32px', height: '32px', borderRadius: '8px',
    background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: '0.9rem', color: '#fff', flexShrink: 0,
  }}>{letter}</div>
);

// ── Stat Card ──
const StatCard = ({ label, value, icon, color, trend, trendLabel, delay, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={onClick ? { scale: 1.02, borderColor: color } : {}}
    transition={{ duration: 0.4, delay }}
    onClick={onClick}
    style={{
      background: theme.card, border: `1px solid ${theme.border}`,
      borderRadius: '14px', padding: '24px',
      display: 'flex', flexDirection: 'column', gap: '12px',
      position: 'relative', overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default',
    }}
  >
    <div style={{
      position: 'absolute', top: 0, right: 0,
      width: '100px', height: '100px',
      background: `radial-gradient(circle at top right, ${color}10, transparent 70%)`,
    }} />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Icon name={icon} size={22} color={color} />
      {trend !== undefined && (
        <span style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          fontSize: '0.75rem', fontWeight: 700,
          color: trend >= 0 ? theme.success : theme.danger,
        }}>
          <span>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>
          {trendLabel && <span style={{ color: theme.textMuted, fontWeight: 400 }}>{trendLabel}</span>}
        </span>
      )}
    </div>
    <div style={{ fontSize: '2rem', fontWeight: 800, color: theme.text, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
      {value}
    </div>
    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {label}
    </div>
  </motion.div>
);

// ── Confirm Modal ──
const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
    onClick={onCancel}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
      onClick={e => e.stopPropagation()}
      style={{ background: theme.card, border: `1px solid ${theme.danger}`, borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '100%', textAlign: 'center' }}
    >
      <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⚠️</div>
      <p style={{ color: theme.textSec, fontSize: '0.95rem', marginBottom: '28px', lineHeight: 1.6 }}>{message}</p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button onClick={onCancel} style={btnGhost}>Cancelar</button>
        <button onClick={onConfirm} style={{ ...btnPrimary, background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>Confirmar</button>
      </div>
    </motion.div>
  </motion.div>
);

// ── Chart Components ──

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: theme.sidebar, border: `1px solid ${theme.border}`,
      borderRadius: '10px', padding: '12px 16px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
    }}>
      <p style={{ color: theme.textMuted, fontSize: '0.75rem', margin: '0 0 6px' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, fontSize: '0.85rem', fontWeight: 700, margin: '2px 0' }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString('es-CO') : entry.value}
        </p>
      ))}
    </div>
  );
};

const RevenueChart = ({ data }) => {
  if (!data || data.length === 0) return <EmptyChart message="No hay datos de ventas disponibles" />;
  const chartData = [...data].reverse().map((c, i) => ({
    name: c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' }) : `#${i+1}`,
    Ingresos: c.total || 0,
    Boletas: c.cantidad || 0,
  }));
  return (
    <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '24px' }}>
      <h3 style={{ color: theme.text, fontSize: '0.95rem', fontWeight: 700, margin: '0 0 20px' }}>Ingresos por Ventas</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={theme.accent} stopOpacity={0.3}/><stop offset="95%" stopColor={theme.accent} stopOpacity={0}/></linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
          <XAxis dataKey="name" stroke={theme.textMuted} fontSize={11} tickLine={false} />
          <YAxis stroke={theme.textMuted} fontSize={11} tickLine={false} tickFormatter={v => `$${v.toLocaleString('es-CO')}`} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="Ingresos" stroke={theme.accent} fill="url(#revGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const EventSalesChart = ({ compras }) => {
  if (!compras || compras.length === 0) return <EmptyChart message="No hay datos de eventos disponibles" />;
  const byEvent = {};
  compras.forEach(c => {
    const name = c.eventoNombre || 'General';
    if (!byEvent[name]) byEvent[name] = { name, Ventas: 0, Boletas: 0 };
    byEvent[name].Ventas += c.total || 0;
    byEvent[name].Boletas += c.cantidad || 0;
  });
  const data = Object.values(byEvent).sort((a, b) => b.Ventas - a.Ventas).slice(0, 8);
  return (
    <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '24px' }}>
      <h3 style={{ color: theme.text, fontSize: '0.95rem', fontWeight: 700, margin: '0 0 20px' }}>Ventas por Evento</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} horizontal={false} />
          <XAxis type="number" stroke={theme.textMuted} fontSize={11} tickLine={false} tickFormatter={v => `$${v.toLocaleString('es-CO')}`} />
          <YAxis type="category" dataKey="name" stroke={theme.textMuted} fontSize={11} tickLine={false} width={140} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Ventas" fill={theme.accent} radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const TicketPieChart = ({ compras }) => {
  if (!compras || compras.length === 0) return <EmptyChart message="No hay datos de distribución" />;
  const byEvent = {};
  compras.forEach(c => {
    const name = c.eventoNombre || 'General';
    if (!byEvent[name]) byEvent[name] = 0;
    byEvent[name] += c.cantidad || 0;
  });
  const data = Object.entries(byEvent)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  const others = Object.entries(byEvent).slice(6).reduce((sum, [, v]) => sum + v, 0);
  if (others > 0) data.push({ name: 'Otros', value: others });
  return (
    <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '24px' }}>
      <h3 style={{ color: theme.text, fontSize: '0.95rem', fontWeight: 700, margin: '0 0 20px' }}>Distribución de Boletas</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: theme.textSec }}
            formatter={(value) => <span style={{ color: theme.textSec }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const EmptyChart = ({ message }) => (
  <div style={{
    background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '14px',
    padding: '60px 24px', textAlign: 'center', color: theme.textMuted, fontSize: '0.85rem',
  }}>{message}</div>
);

// ── Section wrapper ──
const Section = ({ icon, title, children, extra }) => (
  <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      <h3 style={{ color: theme.text, fontSize: '0.9rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {icon && <Icon name={icon} size={18} />}
        {title}
      </h3>
      {extra}
    </div>
    {children}
  </div>
);

// ── Table Styles ──
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' };
const thStyle = {
  padding: '10px 14px', textAlign: 'left', color: theme.textMuted, fontWeight: 600,
  fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px',
  borderBottom: `1px solid ${theme.border}`, whiteSpace: 'nowrap',
};
const tdStyle = {
  padding: '12px 14px', borderBottom: `1px solid ${theme.border}`,
  color: theme.textSec, fontSize: '0.83rem',
};

// ── Main Component ──
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Campañas states
  const [campanaTarget, setCampanaTarget] = useState('CLIENTES');
  const [campanaSubject, setCampanaSubject] = useState('');
  const [campanaMessage, setCampanaMessage] = useState('');
  const [campanaStatus, setCampanaStatus] = useState({ success: '', error: '' });
  const [campanaLoading, setCampanaLoading] = useState(false);
  const [retoDescription, setRetoDescription] = useState('');
  const [retoMetas, setRetoMetas] = useState([]);
  const [retoLoading, setRetoLoading] = useState(false);
  const [retoStatus, setRetoStatus] = useState({ success: '', error: '' });

  const handleAddMeta = () => {
    setRetoMetas([...retoMetas, { cantidad: 5, bono: 10000 }]);
  };

  const handleRemoveMeta = (index) => {
    setRetoMetas(retoMetas.filter((_, i) => i !== index));
  };

  const handleMetaChange = (index, field, value) => {
    const updated = [...retoMetas];
    updated[index][field] = parseInt(value) || 0;
    setRetoMetas(updated);
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [stats, setStats] = useState(null);
  const [compras, setCompras] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [canjes, setCanjes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchCompra, setSearchCompra] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [searchEvento, setSearchEvento] = useState('');
  const [searchCanje, setSearchCanje] = useState('');
  const [searchArtista, setSearchArtista] = useState('');
  const [searchTransfer, setSearchTransfer] = useState('');
  const [searchLog, setSearchLog] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filtroEstadoCompra, setFiltroEstadoCompra] = useState('TODOS');
  const [filtroTipoCompra, setFiltroTipoCompra] = useState('TODOS');
  const [confirmModal, setConfirmModal] = useState(null);
  const [emailModal, setEmailModal] = useState({
    open: false,
    to: '',
    subject: '',
    body: '',
    loading: false,
    success: '',
    error: ''
  });

  const [reportesSeguridad, setReportesSeguridad] = useState([]);

  // Estados para Combos
  const [combos, setCombos] = useState([]);
  const [loadingCombos, setLoadingCombos] = useState(false);
  const [showComboForm, setShowComboForm] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [formCombo, setFormCombo] = useState({ nombre: '', descripcion: '', precio: 0.0, precioOriginal: 0.0, cantidadBoletas: 1, itemsAdicionales: '', imagenUrl: '', esCumpleanero: false, activo: true });
  const [searchCombo, setSearchCombo] = useState('');
  const [transferencias, setTransferencias] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [artistas, setArtistas] = useState([]);

  const [subTabSeguridad, setSubTabSeguridad] = useState('alertas');

  const [showForm, setShowForm] = useState(false);
  const [editingEvento, setEditingEvento] = useState(null);
  const [formEvento, setFormEvento] = useState({
    nombre: '', descripcion: '', fecha: '', hora: '', lugar: '',
    ciudad: 'Medellín', precio: 0, capacidad: 100, imagenUrl: '', lineup: '', activo: true, destacado: false,
    precioPreventa: '', cantidadPreventa: '',
  });

  const [showArtistaForm, setShowArtistaForm] = useState(false);
  const [editingArtista, setEditingArtista] = useState(null);
  const [formArtista, setFormArtista] = useState({
    nombre: '', genero: '', bio: '', imagenUrl: '', instagramUrl: '', soundcloudUrl: '', local: true,
  });

  const [codigoQrInput, setCodigoQrInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanLoopRef = useRef(null);

  // Estados para Regalar Boletas
  const [formRegalo, setFormRegalo] = useState({ eventoId: '', nombre: '', email: '', telefono: '', cantidad: 1, nota: '' });
  const [loadingRegalo, setLoadingRegalo] = useState(false);
  const [errorRegalo, setErrorRegalo] = useState('');
  const [successRegalo, setSuccessRegalo] = useState('');
  const [searchRegaloUser, setSearchRegaloUser] = useState('');

  // Estados para Sugerencias
  const [sugerencias, setSugerencias] = useState([]);
  const [loadingSugerencias, setLoadingSugerencias] = useState(false);
  const [searchSugerencia, setSearchSugerencia] = useState('');

  // Estados para Sorteos
  const [selectedSorteoEvento, setSelectedSorteoEvento] = useState('');
  const [participantesSorteo, setParticipantesSorteo] = useState([]);
  const [loadingParticipantes, setLoadingParticipantes] = useState(false);
  const [numeroSorteoInput, setNumeroSorteoInput] = useState('');
  const [ganadorSorteo, setGanadorSorteo] = useState(null);
  const [buscandoGanador, setBuscandoGanador] = useState(false);
  const [errorSorteo, setErrorSorteo] = useState('');
  
  // Tómbola animada
  const [girandoTombola, setGirandoTombola] = useState(false);
  const [tombolaNumeroVis, setTombolaNumeroVis] = useState('???');
  
  // Historial de ganadores (persistencia local)
  const [ganadoresHistorial, setGanadoresHistorial] = useState([]);

  // Estados para Cupones
  const [cupones, setCupones] = useState([]);
  const [loadingCupones, setLoadingCupones] = useState(false);
  const [formCupon, setFormCupon] = useState({ codigo: '', descuentoPorcentaje: '', descripcion: '', activo: true, maxUsos: '', minBoletas: '', promotorId: '' });
  const [searchCupon, setSearchCupon] = useState('');
  const [selectedCuponReport, setSelectedCuponReport] = useState(null);

  // Estados para Promotores (solo admin)
  const [promotores, setPromotores] = useState([]);
  const [loadingPromotores, setLoadingPromotores] = useState(false);

  // Estados para Sets Musicales
  const [sets, setSets] = useState([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [showSetForm, setShowSetForm] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [formSet, setFormSet] = useState({ titulo: '', artista: '', youtubeUrl: '', genero: '', descripcion: '', imagenUrl: '', activo: true });
  const [searchSet, setSearchSet] = useState('');

  const fetchSets = useCallback(async () => {
    setLoadingSets(true);
    try {
      const data = await api.adminGetSets();
      setSets(data || []);
    } catch (err) {
      console.error('Error fetching sets:', err);
    } finally {
      setLoadingSets(false);
    }
  }, []);

  // Estados para Visitas
  const [pwaStats, setPwaStats] = useState(null);
  const [visitStats, setVisitStats] = useState(null);
  const [allVisits, setAllVisits] = useState([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [searchVisit, setSearchVisit] = useState('');

  const fetchPwaStats = useCallback(async () => {
    try {
      const data = await api.adminGetPwaStats();
      setPwaStats(data);
    } catch (err) {
      console.error('Error fetching PWA stats:', err);
    }
  }, []);

  const fetchVisitStats = useCallback(async () => {
    setLoadingVisits(true);
    try {
      const [stats, visits] = await Promise.all([
        api.adminGetVisitStats(),
        api.adminGetAllVisits().catch(() => []),
      ]);
      setVisitStats(stats);
      setAllVisits(visits || []);
    } catch (err) {
      console.error('Error fetching visit stats:', err);
    } finally {
      setLoadingVisits(false);
    }
  }, []);

  const fetchSugerencias = useCallback(async () => {
    setLoadingSugerencias(true);
    try {
      const data = await api.adminGetSugerencias();
      setSugerencias(data || []);
    } catch (err) {
      console.error('Error fetching sugerencias:', err);
    } finally {
      setLoadingSugerencias(false);
    }
  }, []);

  const fetchCombos = useCallback(async () => {
    setLoadingCombos(true);
    try {
      const data = await api.adminGetCombos();
      setCombos(data || []);
    } catch (err) {
      console.error('Error fetching combos:', err);
    } finally {
      setLoadingCombos(false);
    }
  }, []);

  const handleSubmitCombo = async (e) => {
    e.preventDefault();
    try {
      if (editingCombo) {
        const updated = await api.adminActualizarCombo(editingCombo.id, formCombo);
        setCombos(prev => prev.map(c => c.id === editingCombo.id ? updated : c));
      } else {
        const created = await api.adminCrearCombo(formCombo);
        setCombos(prev => [...prev, created]);
      }
      setShowComboForm(false);
      setEditingCombo(null);
      setFormCombo({ nombre: '', descripcion: '', precio: 0.0, precioOriginal: 0.0, cantidadBoletas: 1, itemsAdicionales: '', imagenUrl: '', esCumpleanero: false, activo: true });
    } catch (err) {
      setError('Error al guardar el combo.');
    }
  };

  const handleEditCombo = (combo) => {
    setEditingCombo(combo);
    setFormCombo({
      nombre: combo.nombre,
      descripcion: combo.descripcion || '',
      precio: combo.precio,
      precioOriginal: combo.precioOriginal || 0.0,
      cantidadBoletas: combo.cantidadBoletas,
      itemsAdicionales: combo.itemsAdicionales || '',
      imagenUrl: combo.imagenUrl || '',
      esCumpleanero: combo.esCumpleanero || false,
      activo: combo.activo
    });
    setShowComboForm(true);
  };

  const handleDeleteCombo = async (id) => {
    if (!window.confirm('¿Desactivar este combo?')) return;
    try {
      await api.adminDeleteCombo(id);
      fetchCombos();
    } catch (err) {
      setError('Error al desactivar el combo.');
    }
  };

  // ===== GRAFFITI =====
  const [graffitis, setGraffitis] = useState([]);
  const [loadingGraffitis, setLoadingGraffitis] = useState(false);
  const [showGraffitiForm, setShowGraffitiForm] = useState(false);
  const [editingGraffiti, setEditingGraffiti] = useState(null);
  const [formGraffiti, setFormGraffiti] = useState({ titulo: '', artista: '', descripcion: '', imagenUrl: '', ubicacion: '', latitud: '', longitud: '', tags: '', activo: true });
  const [searchGraffiti, setSearchGraffiti] = useState('');

  const fetchGraffitis = useCallback(async () => {
    setLoadingGraffitis(true);
    try {
      const data = await api.adminGetGraffiti();
      setGraffitis(data || []);
    } catch (err) {
      console.error('Error fetching graffitis:', err);
    } finally {
      setLoadingGraffitis(false);
    }
  }, []);

  const handleSubmitGraffiti = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formGraffiti,
        latitud: parseFloat(formGraffiti.latitud),
        longitud: parseFloat(formGraffiti.longitud),
      };
      if (editingGraffiti) {
        const updated = await api.adminActualizarGraffiti(editingGraffiti.id, payload);
        setGraffitis(prev => prev.map(g => g.id === editingGraffiti.id ? updated : g));
      } else {
        const created = await api.adminCrearGraffiti(payload);
        setGraffitis(prev => [created, ...prev]);
      }
      setShowGraffitiForm(false);
      setEditingGraffiti(null);
      setFormGraffiti({ titulo: '', artista: '', descripcion: '', imagenUrl: '', ubicacion: '', latitud: '', longitud: '', tags: '', activo: true });
    } catch (err) {
      setError('Error al guardar el graffiti.');
    }
  };

  const handleEditGraffiti = (g) => {
    setEditingGraffiti(g);
    setFormGraffiti({
      titulo: g.titulo || '',
      artista: g.artista || '',
      descripcion: g.descripcion || '',
      imagenUrl: g.imagenUrl || '',
      ubicacion: g.ubicacion || '',
      latitud: g.latitud || '',
      longitud: g.longitud || '',
      tags: g.tags || '',
      activo: g.activo !== false,
    });
    setShowGraffitiForm(true);
  };

  const handleDeleteGraffiti = async (id) => {
    if (!window.confirm('¿Desactivar este graffiti?')) return;
    try {
      await api.adminDeleteGraffiti(id);
      fetchGraffitis();
    } catch (err) {
      setError('Error al desactivar el graffiti.');
    }
  };

  const fetchCupones = useCallback(async () => {
    setLoadingCupones(true);
    try {
      const data = await api.adminGetCuponesReporte();
      setCupones(data || []);
    } catch (err) {
      console.error('Error fetching cupones:', err);
    } finally {
      setLoadingCupones(false);
    }
  }, []);

  const fetchPromotores = useCallback(async () => {
    setLoadingPromotores(true);
    try {
      const data = await api.adminGetPromotores();
      setPromotores(data || []);
    } catch (err) {
      console.error('Error fetching promotores:', err);
    } finally {
      setLoadingPromotores(false);
    }
  }, []);

  const handleCreateCupon = async (e) => {
    e.preventDefault();
    if (!formCupon.codigo.trim()) return;
    const discount = parseFloat(formCupon.descuentoPorcentaje);
    if (isNaN(discount) || discount <= 0 || discount > 100) {
      alert('El porcentaje de descuento debe ser un número entre 0.1 y 100.');
      return;
    }

    try {
      await api.adminCreateCupon({
        codigo: formCupon.codigo.trim().toUpperCase(),
        descuentoPorcentaje: discount,
        descripcion: formCupon.descripcion,
        activo: formCupon.activo,
        maxUsos: formCupon.maxUsos ? parseInt(formCupon.maxUsos) : 0,
        minBoletas: formCupon.minBoletas ? parseInt(formCupon.minBoletas) : 1,
        promotor: formCupon.promotorId ? { id: parseInt(formCupon.promotorId) } : null
      });
      setFormCupon({ codigo: '', descuentoPorcentaje: '', descripcion: '', activo: true, maxUsos: '', minBoletas: '', promotorId: '' });
      fetchCupones();
      fetchAll();
    } catch (err) {
      alert(err.message || 'Error al crear el cupón.');
    }
  };

  const handleToggleCupon = async (id) => {
    try {
      await api.adminToggleCupon(id);
      fetchCupones();
    } catch (err) {
      alert(err.message || 'Error al cambiar estado del cupón.');
    }
  };

  const handleDeleteCupon = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este cupón?')) return;
    try {
      await api.adminDeleteCupon(id);
      fetchCupones();
    } catch (err) {
      alert(err.message || 'Error al eliminar el cupón.');
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setEmailModal(prev => ({ ...prev, loading: true, error: '', success: '' }));
    try {
      await api.adminEnviarCorreo(emailModal.to, emailModal.subject, emailModal.body);
      setEmailModal(prev => ({ ...prev, loading: false, success: '¡Correo enviado exitosamente!' }));
      setTimeout(() => {
        setEmailModal(prev => ({ ...prev, open: false, success: '', error: '' }));
      }, 1500);
    } catch (err) {
      setEmailModal(prev => ({ ...prev, loading: false, error: err.message || 'Error al enviar el correo.' }));
    }
  };

  // Cargar participantes del sorteo al cambiar de evento
  const fetchParticipantesSorteo = useCallback(async (eventoId) => {
    if (!eventoId) {
      setParticipantesSorteo([]);
      setGanadoresHistorial([]);
      return;
    }
    setLoadingParticipantes(true);
    setErrorSorteo('');
    setGanadorSorteo(null);
    try {
      const response = await api.adminGetSorteoParticipantes(eventoId);
      setParticipantesSorteo(response || []);
      // Cargar historial de localStorage
      const stored = localStorage.getItem(`dopamina_sorteo_ganadores_${eventoId}`);
      if (stored) {
        setGanadoresHistorial(JSON.parse(stored));
      } else {
        setGanadoresHistorial([]);
      }
    } catch (err) {
      setErrorSorteo('Error al obtener la lista de participantes del sorteo.');
    } finally {
      setLoadingParticipantes(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSorteoEvento) {
      fetchParticipantesSorteo(selectedSorteoEvento);
    }
  }, [selectedSorteoEvento, fetchParticipantesSorteo]);

  const buscarGanadorManual = async (numero) => {
    if (!selectedSorteoEvento) {
      setErrorSorteo('Seleccione un evento primero.');
      return;
    }
    if (!numero || isNaN(numero)) {
      setErrorSorteo('Ingrese un número de sorteo válido.');
      return;
    }
    setBuscandoGanador(true);
    setErrorSorteo('');
    setGanadorSorteo(null);
    try {
      const response = await api.adminGetSorteoGanador(selectedSorteoEvento, parseInt(numero));
      setGanadorSorteo(response);
      agregarAlHistorial(response);
    } catch (err) {
      setErrorSorteo(err.message || 'No se encontró ninguna boleta con ese número.');
    } finally {
      setBuscandoGanador(false);
    }
  };

  const agregarAlHistorial = useCallback((ganador) => {
    if (!ganador) return;
    setGanadoresHistorial(prev => {
      if (prev.some(h => h.id === ganador.id)) return prev;
      const nuevoHistorial = [{
        id: ganador.id,
        numeroSorteo: ganador.numeroSorteo,
        usuarioNombre: ganador.usuarioNombre || 'Desconocido',
        timestamp: new Date().toISOString()
      }, ...prev];
      localStorage.setItem(`dopamina_sorteo_ganadores_${selectedSorteoEvento}`, JSON.stringify(nuevoHistorial));
      return nuevoHistorial;
    });
  }, [selectedSorteoEvento]);

  const reiniciarSorteo = () => {
    if (!selectedSorteoEvento) return;
    localStorage.removeItem(`dopamina_sorteo_ganadores_${selectedSorteoEvento}`);
    setGanadoresHistorial([]);
    setGanadorSorteo(null);
    setErrorSorteo('');
  };

  useEffect(() => {
    const user = api.getUser();
    if (!user || (user.rol !== 'ROLE_ADMIN' && user.rol !== 'ROLE_SUBADMIN')) navigate('/');
  }, [navigate]);

  const fetchRetoActivo = useCallback(async () => {
    try {
      const res = await api.promotorGetRetoActivo();
      if (res?.challengeJson) {
        try {
          const obj = JSON.parse(res.challengeJson);
          setRetoDescription(obj.descripcion || '');
          setRetoMetas(obj.metas || []);
        } catch (e) {
          setRetoDescription(res.challengeJson);
          setRetoMetas([]);
        }
      } else {
        setRetoDescription('');
        setRetoMetas([]);
      }
    } catch (err) {
      console.error('Error fetching active challenge:', err);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      setRefreshing(true);
      const userObj = api.getUser();
      const subAdmin = userObj?.rol === 'ROLE_SUBADMIN';

      // Refresh PWA statistics
      fetchPwaStats().catch(() => {});

      if (subAdmin) {
        const [statsData, comprasData, eventosData, artistasData, canjesData] = await Promise.all([
          api.adminGetStats(),
          api.adminGetCompras(),
          api.adminGetEventos(),
          api.adminGetArtistas().catch(() => []),
          api.adminGetCanjes().catch(() => []),
        ]);
        setStats(statsData);
        setCompras(comprasData);
        setEventos(eventosData);
        setArtistas(artistasData);
        setCanjes(canjesData);
        setError('');
      } else {
        const [statsData, comprasData, usuariosData, eventosData, canjesData, reportesData, transferenciasData, artistasData, logsData, accessLogsData, cuponesData, sugerenciasData] = await Promise.all([
          api.adminGetStats(),
          api.adminGetCompras(),
          api.adminGetUsuarios(),
          api.adminGetEventos(),
          api.adminGetCanjes(),
          api.adminGetReportesSeguridad().catch(() => []),
          api.adminGetTransferencias().catch(() => []),
          api.adminGetArtistas().catch(() => []),
          api.adminGetLoginLogs().catch(() => []),
          api.adminGetLogsAcceso().catch(() => []),
          api.adminGetCuponesReporte().catch(() => []),
          api.adminGetSugerencias().catch(() => []),
        ]);
        setStats(statsData);
        setCompras(comprasData);
        setUsuarios(usuariosData);
        setEventos(eventosData);
        setCanjes(canjesData || []);
        setReportesSeguridad(reportesData || []);
        setTransferencias(transferenciasData || []);
        setArtistas(artistasData || []);
        setLoginLogs(logsData || []);
        setRecentScans(accessLogsData || []);
        setCupones(cuponesData || []);
        setSugerencias(sugerenciasData || []);
        setError('');
      }
    } catch (err) {
      setError('Error al cargar datos del panel. Verifica tu sesión.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (activeTab === 'overview') fetchPwaStats();
    if (activeTab === 'visitas') fetchVisitStats();
    if (activeTab === 'sets') fetchSets();
    if (activeTab === 'sugerencias') fetchSugerencias();
    if (activeTab === 'promotores') fetchPromotores();
    if (activeTab === 'campanas') fetchRetoActivo();
    if (activeTab === 'combos') fetchCombos();
    if (activeTab === 'graffiti') fetchGraffitis();
  }, [activeTab, fetchPwaStats, fetchVisitStats, fetchSets, fetchSugerencias, fetchPromotores, fetchRetoActivo, fetchCombos, fetchGraffitis]);

  // ── Derived chart data ──
  const comprasConEvento = useMemo(() => compras.filter(c => c.eventoNombre), [compras]);

  // ── Filtered data ──
  const filteredCompras = useMemo(() => {
    return compras.filter(c => {
      const matchSearch = c.usuarioEmail?.toLowerCase().includes(searchCompra.toLowerCase()) ||
        c.usuarioNombre?.toLowerCase().includes(searchCompra.toLowerCase()) ||
        String(c.id).includes(searchCompra);
      const matchEstado = filtroEstadoCompra === 'TODOS' || c.estado === filtroEstadoCompra;
      const matchTipo = filtroTipoCompra === 'TODOS' ||
        (filtroTipoCompra === 'COMBO' && c.comboNombre) ||
        (filtroTipoCompra === 'INDIVIDUAL' && !c.comboNombre);
      return matchSearch && matchEstado && matchTipo;
    });
  }, [compras, searchCompra, filtroEstadoCompra, filtroTipoCompra]);
  const filteredUsuarios = usuarios.filter(u =>
    u.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.nombre?.toLowerCase().includes(searchUser.toLowerCase())
  );
  const filteredEventos = eventos.filter(e =>
    e.nombre?.toLowerCase().includes(searchEvento.toLowerCase()) ||
    e.lugar?.toLowerCase().includes(searchEvento.toLowerCase()) ||
    e.ciudad?.toLowerCase().includes(searchEvento.toLowerCase())
  );
  const filteredCanjes = canjes.filter(c =>
    c.codigoCanje?.toLowerCase().includes(searchCanje.toLowerCase()) ||
    c.usuarioNombre?.toLowerCase().includes(searchCanje.toLowerCase()) ||
    c.usuarioEmail?.toLowerCase().includes(searchCanje.toLowerCase()) ||
    c.premioTitulo?.toLowerCase().includes(searchCanje.toLowerCase())
  );
  const filteredArtistas = artistas.filter(art =>
    art.nombre?.toLowerCase().includes(searchArtista.toLowerCase()) ||
    art.genero?.toLowerCase().includes(searchArtista.toLowerCase())
  );

  // ── Handlers ──
  const exportComprasToCSV = () => {
    const headers = ['ID,Usuario,Email,Evento,Tipo,Cantidad,Subtotal,Descuento,Total,Cupon,Estado,QR,Fecha'];
    const rows = filteredCompras.map(c => 
      `"${c.id}","${c.usuarioNombre}","${c.usuarioEmail}","${c.eventoNombre || 'General'}","${c.comboNombre || 'Individual'}","${c.cantidad}","${c.subtotal || 0}","${c.descuento || 0}","${c.total || 0}","${c.codigoCupon || ''}","${c.estado}","${c.codigoQr || ''}","${c.createdAt || ''}"`
    );
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `compras_dopamina_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportUsuariosToCSV = () => {
    const headers = ['ID,Nombre,Email,Telefono,Rol,Compras,Gastado,Registro,Estado'];
    const rows = filteredUsuarios.map(u => 
      `"${u.id}","${u.nombre}","${u.email}","${u.telefono || ''}","${u.rol}","${u.totalCompras}","${u.totalGastado}","${u.createdAt || ''}","${u.banned ? 'SUSPENDIDO' : 'ACTIVO'}"`
    );
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `usuarios_dopamina_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => { api.clearAuth(); navigate('/'); };
  const handleDeleteCompra = (id) => setConfirmModal({ type: 'compra', id, message: `¿Eliminar la compra #${id}? Esta acción no se puede deshacer.` });
  
  const handleVerifyPayment = async (compraId) => {
    try {
      const res = await api.adminVerifyPaymentStatus(compraId);
      alert(`Estado verificado: ${res.estado} (Efipay: ${res.efipayStatus || 'desconocido'})`);
      fetchAll();
    } catch (err) {
      alert(`Error al verificar pago: ${err.message || err}`);
    }
  };

  const handleDeleteUsuario = (id) => {
    const user = usuarios.find(u => u.id === id);
    setConfirmModal({ type: 'usuario', id, message: `¿Eliminar al usuario "${user?.nombre}"? Se eliminarán todos sus datos.` });
  };
  const handleDeleteEvento = (id) => {
    const ev = eventos.find(e => e.id === id);
    setConfirmModal({ type: 'evento', id, message: `¿Eliminar permanentemente el evento "${ev?.nombre}"?` });
  };
  const handleDeleteArtista = (id) => {
    const art = artistas.find(a => a.id === id);
    setConfirmModal({ type: 'artista', id, message: `¿Eliminar permanentemente al artista "${art?.nombre}"?` });
  };
  const handleToggleBanUsuario = (id, banned, nombre) => {
    setConfirmModal({
      type: banned ? 'unban' : 'ban', id,
      message: banned ? `¿Habilitar nuevamente al usuario "${nombre}"?` : `¿Suspender temporalmente al usuario "${nombre}"?`,
    });
  };

  const confirmDelete = async () => {
    if (!confirmModal) return;
    try {
      if (confirmModal.type === 'ban') {
        await api.adminBanUsuario(confirmModal.id);
        setUsuarios(prev => prev.map(u => u.id === confirmModal.id ? { ...u, banned: true } : u));
        setLoginLogs(await api.adminGetLoginLogs().catch(() => []));
      } else if (confirmModal.type === 'unban') {
        await api.adminUnbanUsuario(confirmModal.id);
        setUsuarios(prev => prev.map(u => u.id === confirmModal.id ? { ...u, banned: false } : u));
        setLoginLogs(await api.adminGetLoginLogs().catch(() => []));
      } else if (confirmModal.type === 'compra') {
        await api.adminDeleteCompra(confirmModal.id);
        setCompras(prev => prev.filter(c => c.id !== confirmModal.id));
      } else if (confirmModal.type === 'evento') {
        await api.adminDeleteEvento(confirmModal.id);
        setEventos(prev => prev.filter(e => e.id !== confirmModal.id));
      } else if (confirmModal.type === 'artista') {
        await api.adminEliminarArtista(confirmModal.id);
        setArtistas(prev => prev.filter(a => a.id !== confirmModal.id));
      } else {
        await api.adminDeleteUsuario(confirmModal.id);
        setUsuarios(prev => prev.filter(u => u.id !== confirmModal.id));
      }
    } catch (err) {
      setError('Error al procesar la solicitud: ' + (err.message || err));
    } finally { setConfirmModal(null); }
  };

  const handleDeliverCanje = async (id) => {
    try {
      await api.adminUpdateCanjeEstado(id, 'ENTREGADO');
      setCanjes(prev => prev.map(c => c.id === id ? { ...c, estado: 'ENTREGADO' } : c));
    } catch (err) { setError('Error al actualizar el estado del premio.'); }
  };

  const handleChangeUserRole = async (userId, nuevoRol, nombreUsuario) => {
    if (!window.confirm(`¿Está seguro de cambiar el rol de "${nombreUsuario}" a ${nuevoRol.replace('ROLE_', '')}?`)) {
      return;
    }
    try {
      setError('');
      await api.adminActualizarRolUsuario(userId, nuevoRol);
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, rol: nuevoRol } : u));
    } catch (err) {
      setError('Error al cambiar el rol del usuario: ' + (err.message || err));
    }
  };

  const handleToggleEvento = async (id) => {
    try {
      const updated = await api.adminToggleEvento(id);
      setEventos(prev => prev.map(e => e.id === id ? { ...e, activo: updated.activo } : e));
    } catch (err) { setError('Error al cambiar estado del evento.'); }
  };

  const handleResolveReport = async (reportId, newStatus) => {
    try {
      await api.adminResolverReporteSeguridad(reportId, newStatus);
      setReportesSeguridad(prev => prev.map(r => r.id === reportId ? { ...r, estado: newStatus } : r));
    } catch (err) { setError('Error al actualizar el estado del reporte.'); }
  };

  const handleSubmitEvento = async (e) => {
    e.preventDefault();
    try {
      const data = { 
        ...formEvento, 
        precio: parseFloat(formEvento.precio), 
        capacidad: parseInt(formEvento.capacidad),
        precioPreventa: formEvento.precioPreventa !== '' && formEvento.precioPreventa !== null ? parseFloat(formEvento.precioPreventa) : null,
        cantidadPreventa: formEvento.cantidadPreventa !== '' && formEvento.cantidadPreventa !== null ? parseInt(formEvento.cantidadPreventa) : null
      };
      if (editingEvento) {
        const updated = await api.adminActualizarEvento(editingEvento.id, data);
        setEventos(prev => prev.map(ev => ev.id === editingEvento.id ? updated : ev));
      } else {
        const created = await api.adminCrearEvento(data);
        setEventos(prev => [...prev, created]);
      }
      setShowForm(false); setEditingEvento(null);
      setFormEvento({ nombre: '', descripcion: '', fecha: '', hora: '', lugar: '', ciudad: 'Medellín', precio: 0, capacidad: 100, imagenUrl: '', lineup: '', activo: true, destacado: false, precioPreventa: '', cantidadPreventa: '' });
    } catch (err) { setError('Error al guardar el evento: ' + (err.message || err)); }
  };

  const handleSubmitArtista = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formArtista };
      if (editingArtista) {
        const updated = await api.adminActualizarArtista(editingArtista.id, data);
        setArtistas(prev => prev.map(art => art.id === editingArtista.id ? updated : art));
      } else {
        const created = await api.adminCrearArtista(data);
        setArtistas(prev => [...prev, created]);
      }
      setShowArtistaForm(false); setEditingArtista(null);
      setFormArtista({ nombre: '', genero: '', bio: '', imagenUrl: '', instagramUrl: '', soundcloudUrl: '', local: true });
    } catch (err) { setError('Error al guardar el artista: ' + (err.message || err)); }
  };

  // ── QR / Puerta handlers ──
  const stopCamera = () => {
    if (scanLoopRef.current) { cancelAnimationFrame(scanLoopRef.current); scanLoopRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      streamRef.current = stream;
      setCameraActive(true);
      await new Promise(r => setTimeout(r, 100));
      const v = videoRef.current;
      if (v) {
        v.srcObject = stream;
        await new Promise((resolve) => {
          v.onloadedmetadata = () => { v.play().then(resolve).catch(resolve); };
        });
      }
      const scanFrame = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video.readyState >= video.HAVE_CURRENT_DATA) {
          canvas.height = video.videoHeight || 720;
          canvas.width = video.videoWidth || 1280;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
          if (code && code.data && code.data.trim()) {
            stopCamera();
            setCodigoQrInput(code.data.trim());
            handleScanSubmitDirect(code.data.trim());
            return;
          }
        }
        scanLoopRef.current = requestAnimationFrame(scanFrame);
      };
      scanLoopRef.current = requestAnimationFrame(scanFrame);
    } catch (err) {
      setCameraError(err.name === 'NotAllowedError' ? 'Permiso de cámara denegado.' : err.name === 'NotFoundError' ? 'No se encontró cámara.' : `Error: ${err.message}`);
    }
  };

  useEffect(() => {
    if (activeTab !== 'puerta') { stopCamera(); setCameraMode(false); }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'puerta' && inputRef.current) inputRef.current.focus();
  }, [activeTab, scanResult, scanning]);

  useEffect(() => {
    const h = () => { if (activeTab === 'puerta' && inputRef.current) inputRef.current.focus(); };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [activeTab]);

  const handleScanSubmitDirect = async (qrValue) => {
    const qr = (qrValue || '').trim();
    if (!qr) return;
    setScanning(true); setScanResult(null);
    try {
      const res = await api.adminValidarQr(qr);
      setScanResult({ success: true, message: 'ACCESO PERMITIDO', boleta: res });
      setRecentScans(await api.adminGetLogsAcceso().catch(() => []));
    } catch (err) {
      setScanResult({ success: false, message: err.message || 'Código QR Inválido.' });
      setRecentScans(await api.adminGetLogsAcceso().catch(() => []));
    } finally { setScanning(false); setCodigoQrInput(''); }
  };

  const handleScanSubmit = async (e) => {
    if (e) e.preventDefault();
    await handleScanSubmitDirect(codigoQrInput);
  };

  if (loading) return (
    <div style={{ background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{ width: '40px', height: '40px', border: '3px solid #1e293b', borderTopColor: theme.accent, borderRadius: '50%' }}
      />
    </div>
  );

  // ── Renderers for each tab ──
  const renderOverview = () => (
    <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Usuarios Registrados" value={stats?.totalUsuarios ?? 0} icon="users" color={theme.info} delay={0} onClick={() => setActiveTab('usuarios')} />
        <StatCard label="Total Compras" value={stats?.totalCompras ?? 0} icon="chart" color={theme.accent} delay={0.05} onClick={() => setActiveTab('compras')} />
        <StatCard label="Ingresos Totales" value={`$${(stats?.totalIngresos ?? 0).toLocaleString('es-CO')}`} icon="money" color={theme.warning} delay={0.1} onClick={() => setActiveTab('compras')} />
        <StatCard label="Boletas Vendidas" value={stats?.totalBoletas ?? 0} icon="ticket" color={theme.success} delay={0.15} onClick={() => setActiveTab('compras')} />
        <StatCard label="Descargas App" value={pwaStats?.totalInstalls ?? 0} icon="smartphone" color="#22d3ee" delay={0.2} onClick={() => setActiveTab('visitas')} />
        <StatCard label="Descargas (30 días)" value={pwaStats?.installsLast30Days ?? 0} icon="chart" color="#ec4899" delay={0.25} onClick={() => setActiveTab('visitas')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <RevenueChart data={stats?.ultimasCompras} />
        <EventSalesChart data={comprasConEvento} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <TicketPieChart data={comprasConEvento} />
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '24px' }}>
          <h3 style={{ color: theme.text, fontSize: '0.95rem', fontWeight: 700, margin: '0 0 16px' }}>Promedio de Boletas por Compra</h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px' }}>
            <div style={{ fontSize: '4rem', fontWeight: 800, color: theme.accent, fontFamily: "'JetBrains Mono', monospace" }}>
              {stats?.promedioBoletasPorCompra?.toFixed(1) ?? '—'}
            </div>
            <div style={{ color: theme.textMuted, fontSize: '0.85rem', marginTop: '8px' }}>boletas por transacción</div>
            <div style={{ width: '60%', height: '4px', background: theme.border, borderRadius: '2px', marginTop: '20px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min((stats?.promedioBoletasPorCompra || 0) / 5 * 100, 100)}%`, background: `linear-gradient(90deg, ${theme.accent}, ${theme.accentLight})`, borderRadius: '2px', transition: 'width 0.8s ease' }} />
            </div>
          </div>
        </div>
      </div>

      <Section icon="ticket" title="Compras Recientes">
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead><tr>
              {['#', 'Usuario', 'Email', 'Cant.', 'Total', 'Estado', 'Fecha'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr></thead>
            <tbody>
              {(stats?.ultimasCompras ?? []).map(c => (
                <tr key={c.id}
                  onMouseEnter={e => e.currentTarget.style.background = theme.cardHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ ...tdStyle, color: theme.accent, fontFamily: "'JetBrains Mono', monospace" }}>#{c.id}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: theme.text }}>{c.usuarioNombre}</td>
                  <td style={{ ...tdStyle, color: theme.textMuted, fontSize: '0.8rem' }}>{c.usuarioEmail}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{c.cantidad}</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: theme.text }}>${c.total?.toLocaleString('es-CO')}</td>
                  <td><span style={badgeStyle(c.estado === 'PAGADO' ? theme.success : theme.warning)}>{c.estado}</span></td>
                  <td style={{ ...tdStyle, color: theme.textMuted, fontSize: '0.78rem' }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-CO') : '—'}</td>
                </tr>
              ))}
              {(stats?.ultimasCompras ?? []).length === 0 && (
                <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: theme.textMuted, padding: '40px' }}>No hay compras registradas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section icon="users" title="Usuarios Recientes">
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead><tr>
              {['#', 'Nombre', 'Email', 'Rol', 'Compras', 'Gastado', 'Registro'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr></thead>
            <tbody>
              {(stats?.ultimosUsuarios ?? []).map(u => (
                <tr key={u.id}
                  onMouseEnter={e => e.currentTarget.style.background = theme.cardHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ ...tdStyle, color: theme.info, fontFamily: "'JetBrains Mono', monospace" }}>#{u.id}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: theme.text }}>{u.nombre}</td>
                  <td style={{ ...tdStyle, color: theme.textMuted, fontSize: '0.8rem' }}>{u.email}</td>
                  <td><span style={badgeStyle(u.rol === 'ROLE_ADMIN' ? theme.warning : theme.info)}>{u.rol === 'ROLE_ADMIN' ? 'ADMIN' : 'USER'}</span></td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{u.totalCompras}</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: theme.warning }}>${u.totalGastado?.toLocaleString('es-CO')}</td>
                  <td style={{ ...tdStyle, color: theme.textMuted, fontSize: '0.78rem' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-CO') : '—'}</td>
                </tr>
              ))}
              {(stats?.ultimosUsuarios ?? []).length === 0 && (
                <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: theme.textMuted, padding: '40px' }}>No hay usuarios registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>
    </motion.div>
  );

  const renderEventos = () => (
    <motion.div key="eventos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {showForm ? (
        <Section icon="calendar" title={editingEvento ? 'Editar Evento' : 'Nuevo Evento'}>
          <form onSubmit={handleSubmitEvento} style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>NOMBRE DEL EVENTO</label>
              <input required style={inputStyle} value={formEvento.nombre} onChange={e => setFormEvento({ ...formEvento, nombre: e.target.value })} placeholder="Ej. Dopamina Warehouse Sessions" />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>DESCRIPCIÓN</label>
              <textarea style={{ ...inputStyle, height: '80px', resize: 'vertical' }} value={formEvento.descripcion} onChange={e => setFormEvento({ ...formEvento, descripcion: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>FECHA</label>
              <input required type="date" style={inputStyle} value={formEvento.fecha} onChange={e => setFormEvento({ ...formEvento, fecha: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>HORA</label>
              <input required type="time" style={inputStyle} value={formEvento.hora} onChange={e => setFormEvento({ ...formEvento, hora: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>LUGAR</label>
              <input required style={inputStyle} value={formEvento.lugar} onChange={e => setFormEvento({ ...formEvento, lugar: e.target.value })} placeholder="Ej. Salón Amador" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>CIUDAD</label>
              <input required style={inputStyle} value={formEvento.ciudad} onChange={e => setFormEvento({ ...formEvento, ciudad: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>PRECIO REGULAR (COP)</label>
              <input type="number" style={inputStyle} value={formEvento.precio} onChange={e => setFormEvento({ ...formEvento, precio: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>PRECIO PREVENTA (COP - Opcional)</label>
              <input type="number" style={inputStyle} value={formEvento.precioPreventa} onChange={e => setFormEvento({ ...formEvento, precioPreventa: e.target.value })} placeholder="Ej. 25000" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>BOLETAS PREVENTA (Opcional)</label>
              <input type="number" style={inputStyle} value={formEvento.cantidadPreventa} onChange={e => setFormEvento({ ...formEvento, cantidadPreventa: e.target.value })} placeholder="Ej. 100" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>AFAORO / CAPACIDAD TOTAL</label>
              <input type="number" style={inputStyle} value={formEvento.capacidad} onChange={e => setFormEvento({ ...formEvento, capacidad: e.target.value })} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>IMAGEN URL</label>
              <input style={inputStyle} value={formEvento.imagenUrl} onChange={e => setFormEvento({ ...formEvento, imagenUrl: e.target.value })} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>LINE UP</label>
              <input style={inputStyle} value={formEvento.lineup} onChange={e => setFormEvento({ ...formEvento, lineup: e.target.value })} placeholder="Artistas separados por coma" />
            </div>
            <div style={{ display: 'flex', gap: '24px', gridColumn: 'span 2' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: theme.textSec }}>
                <input type="checkbox" checked={formEvento.activo} onChange={e => setFormEvento({ ...formEvento, activo: e.target.checked })} style={{ accentColor: theme.accent }} />
                Activo
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: theme.textSec }}>
                <input type="checkbox" checked={formEvento.destacado} onChange={e => setFormEvento({ ...formEvento, destacado: e.target.checked })} style={{ accentColor: theme.accent }} />
                Destacado
              </label>
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setShowForm(false); setEditingEvento(null); }} style={btnGhost}>Cancelar</button>
              <button type="submit" style={btnPrimary}>Guardar Evento</button>
            </div>
          </form>
        </Section>
      ) : (
        <Section icon="calendar" title={`Gestión de Eventos (${filteredEventos.length})`}
          extra={
            <button onClick={() => { setEditingEvento(null); setFormEvento({ nombre: '', descripcion: '', fecha: '', hora: '', lugar: '', ciudad: 'Medellín', precio: 0, capacidad: 100, imagenUrl: '', lineup: '', activo: true, destacado: false, precioPreventa: '', cantidadPreventa: '' }); setShowForm(true); }}
              style={{ ...btnPrimary, padding: '8px 18px' }}>
              + Nuevo Evento
            </button>
          }
        >
          <input style={inputStyle} placeholder="Buscar evento por nombre, lugar o ciudad..." value={searchEvento} onChange={e => setSearchEvento(e.target.value)} />
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead><tr>
                {['#', 'Nombre', 'Fecha/Hora', 'Lugar', 'Precio', 'Aforo', 'Destacado', 'Estado', 'Acciones'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filteredEventos.map(e => (
                  <tr key={e.id}
                    onMouseEnter={el => el.currentTarget.style.background = theme.cardHover}
                    onMouseLeave={el => el.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...tdStyle, color: theme.accent, fontFamily: "'JetBrains Mono', monospace" }}>#{e.id}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: theme.text }}>{e.nombre}</td>
                    <td style={tdStyle}><div>{e.fecha}</div><div style={{ fontSize: '11px', color: theme.textMuted }}>{e.hora ? e.hora.slice(0,5) : ''}</div></td>
                    <td style={tdStyle}><div>{e.lugar}</div><div style={{ fontSize: '11px', color: theme.textMuted }}>{e.ciudad}</div></td>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>{e.precio === 0 ? 'GRATIS' : `$${Number(e.precio).toLocaleString('es-CO')}`}</td>
                    <td style={tdStyle}>{e.capacidad}</td>
                    <td><span style={badgeStyle(e.destacado ? theme.warning : theme.textMuted)}>{e.destacado ? 'DESTACADO' : 'NO'}</span></td>
                    <td>
                      <button onClick={() => handleToggleEvento(e.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <span style={badgeStyle(e.activo ? theme.success : theme.danger)}>{e.activo ? 'ACTIVO' : 'INACTIVO'}</span>
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => { setEditingEvento(e); setFormEvento({ nombre: e.nombre||'', descripcion: e.descripcion||'', fecha: e.fecha||'', hora: e.hora||'', lugar: e.lugar||'', ciudad: e.ciudad||'Medellín', precio: e.precio||0, capacidad: e.capacidad||100, imagenUrl: e.imagenUrl||'', lineup: e.lineup||'', activo: e.activo!==undefined?e.activo:true, destacado: e.destacado!==undefined?e.destacado:false, precioPreventa: e.precioPreventa!==null&&e.precioPreventa!==undefined?e.precioPreventa:'', cantidadPreventa: e.cantidadPreventa!==null&&e.cantidadPreventa!==undefined?e.cantidadPreventa:'' }); setShowForm(true); }}
                          style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${theme.border}`, color: theme.textSec, borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Editar</button>
                        <button onClick={() => handleDeleteEvento(e.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: theme.danger, borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEventos.length === 0 && <tr><td colSpan={9} style={{ ...tdStyle, textAlign: 'center', color: theme.textMuted, padding: '40px' }}>No se encontraron eventos.</td></tr>}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </motion.div>
  );

  const renderArtistas = () => (
    <motion.div key="artistas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {showArtistaForm ? (
        <Section icon="music" title={editingArtista ? 'Editar Artista' : 'Nuevo Artista'}>
          <form onSubmit={handleSubmitArtista} style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>NOMBRE ARTÍSTICO</label>
              <input required style={inputStyle} value={formArtista.nombre} onChange={e => setFormArtista({ ...formArtista, nombre: e.target.value })} placeholder="Ej. Charlotte de Witte" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>GÉNERO</label>
              <input required style={inputStyle} value={formArtista.genero} onChange={e => setFormArtista({ ...formArtista, genero: e.target.value })} placeholder="Ej. Techno" />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>BIOGRAFÍA</label>
              <textarea style={{ ...inputStyle, height: '80px', resize: 'vertical' }} value={formArtista.bio} onChange={e => setFormArtista({ ...formArtista, bio: e.target.value })} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>IMAGEN URL</label>
              <input style={inputStyle} value={formArtista.imagenUrl} onChange={e => setFormArtista({ ...formArtista, imagenUrl: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>INSTAGRAM</label>
              <input style={inputStyle} value={formArtista.instagramUrl} onChange={e => setFormArtista({ ...formArtista, instagramUrl: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>SOUNDCLOUD</label>
              <input style={inputStyle} value={formArtista.soundcloudUrl} onChange={e => setFormArtista({ ...formArtista, soundcloudUrl: e.target.value })} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: theme.textSec }}>
                <input type="checkbox" checked={formArtista.local} onChange={e => setFormArtista({ ...formArtista, local: e.target.checked })} style={{ accentColor: theme.accent }} />
                Artista Local
              </label>
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setShowArtistaForm(false); setEditingArtista(null); }} style={btnGhost}>Cancelar</button>
              <button type="submit" style={btnPrimary}>Guardar Artista</button>
            </div>
          </form>
        </Section>
      ) : (
        <Section icon="music" title={`Control de Artistas (${filteredArtistas.length})`}
          extra={<button onClick={() => { setEditingArtista(null); setFormArtista({ nombre: '', genero: '', bio: '', imagenUrl: '', instagramUrl: '', soundcloudUrl: '', local: true }); setShowArtistaForm(true); }} style={{ ...btnPrimary, padding: '8px 18px' }}>+ Nuevo Artista</button>}
        >
          <input style={inputStyle} placeholder="Buscar artista por nombre o género..." value={searchArtista} onChange={e => setSearchArtista(e.target.value)} />
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead><tr>
                {['#', 'Imagen', 'Nombre', 'Género', 'Tipo', 'Redes', 'Acciones'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filteredArtistas.map(art => (
                  <tr key={art.id}
                    onMouseEnter={el => el.currentTarget.style.background = theme.cardHover}
                    onMouseLeave={el => el.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...tdStyle, color: theme.accent, fontFamily: "'JetBrains Mono', monospace" }}>#{art.id}</td>
                    <td>{art.imagenUrl ? <img src={art.imagenUrl} alt={art.nombre} style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px', border: `1px solid ${theme.border}` }} /> : <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted }}>🎵</div>}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: theme.text }}>{art.nombre}</td>
                    <td><span style={badgeStyle(theme.accent)}>{art.genero}</span></td>
                    <td><span style={badgeStyle(art.local ? theme.success : theme.warning)}>{art.local ? 'LOCAL' : 'INVITADO'}</span></td>
                    <td style={tdStyle}><div style={{ display: 'flex', gap: '8px' }}>{art.instagramUrl && <a href={art.instagramUrl} target="_blank" rel="noopener noreferrer" style={{ color: theme.textMuted, textDecoration: 'none' }}>📸</a>}{art.soundcloudUrl && <a href={art.soundcloudUrl} target="_blank" rel="noopener noreferrer" style={{ color: theme.textMuted, textDecoration: 'none' }}>🎧</a>}</div></td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => { setEditingArtista(art); setFormArtista({ nombre: art.nombre||'', genero: art.genero||'', bio: art.bio||'', imagenUrl: art.imagenUrl||'', instagramUrl: art.instagramUrl||'', soundcloudUrl: art.soundcloudUrl||'', local: art.local!==undefined?art.local:true }); setShowArtistaForm(true); }}
                          style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${theme.border}`, color: theme.textSec, borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Editar</button>
                        <button onClick={() => handleDeleteArtista(art.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: theme.danger, borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredArtistas.length === 0 && <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: theme.textMuted, padding: '40px' }}>No se encontraron artistas.</td></tr>}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </motion.div>
  );

  const renderCompras = () => (
    <motion.div key="compras" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Section 
        icon="ticket" 
        title={`Todas las Compras (${filteredCompras.length})`}
        extra={
          <button onClick={exportComprasToCSV} style={{ ...btnPrimary, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📥 Exportar CSV
          </button>
        }
      >
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <input style={{ ...inputStyle, marginBottom: 0 }} placeholder="Buscar por nombre, email o ID..." value={searchCompra} onChange={e => setSearchCompra(e.target.value)} />
          </div>
          <select
            value={filtroEstadoCompra}
            onChange={(e) => setFiltroEstadoCompra(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              color: theme.text,
              fontSize: '0.85rem',
              padding: '10px 16px',
              cursor: 'pointer',
              outline: 'none',
              minWidth: '180px'
            }}
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="PAGADO">PAGADO</option>
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="RECHAZADO">RECHAZADO</option>
          </select>
          <select
            value={filtroTipoCompra}
            onChange={(e) => setFiltroTipoCompra(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              color: theme.text,
              fontSize: '0.85rem',
              padding: '10px 16px',
              cursor: 'pointer',
              outline: 'none',
              minWidth: '160px'
            }}
          >
            <option value="TODOS">Todos los Tipos</option>
            <option value="COMBO">Combos</option>
            <option value="INDIVIDUAL">Individuales</option>
          </select>
          <span style={{ fontSize: '0.75rem', color: theme.textMuted, alignSelf: 'center', fontFamily: "'JetBrains Mono', monospace" }}>{filteredCompras.length} resultado{filteredCompras.length !== 1 ? 's' : ''}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead><tr>
              {['#', 'Usuario', 'Email', 'Evento', 'Tipo', 'Cant.', 'Subtotal', 'Descuento', 'Total', 'Cupón', 'Estado', 'Código QR', 'Fecha', 'Acción'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filteredCompras.map(c => (
                <tr key={c.id}
                  onMouseEnter={e => e.currentTarget.style.background = theme.cardHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ ...tdStyle, color: theme.accent, fontFamily: "'JetBrains Mono', monospace" }}>#{c.id}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: theme.text }}>{c.usuarioNombre}</td>
                  <td style={{ ...tdStyle, color: theme.textMuted, fontSize: '0.8rem' }}>{c.usuarioEmail}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: theme.info }}>{c.eventoNombre || 'General'}</td>
                  <td style={tdStyle}>{c.comboNombre ? <span style={{ ...badgeStyle('#f59e0b'), fontSize: '0.7rem' }}>Combo: {c.comboNombre}</span> : <span style={{ color: theme.textMuted, fontSize: '0.8rem' }}>Individual</span>}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700 }}>{c.cantidad}</td>
                  <td style={tdStyle}>{c.subtotal ? `$${c.subtotal.toLocaleString('es-CO')}` : '—'}</td>
                  <td style={{ ...tdStyle, color: c.descuento > 0 ? theme.success : theme.textMuted }}>{c.descuento > 0 ? `-$${c.descuento.toLocaleString('es-CO')}` : '—'}</td>
                  <td style={{ ...tdStyle, fontWeight: 800, color: theme.text }}>${c.total?.toLocaleString('es-CO')}</td>
                  <td>{c.codigoCupon ? <span style={badgeStyle(theme.accent)}>{c.codigoCupon}</span> : <span style={{ color: theme.textMuted }}>—</span>}</td>
                  <td><span style={badgeStyle(c.estado === 'PAGADO' ? theme.success : theme.warning)}>{c.estado}</span></td>
                  <td style={{ ...tdStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: theme.textMuted, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.codigoQr}</td>
                  <td style={{ ...tdStyle, color: theme.textMuted, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{c.createdAt ? new Date(c.createdAt).toLocaleString('es-CO') : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {c.estado !== 'PAGADO' && (
                        <button 
                          onClick={() => setEmailModal({
                            open: true,
                            to: c.usuarioEmail,
                            subject: `Dopamina Crew - ¿Alguna duda con tu reserva para ${c.eventoNombre || 'el evento'}?`,
                            body: `Hola ${c.usuarioNombre},\n\nVimos que intentaste adquirir entradas para ${c.eventoNombre || 'nuestro evento'} pero el pago no se completó (estado: ${c.estado}).\n\n¿Tuviste algún problema o tienes alguna duda? Puedes responder directamente a este correo o escribirle a nuestro Dopa-Raver en la web.\n\n¡Esperamos verte en la pista de baile! 🖤`,
                            loading: false,
                            success: '',
                            error: ''
                          })} 
                          style={{ 
                            background: 'rgba(177,78,255,0.1)', border: `1px solid ${theme.border}`, color: theme.accentLight, 
                            borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          📨 Recordar
                        </button>
                      )}
                      {c.estado === 'PENDIENTE' && (
                        <button 
                          onClick={() => handleVerifyPayment(c.id)} 
                          style={{ 
                            background: 'rgba(59,130,246,0.1)', border: `1px solid ${theme.border}`, color: '#60A5FA', 
                            borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          🔍 Verificar
                        </button>
                      )}
                      {api.getUser()?.rol === 'ROLE_ADMIN' && (
                        <button onClick={() => handleDeleteCompra(c.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: theme.danger, borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Icon name="trash" size={14} /> Eliminar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCompras.length === 0 && <tr><td colSpan={13} style={{ ...tdStyle, textAlign: 'center', color: theme.textMuted, padding: '40px' }}>No se encontraron compras.</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>
    </motion.div>
  );

  const renderUsuarios = () => (
    <motion.div key="usuarios" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Section 
        icon="users" 
        title={`Todos los Usuarios (${filteredUsuarios.length})`}
        extra={
          <button onClick={exportUsuariosToCSV} style={{ ...btnPrimary, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📥 Exportar CSV
          </button>
        }
      >
        <input style={inputStyle} placeholder="Buscar por nombre o email..." value={searchUser} onChange={e => setSearchUser(e.target.value)} />
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead><tr>
              {['#', 'Nombre', 'Email', 'Teléfono', 'Rol', 'Compras', 'Gastado', 'Registro', 'Estado', 'Acciones'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filteredUsuarios.map(u => (
                <tr key={u.id}
                  onMouseEnter={e => e.currentTarget.style.background = theme.cardHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ ...tdStyle, color: theme.info, fontFamily: "'JetBrains Mono', monospace" }}>#{u.id}</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: theme.text }}>{u.nombre}</td>
                  <td style={{ ...tdStyle, color: theme.textMuted, fontSize: '0.8rem' }}>{u.email}</td>
                  <td style={{ ...tdStyle, color: theme.textMuted }}>{u.telefono}</td>
                  <td>
                    {(() => {
                      const currentUser = api.getUser();
                      const isAdmin = currentUser?.rol === 'ROLE_ADMIN';
                      const isSelf = currentUser?.id === u.id;

                      if (isAdmin && !isSelf) {
                        return (
                          <select
                            value={u.rol}
                            onChange={(e) => handleChangeUserRole(u.id, e.target.value, u.nombre)}
                            style={{
                              background: theme.bg,
                              border: `1px solid ${theme.border}`,
                              borderRadius: '6px',
                              color: theme.text,
                              fontSize: '0.75rem',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              outline: 'none',
                            }}
                          >
                            <option value="ROLE_USER">USER</option>
                            <option value="ROLE_PROMOTER">PROMOTOR</option>
                            <option value="ROLE_SUBADMIN">SUBADMIN</option>
                            <option value="ROLE_ADMIN">ADMIN</option>
                          </select>
                        );
                      } else {
                        return (
                          <span style={badgeStyle(u.rol === 'ROLE_ADMIN' ? theme.warning : u.rol === 'ROLE_SUBADMIN' ? theme.accent : (u.rol === 'ROLE_PROMOTER' ? theme.success : theme.info))}>
                            {u.rol === 'ROLE_ADMIN' ? 'ADMIN' : u.rol === 'ROLE_SUBADMIN' ? 'SUBADMIN' : (u.rol === 'ROLE_PROMOTER' ? 'PROMOTOR' : 'USER')}
                          </span>
                        );
                      }
                    })()}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: theme.accent }}>{u.totalCompras}</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: theme.warning }}>${u.totalGastado?.toLocaleString('es-CO')}</td>
                  <td style={{ ...tdStyle, color: theme.textMuted, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-CO') : '—'}</td>
                  <td><span style={badgeStyle(u.banned ? theme.danger : theme.success)}>{u.banned ? 'SUSPENDIDO' : 'ACTIVO'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {u.rol !== 'ROLE_ADMIN' && (
                        <button onClick={() => handleToggleBanUsuario(u.id, u.banned, u.nombre)}
                          style={{ background: u.banned ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: u.banned ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)', color: u.banned ? theme.success : theme.danger, borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {u.banned ? 'Habilitar' : 'Suspender'}
                        </button>
                      )}
                      <button onClick={() => u.rol !== 'ROLE_ADMIN' && handleDeleteUsuario(u.id)} disabled={u.rol === 'ROLE_ADMIN'}
                        style={{ background: u.rol === 'ROLE_ADMIN' ? 'transparent' : 'rgba(239,68,68,0.1)', border: `1px solid ${u.rol === 'ROLE_ADMIN' ? 'transparent' : 'rgba(239,68,68,0.2)'}`, color: u.rol === 'ROLE_ADMIN' ? theme.textMuted : theme.danger, borderRadius: '6px', padding: '5px 10px', cursor: u.rol === 'ROLE_ADMIN' ? 'not-allowed' : 'pointer', fontSize: '0.78rem', fontWeight: 600, opacity: u.rol === 'ROLE_ADMIN' ? 0.4 : 1 }}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsuarios.length === 0 && <tr><td colSpan={10} style={{ ...tdStyle, textAlign: 'center', color: theme.textMuted, padding: '40px' }}>No se encontraron usuarios.</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>
    </motion.div>
  );

  const renderCanjes = () => (
    <motion.div key="canjes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Section icon="gift" title={`Control de Premios Canjeados (${filteredCanjes.length})`}>
        <p style={{ color: theme.textSec, fontSize: '0.85rem', marginBottom: '16px', lineHeight: 1.5 }}>
          Monitoree todos los premios y reclamos. Al entregar un premio, marque como <strong style={{ color: theme.success }}>ENTREGADO</strong>.
        </p>
        <input style={inputStyle} placeholder="Buscar canjes por código, usuario o premio..." value={searchCanje} onChange={e => setSearchCanje(e.target.value)} />
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead><tr>
              {['#', 'Usuario', 'Email', 'Premio', 'Código', 'Puntos', 'Estado', 'Fecha', 'Acciones'].map(h => <th key={h} style={thStyle}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filteredCanjes.map(c => (
                <tr key={c.id}
                  onMouseEnter={e => e.currentTarget.style.background = theme.cardHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ ...tdStyle, color: theme.accent, fontFamily: "'JetBrains Mono', monospace" }}>#{c.id}</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: theme.text }}>{c.usuarioNombre}</td>
                  <td style={{ ...tdStyle, color: theme.textMuted, fontSize: '0.8rem' }}>{c.usuarioEmail}</td>
                  <td style={{ ...tdStyle, color: theme.text, fontWeight: 600 }}>{c.premioTitulo}</td>
                  <td><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', padding: '3px 8px', borderRadius: '4px', background: theme.bg, border: `1px solid ${theme.border}`, color: theme.accentLight, letterSpacing: '1px', fontWeight: 700 }}>{c.codigoCanje}</span></td>
                  <td style={{ ...tdStyle, color: theme.warning, fontWeight: 700 }}>{c.costoPuntos} PTS</td>
                  <td><span style={badgeStyle(c.estado === 'PENDIENTE' ? theme.warning : theme.success)}>{c.estado}</span></td>
                  <td style={{ ...tdStyle, color: theme.textMuted, fontSize: '0.78rem' }}>{c.createdAt ? new Date(c.createdAt).toLocaleString('es-CO') : '—'}</td>
                  <td>
                    {c.estado === 'PENDIENTE' ? (
                      <button onClick={() => handleDeliverCanje(c.id)} style={{ background: `linear-gradient(135deg, ${theme.success}, #059669)`, border: 'none', color: '#fff', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Marcar Entregado</button>
                    ) : <span style={{ color: theme.success, fontSize: '0.75rem', fontWeight: 700 }}>✓ Entregado</span>}
                  </td>
                </tr>
              ))}
              {filteredCanjes.length === 0 && <tr><td colSpan={9} style={{ ...tdStyle, textAlign: 'center', color: theme.textMuted, padding: '40px' }}>No se encontraron canjes.</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>
    </motion.div>
  );

  const renderPuerta = () => (
    <motion.div key="puerta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        <div style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Section icon="scan" title="Control de Acceso — Validación en Puerta">
            <form onSubmit={handleScanSubmit} style={{ marginBottom: '24px' }}>
              <p style={{ color: theme.textSec, fontSize: '0.85rem', marginBottom: '12px' }}>Ingrese o escanee el código QR:</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input ref={inputRef} type="text" style={{ flex: 1, padding: '14px 20px', background: 'rgba(0,0,0,0.3)', border: `2px solid ${theme.accent}66`, borderRadius: '10px', color: theme.text, fontSize: '1rem', fontFamily: "'JetBrains Mono', monospace", outline: 'none' }} placeholder="Esperando código QR..." value={codigoQrInput} onChange={e => setCodigoQrInput(e.target.value)} disabled={scanning} />
                <button type="submit" disabled={scanning || !codigoQrInput.trim()}
                  style={{ ...btnPrimary, padding: '0 28px', opacity: scanning || !codigoQrInput.trim() ? 0.6 : 1, cursor: scanning || !codigoQrInput.trim() ? 'not-allowed' : 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Validar
                </button>
              </div>
            </form>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button type="button" onClick={() => { if (cameraActive) stopCamera(); setCameraMode(!cameraMode); setScanResult(null); }}
                style={{ padding: '10px 16px', borderRadius: '8px', border: `1px solid ${theme.accent}66`, background: cameraMode ? 'rgba(177,78,255,0.1)' : 'transparent', color: theme.text, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                {cameraMode ? 'Usar Lector Manual' : 'Usar Cámara'}
              </button>
            </div>

            {cameraMode ? (
              <div style={{ position: 'relative', height: '320px', background: 'rgba(0,0,0,0.5)', border: `1px dashed ${theme.accent}44`, borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '20px' }}>
                {cameraActive ? (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }} />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
                      <button type="button" onClick={stopCamera} style={{ background: 'rgba(239,68,68,0.8)', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer' }}>Apagar</button>
                    </div>
                    <motion.div animate={{ y: [-130, 130] }} transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                      style={{ position: 'absolute', left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, #ff4444, transparent)', boxShadow: '0 0 10px #ff4444', zIndex: 5 }} />
                  </>
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center' }}>
                    <button type="button" onClick={startCamera} style={btnPrimary}>Activar Cámara</button>
                    {cameraError && <p style={{ color: theme.danger, fontSize: '0.8rem', marginTop: '12px' }}>{cameraError}</p>}
                  </div>
                )}
              </div>
            ) : !scanResult && (
              <div style={{ height: '260px', background: 'rgba(0,0,0,0.3)', border: `1px dashed ${theme.border}`, borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                <motion.div animate={{ y: [-110, 110] }} transition={{ duration: 2.2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                  style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)`, boxShadow: `0 0 12px ${theme.accent}`, zIndex: 5 }} />
                <div style={{ color: theme.accent, marginBottom: '16px' }}><Icon name="scan" size={32} /></div>
                <span style={{ fontSize: '0.85rem', color: theme.textMuted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '2px', textTransform: 'uppercase' }}>
                  {scanning ? 'PROCESANDO...' : 'LECTOR ACTIVO'}
                </span>
                <p style={{ color: theme.textMuted, fontSize: '0.75rem', marginTop: '8px', textAlign: 'center', maxWidth: '300px' }}>Terminal lista. Escanee un código QR.</p>
              </div>
            )}

            {scanResult && (
              <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                style={{ borderRadius: '14px', border: `2px solid ${scanResult.success ? theme.success : theme.danger}`, background: scanResult.success ? `radial-gradient(circle at center, ${theme.success}08, transparent 100%)` : `radial-gradient(circle at center, ${theme.danger}08, transparent 100%)`, padding: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '3px', color: scanResult.success ? theme.success : theme.danger, marginBottom: '8px', textShadow: `0 0 20px ${scanResult.success ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}` }}>
                  {scanResult.message}
                </div>
                {scanResult.success ? (
                  <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '20px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.success }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: theme.success, letterSpacing: '1px', textTransform: 'uppercase' }}>Ingreso Permitido</span>
                    </div>
                    <div style={{ width: '100%', maxWidth: '520px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', textAlign: 'left' }}>
                      <div><span style={{ fontSize: '0.7rem', color: theme.textMuted, textTransform: 'uppercase', fontWeight: 700 }}>Asistente</span><span style={{ fontSize: '1rem', fontWeight: 700, color: theme.text, display: 'block', marginTop: '4px' }}>{scanResult.boleta.usuarioNombre || 'Desconocido'}</span></div>
                      <div><span style={{ fontSize: '0.7rem', color: theme.textMuted, textTransform: 'uppercase', fontWeight: 700 }}>ID Entrada</span><span style={{ fontSize: '1rem', fontWeight: 700, color: theme.accent, display: 'block', marginTop: '4px', fontFamily: "'JetBrains Mono', monospace" }}>#{scanResult.boleta.id}</span></div>
                      <div style={{ gridColumn: 'span 2' }}><span style={{ fontSize: '0.7rem', color: theme.textMuted, textTransform: 'uppercase', fontWeight: 700 }}>Evento</span><span style={{ fontSize: '1.1rem', fontWeight: 800, color: theme.text, display: 'block', marginTop: '4px' }}>{scanResult.boleta.eventoNombre}</span></div>
                      <div><span style={{ fontSize: '0.7rem', color: theme.textMuted, textTransform: 'uppercase', fontWeight: 700 }}>Fecha</span><span style={{ fontSize: '0.85rem', color: theme.textSec, display: 'block', marginTop: '4px' }}>{scanResult.boleta.eventoFecha}</span></div>
                      <div><span style={{ fontSize: '0.7rem', color: theme.textMuted, textTransform: 'uppercase', fontWeight: 700 }}>Lugar</span><span style={{ fontSize: '0.85rem', color: theme.textSec, display: 'block', marginTop: '4px' }}>{scanResult.boleta.eventoLugar}</span></div>

                      {scanResult.boleta.comboNombre && (
                        <div style={{
                          gridColumn: 'span 2',
                          background: 'rgba(177, 78, 255, 0.15)',
                          border: `2px dashed ${theme.accent}`,
                          borderRadius: '8px',
                          padding: '16px',
                          marginTop: '8px'
                        }}>
                          <span style={{ fontSize: '0.7rem', color: theme.accentLight, textTransform: 'uppercase', fontWeight: 900, display: 'block', letterSpacing: '1px' }}>COMBO ADQUIRIDO</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff', display: 'block', marginTop: '4px' }}>{scanResult.boleta.comboNombre}</span>
                          
                          {scanResult.boleta.comboItemClaims && scanResult.boleta.comboItemClaims.length > 0 ? (
                            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <span style={{ fontSize: '0.65rem', color: theme.textMuted, textTransform: 'uppercase', fontWeight: 700 }}>Entrega de items en barra:</span>
                              {scanResult.boleta.comboItemClaims.map((claim) => (
                                <div key={claim.id} style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  background: claim.reclamado ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.3)',
                                  border: `1px solid ${claim.reclamado ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
                                  borderRadius: '6px', padding: '10px 12px'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '1.1rem' }}>{claim.reclamado ? '✅' : '⬜'}</span>
                                    <div>
                                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: claim.reclamado ? '#4ade80' : '#fff' }}>{claim.itemNombre}</span>
                                      {claim.reclamado && (
                                        <span style={{ fontSize: '0.65rem', color: theme.textMuted, display: 'block', marginTop: '2px' }}>
                                          Entregado por {claim.reclamadoPorNombre} {claim.reclamadoAt ? new Date(claim.reclamadoAt).toLocaleTimeString('es-CO') : ''}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={async () => {
                                      try {
                                        if (claim.reclamado) {
                                          await api.adminUnclaimComboItem(scanResult.boleta.compraId, claim.itemNombre);
                                        } else {
                                          await api.adminClaimComboItem(scanResult.boleta.compraId, claim.itemNombre);
                                        }
                                        const updatedClaims = await api.adminGetComboClaims(scanResult.boleta.compraId);
                                        setScanResult(prev => ({
                                          ...prev,
                                          boleta: { ...prev.boleta, comboItemClaims: updatedClaims }
                                        }));
                                      } catch (e) {
                                        alert('Error actualizando item: ' + (e.message || 'Error'));
                                      }
                                    }}
                                    style={{
                                      padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                                      fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                                      background: claim.reclamado ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                                      color: claim.reclamado ? '#f87171' : '#4ade80'
                                    }}
                                  >
                                    {claim.reclamado ? 'Desmarcar' : 'Entregado'}
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ marginTop: '10px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px' }}>
                              <span style={{ fontSize: '0.65rem', color: theme.textMuted, textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>Entregar en barra:</span>
                              <span style={{ fontSize: '0.9rem', color: '#4ade80', fontWeight: 800 }}>{scanResult.boleta.comboItems || 'Sin ítems adicionales registrados.'}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {scanResult.boleta.requiereVerificacionCumple && (
                        <div style={{
                          gridColumn: 'span 2',
                          background: 'rgba(245, 158, 11, 0.15)',
                          border: '2px dashed #f59e0b',
                          borderRadius: '8px',
                          padding: '16px',
                          marginTop: '8px'
                        }}>
                          <span style={{ fontSize: '0.75rem', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            🎂 VERIFICACIÓN FÍSICA OBLIGATORIA
                          </span>
                          <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 800, display: 'block', marginTop: '4px' }}>
                            Combo Cumpleañero: ¡Solicitar cédula física original para corroborar que el asistente cumple años este mes!
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#f59e0b', display: 'block', marginTop: '4px' }}>
                            Si la fecha de nacimiento no corresponde al mes actual, el descuento NO es válido y se debe denegar el ingreso o cobrar el excedente.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '20px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.danger }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: theme.danger, letterSpacing: '1px', textTransform: 'uppercase' }}>Ingreso Rechazado</span>
                    </div>
                    <p style={{ color: theme.textSec, fontSize: '0.9rem', marginTop: '16px' }}>{scanResult.message}</p>
                  </div>
                )}
                <button onClick={() => { setScanResult(null); if (cameraMode) { startCamera(); } else if(inputRef.current) inputRef.current.focus(); }}
                  style={{ marginTop: '24px', background: `1px solid ${theme.border}`, border: `1px solid ${theme.borderLight}`, color: theme.text, borderRadius: '8px', padding: '10px 24px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                  Siguiente Escaneo
                </button>
              </motion.div>
            )}
          </Section>
        </div>

        <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Section icon="users" title={`Últimos Ingresos (${recentScans.length})`}
            extra={recentScans.length > 0 && (
              <button type="button" onClick={async () => { if (window.confirm("¿Limpiar el registro histórico de ingresos?")) { try { await api.adminClearLogsAcceso(); setRecentScans([]); } catch(e) { alert("Error."); } } }}
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: theme.danger, fontSize: '0.65rem', padding: '4px 10px', cursor: 'pointer', fontWeight: 700, textTransform: 'uppercase' }}>Limpiar</button>
            )}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '480px', overflowY: 'auto' }}>
              {recentScans.map(scan => (
                <div key={scan.id} onClick={async () => {
                  if (!scan.codigoQr || scanning) return;
                  setScanning(true); setScanResult(null);
                  try {
                    const res = await api.adminGetBoletaByQr(scan.codigoQr);
                    setScanResult({ success: true, message: scan.estado === 'SUCCESS' ? 'ACCESO PERMITIDO' : 'ACCESO DENEGADO', boleta: res });
                  } catch (err) {
                    setScanResult({ success: false, message: err.message || 'No se pudo cargar la info.' });
                  } finally { setScanning(false); }
                }} style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${scan.estado === 'SUCCESS' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scan.usuarioNombre || 'Desconocido'}</span>
                      <span style={{ fontSize: '0.7rem', color: theme.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{scan.createdAt ? new Date(scan.createdAt).toLocaleTimeString('es-CO') : '—'}</span>
                    </div>
                    <p style={{ color: theme.textMuted, fontSize: '0.75rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scan.eventoNombre || 'Evento'} — {(scan.codigoQr||'').substring(0, 15)}...</p>
                  </div>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, background: scan.estado === 'SUCCESS' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: scan.estado === 'SUCCESS' ? theme.success : theme.danger }}>
                    {scan.estado === 'SUCCESS' ? 'OK' : 'DENIED'}
                  </span>
                </div>
              ))}
              {recentScans.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: theme.textMuted, fontSize: '0.85rem' }}>Sin registros.</div>}
            </div>
          </Section>
        </div>
      </div>
    </motion.div>
  );

  const handleGiftTickets = async (e) => {
    e.preventDefault();
    if (!formRegalo.eventoId || !formRegalo.nombre || !formRegalo.email || !formRegalo.cantidad) {
      setErrorRegalo('Por favor complete todos los campos obligatorios.');
      return;
    }
    setLoadingRegalo(true);
    setErrorRegalo('');
    setSuccessRegalo('');
    try {
      await api.adminRegalarBoletas({
        eventoId: parseInt(formRegalo.eventoId),
        nombre: formRegalo.nombre,
        email: formRegalo.email,
        telefono: formRegalo.telefono || '3000000000',
        cantidad: parseInt(formRegalo.cantidad),
        nota: formRegalo.nota || ''
      });
      setSuccessRegalo(`¡Boletas de cortesía enviadas con éxito a ${formRegalo.nombre}!`);
      setFormRegalo({ eventoId: '', nombre: '', email: '', telefono: '', cantidad: 1, nota: '' });
      fetchAll();
    } catch (err) {
      setErrorRegalo(err.message || 'Error al regalar boletas.');
    } finally {
      setLoadingRegalo(false);
    }
  };

  const renderRegalos = () => {
    const filteredRegaloUsers = usuarios.filter(u =>
      !searchRegaloUser ||
      u.nombre?.toLowerCase().includes(searchRegaloUser.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchRegaloUser.toLowerCase())
    );

    return (
      <motion.div key="regalos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <Section icon="gift" title="Regalar Boletas (Entradas de Cortesía)">
          <p style={{ color: theme.textSec, fontSize: '0.85rem', marginBottom: '24px', lineHeight: 1.5 }}>
            Genera boletas gratuitas para invitados especiales, organizadores o relaciones públicas. Se creará la compra en estado <strong style={{ color: theme.success }}>PAGADO</strong> a valor $0 y se enviará el correo con los códigos QR automáticamente al beneficiario.
          </p>

          {errorRegalo && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.2)`, borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: theme.danger, fontSize: '0.85rem' }}>
              ⚠️ {errorRegalo}
            </div>
          )}

          {successRegalo && (
            <div style={{ background: 'rgba(74,222,128,0.1)', border: `1px solid rgba(74,222,128,0.2)`, borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', color: theme.success, fontSize: '0.85rem' }}>
              ✅ {successRegalo}
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
            {/* Columna Izquierda: Listado de Usuarios */}
            <div style={{ flex: '1 1 300px', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '12px', borderRight: isMobile ? 'none' : `1px solid ${theme.border}`, paddingRight: isMobile ? '0' : '24px' }}>
              <h4 style={{ color: theme.text, fontSize: '0.85rem', fontWeight: 800, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Seleccionar Usuario Creado</h4>
              <p style={{ color: theme.textMuted, fontSize: '0.75rem', margin: '0 0 12px' }}>Busca un usuario para auto-completar el formulario.</p>
              
              <input
                type="text"
                placeholder="Buscar usuario..."
                value={searchRegaloUser}
                onChange={e => setSearchRegaloUser(e.target.value)}
                style={{ ...inputStyle, marginBottom: '12px' }}
              />

              <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                {filteredRegaloUsers.map(u => (
                  <div 
                    key={u.id} 
                    onClick={() => {
                      setFormRegalo(prev => ({
                        ...prev,
                        nombre: u.nombre || '',
                        email: u.email || '',
                        telefono: u.telefono || ''
                      }));
                    }}
                    style={{ 
                      padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${theme.border}`, cursor: 'pointer', display: 'flex', 
                      flexDirection: 'column', gap: '2px', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = theme.cardHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  >
                    <span style={{ color: theme.text, fontWeight: 700, fontSize: '0.8rem' }}>{u.nombre}</span>
                    <span style={{ color: theme.textMuted, fontSize: '0.72rem' }}>{u.email}</span>
                    {u.telefono && <span style={{ color: theme.accentLight, fontSize: '0.7rem', fontFamily: 'monospace' }}>{u.telefono}</span>}
                  </div>
                ))}
                {filteredRegaloUsers.length === 0 && (
                  <div style={{ color: theme.textMuted, fontSize: '0.78rem', textAlign: 'center', padding: '20px 0' }}>No se encontraron usuarios.</div>
                )}
              </div>
            </div>

            {/* Columna Derecha: Formulario */}
            <form onSubmit={handleGiftTickets} style={{ flex: '1.5 1 350px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>Evento de Destino *</label>
                <select
                  value={formRegalo.eventoId}
                  onChange={e => setFormRegalo(prev => ({ ...prev, eventoId: e.target.value }))}
                  style={inputStyle}
                  required
                >
                  <option value="">-- Seleccione el evento --</option>
                  {eventos.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.nombre} ({ev.ciudad})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>Nombre del Invitado *</label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={formRegalo.nombre}
                    onChange={e => setFormRegalo(prev => ({ ...prev, nombre: e.target.value }))}
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>Correo Electrónico *</label>
                  <input
                    type="email"
                    placeholder="invitado@correo.com"
                    value={formRegalo.email}
                    onChange={e => setFormRegalo(prev => ({ ...prev, email: e.target.value }))}
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>Teléfono (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: 3001234567"
                    value={formRegalo.telefono}
                    onChange={e => setFormRegalo(prev => ({ ...prev, telefono: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>Cantidad de Entradas *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formRegalo.cantidad}
                    onChange={e => setFormRegalo(prev => ({ ...prev, cantidad: e.target.value }))}
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>Nota / Razón de la Cortesía</label>
                <input
                  type="text"
                  placeholder="Ej: Invitado de Charlotte de Witte"
                  value={formRegalo.nota}
                  onChange={e => setFormRegalo(prev => ({ ...prev, nota: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                disabled={loadingRegalo}
                style={{
                  ...btnPrimary,
                  alignSelf: 'flex-start',
                  padding: '12px 32px',
                  opacity: loadingRegalo ? 0.6 : 1,
                  cursor: loadingRegalo ? 'not-allowed' : 'pointer'
                }}
              >
                {loadingRegalo ? 'Procesando Cortesía...' : '🎁 Enviar Cortesías'}
              </button>
            </form>
          </div>
        </Section>
      </motion.div>
    );
  };

  const handleResolveSugerencia = async (id, nuevoEstado) => {
    try {
      await api.adminActualizarEstadoSugerencia(id, nuevoEstado);
      setSugerencias(prev => prev.map(s => s.id === id ? { ...s, estado: nuevoEstado } : s));
    } catch (err) {
      setError('Error al actualizar el estado de la sugerencia: ' + (err.message || err));
    }
  };

  const renderSugerencias = () => {
    const filteredSugerencias = sugerencias.filter(s =>
      !searchSugerencia ||
      s.contenido?.toLowerCase().includes(searchSugerencia.toLowerCase()) ||
      s.nombre?.toLowerCase().includes(searchSugerencia.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchSugerencia.toLowerCase())
    );

    return (
      <motion.div key="sugerencias" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <Section icon="star" title={`Sugerencias del Público (${filteredSugerencias.length})`}>
          <p style={{ color: theme.textSec, fontSize: '0.85rem', marginBottom: '24px', lineHeight: 1.5 }}>
            Consulte y gestione las sugerencias, ideas y opiniones que los asistentes envían para mejorar las fiestas de Dopamina Crew.
          </p>

          <input
            style={inputStyle}
            placeholder="Buscar sugerencias por contenido, nombre o correo..."
            value={searchSugerencia}
            onChange={e => setSearchSugerencia(e.target.value)}
          />

          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  {['#', 'Fecha', 'Autor', 'Correo', 'Sugerencia', 'Estado', 'Acciones'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredSugerencias.map(s => {
                  const estadoColor = s.estado === 'PENDIENTE' ? theme.warning : s.estado === 'LEIDA' ? theme.success : theme.textMuted;
                  return (
                    <tr 
                      key={s.id}
                      onMouseEnter={e => e.currentTarget.style.background = theme.cardHover}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ ...tdStyle, color: theme.accent, fontFamily: "'JetBrains Mono', monospace" }}>#{s.id}</td>
                      <td style={{ ...tdStyle, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {s.createdAt ? new Date(s.createdAt).toLocaleString('es-CO') : '—'}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: theme.text }}>{s.nombre || 'Anónimo'}</td>
                      <td style={{ ...tdStyle, color: theme.textMuted, fontSize: '0.8rem' }}>{s.email || '—'}</td>
                      <td style={{ ...tdStyle, color: theme.textSec, maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.4 }}>
                        {s.contenido}
                      </td>
                      <td>
                        <span style={badgeStyle(estadoColor)}>{s.estado}</span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {s.estado === 'PENDIENTE' && (
                            <button
                              onClick={() => handleResolveSugerencia(s.id, 'LEIDA')}
                              style={{ 
                                padding: '4px 8px', borderRadius: '4px', border: 'none',
                                background: 'rgba(74,222,128,0.1)', color: theme.success,
                                cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700
                              }}
                            >
                              Marcar Leída
                            </button>
                          )}
                          {s.estado !== 'ARCHIVADA' && (
                            <button
                              onClick={() => handleResolveSugerencia(s.id, 'ARCHIVADA')}
                              style={{ 
                                padding: '4px 8px', borderRadius: '4px', border: 'none',
                                background: 'rgba(255,255,255,0.05)', color: theme.textSec,
                                cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700
                              }}
                            >
                              Archivar
                            </button>
                          )}
                          {s.email && (
                            <button
                              onClick={() => setEmailModal({
                                open: true,
                                to: s.email,
                                subject: 'Dopamina Crew - Respuesta a tu sugerencia',
                                body: `Hola ${s.nombre || 'Amante de la música'},\n\nMuchas gracias por enviarnos tu sugerencia:\n"${s.contenido}"\n\n[Escribe tu respuesta aquí]\n\nAtentamente,\nStaff de Dopamina Crew 🖤`,
                                loading: false,
                                success: '',
                                error: ''
                              })}
                              style={{ 
                                padding: '4px 8px', borderRadius: '4px', border: 'none',
                                background: 'rgba(177,78,255,0.1)', color: theme.accentLight,
                                cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700
                              }}
                            >
                              📨 Responder
                            </button>
                          )}
                          {s.estado === 'ARCHIVADA' && (
                            <span style={{ color: theme.textMuted, fontSize: '0.7rem', fontWeight: 600 }}>Archivada</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredSugerencias.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: theme.textMuted, padding: '40px' }}>
                      No se encontraron sugerencias.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>
      </motion.div>
    );
  };

  const handleSendCampana = async (e) => {
    e.preventDefault();
    if (!campanaSubject.trim() || !campanaMessage.trim()) {
      setCampanaStatus({ success: '', error: 'Por favor complete todos los campos de la campaña.' });
      return;
    }
    setCampanaLoading(true);
    setCampanaStatus({ success: '', error: '' });
    try {
      const res = await api.adminEnviarCampana(campanaSubject.trim(), campanaMessage.trim(), campanaTarget);
      setCampanaStatus({ success: res.message || 'Campaña enviada con éxito.', error: '' });
      setCampanaSubject('');
      setCampanaMessage('');
    } catch (err) {
      setCampanaStatus({ success: '', error: err.message || 'Error al enviar la campaña.' });
    } finally {
      setCampanaLoading(false);
    }
  };

  const handleSaveReto = async (e) => {
    e.preventDefault();
    setRetoLoading(true);
    setRetoStatus({ success: '', error: '' });
    try {
      const challengeObj = {
        descripcion: retoDescription.trim(),
        metas: retoMetas.filter(m => m.cantidad > 0 && m.bono > 0)
      };
      const res = await api.adminActualizarReto(JSON.stringify(challengeObj));
      setRetoStatus({ success: res.message || 'Reto de promotores actualizado con éxito.', error: '' });
    } catch (err) {
      setRetoStatus({ success: '', error: err.message || 'Error al actualizar el reto.' });
    } finally {
      setRetoLoading(false);
    }
  };

  const renderCampanas = () => {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* Column 1: Email Campaign (FOMO) */}
          <Section icon="gift" title="Campaña Masiva de Email (FOMO)">
            <form onSubmit={handleSendCampana} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ color: theme.textSec, fontSize: '0.82rem', marginBottom: '16px', lineHeight: 1.4 }}>
                Envía correos personalizados masivos utilizando la pasarela de Resend. Úsalos para notificar sobre preventas agotándose o nuevos lanzamientos.
              </p>

              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: theme.textSec, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Destinatarios
              </label>
              <select 
                value={campanaTarget} 
                onChange={e => setCampanaTarget(e.target.value)} 
                style={{ ...inputStyle, marginBottom: '12px' }}
              >
                <option value="CLIENTES">Todos los Clientes (Compradores Registrados)</option>
                <option value="PROMOTORES">Todos los Promotores Activos</option>
              </select>

              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: theme.textSec, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Asunto del Correo
              </label>
              <input 
                type="text" 
                placeholder="Ej: ¡Últimas 9 entradas en preventa para Dopamina Crew! 🔥" 
                value={campanaSubject} 
                onChange={e => setCampanaSubject(e.target.value)} 
                style={{ ...inputStyle, marginBottom: '12px' }}
                required
              />

              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: theme.textSec, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Mensaje de la Campaña
              </label>
              <textarea 
                rows="6" 
                placeholder="Escribe el contenido del correo aquí. El sistema lo enviará con la plantilla oscura premium de Dopamina Crew." 
                value={campanaMessage} 
                onChange={e => setCampanaMessage(e.target.value)} 
                style={{ ...inputStyle, minHeight: '120px', resize: 'vertical', fontFamily: 'inherit', marginBottom: '12px' }}
                required
              />

              {campanaStatus.success && (
                <div style={{ color: theme.success, fontSize: '0.8rem', fontWeight: 650, background: 'rgba(74,222,128,0.1)', padding: '10px', borderRadius: '8px', border: `1px solid ${theme.success}33` }}>
                  ✓ {campanaStatus.success}
                </div>
              )}
              {campanaStatus.error && (
                <div style={{ color: theme.danger, fontSize: '0.8rem', fontWeight: 650, background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '8px', border: `1px solid ${theme.danger}33` }}>
                  ⚠️ {campanaStatus.error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={campanaLoading}
                style={{ ...btnPrimary, marginTop: '8px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {campanaLoading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                ) : '🚀 Enviar Campaña Masiva'}
              </button>
            </form>
          </Section>

          {/* Column 2: Promoter Incentives (Reto / Bono) */}
          <Section icon="users" title="Incentivo Activo para Promotores (Didi-style)">
            <form onSubmit={handleSaveReto} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ color: theme.textSec, fontSize: '0.82rem', marginBottom: '16px', lineHeight: 1.4 }}>
                Publica un reto con metas acumulativas (Didi-style) para que los promotores visualicen su barra de progreso y desbloqueen bonos en tiempo real.
              </p>

              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: theme.textSec, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Descripción del Reto
              </label>
              <input 
                type="text"
                placeholder="Ej: ¡Completa los retos de ventas hoy y gana comisiones extra!" 
                value={retoDescription} 
                onChange={e => setRetoDescription(e.target.value)} 
                style={{ ...inputStyle, marginBottom: '12px' }}
                required
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: theme.textSec, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Metas / Hitos de Ventas
                </label>
                <button 
                  type="button" 
                  onClick={handleAddMeta}
                  style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: 'rgba(177,78,255,0.12)', color: theme.accentLight, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                >
                  + Agregar Meta
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {retoMetas.map((meta, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.65rem', color: theme.textMuted, display: 'block', marginBottom: '2px', fontWeight: 700 }}>Boletas</span>
                      <input 
                        type="number" 
                        min="1" 
                        value={meta.cantidad} 
                        onChange={e => handleMetaChange(idx, 'cantidad', e.target.value)}
                        style={{ ...inputStyle, marginBottom: 0, padding: '8px 12px' }} 
                        placeholder="Ej: 5"
                      />
                    </div>
                    <div style={{ flex: 1.5 }}>
                      <span style={{ fontSize: '0.65rem', color: theme.textMuted, display: 'block', marginBottom: '2px', fontWeight: 700 }}>Bono Extra (COP)</span>
                      <input 
                        type="number" 
                        min="0" 
                        value={meta.bono} 
                        onChange={e => handleMetaChange(idx, 'bono', e.target.value)}
                        style={{ ...inputStyle, marginBottom: 0, padding: '8px 12px' }} 
                        placeholder="Ej: 10000"
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveMeta(idx)}
                      style={{ padding: '8px 10px', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.1)', color: theme.danger, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, marginTop: '16px' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {retoMetas.length === 0 && (
                  <p style={{ color: theme.textMuted, fontSize: '0.78rem', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>Sin metas agregadas. Agrega al menos una para activar el reto.</p>
                )}
              </div>

              {/* Didi-style Preview for Admin */}
              <div style={{ padding: '16px', background: 'rgba(177, 78, 255, 0.05)', borderRadius: '12px', border: `1px solid ${theme.border}`, marginBottom: '12px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: theme.accentLight, display: 'block', marginBottom: '8px' }}>Vista previa del Reto (Asumiendo 7 boletas vendidas):</span>
                {retoDescription.trim() ? (
                  <div style={{ background: 'linear-gradient(135deg, rgba(177, 78, 255, 0.15), rgba(153, 64, 224, 0.05))', border: `1px solid ${theme.accent}44`, borderRadius: '10px', padding: '14px', color: theme.text }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{retoDescription}</span>
                    </div>
                    {retoMetas.length > 0 && (
                      <div style={{ marginTop: '16px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                        {(() => {
                          const metasSorted = [...retoMetas].sort((a, b) => a.cantidad - b.cantidad);
                          const maxMeta = metasSorted[metasSorted.length - 1].cantidad || 10;
                          const progresoMock = 7;
                          const percent = Math.min(100, (progresoMock / maxMeta) * 100);
                          return (
                            <div style={{ position: 'relative', width: '100%', height: '8px', background: '#222', borderRadius: '4px', marginTop: '10px', marginBottom: '32px' }}>
                              <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: 'linear-gradient(90deg, #ff007f, #7928ca)', boxShadow: '0 0 10px rgba(255, 0, 127, 0.5)', borderRadius: '4px', width: `${percent}%` }} />
                              {metasSorted.map((meta, idx) => {
                                const isCompleted = progresoMock >= meta.cantidad;
                                const leftVal = (meta.cantidad / maxMeta) * 100;
                                return (
                                  <div key={idx} style={{ position: 'absolute', left: `${leftVal}%`, top: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: isCompleted ? '#4ade80' : '#111', border: '2px solid #333' }} />
                                    <span style={{ fontSize: '8px', color: '#9A9A9A', marginTop: '4px', whiteSpace: 'nowrap', fontWeight: 'bold' }}>{meta.cantidad} bols. (+${(meta.bono/1000).toFixed(0)}k)</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: theme.textMuted, fontSize: '0.78rem', fontStyle: 'italic', padding: '8px 0' }}>Sin reto activo actualmente.</div>
                )}
              </div>

              {retoStatus.success && (
                <div style={{ color: theme.success, fontSize: '0.8rem', fontWeight: 650, background: 'rgba(74,222,128,0.1)', padding: '10px', borderRadius: '8px', border: `1px solid ${theme.success}33` }}>
                  ✓ {retoStatus.success}
                </div>
              )}
              {retoStatus.error && (
                <div style={{ color: theme.danger, fontSize: '0.8rem', fontWeight: 650, background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '8px', border: `1px solid ${theme.danger}33` }}>
                  ⚠️ {retoStatus.error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={retoLoading}
                style={{ ...btnPrimary, marginTop: '8px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {retoLoading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                ) : '💾 Actualizar Reto'}
              </button>
            </form>
          </Section>

        </div>
      </motion.div>
    );
  };

  const renderSorteos = () => {
    const elegibles = participantesSorteo.filter(p => !ganadoresHistorial.some(h => h.id === p.id) && (p.estado === 'ACTIVA' || p.estado === 'USADA'));
    
    const handleGirarTombola = () => {
      if (girandoTombola) return;
      if (!selectedSorteoEvento) {
        setErrorSorteo('Por favor seleccione un evento.');
        return;
      }
      if (elegibles.length === 0) {
        setErrorSorteo('No hay boletas participantes disponibles para sortear.');
        return;
      }
      
      setGirandoTombola(true);
      setErrorSorteo('');
      setGanadorSorteo(null);
      
      let duracion = 2500; // 2.5s
      let intervaloTiempo = 80;
      let paso = 0;
      
      const interval = setInterval(() => {
        const indexAzar = Math.floor(Math.random() * elegibles.length);
        const numVis = String(elegibles[indexAzar].numeroSorteo).padStart(3, '0');
        setTombolaNumeroVis(numVis);
        paso += intervaloTiempo;
        if (paso >= duracion) {
          clearInterval(interval);
          // Elegir ganador definitivo
          const ganadorDefinitivo = elegibles[Math.floor(Math.random() * elegibles.length)];
          setTombolaNumeroVis(String(ganadorDefinitivo.numeroSorteo).padStart(3, '0'));
          setGanadorSorteo(ganadorDefinitivo);
          agregarAlHistorial(ganadorDefinitivo);
          setGirandoTombola(false);
        }
      }, intervaloTiempo);
    };

    return (
      <motion.div key="sorteos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          {/* Fila superior: Selector de Evento */}
          <Section icon="gift" title="Configuración del Sorteo">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Evento Activo</label>
                <select 
                  value={selectedSorteoEvento} 
                  onChange={e => setSelectedSorteoEvento(e.target.value)}
                  style={{ ...inputStyle, marginBottom: 0 }}
                >
                  <option value="">-- Seleccione un evento para iniciar el sorteo --</option>
                  {eventos.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.nombre} ({ev.ciudad})</option>
                  ))}
                </select>
              </div>
              
              {selectedSorteoEvento && (
                <div style={{ display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px 24px', borderRadius: '10px', border: `1px solid ${theme.border}` }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: theme.textMuted, display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Boletas Participantes</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: theme.text, fontFamily: 'monospace' }}>{participantesSorteo.length}</span>
                  </div>
                  <div style={{ borderLeft: `1px solid ${theme.border}`, paddingLeft: '16px' }}>
                    <span style={{ fontSize: '0.65rem', color: theme.textMuted, display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Restantes en Juego</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: theme.success, fontFamily: 'monospace' }}>{elegibles.length}</span>
                  </div>
                  <div style={{ borderLeft: `1px solid ${theme.border}`, paddingLeft: '16px' }}>
                    <span style={{ fontSize: '0.65rem', color: theme.textMuted, display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Ganadores Cantados</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: theme.accent, fontFamily: 'monospace' }}>{ganadoresHistorial.length}</span>
                  </div>
                </div>
              )}
            </div>
          </Section>
        </div>

        {selectedSorteoEvento ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {/* Tómbola y Búsqueda */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <Section icon="refresh" title="Tómbola Virtual Dopamina">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: '24px' }}>
                  {/* Visor digital gigante */}
                  <div style={{
                    width: '260px', height: '160px', borderRadius: '20px',
                    background: '#050508', border: `3px solid ${girandoTombola ? theme.accent : theme.borderLight}`,
                    boxShadow: girandoTombola 
                      ? `0 0 30px rgba(177, 78, 255, 0.4), inset 0 0 20px rgba(177, 78, 255, 0.2)`
                      : `0 8px 32px rgba(0,0,0,0.5)`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', overflow: 'hidden'
                  }}>
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.15, background: 'linear-gradient(rgba(177,78,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(177,78,255,0.1) 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '2px', zIndex: 2, marginBottom: '6px' }}>NÚMERO GANADOR</div>
                    <div style={{
                      fontSize: '4.5rem', fontWeight: 900,
                      color: girandoTombola ? theme.accentLight : theme.text,
                      fontFamily: "'JetBrains Mono', monospace",
                      textShadow: girandoTombola 
                        ? `0 0 20px ${theme.accent}`
                        : `0 0 10px rgba(255,255,255,0.1)`,
                      zIndex: 2,
                      letterSpacing: '4px'
                    }}>
                      {tombolaNumeroVis}
                    </div>
                  </div>

                  <button
                    onClick={handleGirarTombola}
                    disabled={girandoTombola || elegibles.length === 0}
                    style={{
                      width: '100%', maxWidth: '260px', padding: '16px 24px', borderRadius: '12px', border: 'none',
                      background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`,
                      boxShadow: '0 8px 24px rgba(177, 78, 255, 0.3)',
                      color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: '0.95rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                  >
                    {girandoTombola ? (
                      <span>Sorteando...</span>
                    ) : (
                      <>
                        <span>🎰</span>
                        <span>¡GIRAR TÓMBOLA!</span>
                      </>
                    )}
                  </button>
                </div>
              </Section>

              <Section icon="search" title="Buscar Número Manual">
                <p style={{ fontSize: '0.78rem', color: theme.textMuted, margin: '0 0 16px' }}>
                  Si sacaron un número físico en la fiesta, digítalo aquí para encontrar al ganador.
                </p>
                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <input
                    type="number"
                    placeholder="Ej. 30"
                    value={numeroSorteoInput}
                    onChange={e => setNumeroSorteoInput(e.target.value)}
                    style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                    onKeyDown={e => { if (e.key === 'Enter') buscarGanadorManual(numeroSorteoInput); }}
                  />
                  <button
                    onClick={() => buscarGanadorManual(numeroSorteoInput)}
                    disabled={buscandoGanador || !numeroSorteoInput}
                    style={{ ...btnPrimary, padding: '10px 20px', flexShrink: 0 }}
                  >
                    {buscandoGanador ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
              </Section>
            </div>

            {/* Ganador y Historial */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {errorSorteo && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.2)`, borderRadius: '10px', padding: '14px 20px', color: theme.danger, fontSize: '0.85rem' }}>
                  ⚠️ {errorSorteo}
                </div>
              )}

              {/* Tarjeta del Ganador */}
              {ganadorSorteo ? (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{
                    background: `linear-gradient(145deg, #18122B, #0A0A0F)`,
                    border: `2px solid ${theme.accent}`,
                    borderRadius: '16px', padding: '24px',
                    boxShadow: `0 12px 40px rgba(177, 78, 255, 0.25)`,
                    position: 'relative', overflow: 'hidden'
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: `linear-gradient(90deg, ${theme.accent}, #ec4899)` }} />
                  
                  <div style={{
                    position: 'absolute', top: '15px', right: '-35px',
                    background: `linear-gradient(135deg, #ec4899, ${theme.accent})`,
                    color: '#fff', fontSize: '0.65rem', fontWeight: 900,
                    padding: '6px 40px', transform: 'rotate(45deg)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    letterSpacing: '1px', textTransform: 'uppercase'
                  }}>
                    GANADOR
                  </div>

                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{
                      width: '60px', height: '60px', borderRadius: '50%',
                      background: `rgba(177, 78, 255, 0.15)`, border: `1px solid ${theme.accent}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '2rem', flexShrink: 0
                    }}>
                      🏆
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: theme.accentLight, letterSpacing: '1px', textTransform: 'uppercase', display: 'block' }}>NÚMERO SORTEADO</span>
                      <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', fontFamily: 'monospace', lineHeight: 1 }}>
                        #{String(ganadorSorteo.numeroSorteo).padStart(3, '0')}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: `1px solid rgba(255,255,255,0.06)`, paddingTop: '16px', marginBottom: '16px' }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: theme.textMuted, display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Nombre del Cliente</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: theme.text }}>{ganadorSorteo.usuarioNombre || 'Desconocido'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: theme.textMuted, display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Estado de la Boleta</span>
                      <span style={badgeStyle(ganadorSorteo.estado === 'USADA' ? theme.success : theme.info)}>
                        {ganadorSorteo.estado === 'USADA' ? 'INGRESÓ (EN FIESTA)' : 'ACTIVA (SIN ENTRAR)'}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: theme.textMuted, display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Código de Entrada</span>
                      <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: theme.textSec }}>#{ganadorSorteo.id}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', color: theme.textMuted, display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Código QR</span>
                      <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: theme.textMuted }}>{(ganadorSorteo.codigoQr || '').substring(0, 16)}...</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => setGanadorSorteo(null)} 
                      style={{ ...btnGhost, padding: '8px 16px', fontSize: '0.75rem' }}
                    >
                      Listo / Siguiente
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div style={{
                  background: theme.card, border: `1px dashed ${theme.borderLight}`,
                  borderRadius: '16px', padding: '40px 24px', textAlign: 'center', color: theme.textMuted,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px'
                }}>
                  <span style={{ fontSize: '2.5rem' }}>🎲</span>
                  <p style={{ fontSize: '0.85rem', margin: 0, maxWidth: '280px' }}>
                    Gira la tómbola o busca un número para revelar la identidad del ganador.
                  </p>
                </div>
              )}

              {/* Historial de Ganadores */}
              <Section 
                icon="shield" 
                title="Historial de la Noche"
                extra={
                  ganadoresHistorial.length > 0 && (
                    <button 
                      onClick={reiniciarSorteo}
                      style={{
                        background: 'rgba(239,68,68,0.06)', border: `1px solid rgba(239,68,68,0.2)`,
                        color: theme.danger, padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem',
                        fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      Reiniciar Sorteo
                    </button>
                  )
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                  {ganadoresHistorial.map((hist, i) => (
                    <div 
                      key={hist.id} 
                      style={{ 
                        padding: '12px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)',
                        border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', gap: '12px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '1rem', color: theme.accentLight, fontFamily: 'monospace' }}>
                            #{String(hist.numeroSorteo).padStart(3, '0')}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: theme.text }}>
                            {hist.usuarioNombre}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: theme.textMuted }}>
                          Hora: {new Date(hist.timestamp).toLocaleTimeString('es-CO')}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.65rem', color: theme.textMuted, fontFamily: 'monospace' }}>
                        ID: #{hist.id}
                      </span>
                    </div>
                  ))}
                  {ganadoresHistorial.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: theme.textMuted, fontSize: '0.82rem' }}>
                      Nadie ha ganado premios aún en este evento.
                    </div>
                  )}
                </div>
              </Section>
            </div>
          </div>
        ) : (
          <div style={{
            background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '14px',
            padding: '80px 24px', textAlign: 'center', color: theme.textMuted
          }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🎉</span>
            <h3 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px' }}>Sorteos en la Fiesta</h3>
            <p style={{ fontSize: '0.85rem', margin: 0, maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
              Seleccione un evento en el panel superior para activar la tómbola digital y comenzar a rifar premios entre los asistentes de Dopamina Crew.
            </p>
          </div>
        )}
      </motion.div>
    );
  };

  const renderPromotores = () => {
    const totalComision = promotores.reduce((acc, p) => acc + (p.totalComisionAcumulada || 0), 0);
    const totalUsos = promotores.reduce((acc, p) => acc + (p.usosActuales || 0), 0);

    return (
      <motion.div key="promotores" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total Promotores', value: promotores.length, color: theme.accentLight },
            { label: 'Boletas Vendidas (total)', value: totalUsos, color: theme.success },
            { label: 'Comisiones Totales', value: `$${totalComision.toLocaleString('es-CO')} COP`, color: '#f59e0b' },
          ].map(kpi => (
            <div key={kpi.label} style={{ flex: '1 1 180px', background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '18px 22px' }}>
              <div style={{ fontSize: '0.7rem', color: theme.textMuted, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>{kpi.label}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Tabla de promotores */}
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: theme.text, fontSize: '1rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Red de Promotores</h3>
            <button onClick={fetchPromotores} style={{ background: 'rgba(177,78,255,0.1)', border: `1px solid ${theme.border}`, color: theme.accentLight, padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>↻ Actualizar</button>
          </div>

          {loadingPromotores ? (
            <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>Cargando promotores...</div>
          ) : promotores.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>No hay promotores con cupones asignados aún.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    {['Promotor', 'Email', 'Datos de Pago', 'Código Cupón', 'Usos', 'Prev. Vendidas', 'Reg. Vendidas', 'Ventas Generadas', 'Comisión (10%)', 'Estado Cupón'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {promotores.map(p => (
                    <tr key={p.id}>
                      <td style={{ ...tdStyle, fontWeight: 700, color: theme.text }}>{p.promotorNombre}</td>
                      <td style={{ ...tdStyle, fontSize: '0.78rem', color: theme.textMuted }}>{p.promotorEmail}</td>
                      <td style={{ ...tdStyle, fontSize: '0.78rem' }}>
                        {p.promotorCuentaBancaria ? (
                          <div>
                            <div style={{ fontWeight: 700, color: theme.text }}>
                              🏦 {p.promotorBanco} <span style={{ color: theme.textMuted, fontSize: '0.7rem', fontWeight: 500 }}>({p.promotorTipoCuenta})</span>
                            </div>
                            <div style={{ fontFamily: 'monospace', color: theme.accentLight, fontWeight: 700, marginTop: '2px' }}>
                              {p.promotorCuentaBancaria}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: theme.textMuted, marginTop: '2px' }}>
                              Titular: {p.promotorTitularCuenta}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: theme.danger, fontSize: '0.75rem', fontStyle: 'italic' }}>
                            ⚠️ Sin registrar
                          </span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 800, color: theme.accentLight }}>{p.codigo}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, textAlign: 'center' }}>{p.usosActuales || 0}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', color: theme.success }}>{p.totalPreventa || 0}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', color: theme.info || theme.accentLight }}>{p.totalRegular || 0}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: theme.warning }}>
                        ${(p.totalVentasGeneradas || 0).toLocaleString('es-CO')}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 900, color: theme.success }}>
                        ${(p.totalComisionAcumulada || 0).toLocaleString('es-CO')}
                      </td>
                      <td style={tdStyle}>
                        <span style={badgeStyle(p.activo ? theme.success : theme.danger)}>
                          {p.activo ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderCupones = () => {
    const filteredCupones = cupones.filter(c => 
      c.codigo?.toLowerCase().includes(searchCupon.toLowerCase()) || 
      c.descripcion?.toLowerCase().includes(searchCupon.toLowerCase())
    );

    return (
      <motion.div key="cupones" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
          
          {/* Formulario de Creación */}
          <div style={{ flex: '1 1 350px', background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '24px' }}>
            <h3 style={{ color: theme.text, fontSize: '1rem', fontWeight: 800, margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Crear Nuevo Cupón
            </h3>
            <form onSubmit={handleCreateCupon}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>Código del Cupón</label>
              <input 
                type="text" 
                style={inputStyle} 
                placeholder="Ej: OFF20, PARCHE15" 
                value={formCupon.codigo} 
                onChange={e => setFormCupon(prev => ({ ...prev, codigo: e.target.value }))} 
                required 
              />

              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>Descuento (%)</label>
              <input 
                type="number" 
                step="0.1"
                min="0.1"
                max="100"
                style={inputStyle} 
                placeholder="Porcentaje (ej: 15)" 
                value={formCupon.descuentoPorcentaje} 
                onChange={e => setFormCupon(prev => ({ ...prev, descuentoPorcentaje: e.target.value }))} 
                required 
              />

              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>Descripción</label>
              <input 
                type="text" 
                style={inputStyle} 
                placeholder="Descripción del descuento" 
                value={formCupon.descripcion} 
                onChange={e => setFormCupon(prev => ({ ...prev, descripcion: e.target.value }))} 
              />

              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>Límite de usos global</label>
              <input 
                type="number" 
                min="0"
                style={inputStyle} 
                placeholder="Ej: 1 (sorteos). Vacío = ilimitado" 
                value={formCupon.maxUsos} 
                onChange={e => setFormCupon(prev => ({ ...prev, maxUsos: e.target.value }))} 
              />

              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>Mínimo de boletas requeridas</label>
              <input 
                type="number" 
                min="1"
                style={inputStyle} 
                placeholder="Ej: 4 (para tu promo). Vacío = 1 boleta" 
                value={formCupon.minBoletas} 
                onChange={e => setFormCupon(prev => ({ ...prev, minBoletas: e.target.value }))} 
              />

              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>Promotor Asociado</label>
              <select
                style={{ ...inputStyle, background: 'rgba(0,0,0,0.6)', border: `1px solid ${theme.border}`, cursor: 'pointer' }}
                value={formCupon.promotorId}
                onChange={e => setFormCupon(prev => ({ ...prev, promotorId: e.target.value }))}
              >
                <option value="">Ninguno (Cupón general)</option>
                {usuarios.filter(u => u.rol === 'ROLE_PROMOTER').map(u => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} ({u.email})
                  </option>
                ))}
              </select>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <input 
                  type="checkbox" 
                  id="cuponActivo" 
                  checked={formCupon.activo} 
                  onChange={e => setFormCupon(prev => ({ ...prev, activo: e.target.checked }))} 
                  style={{ width: '16px', height: '16px', accentColor: theme.accent, cursor: 'pointer' }}
                />
                <label htmlFor="cuponActivo" style={{ fontSize: '0.8rem', color: theme.textSec, fontWeight: 600, cursor: 'pointer' }}>Activo de inmediato</label>
              </div>

              <button type="submit" style={{ ...btnPrimary, width: '100%' }}>
                Guardar Cupón
              </button>
            </form>
          </div>

          {/* Listado de Cupones */}
          <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Section 
              icon="ticket" 
              title="Cuponera Vigente" 
              extra={
                <input 
                  type="text" 
                  placeholder="Buscar cupón..." 
                  value={searchCupon} 
                  onChange={e => setSearchCupon(e.target.value)} 
                  style={{ ...inputStyle, width: '180px', padding: '6px 12px', margin: 0 }} 
                />
              }
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      {['Código', 'Promotor', 'Descuento', 'Descripción', 'Usos', 'Estado', 'Creado', 'Acciones'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCupones.map(c => (
                      <tr key={c.id}>
                        <td style={{ ...tdStyle, fontWeight: 800, color: theme.accentLight, fontFamily: 'monospace' }}>{c.codigo}</td>
                        <td style={tdStyle}>
                          {c.promotorNombre ? (
                            <div>
                              <div style={{ fontWeight: 700, color: theme.text, fontSize: '0.8rem' }}>{c.promotorNombre}</div>
                              <div style={{ fontSize: '0.68rem', color: theme.textMuted }}>{c.promotorEmail}</div>
                            </div>
                          ) : (
                            <span style={{ color: theme.textMuted, fontSize: '0.78rem' }}>General</span>
                          )}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: theme.text }}>{c.descuentoPorcentaje}%</td>
                        <td style={tdStyle}>{c.descripcion || '—'}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: theme.textSec, fontFamily: 'monospace' }}>
                              {c.usosActuales || 0} / {c.maxUsos && c.maxUsos > 0 ? c.maxUsos : '♾️'}
                            </span>
                            {c.usuarios && c.usuarios.length > 0 && (
                              <button
                                onClick={() => setSelectedCuponReport(c)}
                                style={{
                                  background: 'rgba(177,78,255,0.12)', border: 'none', color: theme.accentLight,
                                  padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700,
                                  display: 'flex', alignItems: 'center', gap: '2px'
                                }}
                              >
                                👥 Ver
                              </button>
                            )}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: theme.textSec, fontFamily: 'monospace' }}>
                              {c.usosActuales || 0} / {c.maxUsos && c.maxUsos > 0 ? c.maxUsos : '♾️'}
                            </span>
                            {c.usuarios && c.usuarios.length > 0 && (
                              <button
                                onClick={() => setSelectedCuponReport(c)}
                                style={{
                                  background: 'rgba(177,78,255,0.12)', border: 'none', color: theme.accentLight,
                                  padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700,
                                  display: 'flex', alignItems: 'center', gap: '2px'
                                }}
                              >
                                👥 Ver
                              </button>
                            )}
                          </div>
                          {c.minBoletas && c.minBoletas > 1 && (
                            <div style={{ fontSize: '0.68rem', color: theme.accentLight, marginTop: '2px', fontWeight: 600 }}>
                              Min. boletas: {c.minBoletas}
                            </div>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <span style={badgeStyle(c.activo ? theme.success : theme.danger)}>
                            {c.activo ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontSize: '0.78rem', color: theme.textMuted }}>
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-CO') : '—'}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => handleToggleCupon(c.id)} 
                              style={{ 
                                padding: '4px 8px', borderRadius: '4px', border: 'none', 
                                background: c.activo ? 'rgba(239,68,68,0.1)' : 'rgba(74,222,128,0.1)', 
                                color: c.activo ? theme.danger : theme.success, 
                                cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 
                              }}
                            >
                              {c.activo ? 'Desactivar' : 'Activar'}
                            </button>
                            <button 
                              onClick={() => handleDeleteCupon(c.id)} 
                              style={{ 
                                padding: '4px 8px', borderRadius: '4px', border: 'none', 
                                background: 'rgba(255,255,255,0.05)', color: theme.textSec, 
                                cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 
                              }}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredCupones.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: theme.textMuted, padding: '30px' }}>
                          No hay cupones registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>

        </div>

        {/* Modal de Detalle de Usos de Cupón */}
        {selectedCuponReport && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px'
          }}>
            <div style={{
              background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '16px',
              width: '100%', maxWidth: '650px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.border}`, paddingBottom: '14px' }}>
                <div>
                  <h3 style={{ color: theme.accentLight, fontSize: '1.25rem', fontWeight: 950, letterSpacing: '1px', fontFamily: 'monospace' }}>
                    REPORTE: {selectedCuponReport.codigo}
                  </h3>
                  <p style={{ color: theme.textMuted, fontSize: '0.78rem', margin: '4px 0 0' }}>
                    {selectedCuponReport.descripcion || 'Sin descripción'}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedCuponReport(null)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: theme.text, fontSize: '1.2rem', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  &times;
                </button>
              </div>

              {selectedCuponReport.promotorNombre && (
                <div style={{ background: 'rgba(177,78,255,0.03)', padding: '14px', borderRadius: '10px', border: `1px dashed rgba(177,78,255,0.2)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', marginBottom: '14px' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: theme.accentLight, textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>Promotor Vinculado</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: theme.text }}>{selectedCuponReport.promotorNombre}</span>
                    <span style={{ fontSize: '0.75rem', color: theme.textMuted, marginLeft: '6px' }}>({selectedCuponReport.promotorEmail})</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: theme.success, textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>Comisiones Acumuladas</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: theme.success }}>${(selectedCuponReport.totalComisionAcumulada || 0).toLocaleString('es-CO')} COP</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 120px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: theme.textMuted, textTransform: 'uppercase', fontWeight: 700 }}>Descuento</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: theme.accentLight }}>{selectedCuponReport.descuentoPorcentaje}%</span>
                </div>
                <div style={{ flex: '1 1 120px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: theme.textMuted, textTransform: 'uppercase', fontWeight: 700 }}>Usos Totales</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: theme.success }}>{selectedCuponReport.usosActuales}</span>
                </div>
                <div style={{ flex: '1 1 120px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: theme.textMuted, textTransform: 'uppercase', fontWeight: 700 }}>Límite Global</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: theme.text }}>
                    {selectedCuponReport.maxUsos && selectedCuponReport.maxUsos > 0 ? selectedCuponReport.maxUsos : 'Ilimitado'}
                  </span>
                </div>
                <div style={{ flex: '1 1 120px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: `1px solid ${theme.border}`, textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: theme.textMuted, textTransform: 'uppercase', fontWeight: 700 }}>Mín. Boletas</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: theme.textSec }}>
                    {selectedCuponReport.minBoletas || 1}
                  </span>
                </div>
              </div>

              <div>
                <h4 style={{ color: theme.text, fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Historial de Canjes:
                </h4>
                <div style={{ maxHeight: '220px', overflowY: 'auto', border: `1px solid ${theme.border}`, borderRadius: '8px' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                        {['Usuario', 'Compra ID', 'Estado Pago', 'Fecha'].map(h => <th key={h} style={{ ...thStyle, padding: '8px 12px' }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCuponReport.usuarios && selectedCuponReport.usuarios.map((u, idx) => (
                        <tr key={idx}>
                          <td style={{ ...tdStyle, padding: '10px 12px' }}>
                            <div style={{ fontWeight: 600, color: theme.text }}>{u.nombre}</div>
                            <div style={{ fontSize: '0.75rem', color: theme.textMuted }}>{u.email}</div>
                          </td>
                          <td style={{ ...tdStyle, padding: '10px 12px', fontFamily: 'monospace' }}>#{u.compraId}</td>
                          <td style={{ ...tdStyle, padding: '10px 12px' }}>
                            <span style={badgeStyle(u.compraEstado === 'PAGADO' || u.compraEstado === 'REGALADA' ? theme.success : theme.danger)}>
                              {u.compraEstado}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, padding: '10px 12px', fontSize: '0.75rem', color: theme.textMuted }}>{u.fecha}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', justifyOrigin: 'flex-end', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  onClick={() => setSelectedCuponReport(null)}
                  style={{ ...btnPrimary, padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.border}`, color: theme.textSec }}
                >
                  Cerrar Reporte
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const handleSubmitSet = async (e) => {
    e.preventDefault();
    try {
      if (editingSet) {
        const updated = await api.adminActualizarSet(editingSet.id, formSet);
        setSets(prev => prev.map(s => s.id === editingSet.id ? updated : s));
      } else {
        const created = await api.adminCrearSet(formSet);
        setSets(prev => [...prev, created]);
      }
      setShowSetForm(false);
      setEditingSet(null);
      setFormSet({ titulo: '', artista: '', youtubeUrl: '', genero: '', descripcion: '', imagenUrl: '', activo: true });
    } catch (err) {
      setError('Error al guardar el set: ' + (err.message || err));
    }
  };

  const handleDeleteSet = async (id) => {
    if (!window.confirm('¿Eliminar este set musical?')) return;
    try {
      await api.adminEliminarSet(id);
      setSets(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError('Error al eliminar el set.');
    }
  };

  const renderSets = () => (
    <motion.div key="sets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {showSetForm ? (
        <Section icon="music" title={editingSet ? 'Editar Set' : 'Nuevo Set Musical'}>
          <form onSubmit={handleSubmitSet} style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>TÍTULO</label>
              <input required style={inputStyle} value={formSet.titulo} onChange={e => setFormSet({ ...formSet, titulo: e.target.value })} placeholder="Ej. Bodega Sessions Vol. 4" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>ARTISTA / DJ</label>
              <input style={inputStyle} value={formSet.artista} onChange={e => setFormSet({ ...formSet, artista: e.target.value })} placeholder="Ej. Dopamina Resident DJ" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>GÉNERO</label>
              <input style={inputStyle} value={formSet.genero} onChange={e => setFormSet({ ...formSet, genero: e.target.value })} placeholder="Ej. Dancehall, Techno..." />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>URL DE YOUTUBE</label>
              <input required style={inputStyle} value={formSet.youtubeUrl} onChange={e => setFormSet({ ...formSet, youtubeUrl: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>DESCRIPCIÓN</label>
              <textarea style={{ ...inputStyle, height: '80px', resize: 'vertical' }} value={formSet.descripcion} onChange={e => setFormSet({ ...formSet, descripcion: e.target.value })} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>IMAGEN URL</label>
              <input style={inputStyle} value={formSet.imagenUrl} onChange={e => setFormSet({ ...formSet, imagenUrl: e.target.value })} />
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: theme.textSec }}>
                <input type="checkbox" checked={formSet.activo} onChange={e => setFormSet({ ...formSet, activo: e.target.checked })} style={{ accentColor: theme.accent }} />
                Activo
              </label>
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setShowSetForm(false); setEditingSet(null); }} style={btnGhost}>Cancelar</button>
              <button type="submit" style={btnPrimary}>Guardar Set</button>
            </div>
          </form>
        </Section>
      ) : (
        <Section icon="music" title={`Sets Musicales (${sets.length})`}
          extra={
            <button onClick={() => { setEditingSet(null); setFormSet({ titulo: '', artista: '', youtubeUrl: '', genero: '', descripcion: '', imagenUrl: '', activo: true }); setShowSetForm(true); }}
              style={{ ...btnPrimary, padding: '8px 18px' }}>
              + Nuevo Set
            </button>
          }
        >
          <input style={inputStyle} placeholder="Buscar set por título, artista o género..." value={searchSet} onChange={e => setSearchSet(e.target.value)} />
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead><tr>
                {['#', 'Título', 'Artista', 'Género', 'YouTube', 'Estado', 'Creado', 'Acciones'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>
                {sets.filter(s =>
                  !searchSet ||
                  s.titulo?.toLowerCase().includes(searchSet.toLowerCase()) ||
                  s.artista?.toLowerCase().includes(searchSet.toLowerCase()) ||
                  s.genero?.toLowerCase().includes(searchSet.toLowerCase())
                ).map(s => (
                  <tr key={s.id}
                    onMouseEnter={e => e.currentTarget.style.background = theme.cardHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...tdStyle, color: theme.accent, fontFamily: "'JetBrains Mono', monospace" }}>#{s.id}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: theme.text }}>{s.titulo}</td>
                    <td style={tdStyle}>{s.artista || '—'}</td>
                    <td><span style={badgeStyle(theme.info)}>{s.genero || '—'}</span></td>
                    <td style={tdStyle}>
                      <a href={s.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ color: theme.accent, fontSize: '0.75rem' }}>Ver</a>
                    </td>
                    <td><span style={badgeStyle(s.activo ? theme.success : theme.danger)}>{s.activo ? 'ACTIVO' : 'INACTIVO'}</span></td>
                    <td style={{ ...tdStyle, fontSize: '0.78rem', color: theme.textMuted }}>{s.createdAt ? new Date(s.createdAt).toLocaleDateString('es-CO') : '—'}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => {
                          setEditingSet(s);
                          setFormSet({ titulo: s.titulo, artista: s.artista || '', youtubeUrl: s.youtubeUrl, genero: s.genero || '', descripcion: s.descripcion || '', imagenUrl: s.imagenUrl || '', activo: s.activo });
                          setShowSetForm(true);
                        }} style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: 'rgba(96,165,250,0.1)', color: theme.info, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}>Editar</button>
                        <button onClick={() => handleDeleteSet(s.id)} style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: 'rgba(239,68,68,0.1)', color: theme.danger, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {sets.length === 0 && (
                  <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: theme.textMuted, padding: '30px' }}>No hay sets musicales registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </motion.div>
  );

  const renderCombos = () => (
    <motion.div key="combos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {showComboForm ? (
        <Section icon="gift" title={editingCombo ? 'Editar Combo' : 'Nuevo Combo'}>
          <form onSubmit={handleSubmitCombo} style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>NOMBRE DEL COMBO</label>
              <input required style={inputStyle} value={formCombo.nombre} onChange={e => setFormCombo({ ...formCombo, nombre: e.target.value })} placeholder="Ej. Combo Ron & Parche" />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>DESCRIPCIÓN</label>
              <textarea style={{ ...inputStyle, height: '80px', resize: 'none', padding: '10px 16px' }} value={formCombo.descripcion} onChange={e => setFormCombo({ ...formCombo, descripcion: e.target.value })} placeholder="Breve explicación del combo..." />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>PRECIO ORIGINAL (COP)</label>
              <input type="number" required style={inputStyle} value={formCombo.precioOriginal} onChange={e => setFormCombo({ ...formCombo, precioOriginal: parseFloat(e.target.value) || 0 })} placeholder="Valor sin descuento" />
              <span style={{ fontSize: '10px', color: theme.textMuted, marginTop: '4px', display: 'block' }}>El precio que pagaría el cliente SIN el combo</span>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>PRECIO COMBO (COP)</label>
              <input type="number" required style={inputStyle} value={formCombo.precio} onChange={e => setFormCombo({ ...formCombo, precio: parseFloat(e.target.value) || 0 })} placeholder="Precio con descuento" />
              <span style={{ fontSize: '10px', color: theme.textMuted, marginTop: '4px', display: 'block' }}>El precio final que paga el cliente</span>
            </div>
            {(formCombo.precioOriginal > 0 && formCombo.precio > 0 && formCombo.precioOriginal > formCombo.precio) && (
              <div style={{ gridColumn: 'span 2', background: 'rgba(16, 185, 129, 0.1)', border: `1px solid ${theme.success}`, borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '11px', color: theme.textMuted, fontWeight: 600 }}>AHORRO PARA EL CLIENTE</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: theme.success, marginTop: '2px' }}>
                    ${(formCombo.precioOriginal - formCombo.precio).toLocaleString('es-CO')} COP
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: theme.textMuted, fontWeight: 600 }}>PORCENTAJE</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: theme.warning, marginTop: '2px' }}>
                    {Math.round(((formCombo.precioOriginal - formCombo.precio) / formCombo.precioOriginal) * 100)}% OFF
                  </div>
                </div>
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>CANTIDAD DE BOLETAS INCLUIDAS</label>
              <input type="number" min="1" required style={inputStyle} value={formCombo.cantidadBoletas} onChange={e => setFormCombo({ ...formCombo, cantidadBoletas: parseInt(e.target.value) || 1 })} placeholder="1" />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>ITEMS ADICIONALES (PRODUCTOS INCLUIDOS)</label>
              <input style={inputStyle} value={formCombo.itemsAdicionales} onChange={e => setFormCombo({ ...formCombo, itemsAdicionales: e.target.value })} placeholder="Ej. 1 Botella de Ron + Hielo" />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>IMAGEN DEL COMBO (URL)</label>
              <input style={inputStyle} value={formCombo.imagenUrl} onChange={e => setFormCombo({ ...formCombo, imagenUrl: e.target.value })} placeholder="https://ejemplo.com/imagen-combo.jpg" />
              <span style={{ fontSize: '10px', color: theme.textMuted, marginTop: '4px', display: 'block' }}>Pega la URL de la imagen del combo (puede ser de Imgur, Google Drive, etc.)</span>
              {formCombo.imagenUrl && (
                <div style={{ marginTop: '10px', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${theme.border}`, maxWidth: '280px' }}>
                  <img src={formCombo.imagenUrl} alt="Preview" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.display = 'none'; }} />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '20px', gridColumn: 'span 2', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input type="checkbox" checked={formCombo.esCumpleanero} onChange={e => setFormCombo({ ...formCombo, esCumpleanero: e.target.checked })} style={{ accentColor: theme.accent }} />
                <span>¿Es Combo de Cumpleañero? (Aplica descuento dinámico de 1 boleta gratis)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input type="checkbox" checked={formCombo.activo} onChange={e => setFormCombo({ ...formCombo, activo: e.target.checked })} style={{ accentColor: theme.accent }} />
                <span>Combo Activo</span>
              </label>
            </div>
            <div style={{ display: 'flex', gap: '12px', gridColumn: 'span 2', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setShowComboForm(false); setEditingCombo(null); }} style={btnGhost}>Cancelar</button>
              <button type="submit" style={btnPrimary}>Guardar Combo</button>
            </div>
          </form>
        </Section>
      ) : (
        <Section icon="gift" title="Catálogo de Combos & Promociones"
          extra={
            <button onClick={() => {
              setEditingCombo(null);
              setFormCombo({ nombre: '', descripcion: '', precio: 0, precioOriginal: 0, cantidadBoletas: 1, itemsAdicionales: '', imagenUrl: '', esCumpleanero: false, activo: true });
              setShowComboForm(true);
            }} style={btnPrimary}>+ Crear Combo</button>
          }
        >
          <input style={inputStyle} placeholder="Buscar combo por nombre o ítems..." value={searchCombo} onChange={e => setSearchCombo(e.target.value)} />
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead><tr>
                {['#', 'Nombre / Descripción', 'P. Original', 'P. Combo', 'Ahorro', 'Boletas', 'Ítems', 'Tipo', 'Estado', 'Acciones'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>
                {combos.filter(c =>
                  !searchCombo ||
                  c.nombre?.toLowerCase().includes(searchCombo.toLowerCase()) ||
                  c.itemsAdicionales?.toLowerCase().includes(searchCombo.toLowerCase())
                ).map(c => (
                  <tr key={c.id}
                    onMouseEnter={e => e.currentTarget.style.background = theme.cardHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...tdStyle, color: theme.accent, fontFamily: "'JetBrains Mono', monospace" }}>#{c.id}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {c.imagenUrl ? (
                          <img src={c.imagenUrl} alt={c.nombre} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: `1px solid ${theme.border}`, flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: theme.cardBg, border: `1px dashed ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>📦</div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: theme.text }}>{c.nombre}</div>
                          <div style={{ fontSize: '11px', color: theme.textMuted }}>{c.descripcion || 'Sin descripción'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: theme.textMuted }}>
                      {c.precioOriginal > 0 ? `$${c.precioOriginal.toLocaleString('es-CO')}` : '—'}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: theme.success }}>
                      {c.esCumpleanero ? (
                        <span style={{ fontSize: '0.8rem', color: theme.success }}>Dinámico (3+1)</span>
                      ) : (
                        `$${c.precio.toLocaleString('es-CO')}`
                      )}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: theme.warning }}>
                      {(c.precioOriginal > 0 && c.precio > 0 && c.precioOriginal > c.precio) ? (
                        <>
                          <div style={{ color: theme.success, fontWeight: 800 }}>${(c.precioOriginal - c.precio).toLocaleString('es-CO')}</div>
                          <div style={{ fontSize: '10px', color: theme.warning }}>{Math.round(((c.precioOriginal - c.precio) / c.precioOriginal) * 100)}% OFF</div>
                        </>
                      ) : (
                        <span style={{ color: theme.textMuted }}>—</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, fontFamily: "'JetBrains Mono', monospace" }}>{c.cantidadBoletas}x</td>
                    <td style={{ ...tdStyle, color: theme.accentLight }}>{c.itemsAdicionales || 'Ninguno'}</td>
                    <td>
                      {c.esCumpleanero ? (
                        <span style={badgeStyle(theme.warning)}>CUMPLEAÑERO 🎂</span>
                      ) : (
                        <span style={badgeStyle(theme.info)}>REGULAR ⚡</span>
                      )}
                    </td>
                    <td><span style={badgeStyle(c.activo ? theme.success : theme.danger)}>{c.activo ? 'ACTIVO' : 'INACTIVO'}</span></td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleEditCombo(c)} style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: 'rgba(96,165,250,0.1)', color: theme.info, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}>Editar</button>
                        <button onClick={() => handleDeleteCombo(c.id)} style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: 'rgba(239,68,68,0.1)', color: theme.danger, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}>Desactivar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {combos.length === 0 && (
                  <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: theme.textMuted, padding: '30px' }}>No hay combos registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </motion.div>
  );

  const renderGraffiti = () => (
    <motion.div key="graffiti" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {showGraffitiForm ? (
        <Section icon="🎨" title={editingGraffiti ? 'Editar Graffiti' : 'Nuevo Graffiti'}>
          <form onSubmit={handleSubmitGraffiti} style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>TÍTULO</label>
              <input required style={inputStyle} value={formGraffiti.titulo} onChange={e => setFormGraffiti({ ...formGraffiti, titulo: e.target.value })} placeholder="Ej. Neon Dreams" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>ARTISTA</label>
              <input style={inputStyle} value={formGraffiti.artista} onChange={e => setFormGraffiti({ ...formGraffiti, artista: e.target.value })} placeholder="Ej. Dopamina Crew" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>UBICACIÓN</label>
              <input required style={inputStyle} value={formGraffiti.ubicacion} onChange={e => setFormGraffiti({ ...formGraffiti, ubicacion: e.target.value })} placeholder="Ej. Centro, esquina Principal" />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>DESCRIPCIÓN</label>
              <textarea style={{ ...inputStyle, height: '80px', resize: 'none', padding: '10px 16px' }} value={formGraffiti.descripcion} onChange={e => setFormGraffiti({ ...formGraffiti, descripcion: e.target.value })} placeholder="Describe el grafiti..." />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>LATITUD</label>
              <input type="number" step="any" required style={inputStyle} value={formGraffiti.latitud} onChange={e => setFormGraffiti({ ...formGraffiti, latitud: e.target.value })} placeholder="Ej. 4.8133" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>LONGITUD</label>
              <input type="number" step="any" required style={inputStyle} value={formGraffiti.longitud} onChange={e => setFormGraffiti({ ...formGraffiti, longitud: e.target.value })} placeholder="Ej. -75.6961" />
              <span style={{ fontSize: '10px', color: theme.textMuted, marginTop: '4px', display: 'block' }}>Busca las coordenadas en Google Maps: click derecho → "¿Qué hay aquí?"</span>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>IMAGEN (URL)</label>
              <input style={inputStyle} value={formGraffiti.imagenUrl} onChange={e => setFormGraffiti({ ...formGraffiti, imagenUrl: e.target.value })} placeholder="https://ejemplo.com/foto-graffiti.jpg" />
              <span style={{ fontSize: '10px', color: theme.textMuted, marginTop: '4px', display: 'block' }}>Pega la URL de la foto del grafiti</span>
              {formGraffiti.imagenUrl && (
                <div style={{ marginTop: '10px', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${theme.border}`, maxWidth: '280px' }}>
                  <img src={formGraffiti.imagenUrl} alt="Preview" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.display = 'none'; }} />
                </div>
              )}
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '12px', color: theme.textMuted, marginBottom: '6px', fontWeight: 600 }}>TAGS (separados por coma)</label>
              <input style={inputStyle} value={formGraffiti.tags} onChange={e => setFormGraffiti({ ...formGraffiti, tags: e.target.value })} placeholder="Ej. mural, neon, abstracto" />
            </div>
            <div style={{ display: 'flex', gap: '20px', gridColumn: 'span 2', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input type="checkbox" checked={formGraffiti.activo} onChange={e => setFormGraffiti({ ...formGraffiti, activo: e.target.checked })} style={{ accentColor: theme.accent }} />
                <span>Graffiti Activo (visible públicamente)</span>
              </label>
            </div>
            <div style={{ display: 'flex', gap: '12px', gridColumn: 'span 2', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setShowGraffitiForm(false); setEditingGraffiti(null); }} style={btnGhost}>Cancelar</button>
              <button type="submit" style={btnPrimary}>Guardar Graffiti</button>
            </div>
          </form>
        </Section>
      ) : (
        <Section icon="🎨" title="Catálogo de Graffiti Trail"
          extra={
            <button onClick={() => {
              setEditingGraffiti(null);
              setFormGraffiti({ titulo: '', artista: '', descripcion: '', imagenUrl: '', ubicacion: '', latitud: '', longitud: '', tags: '', activo: true });
              setShowGraffitiForm(true);
            }} style={btnPrimary}>+ Nuevo Graffiti</button>
          }
        >
          <input style={inputStyle} placeholder="Buscar graffiti por título, artista o ubicación..." value={searchGraffiti} onChange={e => setSearchGraffiti(e.target.value)} />
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead><tr>
                {['#', 'Imagen', 'Título / Artista', 'Ubicación', 'Coords', 'Tags', 'Estado', 'Acciones'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>
                {graffitis.filter(g =>
                  !searchGraffiti ||
                  g.titulo?.toLowerCase().includes(searchGraffiti.toLowerCase()) ||
                  g.artista?.toLowerCase().includes(searchGraffiti.toLowerCase()) ||
                  g.ubicacion?.toLowerCase().includes(searchGraffiti.toLowerCase())
                ).map(g => (
                  <tr key={g.id}
                    onMouseEnter={e => e.currentTarget.style.background = theme.cardHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...tdStyle, color: theme.accent, fontFamily: "'JetBrains Mono', monospace" }}>#{g.id}</td>
                    <td style={tdStyle}>
                      {g.imagenUrl ? (
                        <img src={g.imagenUrl} alt={g.titulo} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: `1px solid ${theme.border}` }} />
                      ) : (
                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: theme.card, border: `1px dashed ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🎨</div>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700, color: theme.text }}>{g.titulo}</div>
                      <div style={{ fontSize: '11px', color: theme.textMuted }}>{g.artista || 'Anónimo'}</div>
                    </td>
                    <td style={{ ...tdStyle, fontSize: '11px', color: theme.textSec }}>{g.ubicacion}</td>
                    <td style={{ ...tdStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: theme.textMuted }}>
                      {g.latitud?.toFixed(4)}, {g.longitud?.toFixed(4)}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {(g.tags || '').split(',').filter(Boolean).slice(0, 3).map(tag => (
                          <span key={tag} style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: `${theme.accent}20`, color: theme.accentLight, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{tag.trim()}</span>
                        ))}
                      </div>
                    </td>
                    <td><span style={badgeStyle(g.activo !== false ? theme.success : theme.danger)}>{g.activo !== false ? 'ACTIVO' : 'INACTIVO'}</span></td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleEditGraffiti(g)} style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: 'rgba(96,165,250,0.1)', color: theme.info, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}>Editar</button>
                        <button onClick={() => handleDeleteGraffiti(g.id)} style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: 'rgba(239,68,68,0.1)', color: theme.danger, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}>Desactivar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {graffitis.length === 0 && (
                  <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: theme.textMuted, padding: '30px' }}>No hay grafitis registrados. ¡Agrega el primero!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </motion.div>
  );

  const renderVisitas = () => (
    <motion.div key="visitas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {loadingVisits ? (
        <div style={{ textAlign: 'center', padding: '60px', color: theme.textMuted }}>Cargando estadísticas de visitas...</div>
      ) : visitStats ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <StatCard label="Visitas Totales" value={visitStats.totalVisitas ?? 0} icon="chart" color={theme.accent} delay={0} />
            <StatCard label="Visitas Hoy" value={visitStats.visitasHoy ?? 0} icon="chart" color={theme.info} delay={0.05} />
            <StatCard label="Autenticados" value={visitStats.autenticados ?? 0} icon="users" color={theme.success} delay={0.1} />
            <StatCard label="Anónimos" value={visitStats.anonimos ?? 0} icon="users" color={theme.warning} delay={0.15} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* Páginas más visitadas */}
            <Section icon="chart" title="Páginas Más Visitadas">
              {visitStats.porPagina && visitStats.porPagina.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {visitStats.porPagina.slice(0, 10).map(([pagina, count], i) => (
                    <div key={pagina} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: theme.textMuted, fontSize: '0.75rem', fontWeight: 700, minWidth: '20px' }}>#{i + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: theme.text, fontSize: '0.85rem', fontWeight: 600 }}>{pagina}</span>
                          <span style={{ color: theme.accent, fontWeight: 700, fontSize: '0.85rem' }}>{count}</span>
                        </div>
                        <div style={{ height: '6px', background: theme.border, borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(count / Math.max(...visitStats.porPagina.map(p => p[1]))) * 100}%`, background: `linear-gradient(90deg, ${theme.accent}, ${theme.accentLight})`, borderRadius: '3px', transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', color: theme.textMuted }}>No hay datos de visitas todavía.</div>
              )}
            </Section>

            {/* Autenticados vs Anónimos */}
            <Section icon="users" title="Autenticados vs Anónimos">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px' }}>
                <div style={{ position: 'relative', width: '160px', height: '160px', marginBottom: '16px' }}>
                  <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={theme.border} strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={theme.success} strokeWidth="3" strokeDasharray={`${visitStats.totalVisitas > 0 ? (visitStats.autenticados / visitStats.totalVisitas) * 100 : 0} 100`} />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={theme.warning} strokeWidth="3" strokeDasharray={`${visitStats.totalVisitas > 0 ? (visitStats.anonimos / visitStats.totalVisitas) * 100 : 0} 100`} strokeDashoffset={visitStats.totalVisitas > 0 ? -(visitStats.autenticados / visitStats.totalVisitas) * 100 : 0} />
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: theme.text }}>{visitStats.totalVisitas}</div>
                    <div style={{ fontSize: '0.65rem', color: theme.textMuted, textTransform: 'uppercase', fontWeight: 600 }}>Total</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: theme.success }} />
                    <span style={{ fontSize: '0.8rem', color: theme.textSec, fontWeight: 600 }}>Autenticados: {visitStats.autenticados}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: theme.warning }} />
                    <span style={{ fontSize: '0.8rem', color: theme.textSec, fontWeight: 600 }}>Anónimos: {visitStats.anonimos}</span>
                  </div>
                </div>
              </div>
            </Section>
          </div>

          {/* Visitas por día */}
          {visitStats.porDia && visitStats.porDia.length > 0 && (
            <Section icon="chart" title="Visitas por Día">
              <div style={{ overflowX: 'auto' }}>
                <table style={tableStyle}>
                  <thead><tr>
                    {['Fecha', 'Visitas'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {visitStats.porDia.slice(-30).reverse().map(([fecha, count]) => (
                      <tr key={fecha}
                        onMouseEnter={e => e.currentTarget.style.background = theme.cardHover}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ ...tdStyle, color: theme.text, fontWeight: 600 }}>{fecha}</td>
                        <td style={{ ...tdStyle, color: theme.accent, fontWeight: 700 }}>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* Historial detallado de visitas */}
          <Section icon="users" title={`Historial de Visitas (${allVisits.length})`}
            extra={
              <button onClick={fetchVisitStats} style={{ ...btnGhost, padding: '6px 14px', fontSize: '0.75rem' }}>
                ↻ Refrescar
              </button>
            }
          >
            <input style={inputStyle} placeholder="Buscar por página, IP o User-Agent..." value={searchVisit} onChange={e => setSearchVisit(e.target.value)} />
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table style={tableStyle}>
                <thead><tr style={{ position: 'sticky', top: 0, background: theme.card, zIndex: 1 }}>
                  {['ID', 'Página', 'Usuario', 'IP', 'User-Agent', 'Referrer', 'Fecha'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {allVisits
                    .filter(v =>
                      !searchVisit ||
                      (v.pagina || '').toLowerCase().includes(searchVisit.toLowerCase()) ||
                      (v.ipAddress || '').includes(searchVisit) ||
                      (v.userAgent || '').toLowerCase().includes(searchVisit.toLowerCase())
                    )
                    .slice(0, 100)
                    .map(v => (
                      <tr key={v.id}
                        onMouseEnter={e => e.currentTarget.style.background = theme.cardHover}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ ...tdStyle, color: theme.accent, fontFamily: "'JetBrains Mono', monospace" }}>#{v.id}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: theme.text }}>{v.pagina}{v.titulo ? <span style={{ color: theme.textMuted, fontSize: '0.75rem' }}> ({v.titulo})</span> : ''}</td>
                        <td style={{ ...tdStyle, color: v.usuario ? theme.success : theme.textMuted }}>
                          {v.usuario ? `${v.usuario.nombre || v.usuario.email || `#${v.usuario.id}`}` : 'Anónimo'}
                        </td>
                        <td style={{ ...tdStyle, fontSize: '0.78rem', color: theme.textMuted }}>{v.ipAddress || '—'}</td>
                        <td style={{ ...tdStyle, fontSize: '0.7rem', color: theme.textMuted, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.userAgent}>{v.userAgent || '—'}</td>
                        <td style={{ ...tdStyle, fontSize: '0.7rem', color: theme.textMuted, maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.referrer}>{v.referrer || '—'}</td>
                        <td style={{ ...tdStyle, fontSize: '0.78rem', color: theme.textMuted }}>{v.createdAt ? new Date(v.createdAt + 'Z').toLocaleString('es-CO') : '—'}</td>
                      </tr>
                    ))}
                  {allVisits.length === 0 && (
                    <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: theme.textMuted, padding: '30px' }}>No hay visitas registradas todavía.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <p style={{ color: theme.danger, marginBottom: '16px' }}>Error al cargar estadísticas de visitas.</p>
          <button onClick={fetchVisitStats} style={btnPrimary}>Reintentar</button>
        </div>
      )}
    </motion.div>
  );

  const renderSeguridad = () => (
    <motion.div key="seguridad" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: `1px solid ${theme.border}`, paddingBottom: '12px' }}>
        {[
          { id: 'alertas', label: `Alertas (${reportesSeguridad.filter(r => r.estado !== 'RESUELTO').length})` },
          { id: 'transferencias', label: 'Transferencias' },
          { id: 'checklist', label: 'Checklist' },
          { id: 'auditoria', label: 'Auditoría' },
        ].map(st => (
          <button key={st.id} onClick={() => setSubTabSeguridad(st.id)}
            style={{ background: subTabSeguridad === st.id ? `rgba(177,78,255,0.12)` : 'transparent', border: subTabSeguridad === st.id ? `1px solid ${theme.accent}` : '1px solid transparent', color: subTabSeguridad === st.id ? theme.text : theme.textMuted, padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
            {st.label}
          </button>
        ))}
      </div>

      {subTabSeguridad === 'alertas' && (
        <Section icon="shield" title="Alertas de Espacio Seguro">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reportesSeguridad.map(r => {
              const dotColor = r.estado === 'PENDIENTE' ? theme.danger : r.estado === 'EN_PROCESO' ? theme.warning : theme.success;
              return (
                <div key={r.id} style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${dotColor}33` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: dotColor, boxShadow: `0 0 8px ${dotColor}` }} />
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: theme.text, textTransform: 'uppercase' }}>{r.tipo}</span>
                      <span style={{ fontSize: '0.75rem', color: theme.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>#{r.id}</span>
                    </div>
                    <span style={badgeStyle(dotColor)}>{r.estado}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8rem', color: theme.textSec, marginBottom: '12px' }}>
                    <div><span style={{ color: theme.textMuted, fontWeight: 600, display: 'block', textTransform: 'uppercase', fontSize: '0.65rem' }}>Ubicación</span><span style={{ color: theme.text, fontWeight: 700 }}>{r.ubicacion}</span></div>
                    <div><span style={{ color: theme.textMuted, fontWeight: 600, display: 'block', textTransform: 'uppercase', fontSize: '0.65rem' }}>Reportado por</span><span style={{ color: theme.text }}>{r.usuarioNombre === 'Anónimo' ? 'Anónimo' : r.usuarioNombre}</span></div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
                    <span style={{ color: theme.textMuted, fontWeight: 600, display: 'block', textTransform: 'uppercase', fontSize: '0.65rem', marginBottom: '4px' }}>Detalles</span>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: theme.textSec }}>{r.descripcion}</p>
                  </div>
                  {r.estado !== 'RESUELTO' && (
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      {r.estado === 'PENDIENTE' && (
                        <button onClick={() => handleResolveReport(r.id, 'EN_PROCESO')} style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: theme.warning, borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>En Proceso</button>
                      )}
                      <button onClick={() => handleResolveReport(r.id, 'RESUELTO')} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: theme.success, borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Resuelto</button>
                    </div>
                  )}
                </div>
              );
            })}
            {reportesSeguridad.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: theme.textMuted }}>Sin reportes.</div>}
          </div>
        </Section>
      )}

      {subTabSeguridad === 'transferencias' && (
        <Section icon="ticket" title="Historial de Transferencias">
          <input style={inputStyle} placeholder="Filtrar por correo o evento..." value={searchTransfer} onChange={e => setSearchTransfer(e.target.value)} />
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead><tr>
                {['#', 'ID Boleta', 'Evento', 'Remitente', 'Destinatario', 'Código Anterior', 'Código Nuevo', 'Fecha'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>
                {transferencias.filter(t => t.usuarioOrigenEmail?.toLowerCase().includes(searchTransfer.toLowerCase()) || t.usuarioDestinoEmail?.toLowerCase().includes(searchTransfer.toLowerCase()) || t.eventoNombre?.toLowerCase().includes(searchTransfer.toLowerCase())).map(t => (
                  <tr key={t.id}>
                    <td style={{ ...tdStyle, color: theme.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>#{t.id}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: theme.accent, fontFamily: "'JetBrains Mono', monospace" }}>#{t.boletaId}</td>
                    <td style={tdStyle}>{t.eventoNombre}</td>
                    <td style={tdStyle}><div style={{ color: theme.text }}>{t.usuarioOrigenNombre}</div><div style={{ fontSize: '11px', color: theme.textMuted }}>{t.usuarioOrigenEmail}</div></td>
                    <td style={tdStyle}><div style={{ color: theme.text }}>{t.usuarioDestinoNombre}</div><div style={{ fontSize: '11px', color: theme.textMuted }}>{t.usuarioDestinoEmail}</div></td>
                    <td style={{ ...tdStyle, fontFamily: "'JetBrains Mono', monospace", color: theme.textMuted, fontSize: '0.75rem' }}>{(t.codigoQrAnterior||'').substring(0, 16)}...</td>
                    <td style={{ ...tdStyle, fontFamily: "'JetBrains Mono', monospace", color: theme.success, fontSize: '0.75rem' }}>{(t.codigoQrNuevo||'').substring(0, 16)}...</td>
                    <td style={{ ...tdStyle, color: theme.textMuted, fontSize: '0.78rem' }}>{new Date(t.fechaTransferencia).toLocaleString('es-CO')}</td>
                  </tr>
                ))}
                {transferencias.length === 0 && <tr><td colSpan={8} style={{ ...tdStyle, textAlign: 'center', color: theme.textMuted, padding: '40px' }}>Sin registros.</td></tr>}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {subTabSeguridad === 'checklist' && (
        <Section icon="shield" title="Estado de Seguridad del Sistema">
          {[
            { icon: '🔑', title: 'Autenticación JWT', status: 'ACTIVO', desc: 'Tokens HS512 con expiración. Endpoints protegidos con Bearer token.', color: theme.success },
            { icon: '🔒', title: 'Encriptación BCrypt', status: 'ACTIVO', desc: 'Contraseñas con BCrypt strength-12.', color: theme.success },
            { icon: '🛡️', title: 'RBAC', status: 'ACTIVO', desc: 'Doble protección: SecurityFilterChain + @PreAuthorize.', color: theme.success },
            { icon: '💉', title: 'SQL Injection', status: 'ACTIVO', desc: 'JPA/Hibernate con parámetros tipados.', color: theme.success },
            { icon: '🌐', title: 'CORS', status: 'ACTIVO', desc: 'Origen restringido a localhost:5173.', color: theme.success },
            { icon: '🚦', title: 'Headers HTTP', status: 'ACTIVO', desc: 'X-Frame-Options: DENY, X-Content-Type-Options: nosniff.', color: theme.success },
            { icon: '✅', title: 'Validación de Entradas', status: 'ACTIVO', desc: 'DTOs con @Valid + Bean Validation.', color: theme.success },
            { icon: '📂', title: 'Variables de Entorno', status: 'ACTIVO', desc: 'Credenciales en .env fuera de VCS.', color: theme.success },
            { icon: '🚫', title: 'CSRF', status: 'STATELESS', desc: 'API stateless con JWT, sin cookies de sesión.', color: theme.warning },
            { icon: '💳', title: 'Pasarela de Pago', status: 'PENDIENTE', desc: 'Pago simulado. Integrar Stripe/Wompi.', color: theme.danger },
            { icon: '🔒', title: 'HTTPS/TLS', status: 'REQUERIDO EN PROD', desc: 'Configurar SSL + Nginx.', color: theme.warning },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '16px 18px', borderRadius: '10px', background: `${item.color}06`, border: `1px solid ${item.color}22`, marginBottom: '10px' }}>
              <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, color: theme.text }}>{item.title}</span>
                  <span style={badgeStyle(item.color)}>{item.status}</span>
                </div>
                <p style={{ color: theme.textMuted, fontSize: '0.83rem', margin: 0 }}>{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </Section>
      )}

      {subTabSeguridad === 'auditoria' && (
        <Section icon="shield" title="Auditoría de Inicios de Sesión">
          <p style={{ color: theme.textSec, fontSize: '0.85rem', marginBottom: '16px', lineHeight: 1.5 }}>
            Registro de todos los accesos e intentos fallidos al sistema.
          </p>
          <input style={inputStyle} placeholder="Buscar por email, IP o detalles..." value={searchLog} onChange={e => setSearchLog(e.target.value)} />
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead><tr>
                {['#', 'Email', 'IP', 'Resultado', 'Detalles', 'Fecha'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>
                {loginLogs.filter(log => log.email?.toLowerCase().includes(searchLog.toLowerCase()) || log.ipAddress?.toLowerCase().includes(searchLog.toLowerCase()) || log.detalles?.toLowerCase().includes(searchLog.toLowerCase())).map(log => (
                  <tr key={log.id}
                    onMouseEnter={el => el.currentTarget.style.background = theme.cardHover}
                    onMouseLeave={el => el.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...tdStyle, color: theme.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>#{log.id}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: theme.text }}>{log.email}</td>
                    <td style={{ ...tdStyle, fontFamily: "'JetBrains Mono', monospace", color: theme.textMuted }}>{log.ipAddress}</td>
                    <td><span style={badgeStyle(log.exitoso ? theme.success : theme.danger)}>{log.exitoso ? 'ÉXITO' : 'FALLIDO'}</span></td>
                    <td style={{ ...tdStyle, color: log.exitoso ? theme.textSec : theme.danger }}>{log.detalles}</td>
                    <td style={{ ...tdStyle, color: theme.textMuted, fontSize: '0.78rem' }}>{new Date(log.timestamp).toLocaleString('es-CO')}</td>
                  </tr>
                ))}
                {loginLogs.length === 0 && <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: theme.textMuted, padding: '40px' }}>Sin registros.</td></tr>}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </motion.div>
  );

  // ── Main Layout ──
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, color: theme.text, fontFamily: "'Outfit', 'Inter', sans-serif", position: 'relative' }}>
      {/* Mobile overlay */}
      {sidebarOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40, display: isMobile ? 'block' : 'none' }} onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside style={{
        width: '240px', background: theme.sidebar, borderRight: `1px solid ${theme.border}`,
        display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-240px)',
        transition: 'transform 0.3s ease',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '6px', border: `1px solid ${theme.accent}`, background: '#000', display: 'flex', alignItems: 'center', justifycontent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            <img src={logoImg} alt="Logo" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1rem', color: theme.text, letterSpacing: '1px' }}>DOPAMINA</div>
            <div style={{ fontSize: '0.68rem', color: theme.textMuted, fontWeight: 500, letterSpacing: '0.5px' }}>CREW CONTROL PANEL</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
          {(() => {
            const userObj = api.getUser();
            const restrictedTabs = ['usuarios', 'regalos', 'cupones', 'seguridad', 'campanas'];
            const filteredItems = userObj?.rol === 'ROLE_SUBADMIN' 
              ? SIDEBAR_ITEMS.filter(item => !restrictedTabs.includes(item.id)) 
              : SIDEBAR_ITEMS;
            return filteredItems.map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); if (isMobile) setSidebarOpen(false); }}
                style={navBtnStyle(activeTab === item.id)}
                onMouseEnter={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (activeTab !== item.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: '28px', height: '28px', borderRadius: '6px',
                  background: activeTab === item.id ? theme.accent : theme.border,
                  color: activeTab === item.id ? '#fff' : theme.textMuted,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.75rem', flexShrink: 0,
                }}>{item.icon}</div>
                {item.label}
              </button>
            ));
          })()}
        </nav>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${theme.border}`, background: 'rgba(177, 78, 255, 0.08)', color: theme.accentLight, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
            <Icon name="home" size={16} />
            Volver a la Tienda
          </button>
          <button onClick={fetchAll} disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${theme.border}`, background: 'transparent', color: theme.textSec, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
            <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={{ duration: 0.8, repeat: refreshing ? Infinity : 0, ease: 'linear' }}>
              <Icon name="refresh" size={16} />
            </motion.div>
            Actualizar Datos
          </button>
          <button onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid rgba(239,68,68,0.2)`, background: 'rgba(239,68,68,0.06)', color: theme.danger, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
            <Icon name="logout" size={16} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, marginLeft: isMobile ? '0' : '240px', padding: isMobile ? '16px' : '28px 32px', maxWidth: isMobile ? '100vw' : 'calc(100vw - 240px)', overflowX: 'hidden' }}>
        {/* Mobile Header Bar */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: theme.sidebar, border: `1px solid ${theme.border}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
            <button 
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', color: theme.text, fontSize: '1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', outline: 'none' }}
            >
              ☰
            </button>
            <span style={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '1.5px', color: theme.accentLight }}>DOPAMINA CONTROL</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.3)`, borderRadius: '10px', padding: '14px 20px', marginBottom: '24px', color: theme.danger, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span> {error}
            <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: theme.danger, cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
          </motion.div>
        )}

        {/* Page header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: theme.text, margin: 0 }}>
            {SIDEBAR_ITEMS.find(i => i.id === activeTab)?.label || 'Dashboard'}
          </h1>
          <p style={{ color: theme.textMuted, fontSize: '0.85rem', margin: '4px 0 0' }}>
            {activeTab === 'overview' ? 'Resumen general del sistema Dopamina Crew' : `Gestión y administración de ${(SIDEBAR_ITEMS.find(i => i.id === activeTab)?.label || '').toLowerCase()}`}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'eventos' && renderEventos()}
          {activeTab === 'artistas' && renderArtistas()}
          {activeTab === 'compras' && renderCompras()}
          {activeTab === 'usuarios' && api.getUser()?.rol === 'ROLE_ADMIN' && renderUsuarios()}
          {activeTab === 'canjes' && renderCanjes()}
          {activeTab === 'puerta' && renderPuerta()}
          {activeTab === 'regalos' && api.getUser()?.rol === 'ROLE_ADMIN' && renderRegalos()}
          {activeTab === 'sorteos' && renderSorteos()}
          {activeTab === 'cupones' && api.getUser()?.rol === 'ROLE_ADMIN' && renderCupones()}
          {activeTab === 'promotores' && api.getUser()?.rol === 'ROLE_ADMIN' && renderPromotores()}
          {activeTab === 'campanas' && api.getUser()?.rol === 'ROLE_ADMIN' && renderCampanas()}
          {activeTab === 'visitas' && renderVisitas()}
          {activeTab === 'sets' && renderSets()}
          {activeTab === 'combos' && renderCombos()}
          {activeTab === 'graffiti' && renderGraffiti()}
          {activeTab === 'sugerencias' && renderSugerencias()}
          {activeTab === 'seguridad' && api.getUser()?.rol === 'ROLE_ADMIN' && renderSeguridad()}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {confirmModal && <ConfirmModal message={confirmModal.message} onConfirm={confirmDelete} onCancel={() => setConfirmModal(null)} />}
      </AnimatePresence>

      {/* Modal de Envío de Correo Manual */}
      <AnimatePresence>
        {emailModal.open && (
          <div 
            style={{ 
              position: 'fixed', inset: 0, zIndex: 1000, 
              background: 'rgba(0,0,0,0.85)', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', padding: '24px',
              backdropFilter: 'blur(4px)'
            }}
            onClick={() => !emailModal.loading && setEmailModal(prev => ({ ...prev, open: false }))}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ 
                background: theme.card, border: `1px solid ${theme.border}`, 
                borderRadius: '16px', padding: '28px', maxWidth: '500px', width: '100%' 
              }}
            >
              <h3 style={{ color: theme.text, fontSize: '1.1rem', fontWeight: 800, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                ✉️ Enviar Correo Personalizado
              </h3>

              {emailModal.error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: theme.danger, fontSize: '0.8rem' }}>
                  ⚠️ {emailModal.error}
                </div>
              )}

              {emailModal.success && (
                <div style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: theme.success, fontSize: '0.8rem' }}>
                  ✅ {emailModal.success}
                </div>
              )}

              <form onSubmit={handleSendEmail}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>Destinatario</label>
                <input 
                  type="email" 
                  value={emailModal.to} 
                  onChange={e => setEmailModal(prev => ({ ...prev, to: e.target.value }))}
                  required 
                  disabled
                  style={{ ...inputStyle, background: 'rgba(0,0,0,0.2)', cursor: 'not-allowed', color: theme.textMuted, marginBottom: '16px' }}
                />

                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>Asunto del Correo</label>
                <input 
                  type="text" 
                  value={emailModal.subject} 
                  onChange={e => setEmailModal(prev => ({ ...prev, subject: e.target.value }))}
                  required 
                  disabled={emailModal.loading}
                  style={inputStyle}
                  placeholder="Asunto"
                />

                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: theme.textMuted, marginBottom: '6px', textTransform: 'uppercase' }}>Mensaje (Texto Plano)</label>
                <textarea 
                  value={emailModal.body} 
                  onChange={e => setEmailModal(prev => ({ ...prev, body: e.target.value }))}
                  required 
                  disabled={emailModal.loading}
                  style={{ ...inputStyle, height: '180px', resize: 'none', lineHeight: 1.5 }}
                  placeholder="Escribe el cuerpo del mensaje..."
                />

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button 
                    type="button" 
                    onClick={() => setEmailModal(prev => ({ ...prev, open: false }))} 
                    disabled={emailModal.loading}
                    style={btnGhost}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={emailModal.loading}
                    style={{ 
                      ...btnPrimary, 
                      display: 'flex', alignItems: 'center', gap: '6px',
                      opacity: emailModal.loading ? 0.6 : 1,
                      cursor: emailModal.loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {emailModal.loading ? 'Enviando...' : 'Enviar Correo'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
