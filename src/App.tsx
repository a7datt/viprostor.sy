/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Component } from "react";
import { 
  Home, 
  Wallet, 
  ShoppingBag, 
  User, 
  Bell, 
  Menu, 
  ChevronRight, 
  Plus, 
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  LogOut,
  Settings,
  History,
  MessageSquare,
  Ticket,
  LayoutGrid,
  Search,
  Lock,
  Copy,
  ExternalLink,
  Pencil,
  Database,
  Upload,
  Download,
  Trash2,
  PlusCircle,
  Phone,
  ShieldCheck,
  RefreshCw,
  FileJson,
  Eraser,
  Star,
  Award,
  Crown,
  ChevronDown,
  ChevronUp,
  Palette,
  Send,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { 
  Category, 
  Subcategory, 
  SubSubCategory, 
  Product, 
  UserData, 
  Order, 
  Transaction, 
  PaymentMethod, 
  Banner, 
  Offer,
  AdminPanelProps,
  VoucherRedeemViewProps,
  AdminLoginViewProps
} from "./types";

const VoucherRedeemView = ({ voucherCode, setVoucherCode, handleRedeemVoucher, setView }: VoucherRedeemViewProps) => (
  <div className="px-6 flex flex-col items-center justify-center min-h-[60vh] space-y-6">
    <div className="w-20 h-20 bg-brand rounded-3xl flex items-center justify-center text-white shadow-xl shadow-brand-soft">
      <Ticket size={40} />
    </div>
    <div className="text-center space-y-2">
      <h2 className="text-2xl font-bold text-gray-800">شحن كود الرصيد</h2>
      <p className="text-gray-400 text-sm">أدخل الكود الذي حصلت عليه لشحن رصيدك فوراً</p>
    </div>
    <div className="w-full space-y-4">
      <input 
        type="text" 
        placeholder="ضع الكود هنا (مثال: GIFT100)" 
        value={voucherCode}
        onChange={(e) => setVoucherCode(e.target.value)}
        className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-center text-lg font-bold outline-none focus:border-brand shadow-sm"
      />
      <button 
        onClick={handleRedeemVoucher}
        className="w-full bg-brand text-white py-4 rounded-2xl font-bold shadow-lg shadow-brand-soft transition-all active:scale-95"
      >
        تأكيد الشحن
      </button>
      <button 
        onClick={() => setView({ type: "main" })}
        className="w-full text-gray-400 font-bold text-sm"
      >
        إلغاء
      </button>
    </div>
  </div>
);

const AdminLoginView = ({ setIsAdmin, setAdminAuth, setView }: AdminLoginViewProps) => {
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass })
      });
      if (res.ok) {
        setIsAdmin(true);
        setAdminAuth(true);
        setView({ type: "main" });
      } else {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          alert(data.error || "كلمة مرور خاطئة");
        } else {
          alert("كلمة مرور خاطئة");
        }
      }
    } catch (e: any) {
      if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
        alert("فشل الاتصال بالسيرفر (تأكد من اتصالك بالإنترنت)");
      } else {
        alert("فشل الاتصال بالسيرفر");
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="px-6 flex flex-col items-center justify-center min-h-[70vh] space-y-8">
      <div className="w-20 h-20 bg-gray-800 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-gray-100">
        <Lock size={40} />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">دخول المسؤول</h2>
        <p className="text-gray-400 text-sm">يرجى إدخال كلمة المرور للوصول للوحة التحكم</p>
      </div>
      <div className="w-full space-y-4">
        <input 
          type="password" 
          placeholder="كلمة المرور" 
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-center text-lg outline-none focus:border-gray-800 shadow-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        />
        <button 
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-gray-800 text-white py-4 rounded-2xl font-bold shadow-lg shadow-gray-100 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? "جاري التحقق..." : "دخول"}
        </button>
        <button 
          onClick={() => setView({ type: "main" })}
          className="w-full text-gray-400 font-bold text-sm"
        >
          عودة للمتجر
        </button>
      </div>
    </div>
  );
};

const REWARD_GOALS = [
  { id: 1, target: 5, title: "الهدف الأول", rewardText: "خصم 1٪ لجميع المنتجات مدة شهر", rewards: { discount: 1, duration: '1_month' } },
  { id: 2, target: 15, title: "الهدف الثاني", rewardText: "خصم 2٪ لمدة شهر + رصيد 1$", rewards: { discount: 2, duration: '1_month', balance: 1 } },
  { id: 3, target: 30, title: "الهدف الثالث", rewardText: "خصم 4٪ لمدة شهر + رصيد 3$ + خصم 10٪ لمنتج واحد", rewards: { discount: 4, duration: '1_month', balance: 3, oneProductDiscount: 10 } },
  { id: 4, target: 50, title: "الهدف الرابع", rewardText: "رصيد 5$ + خصم 5٪ لمدة سنة", rewards: { balance: 5, discount: 5, duration: '1_year' } },
  { id: 5, target: 100, title: "الهدف الخامس", rewardText: "رصيد 5$ + خصم 7٪ لمدة شهر + خصم 5٪ لمدة سنة + خصم 15٪ لمنتج واحد + شارة فضية + ثيم أصفر", rewards: { balance: 5, discount_month: 7, discount_year: 5, oneProductDiscount: 15, badge: 'silver', theme: 'yellow' } },
  { id: 6, target: 200, title: "الهدف السادس", rewardText: "رصيد 10$ + خصم 15٪ لمنتج واحد + خصم 5٪ لمدة سنة + خصم 10٪ لمدة شهر + شارة ذهبية + ثيم أحمر", rewards: { balance: 10, oneProductDiscount: 15, discount_year: 5, discount_month: 10, badge: 'gold', theme: 'red' } },
  { id: 7, target: 500, title: "الهدف السابع", rewardText: "رصيد 20$ + خصم 20٪ لمنتج واحد + خصم 10٪ لمدة شهر + خصم 15٪ لمدة أسبوع + شارة ذهبية + ثيمات مفتوحة + دعم خاص + أولوية طلبات + أكواد مخصصة", rewards: { balance: 20, oneProductDiscount: 20, discount_month: 10, discount_week: 15, badge: 'gold', anyTheme: true, specialSupport: true, priority: true, customCodes: true } }
];

