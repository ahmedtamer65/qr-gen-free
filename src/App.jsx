import React, { useState, useEffect } from 'react';
import { Globe, FileText, Image, Film, User, Type, Download, QrCode, Smartphone, Mail, Phone, Palette, BarChart3, Edit3, Trash2, ExternalLink, Calendar, TrendingUp, MousePointer, Plus, Home, ChevronRight, LogIn, LogOut, Eye, EyeOff, UserPlus, Loader, AlertCircle, Share2, Copy, Check } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// ============ SUPABASE ============
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ============ LOCAL STORAGE ============
const saveLocal = (data) => localStorage.setItem('qr_codes', JSON.stringify(data));
const loadLocal = () => { try { return JSON.parse(localStorage.getItem('qr_codes')) || []; } catch { return []; } };

// ============ QR IMAGE ============
const QRImage = ({ data, size = 200, fg = '#000000', bg = '#FFFFFF' }) => (
  <img 
    src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data || 'https://example.com')}&color=${fg.replace('#','')}&bgcolor=${bg.replace('#','')}`} 
    alt="QR" 
    style={{width: size, height: size}} 
  />
);

// ============ APP ============
export default function App() {
  const [mode, setMode] = useState('loading'); // loading, auth, local, cloud
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('home');
  const [qrList, setQrList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState('url');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authError, setAuthError] = useState('');
  const [success, setSuccess] = useState('');

  const tabs = [
    { id: 'url', label: 'موقع', icon: Globe, color: '#3B82F6' },
    { id: 'text', label: 'نص', icon: Type, color: '#8B5CF6' },
  ];

  // Show success message
  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  // ============ INIT ============
  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) { setUser(session.user); setMode('cloud'); }
        else { setMode('auth'); }
      });
      supabase.auth.onAuthStateChange((_, session) => {
        if (session?.user) { setUser(session.user); setMode('cloud'); }
      });
    } else {
      setMode('local');
      setQrList(loadLocal());
    }
  }, []);

  useEffect(() => {
    if (mode === 'cloud' && user) loadFromCloud();
    if (mode === 'local') setQrList(loadLocal());
  }, [mode, user]);

  // ============ AUTH ============
  const login = async () => {
    if (!supabase) return;
    setLoading(true); setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPass });
    if (error) setAuthError('خطأ: ' + error.message);
    setLoading(false);
  };

  const register = async () => {
    if (!supabase) return;
    setLoading(true); setAuthError('');
    const { error } = await supabase.auth.signUp({ email: authEmail, password: authPass });
    if (error) setAuthError('خطأ: ' + error.message);
    else { alert('تم! سجل دخول الآن'); }
    setLoading(false);
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null); setMode('auth'); setQrList([]);
  };

  const skipAuth = () => { setMode('local'); setQrList(loadLocal()); };

  // ============ CLOUD ============
  const loadFromCloud = async () => {
    if (!supabase || !user) return;
    const { data } = await supabase.from('qr_codes').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setQrList(data || []);
  };

  // ============ QR CRUD ============
  const getData = () => tab === 'url' ? (url.startsWith('http') ? url : 'https://' + url) : text;

  const saveQR = async () => {
    const qrData = getData();
    if (!qrData || qrData === 'https://') { alert('أدخل البيانات!'); return; }

    setLoading(true);

    const newQR = {
      id: editing?.id || Date.now(),
      user_id: user?.id || null,
      short_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      name: name || 'QR ' + (qrList.length + 1),
      type: tab,
      original_url: qrData,
      fg_color: fgColor,
      bg_color: bgColor,
      scans: editing?.scans || 0,
      is_active: true,
      created_at: editing?.created_at || new Date().toISOString()
    };

    if (mode === 'cloud' && supabase && user) {
      // CLOUD MODE
      if (editing) {
        const { error } = await supabase.from('qr_codes').update({
          name: newQR.name, type: newQR.type, original_url: newQR.original_url,
          fg_color: newQR.fg_color, bg_color: newQR.bg_color
        }).eq('id', editing.id);
        if (error) { alert('خطأ: ' + error.message); setLoading(false); return; }
      } else {
        const { error } = await supabase.from('qr_codes').insert([{
          user_id: user.id,
          short_code: newQR.short_code,
          name: newQR.name,
          type: newQR.type,
          original_url: newQR.original_url,
          fg_color: newQR.fg_color,
          bg_color: newQR.bg_color,
          scans: 0,
          is_active: true
        }]);
        if (error) { alert('خطأ: ' + error.message); setLoading(false); return; }
      }
      await loadFromCloud();
    } else {
      // LOCAL MODE
      let updated;
      if (editing) {
        updated = qrList.map(q => q.id === editing.id ? newQR : q);
      } else {
        updated = [newQR, ...qrList];
      }
      setQrList(updated);
      saveLocal(updated);
    }

    // Reset
    setName(''); setUrl(''); setText(''); setFgColor('#000000'); setBgColor('#FFFFFF');
    setEditing(null);
    setLoading(false);
    showSuccess('تم الحفظ بنجاح! ✅');
    setPage('dashboard');
  };

  const deleteQR = async (qr) => {
    if (!confirm('حذف؟')) return;
    if (mode === 'cloud' && supabase) {
      await supabase.from('qr_codes').delete().eq('id', qr.id);
      await loadFromCloud();
    } else {
      const updated = qrList.filter(q => q.id !== qr.id);
      setQrList(updated);
      saveLocal(updated);
    }
    showSuccess('تم الحذف! 🗑️');
  };

  const editQR = (qr) => {
    setEditing(qr);
    setTab(qr.type);
    setName(qr.name);
    setFgColor(qr.fg_color);
    setBgColor(qr.bg_color);
    if (qr.type === 'url') setUrl(qr.original_url);
    else setText(qr.original_url);
    setPage('create');
  };

  const downloadQR = (qr, size = 512) => {
    const link = document.createElement('a');
    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qr.original_url)}&color=${qr.fg_color.replace('#','')}&bgcolor=${qr.bg_color.replace('#','')}&format=png`;
    link.download = qr.name + '.png';
    link.click();
  };

  // ============ LOADING ============
  if (mode === 'loading') return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <Loader className="animate-spin text-blue-500" size={48} />
    </div>
  );

  // ============ AUTH ============
  if (mode === 'auth') return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-2xl inline-block mb-3">
            <QrCode size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">QR Generator</h1>
        </div>
        {authError && <div className="bg-red-100 text-red-600 p-2 rounded-lg mb-4 text-sm text-center">{authError}</div>}
        <input type="email" placeholder="الإيميل" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full p-3 border rounded-xl mb-3" dir="ltr" />
        <input type="password" placeholder="كلمة المرور" value={authPass} onChange={e => setAuthPass(e.target.value)} className="w-full p-3 border rounded-xl mb-4" dir="ltr" />
        <button onClick={login} disabled={loading} className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold mb-2 disabled:opacity-50">
          {loading ? 'جاري...' : 'تسجيل دخول'}
        </button>
        <button onClick={register} disabled={loading} className="w-full bg-purple-500 text-white py-3 rounded-xl font-bold mb-4 disabled:opacity-50">
          إنشاء حساب
        </button>
        <button onClick={skipAuth} className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">
          متابعة بدون تسجيل 📱
        </button>
      </div>
    </div>
  );

  // ============ MAIN APP ============
  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Success Message */}
      {success && (
        <div className="fixed top-4 left-4 right-4 bg-green-500 text-white p-3 rounded-xl text-center z-50 shadow-lg">
          {success}
        </div>
      )}

      {/* Mode Banner */}
      {mode === 'local' && (
        <div className="bg-amber-100 text-amber-700 text-center py-2 text-sm">
          ⚠️ الوضع المحلي - البيانات في المتصفح فقط
        </div>
      )}

      {/* Nav */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <QrCode size={28} className="text-blue-500" />
            <span className="font-bold text-lg">QR Generator</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPage('home')} className={`p-2 rounded-lg ${page === 'home' ? 'bg-blue-100 text-blue-600' : ''}`}><Home size={20} /></button>
            <button onClick={() => setPage('create')} className={`p-2 rounded-lg ${page === 'create' ? 'bg-blue-100 text-blue-600' : ''}`}><Plus size={20} /></button>
            <button onClick={() => setPage('dashboard')} className={`p-2 rounded-lg ${page === 'dashboard' ? 'bg-blue-100 text-blue-600' : ''}`}><BarChart3 size={20} /></button>
            {user && <button onClick={logout} className="p-2 text-red-500"><LogOut size={20} /></button>}
          </div>
        </div>
      </nav>

      {/* Loading */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl"><Loader className="animate-spin text-blue-500" size={40} /></div>
        </div>
      )}

      {/* HOME */}
      {page === 'home' && (
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold mb-4">مرحباً! 👋</h1>
          <p className="text-gray-600 mb-8">أنشئ رموز QR حقيقية</p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => setPage('create')} className="bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2">
              <Plus size={20} /> إنشاء QR
            </button>
            <button onClick={() => setPage('dashboard')} className="bg-white border-2 px-6 py-3 rounded-xl font-bold flex items-center gap-2">
              <BarChart3 size={20} /> لوحة التحكم ({qrList.length})
            </button>
          </div>
        </div>
      )}

      {/* CREATE */}
      {page === 'create' && (
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-6">{editing ? 'تعديل' : 'إنشاء'} QR</h1>
          
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} 
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold ${tab === t.id ? 'text-white' : 'bg-gray-100'}`}
                style={tab === t.id ? {backgroundColor: t.color} : {}}>
                <t.icon size={18} /> {t.label}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <label className="block font-bold mb-2">اسم الـ QR</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="اسم للتعريف" className="w-full p-3 border rounded-xl mb-4" />
            
            {tab === 'url' && (
              <>
                <label className="block font-bold mb-2">الرابط</label>
                <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" className="w-full p-3 border rounded-xl mb-4" dir="ltr" />
              </>
            )}
            {tab === 'text' && (
              <>
                <label className="block font-bold mb-2">النص</label>
                <textarea value={text} onChange={e => setText(e.target.value)} placeholder="اكتب النص..." className="w-full p-3 border rounded-xl mb-4 h-24" />
              </>
            )}

            <div className="flex gap-4 mb-4">
              <div>
                <label className="block text-sm mb-1">لون الكود</label>
                <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} className="w-12 h-12 rounded cursor-pointer" />
              </div>
              <div>
                <label className="block text-sm mb-1">لون الخلفية</label>
                <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-12 h-12 rounded cursor-pointer" />
              </div>
            </div>

            <button onClick={saveQR} disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50">
              {editing ? '💾 تحديث' : '✨ إنشاء QR'}
            </button>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <h3 className="font-bold mb-4">معاينة</h3>
            <div className="inline-block p-4 bg-gray-50 rounded-xl">
              <QRImage data={getData()} size={180} fg={fgColor} bg={bgColor} />
            </div>
            <p className="text-green-600 mt-3">✅ جرب تمسحه بموبايلك!</p>
          </div>
        </div>
      )}

      {/* DASHBOARD */}
      {page === 'dashboard' && (
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">لوحة التحكم</h1>
            <button onClick={() => { setEditing(null); setName(''); setUrl(''); setText(''); setPage('create'); }} className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2">
              <Plus size={18} /> جديد
            </button>
          </div>

          {qrList.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
              <QrCode size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">لا توجد رموز QR</p>
              <button onClick={() => setPage('create')} className="text-blue-500 font-bold">إنشاء أول QR</button>
            </div>
          ) : (
            <div className="space-y-4">
              {qrList.map(qr => (
                <div key={qr.id} className="bg-white rounded-2xl p-4 shadow-lg">
                  <div className="flex gap-4">
                    <div className="p-2 bg-gray-50 rounded-xl">
                      <QRImage data={qr.original_url} size={100} fg={qr.fg_color} bg={qr.bg_color} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{qr.name}</h3>
                      <p className="text-gray-500 text-sm truncate" dir="ltr">{qr.original_url}</p>
                      <p className="text-gray-400 text-xs mt-1">{new Date(qr.created_at).toLocaleDateString('ar-EG')}</p>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button onClick={() => window.open(qr.original_url, '_blank')} className="px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg text-sm font-bold">
                          فتح
                        </button>
                        <button onClick={() => editQR(qr)} className="px-3 py-1.5 bg-green-100 text-green-600 rounded-lg text-sm font-bold">
                          تعديل
                        </button>
                        <button onClick={() => downloadQR(qr)} className="px-3 py-1.5 bg-purple-100 text-purple-600 rounded-lg text-sm font-bold">
                          تنزيل
                        </button>
                        <button onClick={() => downloadQR(qr, 1024)} className="px-3 py-1.5 bg-amber-100 text-amber-600 rounded-lg text-sm font-bold">
                          HD
                        </button>
                        <button onClick={() => deleteQR(qr)} className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-sm font-bold">
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <footer className="text-center py-6 text-gray-400 text-sm">© 2025 QR Generator</footer>
    </div>
  );
}
