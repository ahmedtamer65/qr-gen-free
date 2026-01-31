import React, { useState, useEffect } from 'react';
import { Globe, FileText, Image, Film, User, Type, Download, QrCode, Smartphone, Mail, Phone, Palette, BarChart3, Edit3, Trash2, ExternalLink, Calendar, TrendingUp, MousePointer, Plus, Home, ChevronRight, LogIn, LogOut, Eye, EyeOff, UserPlus, Loader, AlertCircle } from 'lucide-react';

// ============ SUPABASE CONFIG ============
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;

// Only initialize Supabase if credentials exist
if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
  import('@supabase/supabase-js').then(({ createClient }) => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  });
}

// ============ LOCAL STORAGE HELPERS ============
const saveToLocal = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const loadFromLocal = (key, defaultValue = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// ============ REAL QR CODE GENERATOR ============
// Using QR Code generation algorithm
const QRCodeSVG = ({ data, size = 200, fgColor = '#000000', bgColor = '#FFFFFF', id }) => {
  const [qrUrl, setQrUrl] = useState('');
  
  useEffect(() => {
    // Use Google Charts API for real QR codes
    const encodedData = encodeURIComponent(data || 'https://example.com');
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&color=${fgColor.replace('#', '')}&bgcolor=${bgColor.replace('#', '')}`;
    setQrUrl(url);
  }, [data, size, fgColor, bgColor]);

  return (
    <div id={id} style={{ width: size, height: size, background: bgColor }}>
      {qrUrl && <img src={qrUrl} alt="QR Code" style={{ width: '100%', height: '100%' }} crossOrigin="anonymous" />}
    </div>
  );
};

// ============ MAIN APP ============
const QRGeneratorApp = () => {
  // Mode: 'local' (no auth) or 'cloud' (with Supabase)
  const [mode, setMode] = useState('local');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [currentPage, setCurrentPage] = useState('home');
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingQR, setEditingQR] = useState(null);
  const [activeTab, setActiveTab] = useState('url');
  const [qrColor, setQrColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [qrName, setQrName] = useState('');
  
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [vCard, setVCard] = useState({ firstName: '', lastName: '', phone: '', email: '', company: '', title: '', website: '', address: '' });
  const [wifiData, setWifiData] = useState({ ssid: '', password: '', encryption: 'WPA' });
  const [emailData, setEmailData] = useState({ to: '', subject: '', body: '' });
  const [smsData, setSmsData] = useState({ phone: '', message: '' });

  const tabs = [
    { id: 'url', name: 'موقع', icon: Globe, color: '#3B82F6' },
    { id: 'text', name: 'نص', icon: Type, color: '#8B5CF6' },
    { id: 'pdf', name: 'PDF', icon: FileText, color: '#EF4444' },
    { id: 'image', name: 'صورة', icon: Image, color: '#10B981' },
    { id: 'vcard', name: 'vCard', icon: User, color: '#F59E0B' },
    { id: 'video', name: 'فيديو', icon: Film, color: '#EC4899' },
    { id: 'wifi', name: 'واي فاي', icon: Smartphone, color: '#06B6D4' },
    { id: 'email', name: 'إيميل', icon: Mail, color: '#F97316' },
    { id: 'sms', name: 'SMS', icon: Phone, color: '#14B8A6' },
  ];

  // ============ INITIALIZATION ============
  useEffect(() => {
    // Check if Supabase is configured
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
          setMode('cloud');
        }
        setAuthLoading(false);
      });
      
      supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) setMode('cloud');
      });
    } else {
      // No Supabase - use local mode
      setMode('local');
      setAuthLoading(false);
      setQrCodes(loadFromLocal('qr_codes', []));
    }
  }, []);

  useEffect(() => {
    if (mode === 'cloud' && user) {
      loadQRCodesFromCloud();
    }
  }, [mode, user]);

  // ============ AUTH FUNCTIONS ============
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    setAuthError('');
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: authForm.email,
      password: authForm.password,
    });
    
    if (error) {
      setAuthError(error.message === 'Invalid login credentials' ? 'البريد أو كلمة المرور غير صحيحة' : error.message);
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    setAuthError('');
    setLoading(true);
    
    const { error } = await supabase.auth.signUp({
      email: authForm.email,
      password: authForm.password,
      options: { data: { name: authForm.name } }
    });
    
    if (error) setAuthError(error.message);
    else {
      alert('تم إنشاء الحساب! يمكنك تسجيل الدخول الآن');
      setAuthMode('login');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setMode('local');
    setQrCodes(loadFromLocal('qr_codes', []));
  };

  const continueWithoutLogin = () => {
    setMode('local');
    setQrCodes(loadFromLocal('qr_codes', []));
  };

  // ============ QR FUNCTIONS ============
  const loadQRCodesFromCloud = async () => {
    if (!supabase || !user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) setQrCodes(data);
    setLoading(false);
  };

  const getQRData = () => {
    switch(activeTab) {
      case 'url': return urlInput.startsWith('http') ? urlInput : `https://${urlInput}`;
      case 'text': return textInput;
      case 'pdf': return pdfUrl;
      case 'image': return imageUrl;
      case 'video': return videoUrl;
      case 'vcard': return `BEGIN:VCARD\nVERSION:3.0\nN:${vCard.lastName};${vCard.firstName}\nFN:${vCard.firstName} ${vCard.lastName}\nORG:${vCard.company}\nTITLE:${vCard.title}\nTEL:${vCard.phone}\nEMAIL:${vCard.email}\nURL:${vCard.website}\nADR:;;${vCard.address}\nEND:VCARD`;
      case 'wifi': return `WIFI:T:${wifiData.encryption};S:${wifiData.ssid};P:${wifiData.password};;`;
      case 'email': return `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
      case 'sms': return `sms:${smsData.phone}?body=${encodeURIComponent(smsData.message)}`;
      default: return urlInput;
    }
  };

  const createQR = async () => {
    const data = getQRData();
    if (!data || data === 'https://') { alert('من فضلك أدخل البيانات'); return; }
    
    setLoading(true);
    const shortCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const newQR = {
      id: Date.now(),
      user_id: user?.id,
      short_code: shortCode,
      name: qrName || `QR ${qrCodes.length + 1}`,
      type: activeTab,
      original_url: data,
      fg_color: qrColor,
      bg_color: bgColor,
      scans: 0,
      is_active: true,
      created_at: new Date().toISOString()
    };

    if (mode === 'cloud' && supabase && user) {
      if (editingQR) {
        await supabase.from('qr_codes').update({
          name: newQR.name, type: newQR.type, original_url: newQR.original_url,
          fg_color: newQR.fg_color, bg_color: newQR.bg_color, updated_at: new Date().toISOString()
        }).eq('id', editingQR.id);
        setEditingQR(null);
        loadQRCodesFromCloud();
      } else {
        await supabase.from('qr_codes').insert([newQR]);
        loadQRCodesFromCloud();
      }
    } else {
      // Local mode
      if (editingQR) {
        const updated = qrCodes.map(qr => qr.id === editingQR.id ? { ...newQR, id: editingQR.id, scans: editingQR.scans } : qr);
        setQrCodes(updated);
        saveToLocal('qr_codes', updated);
        setEditingQR(null);
      } else {
        const updated = [newQR, ...qrCodes];
        setQrCodes(updated);
        saveToLocal('qr_codes', updated);
      }
    }

    resetForm();
    setLoading(false);
    setCurrentPage('dashboard');
  };

  const resetForm = () => {
    setQrName(''); setUrlInput(''); setTextInput(''); setPdfUrl(''); setImageUrl(''); setVideoUrl('');
    setVCard({ firstName: '', lastName: '', phone: '', email: '', company: '', title: '', website: '', address: '' });
    setWifiData({ ssid: '', password: '', encryption: 'WPA' }); setEmailData({ to: '', subject: '', body: '' }); setSmsData({ phone: '', message: '' });
    setQrColor('#000000'); setBgColor('#FFFFFF');
  };

  const deleteQR = async (id) => {
    if (!confirm('حذف هذا الكود؟')) return;
    
    if (mode === 'cloud' && supabase) {
      await supabase.from('qr_codes').delete().eq('id', id);
      loadQRCodesFromCloud();
    } else {
      const updated = qrCodes.filter(qr => qr.id !== id);
      setQrCodes(updated);
      saveToLocal('qr_codes', updated);
    }
  };

  const editQR = (qr) => {
    setEditingQR(qr);
    setActiveTab(qr.type);
    setQrName(qr.name);
    setQrColor(qr.fg_color);
    setBgColor(qr.bg_color);
    
    if (qr.type === 'url') setUrlInput(qr.original_url);
    else if (qr.type === 'text') setTextInput(qr.original_url);
    else if (qr.type === 'pdf') setPdfUrl(qr.original_url);
    else if (qr.type === 'image') setImageUrl(qr.original_url);
    else if (qr.type === 'video') setVideoUrl(qr.original_url);
    setCurrentPage('create');
  };

  const trackScan = async (qr) => {
    if (mode === 'cloud' && supabase) {
      await supabase.from('qr_codes').update({ scans: qr.scans + 1 }).eq('id', qr.id);
      loadQRCodesFromCloud();
    } else {
      const updated = qrCodes.map(q => q.id === qr.id ? { ...q, scans: (q.scans || 0) + 1 } : q);
      setQrCodes(updated);
      saveToLocal('qr_codes', updated);
    }
    window.open(qr.original_url, '_blank');
  };

  const downloadQR = async (qr, format) => {
    const encodedData = encodeURIComponent(qr.original_url);
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodedData}&color=${qr.fg_color.replace('#', '')}&bgcolor=${qr.bg_color.replace('#', '')}&format=${format}`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${qr.name}.${format}`;
    a.target = '_blank';
    a.click();
  };

  const totalScans = qrCodes.reduce((sum, qr) => sum + (qr.scans || 0), 0);

  // ============ RENDER FORM ============
  const renderForm = () => {
    switch(activeTab) {
      case 'url': return (<div><label className="block text-gray-700 font-semibold mb-2">رابط الموقع</label><div className="relative"><Globe className="absolute right-3 top-3 text-gray-400" size={20} /><input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://example.com" className="w-full pr-10 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none" dir="ltr" /></div></div>);
      case 'text': return (<div><label className="block text-gray-700 font-semibold mb-2">النص</label><textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="اكتب النص..." className="w-full p-4 border-2 border-gray-200 rounded-xl h-32" dir="rtl" /></div>);
      case 'pdf': return (<div><label className="block text-gray-700 font-semibold mb-2">رابط PDF</label><input type="url" value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="https://example.com/file.pdf" className="w-full p-3 border-2 border-gray-200 rounded-xl" dir="ltr" /></div>);
      case 'image': return (<div><label className="block text-gray-700 font-semibold mb-2">رابط الصورة</label><input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full p-3 border-2 border-gray-200 rounded-xl" dir="ltr" /></div>);
      case 'video': return (<div><label className="block text-gray-700 font-semibold mb-2">رابط الفيديو</label><input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full p-3 border-2 border-gray-200 rounded-xl" dir="ltr" /></div>);
      case 'vcard': return (<div className="space-y-3"><div className="grid grid-cols-2 gap-3"><input type="text" value={vCard.firstName} onChange={(e) => setVCard({...vCard, firstName: e.target.value})} placeholder="الاسم الأول" className="p-2 border-2 border-gray-200 rounded-lg" /><input type="text" value={vCard.lastName} onChange={(e) => setVCard({...vCard, lastName: e.target.value})} placeholder="اسم العائلة" className="p-2 border-2 border-gray-200 rounded-lg" /></div><div className="grid grid-cols-2 gap-3"><input type="tel" value={vCard.phone} onChange={(e) => setVCard({...vCard, phone: e.target.value})} placeholder="الهاتف" className="p-2 border-2 border-gray-200 rounded-lg" dir="ltr" /><input type="email" value={vCard.email} onChange={(e) => setVCard({...vCard, email: e.target.value})} placeholder="الإيميل" className="p-2 border-2 border-gray-200 rounded-lg" dir="ltr" /></div><div className="grid grid-cols-2 gap-3"><input type="text" value={vCard.company} onChange={(e) => setVCard({...vCard, company: e.target.value})} placeholder="الشركة" className="p-2 border-2 border-gray-200 rounded-lg" /><input type="text" value={vCard.title} onChange={(e) => setVCard({...vCard, title: e.target.value})} placeholder="المسمى الوظيفي" className="p-2 border-2 border-gray-200 rounded-lg" /></div><input type="url" value={vCard.website} onChange={(e) => setVCard({...vCard, website: e.target.value})} placeholder="الموقع" className="w-full p-2 border-2 border-gray-200 rounded-lg" dir="ltr" /></div>);
      case 'wifi': return (<div className="space-y-4"><input type="text" value={wifiData.ssid} onChange={(e) => setWifiData({...wifiData, ssid: e.target.value})} placeholder="اسم الشبكة" className="w-full p-3 border-2 border-gray-200 rounded-xl" /><input type="text" value={wifiData.password} onChange={(e) => setWifiData({...wifiData, password: e.target.value})} placeholder="كلمة المرور" className="w-full p-3 border-2 border-gray-200 rounded-xl" /><select value={wifiData.encryption} onChange={(e) => setWifiData({...wifiData, encryption: e.target.value})} className="w-full p-3 border-2 border-gray-200 rounded-xl"><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">بدون</option></select></div>);
      case 'email': return (<div className="space-y-4"><input type="email" value={emailData.to} onChange={(e) => setEmailData({...emailData, to: e.target.value})} placeholder="البريد" className="w-full p-3 border-2 border-gray-200 rounded-xl" dir="ltr" /><input type="text" value={emailData.subject} onChange={(e) => setEmailData({...emailData, subject: e.target.value})} placeholder="الموضوع" className="w-full p-3 border-2 border-gray-200 rounded-xl" /><textarea value={emailData.body} onChange={(e) => setEmailData({...emailData, body: e.target.value})} placeholder="الرسالة" className="w-full p-3 border-2 border-gray-200 rounded-xl h-24" /></div>);
      case 'sms': return (<div className="space-y-4"><input type="tel" value={smsData.phone} onChange={(e) => setSmsData({...smsData, phone: e.target.value})} placeholder="رقم الهاتف" className="w-full p-3 border-2 border-gray-200 rounded-xl" dir="ltr" /><textarea value={smsData.message} onChange={(e) => setSmsData({...smsData, message: e.target.value})} placeholder="الرسالة" className="w-full p-3 border-2 border-gray-200 rounded-xl h-24" /></div>);
      default: return null;
    }
  };

  // ============ LOADING ============
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto text-blue-500 mb-4" size={48} />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // ============ AUTH PAGE (only if Supabase configured and not logged in) ============
  if (supabase && !user && mode !== 'local') {
    return (
      <div dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl inline-block mb-4">
              <QrCode size={48} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">QR Generator</h1>
            <p className="text-gray-500 mt-2">مولد رموز QR الذكي</p>
          </div>

          {authError && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-center">{authError}</div>}

          <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-gray-700 font-semibold mb-2">الاسم</label>
                <input type="text" value={authForm.name} onChange={(e) => setAuthForm({...authForm, name: e.target.value})} placeholder="أحمد محمد" className="w-full p-3 border-2 border-gray-200 rounded-xl" required />
              </div>
            )}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">البريد الإلكتروني</label>
              <input type="email" value={authForm.email} onChange={(e) => setAuthForm({...authForm, email: e.target.value})} placeholder="example@email.com" className="w-full p-3 border-2 border-gray-200 rounded-xl" dir="ltr" required />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">كلمة المرور</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={authForm.password} onChange={(e) => setAuthForm({...authForm, password: e.target.value})} placeholder="••••••••" className="w-full p-3 border-2 border-gray-200 rounded-xl" dir="ltr" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-3 text-gray-400">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader className="animate-spin" size={20} /> : authMode === 'login' ? <><LogIn size={20} /> تسجيل الدخول</> : <><UserPlus size={20} /> إنشاء حساب</>}
            </button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-gray-400 text-sm">أو</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          <button onClick={continueWithoutLogin} className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition">
            المتابعة بدون تسجيل (حفظ محلي)
          </button>

          <p className="text-center mt-6 text-gray-600">
            {authMode === 'login' ? (
              <>ليس لديك حساب؟ <button onClick={() => setAuthMode('register')} className="text-blue-500 font-semibold">سجل الآن</button></>
            ) : (
              <>لديك حساب؟ <button onClick={() => setAuthMode('login')} className="text-blue-500 font-semibold">تسجيل الدخول</button></>
            )}
          </p>
        </div>
      </div>
    );
  }

  // ============ MAIN APP ============
  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Mode Banner */}
      {mode === 'local' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-amber-700 text-sm">
          <AlertCircle size={16} className="inline ml-1" />
          أنت تستخدم الوضع المحلي - البيانات محفوظة في المتصفح فقط
          {supabase && <button onClick={() => setMode('cloud')} className="mr-2 text-blue-600 underline">تسجيل الدخول للحفظ السحابي</button>}
        </div>
      )}

      {/* Nav */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => setCurrentPage('home')} className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl"><QrCode size={24} className="text-white" /></div>
            <span className="font-bold text-xl text-gray-800">QR Generator</span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage('home')} className={`px-4 py-2 rounded-lg font-semibold ${currentPage === 'home' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}><Home size={18} className="inline ml-1" />الرئيسية</button>
            <button onClick={() => setCurrentPage('create')} className={`px-4 py-2 rounded-lg font-semibold ${currentPage === 'create' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}><Plus size={18} className="inline ml-1" />إنشاء</button>
            <button onClick={() => setCurrentPage('dashboard')} className={`px-4 py-2 rounded-lg font-semibold ${currentPage === 'dashboard' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}><BarChart3 size={18} className="inline ml-1" />لوحة التحكم</button>
            {user && (
              <>
                <div className="border-r h-6 mx-2"></div>
                <span className="text-gray-600 text-sm">{user.email}</span>
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 rounded-lg" title="تسجيل خروج"><LogOut size={20} /></button>
              </>
            )}
          </div>
        </div>
      </nav>

      {loading && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-xl">
            <Loader className="animate-spin mx-auto text-blue-500 mb-2" size={32} />
            <p>جاري التحميل...</p>
          </div>
        </div>
      )}

      {/* Home */}
      {currentPage === 'home' && (
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">مرحباً! 👋</h1>
          <p className="text-xl text-gray-600 mb-8">أنشئ رموز QR حقيقية قابلة للمسح والتعديل</p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => setCurrentPage('create')} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-2"><Plus size={24} />إنشاء QR جديد</button>
            <button onClick={() => setCurrentPage('dashboard')} className="bg-white text-gray-700 px-8 py-4 rounded-xl font-bold text-lg border-2 flex items-center gap-2"><BarChart3 size={24} />لوحة التحكم</button>
          </div>
          <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto mt-16">
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center"><div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3"><QrCode size={28} className="text-blue-500" /></div><p className="text-3xl font-bold">{qrCodes.length}</p><p className="text-gray-500">رموز QR</p></div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center"><div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"><MousePointer size={28} className="text-green-500" /></div><p className="text-3xl font-bold">{totalScans}</p><p className="text-gray-500">إجمالي المسح</p></div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center"><div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3"><TrendingUp size={28} className="text-purple-500" /></div><p className="text-3xl font-bold">{qrCodes.filter(q => q.is_active).length}</p><p className="text-gray-500">نشط</p></div>
          </div>
        </div>
      )}

      {/* Create */}
      {currentPage === 'create' && (
        <div className="max-w-5xl mx-auto px-4 py-8">
          <button onClick={() => { setCurrentPage('home'); setEditingQR(null); resetForm(); }} className="flex items-center gap-2 text-gray-600 mb-6"><ChevronRight size={20} />رجوع</button>
          <h1 className="text-3xl font-bold text-gray-800 mb-8">{editingQR ? 'تعديل QR' : 'إنشاء QR جديد'}</h1>
          <div className="bg-white rounded-2xl shadow-lg p-2 mb-8 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {tabs.map((tab) => { const Icon = tab.icon; return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'text-gray-600 hover:bg-gray-100'}`} style={activeTab === tab.id ? { backgroundColor: tab.color } : {}}><Icon size={18} />{tab.name}</button>); })}
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="mb-6"><label className="block text-gray-700 font-semibold mb-2">اسم الـ QR</label><input type="text" value={qrName} onChange={(e) => setQrName(e.target.value)} placeholder="مثال: موقعي" className="w-full p-3 border-2 border-gray-200 rounded-xl" /></div>
              {renderForm()}
              <div className="mt-6 pt-6 border-t"><h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Palette size={18} />الألوان</h3><div className="flex gap-6"><div><label className="block text-sm text-gray-600 mb-2">الكود</label><input type="color" value={qrColor} onChange={(e) => setQrColor(e.target.value)} className="w-12 h-12 rounded-lg cursor-pointer border-2" /></div><div><label className="block text-sm text-gray-600 mb-2">الخلفية</label><input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-12 h-12 rounded-lg cursor-pointer border-2" /></div></div></div>
              <button onClick={createQR} disabled={loading} className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50">{editingQR ? <><Edit3 size={20} />تحديث</> : <><Plus size={20} />إنشاء</>}</button>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-700 mb-6">معاينة (QR حقيقي قابل للمسح)</h3>
              <div className="flex justify-center"><div className="p-4 bg-gray-50 rounded-2xl"><QRCodeSVG data={getQRData() || 'https://example.com'} size={250} fgColor={qrColor} bgColor={bgColor} /></div></div>
              <p className="text-center text-green-600 mt-4 text-sm">✅ جرب تمسح الكود بموبايلك!</p>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard */}
      {currentPage === 'dashboard' && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">لوحة التحكم</h1>
            <button onClick={() => setCurrentPage('create')} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"><Plus size={20} />إنشاء QR</button>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><QrCode size={20} className="text-blue-500" /></div><div><p className="text-2xl font-bold">{qrCodes.length}</p><p className="text-sm text-gray-500">إجمالي</p></div></div>
            <div className="bg-white rounded-xl p-4 shadow flex items-center gap-3"><div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><MousePointer size={20} className="text-green-500" /></div><div><p className="text-2xl font-bold">{totalScans}</p><p className="text-sm text-gray-500">مسح</p></div></div>
            <div className="bg-white rounded-xl p-4 shadow flex items-center gap-3"><div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><TrendingUp size={20} className="text-purple-500" /></div><div><p className="text-2xl font-bold">{qrCodes.filter(q => q.is_active).length}</p><p className="text-sm text-gray-500">نشط</p></div></div>
            <div className="bg-white rounded-xl p-4 shadow flex items-center gap-3"><div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center"><Calendar size={20} className="text-amber-500" /></div><div><p className="text-2xl font-bold">{qrCodes.filter(qr => new Date(qr.created_at) > new Date(Date.now() - 7*24*60*60*1000)).length}</p><p className="text-sm text-gray-500">هذا الأسبوع</p></div></div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-4 border-b bg-gray-50"><h2 className="font-bold text-gray-700">رموز QR الخاصة بك</h2></div>
            {qrCodes.length === 0 ? (<div className="p-12 text-center"><QrCode size={64} className="mx-auto text-gray-300 mb-4" /><p className="text-gray-500 mb-4">لا توجد رموز بعد</p><button onClick={() => setCurrentPage('create')} className="text-blue-500 font-semibold">إنشاء أول QR</button></div>) : (
              <div className="divide-y">
                {qrCodes.map((qr) => { const tab = tabs.find(t => t.id === qr.type); return (
                  <div key={qr.id} className="p-4 hover:bg-gray-50 flex items-center gap-4">
                    <div className="flex-shrink-0 p-2 bg-white rounded-lg border"><QRCodeSVG data={qr.original_url} size={60} fgColor={qr.fg_color} bgColor={qr.bg_color} id={`qr-${qr.id}`} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1"><h3 className="font-bold text-gray-800">{qr.name}</h3><span className="px-2 py-0.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: tab?.color }}>{tab?.name}</span></div>
                      <p className="text-sm text-gray-500 truncate" dir="ltr">{qr.original_url}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-400"><span><MousePointer size={14} className="inline" /> {qr.scans || 0}</span><span><Calendar size={14} className="inline" /> {new Date(qr.created_at).toLocaleDateString('ar-EG')}</span></div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => trackScan(qr)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg" title="فتح"><ExternalLink size={18} /></button>
                      <button onClick={() => editQR(qr)} className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg" title="تعديل"><Edit3 size={18} /></button>
                      <button onClick={() => downloadQR(qr, 'png')} className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg" title="PNG"><Download size={18} /></button>
                      <button onClick={() => deleteQR(qr.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="حذف"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ); })}
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="bg-white border-t py-6 mt-12"><div className="text-center text-gray-500">© 2025 QR Generator</div></footer>
    </div>
  );
};

export default QRGeneratorApp;
