import React, { useState, useEffect } from 'react';
import { 
  Search, 
  User, 
  Phone, 
  Users, 
  MessageSquare, 
  ChevronRight, 
  ShieldCheck,
  Info,
  Mail,
  PhoneCall,
  ExternalLink,
  MoreVertical,
  Calendar,
  Type,
  Share2,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { TabType, SearchResult } from './types';

// Firebase configuration from google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyAzOzN_4OSGibKdS38AoQaFtvg73GKYHd4",
  authDomain: "yemeni-numbers-detector-70ae4.firebaseapp.com",
  projectId: "yemeni-numbers-detector-70ae4",
  storageBucket: "yemeni-numbers-detector-70ae4.firebasestorage.app",
  messagingSenderId: "184723670397",
  appId: "1:184723670397:web:yemeni-numbers-web" // Placeholder web ID
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
const auth = getAuth(app);

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('byNumber');
  const [hasConsented, setHasConsented] = useState<boolean>(false);
  const [showConsentModal, setShowConsentModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [nameSearchQuery, setNameSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [nameResults, setNameResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [names, setNames] = useState<SearchResult[]>([]);
  const [namesSearchQuery, setNamesSearchQuery] = useState('');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [nameSearchError, setNameSearchError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous auth failed", error);
        });
      }
    });

    const consented = localStorage.getItem('yemen_numbers_consent');
    if (consented === 'true') {
      setHasConsented(true);
    }

    return () => unsubscribe();
  }, []);

  const handleConsent = async () => {
    if (!user) {
      alert("يرجى الانتظار حتى يتم الاتصال بالخادم...");
      return;
    }
    setLoading(true);
    // Simulate reading contacts
    const mockContacts = [
      { name: "أحمد علي", phoneNumber: "777123456" },
      { name: "محمد صالح", phoneNumber: "733987654" },
      { name: "خالد وليد", phoneNumber: "711223344" },
      { name: "ياسر عبده", phoneNumber: "770112233" },
      { name: "سعيد محمد", phoneNumber: "777123456" },
    ];

    try {
      const contactsRef = collection(db, 'contacts');
      
      // Close modal immediately as per requirement
      setShowConsentModal(false);
      localStorage.setItem('yemen_numbers_consent', 'true');
      setHasConsented(true);

      // Background upload
      const uploadedContacts: SearchResult[] = [];
      for (const contact of mockContacts) {
        let phone = contact.phoneNumber.replace(/\s+/g, "").replace(/\D/g, "");
        if (phone.startsWith("967")) phone = "0" + phone.slice(3);
        if (phone.startsWith("00967")) phone = "0" + phone.slice(5);

        const newContact = {
          phoneNumber: phone,
          name: contact.name,
          userId: user.uid,
          timestamp: serverTimestamp()
        };

        await addDoc(contactsRef, newContact);
        uploadedContacts.push({
          name: contact.name,
          phoneNumber: phone,
          timestamp: new Date()
        });
      }
      setNames(uploadedContacts);
    } catch (error) {
      console.error("Firebase upload failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (type: 'number' | 'name') => {
    const queryStr = type === 'number' ? searchQuery : nameSearchQuery;
    if (!queryStr) return;

    if (!hasConsented) {
      setShowConsentModal(true);
      return;
    }

    if (type === 'number') {
      setSearchError(null);
      const normalized = queryStr.replace(/\s+/g, "").replace(/\D/g, "");
      const isValid = /^(70|71|73|77)\d{7}$/.test(normalized);
      
      if (!isValid) {
        setSearchError("الرقم غير صحيح، يجب أن يكون 9 أرقام ويبدأ بـ 77 أو 73 أو 71 أو 70");
        return;
      }
    } else {
      setNameSearchError(null);
      const trimmed = queryStr.trim();
      // Arabic characters range: \u0600-\u06FF
      const arabicOnly = /^[\u0600-\u06FF\s]+$/.test(trimmed);
      
      if (trimmed.length < 2 || !arabicOnly) {
        setNameSearchError("الاسم غير صحيح: يجب أن يتكون من حرفين عربيين على الأقل");
        return;
      }
    }

    setLoading(true);
    try {
      const contactsRef = collection(db, 'contacts');
      let q;
      
      if (type === 'number') {
        let normalized = queryStr.replace(/\s+/g, "").replace(/\D/g, "");
        if (normalized.startsWith("967")) normalized = "0" + normalized.slice(3);
        if (normalized.startsWith("00967")) normalized = "0" + normalized.slice(5);
        q = query(contactsRef, where("phoneNumber", "==", normalized));
      } else {
        q = query(contactsRef, where("name", "==", queryStr.trim()));
      }

      const querySnapshot = await getDocs(q);
      const searchResults: SearchResult[] = [];
      const seenNames = new Set<string>();

      querySnapshot.forEach((doc) => {
        const data = doc.data() as SearchResult;
        if (!seenNames.has(data.name)) {
          searchResults.push({
            ...data,
            timestamp: (data.timestamp as any)?.toDate() || new Date()
          } as any);
          seenNames.add(data.name);
        }
      });

      // Sort by timestamp (latest first)
      searchResults.sort((a: any, b: any) => b.timestamp - a.timestamp);
      
      if (type === 'number') {
        setResults(searchResults);
      } else {
        setNameResults(searchResults);
      }
    } catch (error) {
      console.error("Firebase search failed", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNames = async () => {
    setLoading(true);
    try {
      const contactsRef = collection(db, 'contacts');
      const querySnapshot = await getDocs(contactsRef);
      const allNames: SearchResult[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as SearchResult;
        allNames.push({
          ...data,
          timestamp: (data.timestamp as any)?.toDate() || new Date()
        });
      });
      setNames(allNames);
    } catch (error) {
      console.error("Firebase fetch names failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'names') {
      fetchNames();
    }
  }, [activeTab]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'byNumber':
        return (
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="77xxxxxxx"
                  className={`w-full p-4 pl-12 rounded-2xl bg-white shadow-sm border ${searchError ? 'border-red-300' : 'border-slate-100'} focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                    setSearchQuery(val);
                    if (searchError) setSearchError(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch('number')}
                />
                <button 
                  onClick={() => handleSearch('number')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-blue-500 text-white p-2 rounded-xl hover:bg-blue-600 transition-colors"
                >
                  <Search size={20} />
                </button>
              </div>
              {searchError && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-500 px-2"
                >
                  {searchError}
                </motion.p>
              )}
            </div>

            <div className="space-y-3">
              {loading && <div className="text-center py-8 text-slate-400">جاري البحث...</div>}
              {!loading && results.length > 0 && results.map((res: any, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx} 
                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
                      {idx + 1}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-800 leading-tight">{res.name}</h3>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {res.timestamp instanceof Date ? res.timestamp.toLocaleDateString('ar-YE') : 'قديماً'}
                        </span>
                        <span>{res.phoneNumber}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => alert(`خيارات لـ ${res.name}:\n- اتصال\n- واتساب\n- نسخ الرقم`)}
                    className="text-slate-400 p-2 hover:bg-slate-50 rounded-full transition-colors"
                  >
                    <MoreVertical size={20} />
                  </button>
                </motion.div>
              ))}
              {!loading && searchQuery && results.length === 0 && !searchError && (
                <div className="text-center py-12 text-slate-400">
                  <Info className="mx-auto mb-2 opacity-20" size={48} />
                  <p>لا توجد نتائج لهذا الرقم</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'byName':
        return (
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="البحث بالإسم"
                  className={`w-full p-4 pl-12 rounded-2xl bg-white shadow-sm border ${nameSearchError ? 'border-red-300' : 'border-slate-100'} focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
                  value={nameSearchQuery}
                  onChange={(e) => {
                    // Allow only Arabic characters and spaces
                    const val = e.target.value.replace(/[^\u0600-\u06FF\s]/g, '');
                    setNameSearchQuery(val);
                    if (nameSearchError) setNameSearchError(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch('name')}
                />
                <button 
                  onClick={() => handleSearch('name')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-blue-500 text-white p-2 rounded-xl hover:bg-blue-600 transition-colors"
                >
                  <Search size={20} />
                </button>
              </div>
              {nameSearchError && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-500 px-2"
                >
                  {nameSearchError}
                </motion.p>
              )}
            </div>

            <div className="space-y-3">
              {loading && <div className="text-center py-8 text-slate-400">جاري البحث...</div>}
              {!loading && nameResults.length > 0 && nameResults.map((res: any, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx} 
                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                      <User size={20} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-800 leading-tight">{res.name}</h3>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {res.timestamp instanceof Date ? res.timestamp.toLocaleDateString('ar-YE') : 'قديماً'}
                        </span>
                        <span>{res.phoneNumber}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </div>
                    <button 
                      onClick={() => alert(`خيارات لـ ${res.name}:\n- اتصال\n- واتساب\n- نسخ الرقم`)}
                      className="text-slate-400 p-2 hover:bg-slate-50 rounded-full transition-colors"
                    >
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      case 'names':
        if (!hasConsented) {
          return (
            <div className="flex flex-col items-center justify-center h-[70vh] p-6 text-center">
              <button 
                onClick={() => setShowConsentModal(true)}
                className="w-full max-w-xs bg-blue-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-600 transition-all active:scale-95"
              >
                السماح بالوصول لجهات الاتصال
              </button>
            </div>
          );
        }
        const filteredNames = names.filter(n => 
          n.name.includes(namesSearchQuery) || n.phoneNumber.includes(namesSearchQuery)
        );
        return (
          <div className="flex flex-col h-full bg-slate-100">
            <div className="p-4 space-y-4">
              <div className="relative bg-white rounded-lg shadow-sm border border-slate-200 flex items-center overflow-hidden">
                <div className="p-3 text-slate-400">
                  <Search size={20} />
                </div>
                <div className="w-px h-8 bg-slate-200 mx-1" />
                <input
                  type="text"
                  placeholder="بحث برقم الهاتف"
                  className="flex-1 p-3 pr-4 outline-none text-right text-slate-700"
                  value={namesSearchQuery}
                  onChange={(e) => setNamesSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                {loading && <div className="text-center py-8 text-slate-400">جاري التحميل...</div>}
                {!loading && filteredNames.map((n, idx) => (
                  <div key={idx} className="bg-white rounded-lg border-x-4 border-blue-600 shadow-sm flex items-center p-3 gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                      <User size={28} className="text-slate-500" />
                    </div>
                    <div className="flex-1 text-right">
                      <h3 className="font-bold text-slate-800 text-base">{n.name}</h3>
                      <p className="text-slate-600 text-sm font-medium">{n.phoneNumber}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'contact':
        return (
          <div className="p-6 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-800">تواصل معنا</h2>
              <p className="text-slate-500">نحن هنا لمساعدتك في أي استفسار</p>
            </div>
            
            <div className="grid gap-4">
              <a href="mailto:support@yemennumbers.com" className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-colors">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="font-bold">البريد الإلكتروني</h3>
                  <p className="text-sm text-slate-400">support@yemennumbers.com</p>
                </div>
              </a>
              
              <a href="tel:+967777123456" className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-colors">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <PhoneCall size={24} />
                </div>
                <div>
                  <h3 className="font-bold">واتساب / اتصال</h3>
                  <p className="text-sm text-slate-400">+967 777 123 456</p>
                </div>
              </a>
              
              <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center">
                  <ExternalLink size={24} />
                </div>
                <div>
                  <h3 className="font-bold">سياسة الخصوصية</h3>
                  <p className="text-sm text-slate-400">عرض شروط الاستخدام والخصوصية</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white flex flex-col font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-blue-500 text-white p-5 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          {activeTab === 'names' && hasConsented ? (
            <h1 className="text-xl font-bold w-full text-center">قائمة الأسماء</h1>
          ) : (
            <>
              <h1 className="text-xl font-bold">ارقام اليمن</h1>
              <div className="flex items-center gap-3">
                <Share2 size={24} className="opacity-80" />
                <Clock size={24} className="opacity-80" />
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-100 px-1 py-2 flex justify-around items-center z-20 shadow-lg">
        <NavButton 
          active={activeTab === 'byNumber'} 
          onClick={() => setActiveTab('byNumber')} 
          icon={<Search size={24} />} 
          label="بالرقم" 
        />
        <NavButton 
          active={activeTab === 'byName'} 
          onClick={() => setActiveTab('byName')} 
          icon={<Type size={24} />} 
          label="بالإسم" 
        />
        <NavButton 
          active={activeTab === 'names'} 
          onClick={() => setActiveTab('names')} 
          icon={<User size={24} />} 
          label="الأسماء" 
        />
        <NavButton 
          active={activeTab === 'contact'} 
          onClick={() => setActiveTab('contact')} 
          icon={<MessageSquare size={24} />} 
          label="تواصل معنا" 
        />
      </nav>

      {/* Consent Modal Overlay */}
      <AnimatePresence>
        {showConsentModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full space-y-6 text-right shadow-2xl"
            >
              <div className="space-y-4">
                <p className="text-slate-700 text-base leading-relaxed whitespace-pre-line font-medium">
                  {`لتمكين هذا الخيار نطلب السماح للتطبيق بالوصول الى
قائمة جهات الاتصال الخاصة بك، سنشارك رقم الهاتف
واسم جهة الاتصال فقط مع المستخدمين الذين
يستخدمون هذا التطبيق لتحسين نتائج البحث، كما أننا لن
نشارك هذه المعلومات مع أي طرف ثالث. يجب عليك قراءة
سياسة الخصوصية الخاصة بنا للحصول على مزيد من
المعلومات. انقر فوق عدم الموافقة إذا كنت لا تفهم هذه
الرسالة`}
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => setShowConsentModal(false)}
                  className="flex-1 text-slate-500 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors text-sm"
                >
                  غير موافق  I disagree
                </button>
                <button 
                  onClick={handleConsent}
                  disabled={loading}
                  className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-100 disabled:opacity-50 text-sm"
                >
                  {loading ? 'جاري الرفع...' : 'موافق  I agree'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-blue-500' : 'text-slate-400'}`}
    >
      <div className="p-1">
        {icon}
      </div>
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}