// --- Error Boundary ---
export class ErrorBoundary extends (Component as any) {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    fetch("/api/report-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: error?.toString(),
        stack: errorInfo?.componentStack,
        userInfo: user ? { id: user.id, name: user.name } : "Guest"
      })
    }).catch(console.error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
            <XCircle size={48} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">عذراً، حدث خطأ ما</h1>
          <p className="text-gray-600 mb-8 max-w-md">
            لقد واجه التطبيق مشكلة غير متوقعة. يرجى أخذ لقطة شاشة (Screenshot) والتواصل مع الدعم الفني لمساعدتك.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-brand text-white rounded-xl font-bold shadow-lg shadow-brand-soft"
          >
            إعادة تحميل التطبيق
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-8 p-4 bg-gray-100 rounded-lg text-left text-xs overflow-auto max-w-full">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

  const AdminImageUpload = ({ onUpload, currentUrl, label }: { onUpload: (url: string) => void, currentUrl: string, label: string }) => {
    const [uploading, setUploading] = useState(false);
    
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);
      
      try {
        const imgbbKey = (import.meta as any).env.VITE_IMGBB_API_KEY || "97ffbf56fe1a203445531d664cd4b928";
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          onUpload(data.data.url);
        } else {
          alert("فشل الرفع: " + (data.error?.message || "خطأ غير معروف"));
        }
      } catch (err) {
        alert("خطأ في الاتصال بخادم الصور");
      } finally {
        setUploading(false);
      }
    };

    return (
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-400">{label}</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="رابط الصورة" 
            className="flex-1 p-3 bg-gray-50 border-none rounded-xl text-sm outline-none" 
            value={currentUrl} 
            onChange={e => onUpload(e.target.value)} 
          />
          <label className="bg-brand-light text-brand px-4 py-3 rounded-xl text-xs font-bold cursor-pointer hover:bg-brand-soft transition-colors flex items-center gap-1">
            <Upload size={14} />
            {uploading ? "..." : "رفع"}
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
        {currentUrl && (
          <div className="w-16 h-16 rounded-lg border border-gray-100 overflow-hidden bg-gray-50">
            <img src={currentUrl} className="w-full h-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
          </div>
        )}
      </div>
    );
  };

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [user, setUser] = useState<UserData | null>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [view, setView] = useState<{ type: string; id?: number; data?: any }>({ type: "main" });
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [subSubCategories, setSubSubCategories] = useState<SubSubCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState<any>(null);
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminTab, setAdminTab] = useState("management");
  const [themeModal, setThemeModal] = useState({ isOpen: false, color: "#10b981" });
  const [newAdminPass, setNewAdminPass] = useState("");
  const [showAllRewards, setShowAllRewards] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const [voucherCode, setVoucherCode] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockCountdown, setBlockCountdown] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [linkingModal, setLinkingModal] = useState<{ isOpen: boolean; code: string; timeLeft: number }>({
    isOpen: false,
    code: "",
    timeLeft: 0
  });

  // Theme effect
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const subscribeToPush = async (userId: number) => {
    try {
      if (!('Notification' in window)) return;
      
      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }

      if (permission !== "granted") {
        console.log("Push notification permission not granted.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const res = await fetch("/api/push/key");
      const { publicKey } = await res.json();
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey
      });
      
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, subscription })
      });
    } catch (e: any) {
      if (e.name === 'NotAllowedError' || e.message.includes('permission denied')) {
        console.log("Push subscription blocked by user permission.");
      } else {
        console.error("Push subscription error:", e);
      }
    }
  };

  useEffect(() => {
    if (user && 'serviceWorker' in navigator && 'PushManager' in window) {
      subscribeToPush(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Polling for user data (instant updates)
  useEffect(() => {
    let interval: any;
    // Don't poll if in sensitive views or if admin
    const isSensitiveView = ["checkout", "payment"].includes(view.type);
    if (user && !isAdmin && !isSensitiveView) {
      interval = setInterval(() => {
        fetchUser(user.id);
      }, 60000); // Poll every 60 seconds instead of 10
    }
    return () => clearInterval(interval);
  }, [user?.id, isAdmin, view.type]);

  // Block countdown effect
  useEffect(() => {
    let interval: any;
    if (isBlocked && blockCountdown > 0) {
      interval = setInterval(() => {
        setBlockCountdown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBlocked, blockCountdown]);

  // Telegram linking timer effect
  useEffect(() => {
    let interval: any;
    if (linkingModal.isOpen && linkingModal.timeLeft > 0) {
      interval = setInterval(() => {
        setLinkingModal(prev => ({ ...prev, timeLeft: Math.max(0, prev.timeLeft - 1) }));
      }, 1000);
    } else if (linkingModal.timeLeft === 0 && linkingModal.isOpen) {
      setLinkingModal(prev => ({ ...prev, isOpen: false }));
    }
    return () => clearInterval(interval);
  }, [linkingModal.isOpen, linkingModal.timeLeft]);

  // Fetch initial data
  useEffect(() => {
    fetchCategories();
    fetchSubSubCategories();
    fetchPaymentMethods();
    fetchBanners();
    fetchOffers();
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      fetchUser(parsed.id);
    }

    // Handle referral code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      localStorage.setItem("referralCode", ref);
      if (!savedUser) {
        setView({ type: "login" });
      }
    }

    // Handle Admin Route
    if (window.location.pathname === "/adminvipa7d1216") {
      setView({ type: "admin_login" });
    }
  }, []);

  useEffect(() => {
    if (user?.stats?.custom_theme_color && user.stats.custom_theme_color.startsWith('#')) {
      document.documentElement.style.setProperty('--custom-primary', user.stats.custom_theme_color);
      document.documentElement.style.setProperty('--custom-primary-light', `${user.stats.custom_theme_color}1a`);
    } else {
      document.documentElement.style.removeProperty('--custom-primary');
      document.documentElement.style.removeProperty('--custom-primary-light');
    }
  }, [user?.stats?.custom_theme_color]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/notifications/${user.id}`);
      if (!res.ok) throw new Error(`Failed to fetch notifications: ${res.status}`);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Expected JSON response from notifications API");
      }
      const data = await res.json();
      const serverNotifs = data.map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        created_at: n.created_at,
        is_read: n.is_read
      }));

      // Add the TG link warning if needed
      if (user.telegram_chat_id) {
        serverNotifs.unshift({
          id: 'tg-link',
          title: 'تم ربط حسابك ببوت تلجرام',
          message: 'لقد تم ربط حسابك ببوت تلجرام. إن لم تكن أنت، يرجى الضغط على فك الارتباط وتغيير بياناتك.',
          type: 'warning',
          action: 'unlink'
        });
      }
      setNotifications(serverNotifs);
    } catch (e: any) {
      if (e.name === 'TypeError' && e.message === 'Failed to fetch') return;
      console.error("Fetch notifications error:", e);
    }
  };

  useEffect(() => {
    if (user && !isAdmin) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    } else if (!user) {
      setNotifications([]);
    }
  }, [user, isAdmin]);

  const markNotificationRead = async (id: number | string) => {
    if (typeof id === 'string') return; // Local notifs
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id })
      });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnlinkTelegram = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/user/unlink-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) {
        fetchUser(user.id);
        alert("تم فك الارتباط بنجاح. لقد تم تسجيل خروجك من بوت تليجرام أيضاً.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateLinkingCode = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/user/generate-linking-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      if (res.ok) {
        setLinkingModal({
          isOpen: true,
          code: data.code,
          timeLeft: 600 // 10 minutes
        });
      } else {
        alert(data.error || "فشل توليد الكود");
      }
    } catch (e) {
      console.error(e);
      alert("خطأ في الاتصال بالسيرفر");
    }
  };

  const handleUpdateTheme = async (color: string) => {
    if (!user) return;
    try {
      const res = await fetch("/api/user/update-theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, color })
      });
      if (res.ok) {
        fetchUser(user.id);
        setThemeModal({ ...themeModal, isOpen: false });
      }
    } catch (e) {
      alert("فشل تحديث الثيم");
    }
  };

  const handleChangeAdminPassword = async () => {
    if (!newAdminPass) return alert("يرجى إدخال كلمة المرور الجديدة");
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: newAdminPass })
      });
      if (res.ok) {
        alert("تم تغيير كلمة المرور بنجاح");
        setNewAdminPass("");
      }
    } catch (e) {
      alert("فشل تغيير كلمة المرور");
    }
  };

  const fetchUser = async (id: number) => {
    if (!id || isNaN(id)) return;
    try {
      const res = await fetch(`/api/user/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          console.warn(`User ${id} not found`);
          return;
        }
        throw new Error(`Failed to fetch user: ${res.status}`);
      }
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Expected JSON but got:", text.substring(0, 100));
        return;
      }

      const data = await res.json();
      if (data) {
        setUser(data);
        localStorage.setItem("user", JSON.stringify(data));
        
        if (data.blocked_until) {
          const until = new Date(data.blocked_until);
          const now = new Date();
          if (until > now) {
            setIsBlocked(true);
            setBlockCountdown(Math.floor((until.getTime() - now.getTime()) / 1000));
          } else {
            setIsBlocked(false);
          }
        } else {
          setIsBlocked(false);
        }
      }
    } catch (e: any) {
      if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
        // Silent network error (likely server restarting)
        return;
      }
      console.error("Fetch user error:", e);
    }
  };

  const handleRedeemVoucher = async () => {
    if (!user || !voucherCode) return;
    try {
      const res = await fetch("/api/user/redeem-voucher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, code: voucherCode })
      });
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Expected JSON response from redeem voucher API");
      }

      const data = await res.json();
      if (res.ok) {
        alert(`✅ تم شحن ${data.amount}$ بنجاح!`);
        setVoucherCode("");
        fetchUser(user.id);
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (e: any) {
      if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
        alert("❌ فشل الاتصال بالخادم (تأكد من اتصالك بالإنترنت)");
      } else {
        alert("❌ فشل الاتصال بالخادم");
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Expected JSON response from categories API");
      }
      const data = await res.json();
      setCategories(data || []);
    } catch (e: any) {
      if (e.name === 'TypeError' && e.message === 'Failed to fetch') return;
      console.error("Fetch categories error:", e);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch("/api/payment-methods");
      if (!res.ok) throw new Error(`Failed to fetch payment methods: ${res.status}`);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Expected JSON response from payment methods API");
      }
      const data = await res.json();
      setPaymentMethods(data || []);
    } catch (e: any) {
      if (e.name === 'TypeError' && e.message === 'Failed to fetch') return;
      console.error("Fetch payment methods error:", e);
    }
  };

  const fetchBanners = async () => {
    try {
      const res = await fetch("/api/banners");
      if (!res.ok) throw new Error(`Failed to fetch banners: ${res.status}`);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Expected JSON response from banners API");
      }
      const data = await res.json();
      setBanners(data || []);
    } catch (e: any) {
      if (e.name === 'TypeError' && e.message === 'Failed to fetch') return;
      console.error("Fetch banners error:", e);
    }
  };

  const fetchOffers = async () => {
    try {
      const res = await fetch("/api/offers");
      if (!res.ok) throw new Error(`Failed to fetch offers: ${res.status}`);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Expected JSON response from offers API");
      }
      const data = await res.json();
      setOffers(data || []);
    } catch (e: any) {
      if (e.name === 'TypeError' && e.message === 'Failed to fetch') return;
      console.error("Fetch offers error:", e);
    }
  };

  const fetchSubcategories = async (catId?: number) => {
    try {
      const url = catId ? `/api/categories/${catId}/subcategories` : "/api/subcategories";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch subcategories: ${res.status}`);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Expected JSON response from subcategories API");
      }
      const data = await res.json();
      setSubcategories(data || []);
    } catch (e: any) {
      if (e.name === 'TypeError' && e.message === 'Failed to fetch') return;
      console.error("Fetch subcategories error:", e);
    }
  };

  const fetchSubSubCategories = async (subId?: number) => {
    try {
      const url = subId ? `/api/subcategories/${subId}/sub-sub-categories` : "/api/sub-sub-categories";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch sub-sub-categories: ${res.status}`);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Expected JSON response from sub-sub-categories API");
      }
      const data = await res.json();
      setSubSubCategories(data || []);
    } catch (e: any) {
      if (e.name === 'TypeError' && e.message === 'Failed to fetch') return;
      console.error("Fetch sub-sub-categories error:", e);
    }
  };

  const fetchProducts = async (subId: number, isSubSub: boolean = false) => {
    try {
      const url = isSubSub 
        ? `/api/sub-sub-categories/${subId}/products`
        : `/api/subcategories/${subId}/products`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Expected JSON response from products API");
      }
      const data = await res.json();
      setProducts(data || []);
    } catch (e: any) {
      if (e.name === 'TypeError' && e.message === 'Failed to fetch') return;
      console.error("Fetch products error:", e);
    }
  };

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/orders/user/${user.id}`);
      if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Expected JSON response from orders API");
      }
      const data = await res.json();
      setOrders(data || []);
    } catch (e: any) {
      if (e.name === 'TypeError' && e.message === 'Failed to fetch') return;
      console.error("Fetch orders error:", e);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/transactions/user/${user.id}`);
      if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status}`);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Expected JSON response from transactions API");
      }
      const data = await res.json();
      setTransactions(data || []);
    } catch (e: any) {
      if (e.name === 'TypeError' && e.message === 'Failed to fetch') return;
      console.error("Fetch transactions error:", e);
    }
  };

  useEffect(() => {
    if (activeTab === "orders") fetchOrders();
    if (activeTab === "wallet" || view.type === "payments") fetchTransactions();
  }, [activeTab, view.type, user]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    setIsDrawerOpen(false);
    setActiveTab("home");
    setView({ type: "main" });
  };

  // --- Theme Helper ---
  const getTheme = () => {
    if (user?.stats?.custom_theme_color && user.stats.custom_theme_color.startsWith('#')) {
      return {
        primary: "bg-[var(--custom-primary)]",
        primaryHover: "opacity-90",
        text: "text-[var(--custom-primary)]",
        textDark: "text-[var(--custom-primary)]",
        bgLight: "bg-[var(--custom-primary-light)]",
        border: "border-[var(--custom-primary-light)]",
        shadow: "shadow-[var(--custom-primary-light)]",
        gradient: "from-[var(--custom-primary)] to-[var(--custom-primary)]",
        icon: "text-[var(--custom-primary)]",
        button: "bg-[var(--custom-primary)]",
        buttonHover: "opacity-90"
      };
    }
    if (user?.stats?.custom_theme_color === 'brand') {
      return {
        primary: "bg-brand",
        primaryHover: "hover:opacity-90",
        text: "text-brand",
        textDark: "text-brand",
        bgLight: "bg-brand-light",
        border: "border-brand-soft",
        shadow: "shadow-brand-soft",
        gradient: "from-brand to-brand",
        icon: "text-brand",
        button: "bg-brand",
        buttonHover: "hover:opacity-90"
      };
    }
    if (user?.is_vip || user?.stats?.custom_theme_color === 'yellow') {
      return {
        primary: "bg-amber-500",
        primaryHover: "hover:bg-amber-600",
        text: "text-amber-600",
        textDark: "text-amber-700",
        bgLight: "bg-amber-50",
        border: "border-amber-100",
        shadow: "shadow-amber-100",
        gradient: "from-amber-500 to-yellow-600",
        icon: "text-amber-600",
        button: "bg-amber-600",
        buttonHover: "hover:bg-amber-700"
      };
    }
    return {
      primary: "bg-[#B00000]",
      primaryHover: "hover:bg-[#8B0000]",
      text: "text-[#B00000]",
      textDark: "text-[#8B0000]",
      bgLight: "bg-red-50",
      border: "border-red-100",
      shadow: "shadow-red-100",
      gradient: "from-[#B00000] to-[#8B0000]",
      icon: "text-[#B00000]",
      button: "bg-[#B00000]",
      buttonHover: "hover:bg-[#8B0000]"
    };
  };

  const theme = getTheme();

  // --- UI Components ---

  const Header = () => (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-40">
      <div className="flex items-center gap-3">
        <button onClick={() => setIsDrawerOpen(true)} className="p-2 hover:bg-gray-50 rounded-full">
          <Menu size={24} className="text-gray-700" />
        </button>
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
        <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
          <img 
            src="https://i.ibb.co/5WZRchqw/1764620392904-removebg-preview-1.png" 
            alt="Logo" 
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <span className={`font-bold text-gray-800 hidden sm:block ${user?.is_vip ? 'text-amber-600' : ''}`}>
          فيبرو {user?.is_vip && 'VIP'}
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        {user && (
          <div className={`${theme.textDark} flex items-center`}>
            <span className="font-bold">{user.balance.toFixed(2)} $</span>
          </div>
        )}
        <button onClick={() => setNotificationsOpen(true)} className="p-2 hover:bg-gray-50 rounded-full relative">
          <Bell size={22} className="text-gray-600" />
          {notifications.some(n => !n.is_read) && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </button>
      </div>
    </header>
  );

  const NotificationPanel = () => (
    <AnimatePresence>
      {notificationsOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setNotificationsOpen(false)}
            className="fixed inset-0 bg-black/20 z-50"
          />
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-800">الإشعارات</h3>
              <button onClick={() => setNotificationsOpen(false)} className="p-2 bg-gray-100 rounded-full">
                <XCircle size={20} className="text-gray-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {notifications.length > 0 ? (
                notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    onClick={() => markNotificationRead(notif.id)}
                    className={`p-4 rounded-2xl border transition-all ${notif.is_read ? 'opacity-60' : 'shadow-sm'} ${
                      notif.type === 'warning' ? 'bg-amber-50 border-amber-100' : 
                      notif.type === 'success' ? 'bg-brand-light border-brand-soft' : 'bg-blue-50 border-blue-100'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`font-bold ${
                        notif.type === 'warning' ? 'text-amber-800' : 
                        notif.type === 'success' ? 'text-brand' : 'text-blue-800'
                      }`}>{notif.title}</h4>
                      {notif.created_at && <span className="text-[9px] text-gray-400">{new Date(notif.created_at).toLocaleTimeString("ar-EG")}</span>}
                    </div>
                    <p className={`text-sm leading-relaxed ${
                      notif.type === 'warning' ? 'text-amber-700' : 
                      notif.type === 'success' ? 'text-brand' : 'text-blue-700'
                    }`}>{notif.message}</p>
                    {notif.action === 'unlink' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleUnlinkTelegram(); }}
                        className="mt-3 bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm"
                      >
                        فك الارتباط الآن
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Bell size={48} className="mb-4 opacity-20" />
                  <p>لا توجد إشعارات حالياً</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex items-center justify-around z-40">
      <button 
        onClick={() => { setActiveTab("home"); setView({ type: "main" }); }}
        className={`flex flex-col items-center gap-1 ${activeTab === "home" ? theme.text : "text-gray-400"}`}
      >
        <Home size={22} />
        <span className="text-[10px] font-medium">الرئيسية</span>
      </button>
      <button 
        onClick={() => setActiveTab("wallet")}
        className={`flex flex-col items-center gap-1 ${activeTab === "wallet" ? theme.text : "text-gray-400"}`}
      >
        <Wallet size={22} />
        <span className="text-[10px] font-medium">شحن</span>
      </button>
      <button 
        onClick={() => setActiveTab("orders")}
        className={`flex flex-col items-center gap-1 ${activeTab === "orders" ? theme.text : "text-gray-400"}`}
      >
        <ShoppingBag size={22} />
        <span className="text-[10px] font-medium">الطلبات</span>
      </button>
      <button 
        onClick={() => setActiveTab("profile")}
        className={`flex flex-col items-center gap-1 ${activeTab === "profile" ? theme.text : "text-gray-400"}`}
      >
        <User size={22} />
        <span className="text-[10px] font-medium">حسابي</span>
      </button>
    </nav>
  );

  const Drawer = () => (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/40 z-50"
          />
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="fixed top-0 right-0 bottom-0 w-72 bg-white z-50 shadow-2xl flex flex-col"
          >
            <div className={`p-6 ${theme.primary} text-white`}>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <User size={32} />
              </div>
              <h3 className="font-bold text-lg">{user ? user.name : "زائر"}</h3>
              <p className="text-white/80 text-sm">{user ? user.email : "سجل الدخول للمزيد"}</p>
            </div>
            
            <div className="flex-1 py-4 overflow-y-auto">
              <DrawerItem icon={<User size={20} />} label="الملف الشخصي" onClick={() => { setActiveTab("profile"); setView({ type: "main" }); setIsDrawerOpen(false); }} />
              <DrawerItem icon={<History size={20} />} label="دفعاتي" onClick={() => { setActiveTab("profile"); setView({ type: "payments" }); setIsDrawerOpen(false); }} />
              <DrawerItem icon={<ShoppingBag size={20} />} label="طلباتي" onClick={() => { setActiveTab("orders"); setIsDrawerOpen(false); }} />
              <DrawerItem icon={<MessageSquare size={20} />} label="الدعم الفني" onClick={() => { setView({ type: "chat" }); setIsDrawerOpen(false); }} />
              {deferredPrompt && (
                <DrawerItem 
                  icon={<Download size={20} />} 
                  label="تثبيت التطبيق" 
                  onClick={() => { handleInstallApp(); setIsDrawerOpen(false); }} 
                  className="text-brand"
                />
              )}
              <div className="border-t border-gray-100 my-2"></div>
              {user ? (
                <DrawerItem icon={<LogOut size={20} />} label="تسجيل الخروج" onClick={handleLogout} className="text-red-500" />
              ) : (
                <DrawerItem icon={<ArrowRight size={20} />} label="تسجيل الدخول" onClick={() => { setView({ type: "login" }); setIsDrawerOpen(false); }} />
              )}
            </div>
            
            <div className="p-4 text-center text-xs text-gray-400 border-t border-gray-100">
              الإصدار 1.0.0
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  const DrawerItem = ({ icon, label, onClick, className = "" }: any) => (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors ${className}`}>
      <span className="text-gray-500">{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );

  // --- Views ---

  const HomeView = () => {
    const [currentBanner, setCurrentBanner] = useState(0);

    useEffect(() => {
      if (banners.length > 1) {
        const timer = setInterval(() => {
          setCurrentBanner((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
      }
    }, [banners]);

    return (
      <div className="space-y-6 pb-20">
        {/* Hero Carousel */}
        <div className="px-4">
          <div className={`h-44 bg-gray-100 rounded-2xl overflow-hidden relative shadow-lg ${theme.shadow}`}>
            {banners.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.img
                  key={banners[currentBanner].id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  src={banners[currentBanner].image_url}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>
            ) : (
              <div className={`h-full bg-gradient-to-r ${theme.gradient} flex flex-col justify-center px-6 text-white`}>
                <h2 className="text-2xl font-bold mb-1">أفضل العروض</h2>
                <p className="text-white/90 text-sm">اشحن ألعابك المفضلة بضغطة واحدة</p>
                <button className="mt-4 bg-white text-brand px-4 py-1.5 rounded-full text-sm font-bold w-fit">اكتشف الآن</button>
              </div>
            )}
            
            {banners.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {banners.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1.5 rounded-full transition-all ${idx === currentBanner ? "w-4 bg-white" : "w-1.5 bg-white/40"}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

      {/* Categories */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">الأقسام الرئيسية</h3>
          <button className={`${theme.text} text-sm font-medium`}>عرض الكل</button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {categories.map(cat => (
            <motion.button 
              whileTap={{ scale: 0.95 }}
              key={cat.id}
              onClick={() => {
                fetchSubcategories(cat.id);
                setView({ type: "subcategories", id: cat.id, data: cat.name });
              }}
              className={`bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center gap-2 hover:${theme.border} transition-colors`}
            >
              <div className={`w-14 h-14 ${theme.bgLight} rounded-xl flex items-center justify-center overflow-hidden`}>
                <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <span className="font-bold text-gray-700 text-[10px] text-center">{cat.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Dynamic Offers */}
      {offers.length > 0 && (
        <div className="px-4">
          <h3 className="font-bold text-gray-800 mb-4">عروض مميزة</h3>
          <div className="space-y-4">
            {offers.map(offer => (
              <div key={offer.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center overflow-hidden">
                  {offer.image_url ? (
                    <img src={offer.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <ImageIcon size={24} className="text-orange-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 text-sm">{offer.title}</h4>
                  <p className="text-gray-400 text-xs">{offer.description}</p>
                </div>
                <ChevronRight size={20} className="text-gray-300" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

  const SubcategoriesView = () => (
    <div className="px-4 space-y-4 pb-20">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => setView({ type: "main" })} className="p-2 bg-gray-100 rounded-full">
          <ArrowRight size={20} className="text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-800">{view.data}</h2>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {subcategories.map(sub => (
          <motion.button 
            whileTap={{ scale: 0.98 }}
            key={sub.id}
            onClick={() => {
              fetchProducts(sub.id);
              setView({ type: "products", id: sub.id, data: sub.name });
            }}
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-brand-soft"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden">
                <img src={sub.image_url || "https://picsum.photos/seed/sub/100/100"} alt={sub.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <span className="font-bold text-gray-700">{sub.name}</span>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </motion.button>
        ))}
      </div>
    </div>
  );

  const ProductsView = () => (
    <div className="px-4 space-y-4 pb-20">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => setView({ type: "subcategories", data: "الرجوع" })} className="p-2 bg-gray-100 rounded-full">
          <ArrowRight size={20} className="text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-800">{view.data}</h2>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {products.map(prod => (
          <div key={prod.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden">
                <img src={prod.image_url || "https://picsum.photos/seed/prod/100/100"} alt={prod.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800">{prod.name}</h4>
                <p className={`${theme.text} font-bold`}>{(Number(prod.price) || 0).toFixed(2)} $</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">{prod.description || "لا يوجد وصف متاح لهذا المنتج."}</p>
            <button 
              onClick={() => {
                if (!user) return setView({ type: "login" });
                if (prod.store_type === 'quick_order') {
                  setView({ type: "quick_order", data: prod });
                } else {
                  setView({ type: "checkout", data: prod });
                }
              }}
              className={`w-full ${theme.button} text-white py-3 rounded-xl font-bold ${theme.buttonHover} transition-colors`}
            >
              {prod.store_type === 'quick_order' ? "طلب سريع" : "شراء الآن"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const QuickOrderView = () => {
    const prod = view.data;
    const [playerId, setPlayerId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const finalPrice = user?.is_vip ? prod.price * 0.95 : prod.price;

    const handleQuickOrder = async () => {
      if (!user) return;
      if (!playerId) return setError("يرجى إدخال المعرف");
      
      setLoading(true);
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            productId: prod.id,
            quantity: 1,
            extraData: { playerId, storeType: 'quick_order' }
          })
        });
        
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Expected JSON response from orders API");
        }

        const data = await res.json();
        if (data.success) {
          fetchUser(user.id);
          setView({ type: "success", data: "تم إرسال الطلب السريع بنجاح!" });
        } else {
          setError(data.error || "حدث خطأ ما");
        }
      } catch (e: any) {
        if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
          setError("فشل الاتصال بالخادم (تأكد من اتصالك بالإنترنت)");
        } else {
          setError("حدث خطأ ما أثناء إرسال الطلب");
          console.error("Quick order error:", e);
        }
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="px-4 space-y-6 pb-20">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => setView({ type: "products", data: "الرجوع" })} className="p-2 bg-gray-100 rounded-full">
            <ArrowRight size={20} className="text-gray-600" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">متجر الطلب السريع</h2>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <h4 className="font-bold text-lg text-gray-800">{prod.name}</h4>
            <div className="flex flex-col items-center">
              {user?.is_vip && <p className="text-gray-400 line-through text-sm">{prod.price.toFixed(2)} $</p>}
              <p className={`${theme.text} font-bold text-xl`}>{finalPrice.toFixed(2)} $</p>
              {user?.is_vip && <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-bold mt-1">خصم VIP 5%</span>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">ضع المعرف (ID)</label>
              <input 
                type="text" 
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                placeholder="أدخل المعرف هنا..."
                className={`w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-center text-lg font-bold outline-none focus:${theme.border}`}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-xl text-center">
              <p className="text-xs text-gray-500 mb-1">السعر الإجمالي</p>
              <p className="text-xl font-bold text-gray-800">{finalPrice.toFixed(2)} $</p>
            </div>

            {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

            <button 
              disabled={loading}
              onClick={handleQuickOrder}
              className={`w-full ${theme.button} text-white py-4 rounded-xl font-bold shadow-lg ${theme.shadow} disabled:opacity-50`}
            >
              {loading ? "جاري الإرسال..." : "إرسال الطلب"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const CheckoutView = () => {
    const prod = view.data;
    const [extraData, setExtraData] = useState("");
    const [quantity, setQuantity] = useState(prod.store_type === 'quantities' ? (prod.min_quantity || 1) : 1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const unitPrice = prod.store_type === 'quantities' ? (prod.price_per_unit || prod.price) : prod.price;
    const baseTotal = unitPrice * quantity;
    const finalPrice = user?.is_vip ? baseTotal * 0.95 : baseTotal;

    const handlePurchase = async () => {
      if (!user) return;
      if (prod.requires_input && !extraData) return setError("يرجى إدخال البيانات المطلوبة");
      if (prod.store_type === 'quantities' && quantity < (prod.min_quantity || 1)) return setError(`أقل كمية مسموحة هي ${prod.min_quantity}`);
      
      setLoading(true);
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            productId: prod.id,
            quantity: quantity,
            extraData: { input: extraData, storeType: prod.store_type }
          })
        });
        const data = await res.json();
        if (data.success) {
          fetchUser(user.id);
          setView({ type: "success", data: "تمت عملية الشراء بنجاح!" });
        } else {
          setError(data.error || "حدث خطأ ما");
        }
      } catch (e) {
        setError("فشل الاتصال بالخادم");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="px-4 space-y-6 pb-20">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => setView({ type: "products", data: "الرجوع" })} className="p-2 bg-gray-100 rounded-full">
            <ArrowRight size={20} className="text-gray-600" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">تأكيد الطلب</h2>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-gray-50">
            <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden">
              <img src={prod.image_url || "https://picsum.photos/seed/prod/100/100"} alt={prod.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h4 className="font-bold text-gray-800">{prod.name}</h4>
              <div className="flex items-center gap-2">
                {user?.is_vip && <p className="text-gray-400 line-through text-xs">{unitPrice.toFixed(2)} $</p>}
                <p className={`${theme.text} font-bold`}>{unitPrice.toFixed(2)} $</p>
                {user?.is_vip && <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-bold">VIP</span>}
              </div>
            </div>
          </div>

          {prod.store_type === 'quantities' && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">الكمية المطلوبة (أقل كمية {prod.min_quantity})</label>
              <input 
                type="number" 
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className={`w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:${theme.border} transition-colors`}
              />
            </div>
          )}

          {prod.store_type === 'numbers' && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">رقم الهاتف (للضرورة)</label>
              <input 
                type="tel" 
                value={extraData}
                onChange={(e) => setExtraData(e.target.value)}
                placeholder="أدخل رقم هاتفك هنا..."
                className={`w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:${theme.border} transition-colors`}
              />
            </div>
          )}

          {prod.requires_input && prod.store_type !== 'numbers' && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">معرف اللاعب / رقم الحساب</label>
              <input 
                type="text" 
                value={extraData}
                onChange={(e) => setExtraData(e.target.value)}
                placeholder="أدخل البيانات هنا..."
                className={`w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:${theme.border} transition-colors`}
              />
            </div>
          )}

          <div className="space-y-3 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">سعر الوحدة</span>
              <span className="font-bold">{unitPrice.toFixed(2)} $</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">الكمية</span>
              <span className="font-bold">{quantity}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">المجموع الفرعي</span>
              <span className="font-bold">{baseTotal.toFixed(2)} $</span>
            </div>
            {user?.is_vip && (
              <div className="flex justify-between text-sm text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
                <div className="flex items-center gap-1">
                  <Star size={14} fill="currentColor" />
                  <span>خصم VIP (5%)</span>
                </div>
                <span className="font-bold">- {(baseTotal * 0.05).toFixed(2)} $</span>
              </div>
            )}
            <div className="flex justify-between text-lg border-t border-gray-100 pt-3 mt-2">
              <span className="font-bold text-gray-800">المبلغ النهائي</span>
              <div className="text-left">
                <span className={`font-bold ${theme.text} text-xl`}>{finalPrice.toFixed(2)} $</span>
                <p className="text-[10px] text-gray-400">شامل جميع الرسوم</p>
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

          <button 
            disabled={loading}
            onClick={handlePurchase}
            className={`w-full ${theme.button} text-white py-4 rounded-xl font-bold shadow-lg ${theme.shadow} flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            {loading ? "جاري المعالجة..." : "تأكيد الدفع بالرصيد"}
          </button>
        </div>
      </div>
    );
  };

  const WalletView = () => {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState("");
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      try {
        const imgbbKey = (import.meta as any).env.VITE_IMGBB_API_KEY || "97ffbf56fe1a203445531d664cd4b928";
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          setReceiptUrl(data.data.url);
        } else {
          console.error("ImgBB Error:", data);
          alert("فشل رفع الصورة: " + (data.error?.message || "خطأ غير معروف"));
        }
      } catch (err) {
        console.error("Upload Error:", err);
        alert("خطأ في الاتصال بخادم الصور");
      } finally {
        setUploading(false);
      }
    };

    const clearReceipt = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setReceiptUrl("");
    };

    const handleTopUp = async () => {
      if (!user || !selectedMethod || !amount || !receiptUrl) {
        alert("يرجى إكمال جميع البيانات ورفع الإيصال");
        return;
      }
      
      const numAmount = parseFloat(amount);
      if (numAmount < selectedMethod.min_amount) {
        alert(`أقل مبلغ للشحن عبر هذه الطريقة هو ${selectedMethod.min_amount} $`);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/transactions/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            paymentMethodId: selectedMethod.id,
            amount: numAmount,
            note,
            receiptImageUrl: receiptUrl
          })
        });
        const data = await res.json();
        if (data.success) {
          setView({ type: "success", data: "تم إرسال طلب الشحن بنجاح، يرجى انتظار التحقق." });
          fetchTransactions();
        } else {
          alert(data.error || "فشل إرسال الطلب");
        }
      } catch (e) {
        alert("فشل الاتصال بالخادم، يرجى المحاولة لاحقاً");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (selectedMethod) {
      return (
        <div className="px-4 space-y-6 pb-20">
          <div className="flex items-center gap-2 mb-6">
            <button onClick={() => setSelectedMethod(null)} className="p-2 bg-gray-100 rounded-full">
              <ArrowRight size={20} className="text-gray-600" />
            </button>
            <h2 className="text-xl font-bold text-gray-800">شحن عبر {selectedMethod.name}</h2>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="bg-brand-light p-4 rounded-xl border border-brand-soft text-center">
              <p className="text-brand text-sm mb-1">رقم المحفظة / العنوان</p>
              <p className="text-2xl font-bold text-brand tracking-wider">{selectedMethod.wallet_address}</p>
              {selectedMethod.min_amount > 0 && (
                <p className="text-xs text-brand mt-2 font-bold">أقل مبلغ: {selectedMethod.min_amount} $</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">المبلغ المراد شحنه</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">ملاحظات إضافية</label>
                <textarea 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="اختياري..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-brand h-24 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">إرفاق صورة الإيصال</label>
                <label className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors relative overflow-hidden">
                  {receiptUrl ? (
                    <>
                      <img src={receiptUrl} className="w-full h-full object-cover" alt="Receipt" referrerPolicy="no-referrer" />
                      <button 
                        onClick={clearReceipt}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <ImageIcon size={32} />
                      <span className="text-xs">{uploading ? "جاري الرفع..." : "اضغط لرفع الصورة"}</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              </div>

              <button 
                disabled={loading || uploading || !receiptUrl}
                onClick={handleTopUp}
                className="w-full bg-brand text-white py-4 rounded-xl font-bold shadow-lg shadow-brand-soft disabled:opacity-50"
              >
                {loading ? "جاري الإرسال..." : "إرسال طلب التحقق"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="px-4 space-y-6 pb-20">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">شحن الرصيد</h2>
        
        <button 
          onClick={() => setView({ type: "voucher_redeem" })}
          className="w-full bg-gradient-to-r from-brand to-brand-soft p-6 rounded-2xl text-white shadow-lg shadow-brand-soft flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Ticket size={28} />
            </div>
            <div className="text-right">
              <h3 className="font-bold text-lg">استرداد كود رصيد</h3>
              <p className="text-white/80 text-xs">اشحن رصيدك عبر الأكواد والقسائم</p>
            </div>
          </div>
          <ChevronRight size={24} className="text-white/60" />
        </button>

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">طرق الشحن المباشر</h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {paymentMethods.map(method => (
            <button 
              key={method.id}
              onClick={() => setSelectedMethod(method)}
              className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center gap-2 hover:border-brand-soft transition-colors"
            >
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden">
                <img src={method.image_url || "https://picsum.photos/seed/pay/100/100"} alt={method.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <span className="font-bold text-gray-800 text-[10px] text-center">{method.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const PaymentsView = () => {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    return (
      <div className="px-4 space-y-6 pb-20">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => setView({ type: "main" })} className="p-2 bg-gray-100 rounded-full">
            <ArrowRight size={20} className="text-gray-600" />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">دفعاتي</h2>
        </div>

        <div className="space-y-3">
          {transactions.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <div 
                onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    t.status === 'approved' ? 'bg-brand-light text-brand' : 
                    t.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {t.status === 'approved' ? <CheckCircle size={20} /> : 
                     t.status === 'rejected' ? <XCircle size={20} /> : <Clock size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-800">{t.method_name}</p>
                    <p className="text-[10px] text-gray-400">{new Date(t.created_at).toLocaleDateString("ar-EG")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <p className="font-bold text-brand">+{t.amount} $</p>
                    <p className={`text-[10px] font-medium ${
                      t.status === 'approved' ? 'text-brand' : 
                      t.status === 'rejected' ? 'text-red-500' : 'text-orange-500'
                    }`}>
                      {t.status === 'approved' ? 'مكتمل' : t.status === 'rejected' ? 'مرفوض' : 'قيد التحقق'}
                    </p>
                  </div>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${expandedId === t.id ? 'rotate-180' : ''}`} />
                </div>
              </div>
              
              {expandedId === t.id && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-50 space-y-3 bg-gray-50/50">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs">رقم العملية</p>
                      <p className="font-bold text-gray-700">#TX{t.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">تاريخ الطلب</p>
                      <p className="font-bold text-gray-700">{new Date(t.created_at).toLocaleString("ar-EG")}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">طريقة الشحن</p>
                      <p className="font-bold text-gray-700">{t.method_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">المبلغ</p>
                      <p className="font-bold text-brand">{t.amount} $</p>
                    </div>
                  </div>
                  {t.note && (
                    <div>
                      <p className="text-gray-400 text-xs">ملاحظات</p>
                      <p className="text-gray-700 text-sm">{t.note}</p>
                    </div>
                  )}
                  {t.receipt_image_url && (
                    <div>
                      <p className="text-gray-400 text-xs mb-2">صورة الإيصال</p>
                      <div className="w-full h-48 bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <img 
                          src={t.receipt_image_url} 
                          alt="Receipt" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                          onClick={() => window.open(t.receipt_image_url, '_blank')}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="text-center py-20 space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                <History size={40} />
              </div>
              <p className="text-gray-400">لا توجد عمليات دفع سابقة</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const OrdersView = () => (
    <div className="px-4 space-y-6 pb-20">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">طلباتي</h2>
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-gray-800">{order.product_name}</h4>
                <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString("ar-EG")}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                order.status === 'completed' ? 'bg-brand-light text-brand' : 
                order.status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {order.status === 'new' ? 'جديد' : order.status === 'completed' ? 'مكتمل' : 'قيد المعالجة'}
              </span>
            </div>
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">الإجمالي: <span className="font-bold text-gray-800">{order.total_amount} $</span></span>
                <span className="text-[10px] text-gray-400">#{order.id}</span>
              </div>
              {order.meta && (
                <div className="bg-gray-50 p-2 rounded-lg text-[10px] text-gray-600 space-y-1">
                  {Object.entries(JSON.parse(order.meta || "{}")).map(([k, v]: any) => (
                    <div key={k} className="flex justify-between">
                      <span className="font-bold">{k}:</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              )}
              {order.admin_response && (
                <div className="bg-brand-light p-3 rounded-xl border border-brand-soft mt-2">
                  <p className="text-[10px] font-bold text-brand mb-1">رد الإدارة:</p>
                  <p className="text-xs text-brand">{order.admin_response}</p>
                </div>
              )}
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
              <ShoppingBag size={40} />
            </div>
            <p className="text-gray-400">لم تقم بأي طلبات بعد</p>
            <button onClick={() => setActiveTab("home")} className="text-brand font-bold">ابدأ التسوق الآن</button>
          </div>
        )}
      </div>
    </div>
  );

  const ProfileView = () => {
    const [uploading, setUploading] = useState(false);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("image", file);
        
        const imgbbKey = (import.meta as any).env.VITE_IMGBB_API_KEY || "97ffbf56fe1a203445531d664cd4b928"; 
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        
        if (data.success) {
          const avatarUrl = data.data.url;
          const updateRes = await fetch(`/api/user/${user?.id}/avatar`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatar_url: avatarUrl })
          });
          if (updateRes.ok) {
            fetchUser(user!.id);
            alert("تم تحديث الصورة الشخصية بنجاح");
          }
        }
      } catch (error) {
        console.error("Avatar upload error:", error);
        alert("فشل رفع الصورة");
      } finally {
        setUploading(false);
      }
    };

    return (
      <div className="px-4 space-y-6 pb-20">
        <div className={`bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-4 ${user?.is_vip ? 'border-amber-200 shadow-amber-50' : ''}`}>
          <div className="relative group">
            <div className={`w-24 h-24 ${theme.bgLight} rounded-full flex items-center justify-center ${theme.icon} border-4 border-white shadow-lg ${theme.shadow} overflow-hidden`}>
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={48} />
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-brand text-white p-2 rounded-full cursor-pointer shadow-lg hover:opacity-90 transition-colors">
              <Plus size={16} />
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
            </label>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <h2 className={`text-xl font-bold text-gray-800 ${user?.is_vip ? 'text-amber-700' : ''}`}>{user?.name || "زائر"}</h2>
              {user?.stats?.profile_badge === 'silver' && <Award size={20} className="text-slate-400" />}
              {user?.stats?.profile_badge === 'gold' && <Award size={20} className="text-amber-400" />}
              {user?.stats?.profile_badge === 'gold_legendary' && <Crown size={20} className="text-amber-500" />}
            </div>
            <p className="text-gray-400 text-sm">{user?.email || "قم بتسجيل الدخول للوصول لكافة الميزات"}</p>
          </div>
          
          {user && (
            <div className="w-full pt-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                {user.telegram_chat_id ? (
                  <button 
                    onClick={handleUnlinkTelegram}
                    className="flex-1 bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 flex flex-col items-center gap-1 transition-all active:scale-95"
                  >
                    <LogOut size={20} />
                    <span className="text-xs font-bold">إلغاء ربط تليجرام</span>
                  </button>
                ) : (
                  <button 
                    onClick={handleGenerateLinkingCode}
                    className="flex-1 bg-brand-light text-brand p-4 rounded-2xl border border-brand-soft flex flex-col items-center gap-1 transition-all active:scale-95"
                  >
                    <MessageSquare size={20} />
                    <span className="text-xs font-bold">ربط تليجرام</span>
                  </button>
                )}
                <button 
                  onClick={() => setView({ type: "referral" })}
                  className="flex-1 bg-brand-light text-brand p-4 rounded-2xl border border-brand-soft flex flex-col items-center gap-1 transition-all active:scale-95"
                >
                  <Plus size={20} />
                  <span className="text-xs font-bold">نظام الإحالة</span>
                </button>
              </div>
            </div>
          )}

          {user && (
            <div className="w-full grid grid-cols-2 gap-4 pt-4">
              <div className={`${theme.bgLight} p-4 rounded-2xl border ${theme.border}`}>
                <p className={`text-[10px] ${theme.text} font-bold uppercase tracking-wider mb-1`}>الرصيد الحالي</p>
                <p className={`text-lg font-bold ${theme.textDark}`}>{user.balance.toFixed(2)} $</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">إجمالي الطلبات</p>
                <p className="text-lg font-bold text-blue-700">{orders.length}</p>
              </div>
              <div className={`${user.is_vip ? 'bg-amber-100 border-amber-200' : 'bg-gray-50 border-gray-100'} p-4 rounded-2xl border`}>
                <p className={`text-[10px] ${user.is_vip ? 'text-amber-600' : 'text-gray-600'} font-bold uppercase tracking-wider mb-1`}>الحالة</p>
                <p className={`text-lg font-bold ${user.is_vip ? 'text-amber-700' : 'text-gray-700'}`}>{user.is_vip ? 'VIP 💎' : 'عادي'}</p>
              </div>
              <div className="bg-brand-light p-4 rounded-2xl border border-brand-soft">
                <p className="text-[10px] text-brand font-bold uppercase tracking-wider mb-1">الرقم الشخصي</p>
                <p className="text-lg font-bold text-brand">{user.personal_number}</p>
              </div>
            </div>
          )}

          {user && (
            <div className="w-full pt-4 space-y-3">
              <h4 className="text-sm font-bold text-gray-700 text-right">حالة الحساب</h4>
              {user.telegram_chat_id ? (
                <div className="bg-brand-light p-4 rounded-2xl border border-brand-soft flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-soft text-brand rounded-xl flex items-center justify-center">
                      <CheckCircle size={20} />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-brand">تليجرام مرتبط</p>
                      <p className="text-[10px] text-brand">حسابك مؤمن ومرتبط بالبوت</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                      <Clock size={20} />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-orange-800">تليجرام غير مرتبط</p>
                      <p className="text-[10px] text-orange-600">اربط حسابك لتلقي الإشعارات</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="w-full space-y-3 pt-4">
            <button 
              onClick={() => setView({ type: "payments" })}
              className="w-full bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-light text-brand rounded-xl flex items-center justify-center">
                  <History size={20} />
                </div>
                <span className="font-bold text-gray-800">دفعاتي</span>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>

            <button 
              onClick={() => setActiveTab("orders")}
              className="w-full bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <ShoppingBag size={20} />
                </div>
                <span className="font-bold text-gray-800">طلباتي</span>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
          </div>

          {user && user.stats && (
            <div className="w-full bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-amber-500" />
                  <h3 className="font-bold text-gray-800">نظام المكافآت والترقية</h3>
                </div>
                <button 
                  onClick={() => setShowAllRewards(!showAllRewards)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
                >
                  {showAllRewards ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>

              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded-lg">
                  إجمالي الشحن: {user.stats.total_recharge_sum.toFixed(2)} $
                </span>
              </div>

              <div className="space-y-6">
                {REWARD_GOALS.map((goal, index) => {
                  const isClaimed = user.stats!.claimed_reward_index >= index;
                  const isReached = user.stats!.total_recharge_sum >= goal.target;
                  const isCurrent = user.stats!.claimed_reward_index === index - 1;
                  const isLocked = user.stats!.claimed_reward_index < index - 1;

                  // Progress calculation
                  const prevTarget = index === 0 ? 0 : REWARD_GOALS[index - 1].target;
                  const progress = Math.min(100, Math.max(0, ((user.stats!.total_recharge_sum - prevTarget) / (goal.target - prevTarget)) * 100));

                  // If not showing all, only show the "Current" one (the next one to claim/reach)
                  if (!showAllRewards && !isCurrent) return null;
                  
                  // If showing all, still hide locked ones that are too far ahead? 
                  // Or just show everything. Usually "show all" means everything.
                  
                  return (
                    <div key={goal.id} className={`space-y-3 p-4 rounded-2xl border ${isClaimed ? 'bg-brand-light border-brand-soft' : isCurrent ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100 opacity-50'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-sm text-gray-800">{goal.title}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{goal.rewardText}</p>
                        </div>
                        {isClaimed ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-brand">
                            <CheckCircle size={14} />
                            تم الاستلام
                          </span>
                        ) : isReached ? (
                          <button 
                            onClick={async () => {
                              try {
                                const res = await fetch("/api/rewards/claim", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ userId: user.id, goalIndex: index })
                                });
                                if (res.ok) {
                                  alert("مبروك! تم استلام المكافأة بنجاح");
                                  fetchUser(user.id);
                                } else {
                                  const data = await res.json();
                                  alert(data.error || "فشل استلام المكافأة");
                                }
                              } catch (e) {
                                alert("خطأ في الاتصال");
                              }
                            }}
                            className="bg-brand text-white px-4 py-1.5 rounded-lg text-[10px] font-bold shadow-sm active:scale-95 transition-all"
                          >
                            الحصول على المكافأة
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-600">
                            متبقي {(goal.target - user.stats!.total_recharge_sum).toFixed(2)} $
                          </span>
                        )}
                      </div>

                      {!isClaimed && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold text-gray-400">
                            <span>{prevTarget} $</span>
                            <span>{goal.target} $</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${isReached ? 'bg-brand' : 'bg-amber-500'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
          <ProfileItem icon={<User size={20} />} label="تعديل الملف الشخصي" onClick={() => setView({ type: "edit_profile" })} />
          <ProfileItem icon={<Plus size={20} />} label="نظام الإحالة" onClick={() => setView({ type: "referral" })} />
          {!!user?.stats?.has_special_support && (
            <ProfileItem 
              icon={<ShieldCheck size={20} />} 
              label="الدعم الخاص (الأولوية)" 
              className="text-amber-600 bg-amber-50/50"
              onClick={() => alert("لديك أولوية في الدعم الفني. تواصل معنا عبر الواتساب.")} 
            />
          )}
          <ProfileItem icon={<Settings size={20} />} label="الإعدادات" onClick={() => setView({ type: "settings" })} />
          <ProfileItem icon={<Clock size={20} />} label="سياسة الخصوصية" onClick={() => setView({ type: "privacy_policy" })} />
          <ProfileItem 
            icon={<MessageSquare size={20} />} 
            label="الدعم الفني" 
            onClick={() => setView({ type: "chat" })} 
            className="text-brand relative"
            badge={user?.unread_support_count > 0 ? user.unread_support_count : undefined}
          />
          {!!user?.stats?.custom_theme_color && (
            <ProfileItem 
              icon={<Palette size={20} />} 
              label="تخصيص الثيم" 
              onClick={() => setThemeModal({ isOpen: true, color: user.stats.custom_theme_color === 'any' ? '#10b981' : user.stats.custom_theme_color })} 
              className="text-brand"
            />
          )}
          {user ? (
            <ProfileItem icon={<LogOut size={20} />} label="تسجيل الخروج" onClick={handleLogout} className="text-red-500" />
          ) : (
            <ProfileItem icon={<ArrowRight size={20} />} label="تسجيل الدخول" onClick={() => setView({ type: "login" })} />
          )}
        </div>
      </div>
    );
  };

  const ProfileItem = ({ icon, label, onClick, className = "", badge }: any) => (
    <button onClick={onClick} className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${className}`}>
      <div className="flex items-center gap-4">
        <span className="text-gray-400">{icon}</span>
        <span className="font-medium text-gray-700">{label}</span>
        {badge !== undefined && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
            {badge}
          </span>
        )}
      </div>
      <ChevronRight size={18} className="text-gray-300" />
    </button>
  );

  const ThemeCustomizationModal = () => {
    if (!themeModal.isOpen) return null;
    const colors = [
      "#10b981", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", 
      "#ec4899", "#06b6d4", "#14b8a6", "#f97316", "#6366f1",
      "#000000", "#4b5563", "#1e293b", "#064e3b", "#7c2d12"
    ];

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand via-brand to-blue-500"></div>
          <button onClick={() => setThemeModal({ ...themeModal, isOpen: false })} className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center text-brand mx-auto mb-4">
              <Palette size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">تخصيص لون الثيم</h3>
            <p className="text-gray-400 text-sm mt-1">اختر لونك المفضل لتمييز حسابك</p>
          </div>

          <div className="grid grid-cols-5 gap-3 mb-8">
            {colors.map(c => (
              <button 
                key={c} 
                onClick={() => setThemeModal({ ...themeModal, color: c })}
                className={`w-full aspect-square rounded-xl transition-all ${themeModal.color === c ? 'ring-4 ring-offset-2 ring-brand scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-10 h-10 rounded-lg shadow-sm" style={{ backgroundColor: themeModal.color }}></div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">اللون المختار</p>
                <p className="text-sm font-mono font-bold text-gray-700">{themeModal.color}</p>
              </div>
            </div>
            
            <button 
              onClick={() => handleUpdateTheme(themeModal.color)}
              className="w-full bg-gray-800 text-white py-4 rounded-2xl font-bold shadow-lg shadow-gray-100 transition-all active:scale-95"
            >
              حفظ التغييرات
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const LoginView = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [referralCode, setReferralCode] = useState(localStorage.getItem("referralCode") || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleAuth = async () => {
      setLoading(true);
      setError("");
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const body = isRegister ? { name, email, password, phone, referralCode } : { email, password };
      
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Expected JSON response from auth API");
        }

        const data = await res.json();
        if (res.ok) {
          setUser(data);
          localStorage.setItem("user", JSON.stringify(data));
          localStorage.removeItem("referralCode");
          setView({ type: "main" });
          setActiveTab("home");
        } else {
          setError(data.error || "حدث خطأ ما");
        }
      } catch (e: any) {
        if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
          setError("فشل الاتصال بالخادم (تأكد من اتصالك بالإنترنت)");
        } else {
          setError("حدث خطأ غير متوقع أثناء تسجيل الدخول");
          console.error("Auth error:", e);
        }
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="px-6 flex flex-col items-center justify-center min-h-[80vh] pb-20">
        <div className="w-20 h-20 bg-brand rounded-3xl flex items-center justify-center text-white shadow-xl shadow-brand-soft mb-8">
          <ShoppingBag size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{isRegister ? "إنشاء حساب جديد" : "تسجيل الدخول"}</h2>
        <p className="text-gray-400 text-sm mb-8 text-center">أهلاً بك في متجرنا، يرجى إدخال بياناتك للمتابعة</p>
        
        <div className="w-full space-y-4">
          {isRegister && (
            <input 
              type="text" 
              placeholder="الاسم الكامل" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 outline-none focus:border-brand shadow-sm"
            />
          )}
          <input 
            type="email" 
            placeholder="البريد الإلكتروني" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 outline-none focus:border-brand shadow-sm"
          />
          {isRegister && (
            <input 
              type="tel" 
              placeholder="رقم الهاتف" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 outline-none focus:border-brand shadow-sm"
            />
          )}
          <input 
            type="password" 
            placeholder="كلمة المرور" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 outline-none focus:border-brand shadow-sm"
          />
          {isRegister && (
            <input 
              type="text" 
              placeholder="كود الإحالة (اختياري)" 
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 outline-none focus:border-brand shadow-sm"
            />
          )}
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          
          <button 
            disabled={loading}
            onClick={handleAuth}
            className="w-full bg-brand text-white py-4 rounded-2xl font-bold shadow-lg shadow-brand-soft disabled:opacity-50"
          >
            {loading ? "جاري المعالجة..." : (isRegister ? "إنشاء الحساب" : "دخول")}
          </button>
          
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className={`w-full ${theme.text} text-sm font-bold pt-4`}
          >
            {isRegister ? "لديك حساب بالفعل؟ سجل دخولك" : "ليس لديك حساب؟ أنشئ حساباً جديداً"}
          </button>

          <button 
            onClick={() => setView({ type: "chat" })}
            className="w-full flex items-center justify-center gap-2 text-gray-400 text-xs font-bold pt-6"
          >
            <Phone size={14} /> تواصل مع الدعم الفني
          </button>
        </div>
      </div>
    );
  };

  const EditProfileView = () => {
    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleUpdate = async () => {
      if (!user) return;
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/user/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, name, email, phone, password })
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data);
          localStorage.setItem("user", JSON.stringify(data));
          setView({ type: "success", data: "تم تحديث المعلومات بنجاح" });
        } else {
          setError(data.error || "فشل التحديث");
        }
      } catch (e) {
        setError("خطأ في الاتصال بالخادم");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="px-4 space-y-6 pb-20">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => setView({ type: "main" })} className="p-2 bg-gray-100 rounded-full">
            <ArrowRight size={20} className="text-gray-600" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">تعديل المعلومات الشخصية</h2>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">الاسم الكامل</label>
                <input 
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-brand"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">البريد الإلكتروني</label>
                <input 
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-brand"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">رقم الهاتف</label>
                <input 
                  type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-brand"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">كلمة المرور الجديدة (اختياري)</label>
                <input 
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="اتركها فارغة إذا لم ترد التغيير"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-brand"
                />
              </div>

          {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

          <button 
            disabled={loading}
            onClick={handleUpdate}
            className="w-full bg-brand text-white py-4 rounded-xl font-bold shadow-lg shadow-brand-soft disabled:opacity-50"
          >
            {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>

          <div className="pt-4 border-t border-gray-50">
            <p className="text-[10px] text-gray-400 mb-2">احتفظ ببيانات دخولك في مكان آمن للعودة لحسابك في أي وقت.</p>
            <button 
              onClick={() => {
                const text = `بيانات دخول متجرنا:\nالاسم: ${user?.name}\nالبريد: ${user?.email}\nالرقم الشخصي (ID): ${user?.personal_number}\nرقم الدخول: ${user?.id}`;
                const blob = new Blob([text], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `my_account_info.txt`;
                a.click();
              }}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm"
            >
              تحميل بيانات الحساب (نسخة احتياطية)
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ReferralView = () => {
    const [stats, setStats] = useState({ count: 0 });
    const referralLink = `${window.location.origin}/?ref=${user?.personal_number}`;

    useEffect(() => {
      if (user) {
        fetch(`/api/referrals/stats/${user.id}`)
          .then(res => res.json())
          .then(data => setStats(data))
          .catch(console.error);
      }
    }, [user]);

    const copyLink = () => {
      navigator.clipboard.writeText(referralLink);
      alert("تم نسخ رابط الإحالة");
    };

    return (
      <div className="px-4 space-y-6 pb-20">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => setView({ type: "main" })} className="p-2 bg-gray-100 rounded-full">
            <ArrowRight size={20} className="text-gray-600" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">نظام الإحالة</h2>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-brand-light text-brand rounded-full flex items-center justify-center mx-auto">
            <Plus size={32} />
          </div>
          <h3 className="font-bold text-lg">اربح 5% من كل عملية شراء</h3>
          <p className="text-gray-500 text-sm">شارك رابط الإحالة الخاص بك مع أصدقائك واحصل على عمولة 5% من كل عملية شراء يقومون بها، تضاف مباشرة إلى رصيدك.</p>
          
          <div className="bg-brand-light p-4 rounded-xl">
            <p className="text-xs text-brand font-bold mb-1">عدد المستخدمين المسجلين عبر رابطك</p>
            <p className="text-2xl font-bold text-brand">{stats.count}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-bold text-gray-700 text-right">رابط الإحالة الخاص بك</p>
            <div className="flex gap-2">
              <button onClick={copyLink} className="bg-brand text-white px-4 py-2 rounded-xl font-bold text-sm">نسخ</button>
              <input 
                readOnly 
                value={referralLink}
                className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm text-left outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ChatView = () => {
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [uploading, setUploading] = useState(false);
    const [sending, setSending] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const fetchMessages = async () => {
      const guestId = localStorage.getItem("guest_id") || `guest_${Math.random().toString(36).substr(2, 9)}`;
      if (!localStorage.getItem("guest_id")) localStorage.setItem("guest_id", guestId);
      
      const identifier = user ? user.id : guestId;
      const isGuest = !user;
      
      const res = await fetch(`/api/chat/messages/${identifier}${isGuest ? '?guest=true' : ''}`);
      const data = await res.json();
      setMessages(data);
      
      // Mark as read if there are unread admin messages
      const hasUnread = data.some((m: any) => m.sender_role === 'admin' && !m.is_read);
      if (hasUnread && user) {
        await fetch("/api/chat/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id })
        });
        fetchUser(user.id); // Refresh user to update unread count
      }
    };

    useEffect(() => {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }, []);

    useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [messages]);

    const handleSend = async (content?: string, imageUrl?: string) => {
      const guestId = localStorage.getItem("guest_id");
      if (!user && !guestId) return;
      if (!content && !imageUrl) return;
      
      setSending(true);
      try {
        const res = await fetch("/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user ? user.id : null,
            guest_id: user ? null : guestId,
            sender_role: "user",
            content: content || "",
            image_url: imageUrl || ""
          })
        });
        if (res.ok) {
          setNewMessage("");
          fetchMessages();
        } else {
          const data = await res.json();
          alert(data.error || "فشل الإرسال");
        }
      } catch (e) {
        alert("خطأ في الاتصال");
      } finally {
        setSending(false);
      }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    };

    const confirmAndSendImage = async () => {
      if (!selectedFile) return;
      setUploading(true);
      const formData = new FormData();
      formData.append("image", selectedFile);
      try {
        const imgbbKey = (import.meta as any).env.VITE_IMGBB_API_KEY || "97ffbf56fe1a203445531d664cd4b928";
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          handleSend("", data.data.url);
          setImagePreview(null);
          setSelectedFile(null);
        }
      } catch (err) {
        alert("فشل رفع الصورة");
      } finally {
        setUploading(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[60] bg-gray-50 flex flex-col bottom-16">
        <div className="bg-white p-4 border-b border-gray-100 flex items-center gap-3 shadow-sm">
          <button onClick={() => setView({ type: "main" })} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowRight size={20} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-light text-brand rounded-full flex items-center justify-center font-bold">
              <User size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">الدعم الفني</h3>
              <p className="text-[10px] text-brand font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse"></span>
                متصل الآن
              </p>
            </div>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[#F7F7F7]">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div 
                key={m.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${m.sender_role === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm relative ${
                  m.sender_role === 'user' ? 'bg-white text-gray-800 rounded-tr-none' : 'bg-[#B00000] text-white rounded-tl-none'
                }`}>
                  {m.image_url && (
                    <img src={m.image_url} alt="Chat" className="rounded-lg mb-2 max-w-full border border-gray-100" referrerPolicy="no-referrer" />
                  )}
                  {m.content && <p className="text-sm leading-relaxed font-medium">{m.content}</p>}
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className={`text-[8px] ${m.sender_role === 'user' ? 'text-gray-400' : 'text-white/70'}`}>
                      {new Date(m.created_at).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {m.sender_role === 'user' && (
                      <span className="text-[10px] text-brand">✓✓</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-2 sticky bottom-0">
          {imagePreview && (
            <div className="fixed inset-0 z-[70] bg-black/80 flex flex-col items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-4 w-full max-w-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800">معاينة الصورة</h3>
                  <button onClick={() => { setImagePreview(null); setSelectedFile(null); }} className="p-1 hover:bg-gray-100 rounded-full">
                    <X size={20} />
                  </button>
                </div>
                <img src={imagePreview} alt="Preview" className="w-full h-64 object-contain rounded-xl mb-4 bg-gray-50" />
                <button 
                  onClick={confirmAndSendImage}
                  disabled={uploading}
                  className="w-full py-3 bg-brand text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send size={18} className="rotate-180" />
                      إرسال الصورة
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          <label className="p-3 bg-gray-50 text-gray-400 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <ImageIcon size={20} />
            <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} disabled={uploading} />
          </label>
          <input 
            type="text" 
            placeholder="اكتب رسالتك هنا..." 
            className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#B00000] transition-all"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend(newMessage)}
          />
          <button 
            onClick={() => handleSend(newMessage)}
            disabled={sending || uploading}
            className={`p-3 ${theme.button} text-white rounded-xl shadow-lg shadow-brand-soft disabled:opacity-50 active:scale-95 transition-all`}
          >
            <ArrowLeft size={20} />
          </button>
        </div>
      </div>
    );
  };

  const AdminChatView = () => {
    const [chatList, setChatList] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [reply, setReply] = useState("");
    const [uploading, setUploading] = useState(false);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const fetchChatList = async () => {
      const res = await fetch("/api/admin/chat/list");
      const data = await res.json();
      setChatList(data);
    };

    const fetchMessages = async (userId: any, isGuest: boolean = false) => {
      const res = await fetch(`/api/chat/messages/${userId}${isGuest ? '?guest=true' : ''}`);
      const data = await res.json();
      setMessages(data);
      await fetch("/api/admin/chat/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [isGuest ? 'guestId' : 'userId']: userId })
      });
      fetchChatList();
    };

    useEffect(() => {
      fetchChatList();
      if (selectedChatUser) fetchMessages(selectedChatUser.id, selectedChatUser.is_guest);
      const interval = setInterval(() => {
        fetchChatList();
        if (selectedChatUser) fetchMessages(selectedChatUser.id, selectedChatUser.is_guest);
      }, 3000);
      return () => clearInterval(interval);
    }, [selectedChatUser]);

    useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [messages]);

    const handleSendReply = async (content?: string, imageUrl?: string) => {
      if (!selectedChatUser || (!content && !imageUrl)) return;
      try {
        const res = await fetch("/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: selectedChatUser.is_guest ? null : selectedChatUser.id,
            guest_id: selectedChatUser.is_guest ? selectedChatUser.id : null,
            sender_role: "admin",
            content: content || "",
            image_url: imageUrl || ""
          })
        });
        if (res.ok) {
          setReply("");
          fetchMessages(selectedChatUser.id, selectedChatUser.is_guest);
        }
      } catch (e) {
        alert("فشل الإرسال");
      }
    };

    const handleToggleBlock = async (userId: number, currentBlocked: boolean) => {
      if (!confirm(`هل تريد ${currentBlocked ? 'إلغاء حظر' : 'حظر'} هذا المستخدم من الدردشة؟`)) return;
      const res = await fetch("/api/admin/chat/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, blocked: !currentBlocked })
      });
      if (res.ok) {
        if (selectedChatUser?.id === userId) {
          setSelectedChatUser({ ...selectedChatUser, chat_blocked: !currentBlocked });
        }
        fetchChatList();
      }
    };

    if (selectedChatUser) {
      return (
        <div className="fixed inset-0 z-[60] bg-gray-50 flex flex-col bottom-16">
          <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedChatUser(null)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                <ArrowRight size={18} />
              </button>
              <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                {selectedChatUser.avatar_url ? (
                  <img src={selectedChatUser.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={20} /></div>
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-800">{selectedChatUser.name}</h4>
                <p className="text-[10px] text-gray-400 font-bold">PN: {selectedChatUser.personal_number}</p>
              </div>
            </div>
            {!selectedChatUser.is_guest && (
              <button 
                onClick={() => handleToggleBlock(selectedChatUser.id, selectedChatUser.chat_blocked)}
                className={`p-2 rounded-xl transition-all active:scale-90 ${selectedChatUser.chat_blocked ? 'bg-brand-light text-brand' : 'bg-red-50 text-red-600'}`}
                title={selectedChatUser.chat_blocked ? "إلغاء الحظر" : "حظر المستخدم"}
              >
                <Lock size={18} />
              </button>
            )}
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[#F7F7F7]">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div 
                  key={m.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${m.sender_role === 'admin' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm relative ${
                    m.sender_role === 'admin' ? 'bg-[#B00000] text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'
                  }`}>
                    {m.image_url && <img src={m.image_url} alt="" className="rounded-lg mb-2 max-w-full border border-gray-100" referrerPolicy="no-referrer" />}
                    {m.content && <p className="text-sm font-medium leading-relaxed">{m.content}</p>}
                    <p className={`text-[8px] mt-1 ${m.sender_role === 'admin' ? 'text-white/70' : 'text-gray-400'}`}>
                      {new Date(m.created_at).toLocaleString("ar-EG", { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-2 sticky bottom-0">
            <label className="p-3 bg-gray-50 text-gray-400 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <ImageIcon size={20} />
              <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                const formData = new FormData();
                formData.append("image", file);
                const imgbbKey = (import.meta as any).env.VITE_IMGBB_API_KEY || "97ffbf56fe1a203445531d664cd4b928";
                const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, { method: "POST", body: formData });
                const data = await res.json();
                if (data.success) handleSendReply("", data.data.url);
                setUploading(false);
              }} />
            </label>
            <input 
              type="text" 
              placeholder="اكتب ردك..." 
              className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#B00000] transition-all"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendReply(reply)}
            />
            <button onClick={() => handleSendReply(reply)} className="p-3 bg-[#B00000] text-white rounded-xl shadow-lg shadow-red-100 active:scale-95 transition-all">
              <Send size={20} className="rotate-180" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="font-bold text-gray-800 text-lg">محادثات الدعم</h3>
        <div className="grid grid-cols-1 gap-3">
          {chatList.map((chat) => (
            <button 
              key={chat.id} 
              onClick={() => setSelectedChatUser(chat)}
              className={`p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 text-right transition-all active:scale-[0.98] ${chat.is_guest ? 'bg-red-50 border-red-100' : 'bg-white'}`}
            >
              <div className="w-12 h-12 bg-gray-50 rounded-full overflow-hidden relative border border-gray-100">
                {chat.avatar_url ? (
                  <img src={chat.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={24} /></div>
                )}
                {chat.unread_count > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-brand text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {chat.unread_count}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-gray-800 text-sm truncate">{chat.name}</h4>
                  <span className="text-[10px] text-gray-400">
                    {chat.last_message_at ? new Date(chat.last_message_at).toLocaleDateString("ar-EG") : ""}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-400 truncate flex-1">{chat.last_message || "بدأ محادثة جديدة"}</p>
                  <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">PN: {chat.personal_number}</span>
                </div>
              </div>
            </button>
          ))}
          {chatList.length === 0 && (
            <div className="text-center py-20 text-gray-400">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-bold">لا توجد محادثات نشطة حالياً</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const PrivacyPolicyView = () => {
    const [policy, setPolicy] = useState("");

    useEffect(() => {
      fetch("/api/settings")
        .then(res => res.json())
        .then(data => {
          const p = data.find((s: any) => s.key === 'privacy_policy');
          setPolicy(p ? p.value : "سيتم إضافة سياسة الخصوصية قريباً.");
        })
        .catch(console.error);
    }, []);

    return (
      <div className="px-4 space-y-6 pb-20">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => setView({ type: "main" })} className="p-2 bg-gray-100 rounded-full">
            <ArrowRight size={20} className="text-gray-600" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">سياسة الخصوصية</h2>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
            {policy}
          </div>
        </div>
      </div>
    );
  };

  const SettingsView = () => (
    <div className="px-4 space-y-6 pb-20">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => setView({ type: "main" })} className="p-2 bg-gray-100 rounded-full">
          <ArrowRight size={20} className="text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-800">الإعدادات</h2>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-gray-400" />
            <span className="font-medium text-gray-700">الإشعارات</span>
          </div>
          <button 
            onClick={() => alert("تم تفعيل الإشعارات بنجاح!")}
            className="w-10 h-5 bg-brand rounded-full relative"
          >
            <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
          </button>
        </div>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ImageIcon size={20} className="text-gray-400" />
            <span className="font-medium text-gray-700">الوضع الليلي</span>
          </div>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-10 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-brand' : 'bg-gray-200'}`}
          >
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isDarkMode ? 'right-1' : 'left-1'}`}></div>
          </button>
        </div>
      </div>
    </div>
  );

  const SuccessView = () => (
    <div className="px-6 flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6">
      <div className="w-24 h-24 bg-brand-light text-brand rounded-full flex items-center justify-center shadow-inner">
        <CheckCircle size={64} />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">عملية ناجحة</h2>
        <p className="text-gray-400">{view.data}</p>
      </div>
      <button 
        onClick={() => { setView({ type: "main" }); setActiveTab("home"); }}
        className="bg-brand text-white px-8 py-3 rounded-xl font-bold"
      >
        العودة للرئيسية
      </button>
    </div>
  );

  // --- Admin Panel ---
const AdminPanel = ({
  user,
  fetchUser,
  categories,
  subcategories,
  subSubCategories,
  fetchCategories,
  fetchSubcategories,
  fetchSubSubCategories,
  paymentMethods,
  fetchPaymentMethods,
  banners,
  fetchBanners,
  offers,
  fetchOffers,
  setIsAdmin,
  theme,
  adminTab,
  setAdminTab
}: AdminPanelProps) => {
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
    const [adminTransactions, setAdminTransactions] = useState<any[]>([]);
    const [orderSearch, setOrderSearch] = useState("");
    const [orderDateFilter, setOrderDateFilter] = useState("");
    const [transSearch, setTransSearch] = useState("");
    const [transDateFilter, setTransDateFilter] = useState("");
    const [newCategory, setNewCategory] = useState({ name: "", image_url: "", special_id: "" });
    const [newSubcategory, setNewSubcategory] = useState({ category_special_id: "", name: "", image_url: "", special_id: "" });
    const [newSubSubCategory, setNewSubSubCategory] = useState({ subcategory_special_id: "", name: "", image_url: "", special_id: "" });
    const [newProduct, setNewProduct] = useState({ 
      category_special_id: "", 
      subcategory_special_id: "", 
      sub_sub_category_special_id: "",
      name: "", 
      price: "", 
      description: "", 
      image_url: "", 
      requires_input: false, 
      store_type: "normal",
      min_quantity: "",
      price_per_unit: "",
      external_id: ""
    });
    const [newPaymentMethod, setNewPaymentMethod] = useState({ name: "", image_url: "", wallet_address: "", min_amount: "", instructions: "" });
    const [newBanner, setNewBanner] = useState({ image_url: "" });
    const [manualTopup, setManualTopup] = useState({ personalNumber: "", amount: "" });
    const [settings, setSettings] = useState<any[]>([]);
    const [privacyPolicy, setPrivacyPolicy] = useState("");
    const [supportWhatsapp, setSupportWhatsapp] = useState("");

    const [adminUsers, setAdminUsers] = useState<any[]>([]);
    const [adminVouchers, setAdminVouchers] = useState<any[]>([]);
    const [adminProducts, setAdminProducts] = useState<any[]>([]);
    const [selectedSubId, setSelectedSubId] = useState("");
    const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);

    const fetchAdminProducts = async (subId: string) => {
      if (!subId) return;
      const res = await fetch(`/api/products?subId=${subId}`);
      const data = await res.json();
      setAdminProducts(data);
    };

    const handleUpdateProductPrice = async (id: number, currentPrice: number, storeType?: string) => {
      const label = storeType === 'quantities' ? "السعر لكل وحدة" : "السعر الجديد";
      const newPrice = prompt(`أدخل ${label}:`, currentPrice.toString());
      if (newPrice !== null) {
        const field = storeType === 'quantities' ? 'price_per_unit' : 'price';
        const res = await fetch(`/api/admin/products/${id}/price`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: parseFloat(newPrice) })
        });
        if (res.ok) {
          alert("تم التحديث بنجاح");
          fetchAdminProducts(selectedSubId);
        }
      }
    };
    const [newVoucher, setNewVoucher] = useState({ code: "", amount: "", max_uses: "1" });
    const [newOffer, setNewOffer] = useState({ title: "", description: "", image_url: "" });

    const handleExportDB = async () => {
      try {
        const res = await fetch("/api/admin/export-db");
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `database_export_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
      } catch (e) {
        alert("فشل تصدير البيانات");
      }
    };

    const handleImportDB = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      if (!confirm("تحذير: سيتم مسح كافة البيانات الحالية واستبدالها بالبيانات المستوردة. هل أنت متأكد؟")) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          const res = await fetch("/api/admin/import-db", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
          });
          if (res.ok) {
            alert("تم استيراد البيانات بنجاح! سيتم إعادة تحميل الصفحة.");
            window.location.reload();
          } else {
            const err = await res.json();
            alert(`فشل الاستيراد: ${err.error}`);
          }
        } catch (err) {
          alert("ملف غير صالح");
        }
      };
      reader.readAsText(file);
    };

    const handleClearDB = async () => {
      if (!confirm("هل أنت متأكد من مسح كافة بيانات الموقع؟ لا يمكن التراجع عن هذه الخطوة.")) return;
      const res = await fetch("/api/admin/clear-db", { method: "POST" });
      if (res.ok) {
        alert("تم مسح قاعدة البيانات بنجاح");
        window.location.reload();
      }
    };

    useEffect(() => {
      fetchAdminOrders();
      fetchAdminTransactions();
      fetchAdminUsers();
      fetchAdminSettings();
      fetchAdminVouchers();
    }, []);

    const fetchAdminVouchers = async () => {
      const res = await fetch("/api/admin/vouchers");
      const data = await res.json();
      setAdminVouchers(data);
    };

    const handleCreateVoucher = async () => {
      const res = await fetch("/api/admin/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVoucher)
      });
      if (res.ok) {
        setNewVoucher({ code: "", amount: "", max_uses: "1" });
        fetchAdminVouchers();
        alert("تم إنشاء الكود بنجاح");
      } else {
        const data = await res.json();
        alert(data.error || "فشل إنشاء الكود");
      }
    };

    const handleDeleteVoucher = async (id: number) => {
      if (!confirm("هل أنت متأكد من حذف هذا الكود؟")) return;
      const res = await fetch(`/api/admin/vouchers/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchAdminVouchers();
        alert("تم حذف الكود");
      }
    };

    const fetchAdminSettings = async () => {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings(data);
      const pp = data.find((s: any) => s.key === 'privacy_policy');
      const sw = data.find((s: any) => s.key === 'support_whatsapp');
      if (pp) setPrivacyPolicy(pp.value);
      if (sw) setSupportWhatsapp(sw.value);
    };

    const handleUpdateSetting = async (key: string, value: string) => {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value })
      });
      if (res.ok) {
        alert("تم تحديث الإعداد بنجاح");
        fetchAdminSettings();
      }
    };

    const handleCloudSync = async () => {
      if (!confirm("هل تريد مزامنة كافة البيانات الحالية مع قاعدة البيانات السحابية (Supabase)؟")) return;
      try {
        const res = await fetch("/api/admin/sync-to-cloud", { method: "POST" });
        const data = await res.json();
        if (res.ok) {
          let msg = "تمت المزامنة السحابية بنجاح!\n\nالتفاصيل:\n";
          for (const [table, status] of Object.entries(data.details || {})) {
            msg += `${table}: ${status}\n`;
          }
          alert(msg);
        } else {
          alert(`فشل المزامنة: ${data.error}`);
        }
      } catch (e) {
        alert("خطأ في الاتصال بالسيرفر");
      }
    };

    const fetchAdminUsers = async () => {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setAdminUsers(data);
    };

    const handleToggleVip = async (userId: number, currentStatus: boolean) => {
      const res = await fetch(`/api/admin/users/${userId}/vip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVip: !currentStatus })
      });
      if (res.ok) {
        fetchAdminUsers();
        alert("تم تحديث حالة VIP");
      }
    };

    const handleAddOffer = async () => {
      const res = await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOffer)
      });
      if (res.ok) {
        setNewOffer({ title: "", description: "", image_url: "" });
        fetchOffers();
        alert("تمت إضافة العرض");
      }
    };

    const fetchAdminOrders = async () => {
      try {
        const res = await fetch("/api/admin/orders");
        const data = await res.json();
        setAdminOrders(Array.isArray(data) ? data : []);
      } catch (e) { console.error(e); }
    };

    const fetchAdminTransactions = async () => {
      try {
        const res = await fetch("/api/admin/transactions");
        const data = await res.json();
        setAdminTransactions(Array.isArray(data) ? data : []);
      } catch (e) { console.error(e); }
    };

    const handleApproveTransaction = async (id: number) => {
      await fetch(`/api/admin/transactions/${id}/approve`, { method: "POST" });
      fetchAdminTransactions();
    };

    const handleRejectTransaction = async (id: number) => {
      await fetch(`/api/admin/transactions/${id}/reject`, { method: "POST" });
      fetchAdminTransactions();
    };

    const handleAddCategory = async () => {
      await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCategory)
      });
      setNewCategory({ name: "", image_url: "", special_id: "" });
      fetchCategories();
      alert("تمت إضافة القسم الرئيسي");
    };

    const handleAddSubcategory = async () => {
      const res = await fetch("/api/admin/subcategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSubcategory)
      });
      if (res.ok) {
        setNewSubcategory({ category_special_id: "", name: "", image_url: "", special_id: "" });
        alert("تمت إضافة القسم الفرعي");
      } else {
        const data = await res.json();
        alert(data.error || "خطأ في الإضافة");
      }
    };

    const handleAddProduct = async () => {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        setNewProduct({ 
          category_special_id: "", 
          subcategory_special_id: "", 
          sub_sub_category_special_id: "",
          name: "", 
          price: "", 
          description: "", 
          image_url: "", 
          requires_input: false, 
          store_type: "normal",
          min_quantity: "",
          price_per_unit: "",
          external_id: ""
        });
        alert("تمت إضافة المنتج");
      } else {
        const data = await res.json();
        alert(data.error || "خطأ في الإضافة");
      }
    };

    const handleAddSubSubCategory = async () => {
      const res = await fetch("/api/admin/sub-sub-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSubSubCategory)
      });
      if (res.ok) {
        setNewSubSubCategory({ subcategory_special_id: "", name: "", image_url: "", special_id: "" });
        fetchSubSubCategories();
        alert("تمت إضافة القسم الفرعي الفرعي");
      } else {
        const data = await res.json();
        alert(data.error || "خطأ في الإضافة");
      }
    };

    const handleAddPaymentMethod = async () => {
      const res = await fetch("/api/admin/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPaymentMethod)
      });
      if (res.ok) {
        setNewPaymentMethod({ name: "", image_url: "", wallet_address: "", min_amount: "", instructions: "" });
        fetchPaymentMethods();
        alert("تمت إضافة طريقة الدفع");
      } else {
        const data = await res.json();
        alert(data.error || "خطأ في الإضافة");
      }
    };

    const handleAddBanner = async () => {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBanner)
      });
      if (res.ok) {
        setNewBanner({ image_url: "" });
        fetchBanners();
        alert("تمت إضافة الصورة المتحركة");
      } else {
        alert("خطأ في الإضافة");
      }
    };

    const handleDelete = async (type: string, id: number) => {
      if (!confirm("هل أنت متأكد من الحذف؟")) return;
      const res = await fetch(`/api/admin/${type}/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (type === 'categories') fetchCategories();
        if (type === 'subcategories') fetchSubcategories();
        if (type === 'sub-sub-categories') fetchSubSubCategories();
        if (type === 'payment-methods') fetchPaymentMethods();
        if (type === 'banners') fetchBanners();
        alert("تم الحذف بنجاح");
      }
    };

    const handleManualTopup = async () => {
      const res = await fetch("/api/admin/manual-topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualTopup)
      });
      if (res.ok) {
        setManualTopup({ personalNumber: "", amount: "" });
        alert("تم شحن الرصيد بنجاح");
      } else {
        const data = await res.json();
        alert(data.error || "خطأ في الشحن");
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 pb-20 text-right" dir="rtl">
        <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-30">
          <h1 className="font-bold text-lg">لوحة التحكم</h1>
          <button onClick={() => setIsAdmin(false)} className="text-gray-400 p-2"><LogOut size={20} /></button>
        </div>

        <div className="flex bg-white border-b border-gray-100 overflow-x-auto no-scrollbar">
          <button onClick={() => setAdminTab("management")} className={`px-6 py-4 font-bold text-sm whitespace-nowrap flex items-center gap-2 ${adminTab === "management" ? "text-[#B00000] border-b-2 border-[#B00000]" : "text-gray-400"}`}>
            <Settings size={18} /> التخصيص
          </button>
          <button onClick={() => setAdminTab("dashboard")} className={`px-6 py-4 font-bold text-sm whitespace-nowrap flex items-center gap-2 ${adminTab === "dashboard" ? "text-[#B00000] border-b-2 border-[#B00000]" : "text-gray-400"}`}>
            <LayoutGrid size={18} /> الرئيسية
          </button>
          <button onClick={() => setAdminTab("chat")} className={`px-6 py-4 font-bold text-sm whitespace-nowrap flex items-center gap-2 ${adminTab === "chat" ? "text-[#B00000] border-b-2 border-[#B00000]" : "text-gray-400"}`}>
            <MessageSquare size={18} /> الشات
          </button>
          <button onClick={() => setAdminTab("orders")} className={`px-6 py-4 font-bold text-sm whitespace-nowrap flex items-center gap-2 ${adminTab === "orders" ? "text-[#B00000] border-b-2 border-[#B00000]" : "text-gray-400"}`}>
            <ShoppingBag size={18} /> الطلبات
          </button>
          <button onClick={() => setAdminTab("transactions")} className={`px-6 py-4 font-bold text-sm whitespace-nowrap flex items-center gap-2 ${adminTab === "transactions" ? "text-brand border-b-2 border-brand" : "text-gray-400"}`}>
            <Wallet size={18} /> شحن الرصيد
          </button>
          <button onClick={() => setAdminTab("users")} className={`px-6 py-4 font-bold text-sm whitespace-nowrap flex items-center gap-2 ${adminTab === "users" ? "text-brand border-b-2 border-brand" : "text-gray-400"}`}>
            <User size={18} /> المستخدمين
          </button>
        </div>

        <div className="p-4 space-y-6">
          {adminTab === "dashboard" && (
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setAdminTab("chat")}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-3 aspect-square transition-all active:scale-95"
              >
                <div className="w-12 h-12 bg-red-50 text-[#B00000] rounded-2xl flex items-center justify-center">
                  <MessageSquare size={24} />
                </div>
                <span className="font-bold text-gray-800">الشات</span>
              </button>
              <button 
                onClick={() => setAdminTab("orders")}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-3 aspect-square transition-all active:scale-95"
              >
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <ShoppingBag size={24} />
                </div>
                <span className="font-bold text-gray-800">الطلبات</span>
              </button>
              <button 
                onClick={() => setAdminTab("transactions")}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-3 aspect-square transition-all active:scale-95"
              >
                <div className="w-12 h-12 bg-brand-light text-brand rounded-2xl flex items-center justify-center">
                  <Wallet size={24} />
                </div>
                <span className="font-bold text-gray-800">المدفوعات</span>
              </button>
              <button 
                onClick={() => setAdminTab("users")}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-3 aspect-square transition-all active:scale-95"
              >
                <div className="w-12 h-12 bg-brand-light text-brand rounded-2xl flex items-center justify-center">
                  <User size={24} />
                </div>
                <span className="font-bold text-gray-800">المستخدمين</span>
              </button>
              <button 
                onClick={() => setAdminTab("management")}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-3 aspect-square transition-all active:scale-95"
              >
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                  <Settings size={24} />
                </div>
                <span className="font-bold text-gray-800">تخصيص الواجهة</span>
              </button>
            </div>
          )}

          {adminTab === "chat" && <AdminChatView />}

          {adminTab === "users" && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 text-lg">إدارة المستخدمين</h3>
                  <div className="bg-brand-light text-brand px-3 py-1 rounded-full text-xs font-bold">
                    إجمالي: {adminUsers.length}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {adminUsers.map(u => (
                    <div key={u.id} className="p-4 border border-gray-50 rounded-2xl bg-gray-50/30 space-y-3 hover:border-brand-soft transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 border border-gray-100">
                            <User size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-800">{u.name}</p>
                            <p className="text-[10px] text-gray-400">ID: {u.id} | PN: {u.personal_number}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${u.is_vip ? 'bg-brand-light text-brand' : 'bg-gray-100 text-gray-400'}`}>
                          {u.is_vip ? 'VIP 💎' : 'عادي'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 flex items-center gap-2"><span className="w-1 h-1 bg-gray-300 rounded-full"></span> {u.email}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-2"><span className="w-1 h-1 bg-gray-300 rounded-full"></span> {u.phone || "بدون هاتف"}</p>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-gray-100 gap-2">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-brand">{u.balance.toFixed(2)} $</p>
                          <button 
                            onClick={async () => {
                              const newBalance = prompt("أدخل الرصيد الجديد:", u.balance.toString());
                              if (newBalance !== null) {
                                const res = await fetch(`/api/admin/users/${u.id}/balance`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ balance: parseFloat(newBalance) })
                                });
                                if (res.ok) fetchAdminUsers();
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-brand transition-colors"
                          >
                            <Settings size={14} />
                          </button>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleToggleVip(u.id, u.is_vip)}
                            className={`text-[10px] px-3 py-1.5 rounded-lg font-bold transition-all ${u.is_vip ? 'bg-gray-100 text-gray-600' : 'bg-brand text-white'}`}
                          >
                            {u.is_vip ? 'إلغاء VIP' : 'ترقية VIP'}
                          </button>
                          <button 
                            onClick={async () => {
                              const mins = prompt("أدخل مدة الحظر بالدقائق:");
                              if (mins) {
                                const res = await fetch(`/api/admin/users/${u.id}/block`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ minutes: parseInt(mins) })
                                });
                                if (res.ok) alert("تم الحظر بنجاح");
                              }
                            }}
                            className="text-[10px] px-3 py-1.5 rounded-lg font-bold bg-orange-100 text-orange-600"
                          >
                            حظر
                          </button>
                          <button 
                            onClick={async () => {
                              if (confirm("هل أنت متأكد من حذف هذا المستخدم نهائياً؟")) {
                                const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
                                if (res.ok) {
                                  alert("تم حذف المستخدم");
                                  fetchAdminUsers();
                                }
                              }
                            }}
                            className="text-[10px] px-3 py-1.5 rounded-lg font-bold bg-red-100 text-red-600"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {adminTab === "orders" && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 className="font-bold text-gray-800 text-lg">سجل الطلبات</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative">
                      <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="بحث برقم الطلب..." 
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="bg-gray-50 border border-gray-100 rounded-xl pr-10 pl-4 py-2 text-xs outline-none focus:border-brand w-full sm:w-48"
                      />
                    </div>
                    <input 
                      type="date" 
                      value={orderDateFilter}
                      onChange={(e) => setOrderDateFilter(e.target.value)}
                      className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs outline-none focus:border-brand"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  {adminOrders
                    .filter(o => {
                      const matchesSearch = orderSearch ? String(o.id).includes(orderSearch) : true;
                      const matchesDate = orderDateFilter ? new Date(o.created_at).toISOString().split('T')[0] === orderDateFilter : true;
                      return matchesSearch && matchesDate;
                    })
                    .map(order => (
                    <div key={order.id} className="p-4 border border-gray-50 rounded-2xl bg-gray-50/30 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-sm text-gray-800">#{order.id} - {order.product_name}</p>
                          <p className="text-[10px] text-gray-400">{new Date(order.created_at).toLocaleString("ar-EG")}</p>
                        </div>
                        <select 
                          value={order.status} 
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            let adminResponse = order.admin_response;
                            
                            if (newStatus === 'completed') {
                              const resp = prompt("أدخل رد الإدارة (اختياري - مثلاً الكود أو الرقم):", order.admin_response || "");
                              if (resp !== null) adminResponse = resp;
                            }

                            await fetch(`/api/admin/orders/${order.id}/status`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ status: newStatus, admin_response: adminResponse })
                            });
                            fetchAdminOrders();
                          }}
                          className={`text-[10px] font-bold border-none rounded-full px-3 py-1 outline-none ${
                            order.status === 'completed' ? 'bg-brand-light text-brand' : 
                            order.status === 'failed' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          <option value="new">جديد</option>
                          <option value="processing">قيد المعالجة</option>
                          <option value="completed">مكتمل</option>
                          <option value="failed">فشل</option>
                        </select>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-gray-50 space-y-1">
                        <p className="text-xs text-gray-600 font-bold">العميل: {order.user_name}</p>
                        <p className="text-[10px] text-gray-400">البيانات: {order.meta}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-brand">{order.total_amount} $</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {adminTab === "transactions" && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 className="font-bold text-gray-800 text-lg">طلبات الشحن</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative">
                      <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="بحث باسم العميل..." 
                        value={transSearch}
                        onChange={(e) => setTransSearch(e.target.value)}
                        className="bg-gray-50 border border-gray-100 rounded-xl pr-10 pl-4 py-2 text-xs outline-none focus:border-brand w-full sm:w-48"
                      />
                    </div>
                    <input 
                      type="date" 
                      value={transDateFilter}
                      onChange={(e) => setTransDateFilter(e.target.value)}
                      className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs outline-none focus:border-brand"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {adminTransactions
                    .filter(t => {
                      const matchesSearch = transSearch ? t.user_name.toLowerCase().includes(transSearch.toLowerCase()) : true;
                      const matchesDate = transDateFilter ? new Date(t.created_at).toISOString().split('T')[0] === transDateFilter : true;
                      return matchesSearch && matchesDate;
                    })
                    .map(t => (
                    <div key={t.id} className="p-4 border border-gray-50 rounded-2xl bg-gray-50/30 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-sm text-gray-800">{t.user_name}</p>
                          <p className="text-[10px] text-gray-400">{t.method_name} | {new Date(t.created_at).toLocaleString("ar-EG")}</p>
                        </div>
                        <span className="font-bold text-brand text-lg">{t.amount} $</span>
                      </div>
                      {t.note && <p className="text-[10px] text-gray-500 bg-white p-2 rounded-lg border border-gray-50">ملاحظة: {t.note}</p>}
                      <div className="aspect-video bg-white rounded-xl overflow-hidden border border-gray-100 group relative">
                        <img src={t.receipt_image_url} alt="Receipt" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={() => window.open(t.receipt_image_url)} className="bg-white text-gray-800 px-4 py-2 rounded-xl text-xs font-bold">عرض الصورة كاملة</button>
                        </div>
                      </div>
                      {t.status === 'pending' ? (
                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => handleApproveTransaction(t.id)} className="bg-brand text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-brand-soft">موافقة</button>
                          <button onClick={() => handleRejectTransaction(t.id)} className="bg-red-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-red-50">رفض</button>
                        </div>
                      ) : (
                        <div className={`text-center py-2.5 rounded-xl text-xs font-bold ${t.status === 'approved' ? 'bg-brand-light text-brand' : 'bg-red-100 text-red-600'}`}>
                          {t.status === 'approved' ? 'تمت الموافقة ✓' : 'تم الرفض ✗'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {adminTab === "management" && (
            <div className="space-y-6 pb-20">
              <div className="grid grid-cols-5 gap-2">
                <button 
                  onClick={() => setActiveSubMenu(activeSubMenu === "add" ? null : "add")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${activeSubMenu === "add" ? "bg-brand-light border-brand-soft text-brand" : "bg-white border-gray-100 text-gray-400"}`}
                >
                  <Plus size={24} />
                  <span className="text-[10px] font-bold mt-1">إضافة</span>
                </button>
                <button 
                  onClick={() => setActiveSubMenu(activeSubMenu === "contact" ? null : "contact")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${activeSubMenu === "contact" ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-gray-100 text-gray-400"}`}
                >
                  <MessageSquare size={24} />
                  <span className="text-[10px] font-bold mt-1">تواصل</span>
                </button>
                <button 
                  onClick={() => setActiveSubMenu(activeSubMenu === "edit" ? null : "edit")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${activeSubMenu === "edit" ? "bg-orange-50 border-orange-200 text-orange-600" : "bg-white border-gray-100 text-gray-400"}`}
                >
                  <Pencil size={24} />
                  <span className="text-[10px] font-bold mt-1">تعديل</span>
                </button>
                <button 
                  onClick={() => setActiveSubMenu(activeSubMenu === "balance" ? null : "balance")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${activeSubMenu === "balance" ? "bg-brand-light border-brand-soft text-brand" : "bg-white border-gray-100 text-gray-400"}`}
                >
                  <Wallet size={24} />
                  <span className="text-[10px] font-bold mt-1">رصيد</span>
                </button>
                <button 
                  onClick={() => setActiveSubMenu(activeSubMenu === "lock" ? null : "lock")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${activeSubMenu === "lock" ? "bg-gray-100 border-gray-300 text-gray-800" : "bg-white border-gray-100 text-gray-400"}`}
                >
                  <Lock size={24} />
                  <span className="text-[10px] font-bold mt-1">أخرى</span>
                </button>
              </div>

              <AnimatePresence mode="wait">
                {activeSubMenu === "add" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-4">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2"><PlusCircle size={18} className="text-brand" /> إضافة عناصر جديدة</h3>
                      <div className="space-y-8">
                        {/* Add Category */}
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-gray-400">إضافة قسم رئيسي</p>
                          <input type="text" placeholder="اسم القسم" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none" value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} />
                          <AdminImageUpload 
                            label="صورة القسم"
                            currentUrl={newCategory.image_url}
                            onUpload={(url) => setNewCategory({...newCategory, image_url: url})}
                          />
                          <input type="number" placeholder="رقم القسم الخاص" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none" value={newCategory.special_id} onChange={e => setNewCategory({...newCategory, special_id: e.target.value})} />
                          <button onClick={handleAddCategory} className="w-full bg-brand text-white py-3 rounded-xl font-bold text-sm">إضافة قسم رئيسي</button>
                        </div>
                        {/* Add Subcategory */}
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-gray-400">إضافة قسم فرعي</p>
                          <input type="number" placeholder="رقم القسم الرئيسي الخاص" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none" value={newSubcategory.category_special_id} onChange={e => setNewSubcategory({...newSubcategory, category_special_id: e.target.value})} />
                          <input type="text" placeholder="اسم القسم الفرعي" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none" value={newSubcategory.name} onChange={e => setNewSubcategory({...newSubcategory, name: e.target.value})} />
                          <AdminImageUpload 
                            label="صورة القسم الفرعي"
                            currentUrl={newSubcategory.image_url}
                            onUpload={(url) => setNewSubcategory({...newSubcategory, image_url: url})}
                          />
                          <input type="number" placeholder="رقم القسم الفرعي الخاص" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none" value={newSubcategory.special_id} onChange={e => setNewSubcategory({...newSubcategory, special_id: e.target.value})} />
                          <button onClick={handleAddSubcategory} className="w-full bg-brand text-white py-3 rounded-xl font-bold text-sm">إضافة قسم فرعي</button>
                        </div>
                        {/* Add SubSubCategory */}
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-gray-400">إضافة قسم فرعي فرعي</p>
                          <input type="number" placeholder="رقم القسم الفرعي الخاص" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none" value={newSubSubCategory.subcategory_special_id} onChange={e => setNewSubSubCategory({...newSubSubCategory, subcategory_special_id: e.target.value})} />
                          <input type="text" placeholder="اسم القسم الفرعي الفرعي" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none" value={newSubSubCategory.name} onChange={e => setNewSubSubCategory({...newSubSubCategory, name: e.target.value})} />
                          <AdminImageUpload 
                            label="صورة القسم الفرعي الفرعي"
                            currentUrl={newSubSubCategory.image_url}
                            onUpload={(url) => setNewSubSubCategory({...newSubSubCategory, image_url: url})}
                          />
                          <input type="number" placeholder="رقم القسم الفرعي الفرعي الخاص" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none" value={newSubSubCategory.special_id} onChange={e => setNewSubSubCategory({...newSubSubCategory, special_id: e.target.value})} />
                          <button onClick={handleAddSubSubCategory} className="w-full bg-brand text-white py-3 rounded-xl font-bold text-sm">إضافة قسم فرعي فرعي</button>
                        </div>
                        {/* Add Product */}
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-gray-400">إضافة منتج جديد</p>
                          <input type="number" placeholder="رقم القسم الرئيسي الخاص" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none" value={newProduct.category_special_id} onChange={e => setNewProduct({...newProduct, category_special_id: e.target.value})} />
                          <input type="number" placeholder="رقم القسم الفرعي الخاص" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none" value={newProduct.subcategory_special_id} onChange={e => setNewProduct({...newProduct, subcategory_special_id: e.target.value})} />
                          <input type="number" placeholder="رقم القسم الفرعي الفرعي الخاص (اختياري)" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none" value={newProduct.sub_sub_category_special_id} onChange={e => setNewProduct({...newProduct, sub_sub_category_special_id: e.target.value})} />
                          <input type="text" placeholder="اسم المنتج" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                          {newProduct.store_type !== 'quantities' && (
                            <input type="number" placeholder="السعر" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                          )}
                          <textarea placeholder="الوصف" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
                          <AdminImageUpload 
                            label="صورة المنتج"
                            currentUrl={newProduct.image_url}
                            onUpload={(url) => setNewProduct({...newProduct, image_url: url})}
                          />
                          <select className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none" value={newProduct.store_type} onChange={e => setNewProduct({...newProduct, store_type: e.target.value})}>
                            <option value="normal">متجر عادي</option>
                            <option value="quick_order">متجر الطلب السريع</option>
                            <option value="quantities">متجر الكميات</option>
                            <option value="numbers">متجر الأرقام</option>
                          </select>
                          {newProduct.store_type === 'quantities' && (
                            <div className="space-y-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <p className="text-xs font-bold text-gray-500">إعدادات متجر الكميات</p>
                              <input type="text" placeholder="ID المنتج الخارجي" className="w-full p-2 bg-white border border-gray-100 rounded-lg text-sm outline-none" value={newProduct.external_id} onChange={e => setNewProduct({...newProduct, external_id: e.target.value})} />
                              <input type="number" placeholder="أقل كمية" className="w-full p-2 bg-white border border-gray-100 rounded-lg text-sm outline-none" value={newProduct.min_quantity} onChange={e => setNewProduct({...newProduct, min_quantity: e.target.value})} />
                              <input type="number" step="0.0001" placeholder="سعر الـ 1 (مثلاً 0.001)" className="w-full p-2 bg-white border border-gray-100 rounded-lg text-sm outline-none" value={newProduct.price_per_unit} onChange={e => setNewProduct({...newProduct, price_per_unit: e.target.value})} />
                            </div>
                          )}
                          <div className="flex items-center gap-2 px-1">
                            <input type="checkbox" className="w-4 h-4 text-brand rounded" checked={newProduct.requires_input} onChange={e => setNewProduct({...newProduct, requires_input: e.target.checked})} />
                            <label className="text-xs text-gray-600 font-bold">يتطلب بيانات إضافية (ID)</label>
                          </div>
                          <button onClick={handleAddProduct} className="w-full bg-brand text-white py-3 rounded-xl font-bold text-sm">إضافة منتج</button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeSubMenu === "contact" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-4">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2"><Phone size={18} className="text-blue-500" /> إعدادات التواصل والنظام</h3>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500">رقم واتساب الدعم (بدون +)</label>
                          <div className="flex gap-2">
                            <input type="text" value={supportWhatsapp} onChange={(e) => setSupportWhatsapp(e.target.value)} className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2 outline-none" />
                            <button onClick={() => handleUpdateSetting('support_whatsapp', supportWhatsapp)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold">حفظ</button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500">سياسة الخصوصية</label>
                          <textarea value={privacyPolicy} onChange={(e) => setPrivacyPolicy(e.target.value)} className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 outline-none h-32 text-sm" />
                          <button onClick={() => handleUpdateSetting('privacy_policy', privacyPolicy)} className="w-full bg-blue-600 text-white py-2 rounded-xl text-sm font-bold">حفظ سياسة الخصوصية</button>
                        </div>
                        <div className="pt-4 border-t border-gray-50 space-y-3">
                          <p className="text-xs font-bold text-gray-400">إدارة البيانات</p>
                          <button onClick={handleCloudSync} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><RefreshCw size={16} /> مزامنة سحابية</button>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={handleExportDB} className="bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2"><Download size={14} /> تصدير</button>
                            <label className="bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer">
                              <Upload size={14} /> استيراد
                              <input type="file" accept=".json" onChange={handleImportDB} className="hidden" />
                            </label>
                          </div>
                          <button onClick={handleClearDB} className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"><Eraser size={16} /> مسح شامل</button>
                        </div>

                        <div className="pt-4 border-t border-gray-100 space-y-3">
                          <p className="text-xs font-bold text-gray-400">تغيير كلمة مرور الإدارة</p>
                          <input 
                            type="password" 
                            placeholder="كلمة المرور الجديدة" 
                            className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none" 
                            value={newAdminPass} 
                            onChange={e => setNewAdminPass(e.target.value)} 
                          />
                          <button 
                            onClick={handleChangeAdminPassword} 
                            className="w-full bg-red-600 text-white py-3 rounded-xl font-bold text-sm"
                          >
                            تغيير كلمة المرور
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeSubMenu === "edit" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-4">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2"><Pencil size={18} className="text-orange-500" /> تعديل المحتوى والمنتجات</h3>
                      <div className="space-y-8">
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-gray-400">إضافة بنر جديد</p>
                          <div className="space-y-2">
                            <AdminImageUpload 
                              label="صورة البانر"
                              currentUrl={newBanner.image_url}
                              onUpload={(url) => setNewBanner({ image_url: url })}
                            />
                            <button onClick={handleAddBanner} className="w-full bg-orange-600 text-white py-3 rounded-xl text-sm font-bold">إضافة بانر</button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-gray-400">إضافة عرض جديد</p>
                          <input type="text" placeholder="عنوان العرض" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none" value={newOffer.title} onChange={e => setNewOffer({...newOffer, title: e.target.value})} />
                          <input type="text" placeholder="وصف العرض" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none" value={newOffer.description} onChange={e => setNewOffer({...newOffer, description: e.target.value})} />
                          <AdminImageUpload 
                            label="صورة العرض"
                            currentUrl={newOffer.image_url}
                            onUpload={(url) => setNewOffer({...newOffer, image_url: url})}
                          />
                          <button onClick={handleAddOffer} className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold text-sm">إضافة عرض</button>
                        </div>
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-gray-400">إدارة أسعار المنتجات</p>
                          <div className="flex gap-2">
                            <input type="number" placeholder="رقم القسم الفرعي الخاص" value={selectedSubId} onChange={(e) => setSelectedSubId(e.target.value)} className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2 outline-none" />
                            <button onClick={() => fetchAdminProducts(selectedSubId)} className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold">عرض</button>
                          </div>
                          <div className="space-y-2">
                            {adminProducts.map(p => (
                              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-gray-700">{p.name}</span>
                                  <span className="text-[8px] text-gray-400">{p.store_type === 'quantities' ? 'متجر كميات' : p.store_type === 'numbers' ? 'متجر أرقام' : 'متجر عادي'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-brand">
                                    {p.store_type === 'quantities' ? `${p.price_per_unit} / وحدة` : `${p.price.toFixed(2)} $`}
                                  </span>
                                  <button onClick={() => handleUpdateProductPrice(p.id, p.store_type === 'quantities' ? p.price_per_unit : p.price, p.store_type)} className="p-1 text-gray-400"><Settings size={14} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeSubMenu === "balance" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-4">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2"><Wallet size={18} className="text-brand" /> إدارة الرصيد والأكواد</h3>
                      <div className="space-y-8">
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-gray-400">إنشاء كود رصيد</p>
                          <div className="grid grid-cols-3 gap-2">
                            <input type="text" placeholder="الكود" className="p-3 bg-gray-50 border-none rounded-xl text-xs outline-none" value={newVoucher.code} onChange={e => setNewVoucher({...newVoucher, code: e.target.value})} />
                            <input type="number" placeholder="القيمة" className="p-3 bg-gray-50 border-none rounded-xl text-xs outline-none" value={newVoucher.amount} onChange={e => setNewVoucher({...newVoucher, amount: e.target.value})} />
                            <input type="number" placeholder="المرات" className="p-3 bg-gray-50 border-none rounded-xl text-xs outline-none" value={newVoucher.max_uses} onChange={e => setNewVoucher({...newVoucher, max_uses: e.target.value})} />
                          </div>
                          <button onClick={handleCreateVoucher} className="w-full bg-brand text-white py-3 rounded-xl font-bold text-sm">إنشاء كود</button>
                        </div>
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-gray-400">شحن رصيد يدوي</p>
                          <input type="text" placeholder="الرقم الشخصي" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none" value={manualTopup.personalNumber} onChange={e => setManualTopup({...manualTopup, personalNumber: e.target.value})} />
                          <input type="number" placeholder="المبلغ $" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none" value={manualTopup.amount} onChange={e => setManualTopup({...manualTopup, amount: e.target.value})} />
                          <button onClick={handleManualTopup} className="w-full bg-brand text-white py-3 rounded-xl font-bold text-sm">شحن الرصيد</button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeSubMenu === "lock" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-4">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2"><Lock size={18} className="text-gray-500" /> خيارات إضافية</h3>
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-gray-400">إضافة طريقة دفع</p>
                          <input type="text" placeholder="اسم الطريقة" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none" value={newPaymentMethod.name} onChange={e => setNewPaymentMethod({...newPaymentMethod, name: e.target.value})} />
                          <AdminImageUpload 
                            label="صورة طريقة الدفع"
                            currentUrl={newPaymentMethod.image_url}
                            onUpload={(url) => setNewPaymentMethod({...newPaymentMethod, image_url: url})}
                          />
                          <input type="text" placeholder="رقم المحفظة" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none" value={newPaymentMethod.wallet_address} onChange={e => setNewPaymentMethod({...newPaymentMethod, wallet_address: e.target.value})} />
                          <input type="number" placeholder="أقل مبلغ" className="w-full p-3 bg-gray-50 border-none rounded-xl text-sm outline-none" value={newPaymentMethod.min_amount} onChange={e => setNewPaymentMethod({...newPaymentMethod, min_amount: e.target.value})} />
                          <button onClick={handleAddPaymentMethod} className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold text-sm">حفظ طريقة الدفع</button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Data Lists (Always visible or toggleable?) - User didn't specify, but I'll keep them at the bottom for management */}
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-800 border-b border-gray-50 pb-2">قائمة العناصر الحالية</h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">الأقسام</p>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map(c => (
                          <div key={c.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-[10px] font-bold text-gray-700 truncate">{c.name}</span>
                            <button onClick={() => handleDelete('categories', c.id)} className="text-red-500 p-1"><XCircle size={14} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">الأقسام الفرعية</p>
                      <div className="grid grid-cols-2 gap-2">
                        {subcategories.map(s => (
                          <div key={s.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-[10px] font-bold text-gray-700 truncate">{s.name}</span>
                            <button onClick={() => handleDelete('subcategories', s.id)} className="text-red-500 p-1"><XCircle size={14} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">المنتجات</p>
                      <div className="grid grid-cols-2 gap-2">
                        {products.map(p => (
                          <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-[10px] font-bold text-gray-700 truncate">{p.name}</span>
                            <div className="flex gap-1">
                              <button onClick={() => handleUpdateProductPrice(p.id, p.store_type === 'quantities' ? p.price_per_unit : p.price, p.store_type)} className="text-orange-500 p-1"><Settings size={14} /></button>
                              <button onClick={() => handleDelete('products', p.id)} className="text-red-500 p-1"><XCircle size={14} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">البانرات</p>
                      <div className="grid grid-cols-2 gap-2">
                        {banners.map(b => (
                          <div key={b.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                            <img src={b.image_url} className="w-8 h-8 object-cover rounded" referrerPolicy="no-referrer" />
                            <button onClick={() => handleDelete('banners', b.id)} className="text-red-500 p-1"><XCircle size={14} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">العروض</p>
                      <div className="grid grid-cols-2 gap-2">
                        {offers.map(o => (
                          <div key={o.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-[10px] font-bold text-gray-700 truncate">{o.title}</span>
                            <button onClick={() => handleDelete('offers', o.id)} className="text-red-500 p-1"><XCircle size={14} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">طرق الدفع</p>
                      <div className="grid grid-cols-2 gap-2">
                        {paymentMethods.map(pm => (
                          <div key={pm.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-[10px] font-bold text-gray-700 truncate">{pm.name}</span>
                            <button onClick={() => handleDelete('payment-methods', pm.id)} className="text-red-500 p-1"><XCircle size={14} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isAdmin) return (
    <AdminPanel 
      user={user}
      fetchUser={fetchUser}
      categories={categories}
      subcategories={subcategories}
      subSubCategories={subSubCategories}
      fetchCategories={fetchCategories}
      fetchSubcategories={fetchSubcategories}
      fetchSubSubCategories={fetchSubSubCategories}
      paymentMethods={paymentMethods}
      fetchPaymentMethods={fetchPaymentMethods}
      banners={banners}
      fetchBanners={fetchBanners}
      offers={offers}
      fetchOffers={fetchOffers}
      setIsAdmin={setIsAdmin}
      theme={theme}
      adminTab={adminTab}
      setAdminTab={setAdminTab}
    />
  );

  return (
    <div className="min-h-screen bg-gray-50 text-right" dir="rtl">
      {!(view.type === "chat" || (isAdmin && adminTab === "chat" && selectedChatUser)) && <Header />}
      <Drawer />
      <NotificationPanel />
      
      <main className={view.type === "chat" || (isAdmin && adminTab === "chat" && selectedChatUser) ? "pb-16" : "pt-20 pb-24"}>
        <AnimatePresence mode="wait">
          <motion.div
            key={view.type + activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {view.type === "admin_login" && (
              <AdminLoginView 
                setIsAdmin={setIsAdmin}
                setAdminAuth={setAdminAuth}
                setView={setView}
              />
            )}
            {view.type === "voucher_redeem" && (
              <VoucherRedeemView 
                voucherCode={voucherCode}
                setVoucherCode={setVoucherCode}
                handleRedeemVoucher={handleRedeemVoucher}
                setView={setView}
              />
            )}
            {view.type !== "admin_login" && view.type !== "voucher_redeem" && (
              <>
                {activeTab === "home" && (
                  <>
                    {view.type === "main" && <HomeView />}
                    {view.type === "subcategories" && <SubcategoriesView />}
                    {view.type === "products" && <ProductsView />}
                    {view.type === "checkout" && <CheckoutView />}
                    {view.type === "quick_order" && <QuickOrderView />}
                    {view.type === "success" && <SuccessView />}
                    {view.type === "login" && <LoginView />}
                  </>
                )}
                {activeTab === "wallet" && (user ? <WalletView /> : <LoginView />)}
                {activeTab === "orders" && (user ? <OrdersView /> : <LoginView />)}
                {activeTab === "profile" && (
                  <>
                    {view.type === "main" && <ProfileView />}
                    {view.type === "payments" && <PaymentsView />}
                    {view.type === "edit_profile" && <EditProfileView />}
                    {view.type === "referral" && <ReferralView />}
                    {view.type === "privacy_policy" && <PrivacyPolicyView />}
                    {view.type === "chat" && <ChatView />}
                    {view.type === "settings" && <SettingsView />}
                    {view.type === "success" && <SuccessView />}
                    {view.type === "login" && <LoginView />}
                  </>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav />

      {/* Telegram Linking Modal */}
      <AnimatePresence>
        {linkingModal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto">
                  <MessageSquare size={40} />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">ربط حساب تليجرام</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">استخدم الكود التالي في البوت لربط حسابك</p>
                </div>

                <div className="relative group">
                  <div className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 transition-colors group-hover:border-blue-400">
                    <span className="text-4xl font-black tracking-widest text-gray-900 dark:text-white font-mono">
                      {linkingModal.code}
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(linkingModal.code);
                      alert("تم نسخ الكود");
                    }}
                    className="absolute -top-2 -right-2 bg-blue-600 text-white p-2 rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
                    title="نسخ الكود"
                  >
                    <Copy size={18} />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-orange-500 font-bold">
                  <Clock size={18} />
                  <span>
                    {Math.floor(linkingModal.timeLeft / 60)}:
                    {(linkingModal.timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                <div className="space-y-3 pt-2">
                  <button 
                    onClick={() => {
                      window.open(`https://t.me/viprostorebot?start=${linkingModal.code}`, '_blank');
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 dark:shadow-none flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <ExternalLink size={20} />
                    فتح تليجرام
                  </button>
                  <button 
                    onClick={() => setLinkingModal(prev => ({ ...prev, isOpen: false }))}
                    className="w-full text-gray-400 dark:text-gray-500 font-bold text-sm py-2"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        {themeModal.isOpen && <ThemeCustomizationModal />}
      </AnimatePresence>

      {/* Blocked Overlay */}
      <AnimatePresence>
        {isBlocked && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-red-600 flex flex-col items-center justify-center text-white p-6 text-center"
          >
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <XCircle size={64} />
            </div>
            <h1 className="text-3xl font-bold mb-4">لقد تم حظرك مؤقتاً</h1>
            <p className="text-red-100 mb-8 max-w-xs">لقد تم تقييد وصولك للموقع بسبب مخالفة القوانين. يرجى الانتظار حتى انتهاء مدة الحظر.</p>
            
            <div className="bg-white/10 p-6 rounded-3xl border border-white/20 backdrop-blur-sm space-y-2">
              <p className="text-xs uppercase tracking-widest text-red-200 font-bold">الوقت المتبقي</p>
              <p className="text-5xl font-bold font-mono">
                {Math.floor(blockCountdown / 60)}:{String(blockCountdown % 60).padStart(2, '0')}
              </p>
            </div>
            
            <button 
              onClick={() => window.location.reload()}
              className="mt-12 bg-white text-red-600 px-8 py-3 rounded-2xl font-bold shadow-xl active:scale-95 transition-all"
            >
              تحديث الصفحة
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
