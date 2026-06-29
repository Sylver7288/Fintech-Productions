import React, { useState, useEffect } from "react";
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  Settings, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Search, 
  Lock, 
  Unlock, 
  Activity,
  UserCheck,
  Shield,
  Layers,
  Megaphone,
  HelpCircle,
  ChevronDown,
  Folder
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from "recharts";

// Helper for Naira currency format
const formatNaira = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-4 rounded-xl border border-white/[0.08] shadow-[0_10px_25px_rgba(0,0,0,0.5)] text-xs">
        <p className="font-bold text-slate-300 mb-2 border-b border-white/[0.05] pb-1 font-mono">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-6 py-0.5">
            <span className="flex items-center gap-1.5 text-slate-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.stroke || entry.color }}></span>
              {entry.name}
            </span>
            <span className="font-bold font-mono" style={{ color: entry.stroke || entry.color }}>
              {formatNaira(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("admin_token"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState("overview");
  const [viewOption, setViewOption] = useState<"list" | "tiles" | "large" | "medium">("large");
  
  // App States
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [flags, setFlags] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Broadcast Notification Form States
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastSuccess, setBroadcastSuccess] = useState("");
  const [broadcastError, setBroadcastError] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Gateway Keys states
  const [paystackPublicKey, setPaystackPublicKey] = useState("");
  const [paystackSecretKey, setPaystackSecretKey] = useState("");
  const [flutterwavePublicKey, setFlutterwavePublicKey] = useState("");
  const [flutterwaveSecretKey, setFlutterwaveSecretKey] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [smileIdApiKey, setSmileIdApiKey] = useState("");
  const [sudoApiKey, setSudoApiKey] = useState("");
  const [bridgecardApiKey, setBridgecardApiKey] = useState("");
  
  const [keysSuccess, setKeysSuccess] = useState("");
  const [keysError, setKeysError] = useState("");
  const [savingKeys, setSavingKeys] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState("paystack");

  // Accordion individual services states
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [serviceSearch, setServiceSearch] = useState("");

  // Support Settings states
  const [supportEmail, setSupportEmail] = useState("");
  const [supportWhatsapp, setSupportWhatsapp] = useState("");
  const [supportLiveChatUrl, setSupportLiveChatUrl] = useState("");
  const [supportSuccess, setSupportSuccess] = useState("");
  const [supportError, setSupportError] = useState("");
  const [savingSupport, setSavingSupport] = useState(false);

  // Banners States
  const [banners, setBanners] = useState<any[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [newBannerTitle, setNewBannerTitle] = useState("");
  const [newBannerDesc, setNewBannerDesc] = useState("");
  const [newBannerImage, setNewBannerImage] = useState("");
  const [newBannerLink, setNewBannerLink] = useState("");
  const [bannerSuccess, setBannerSuccess] = useState("");
  const [bannerError, setBannerError] = useState("");

  // Staffs States
  const [staffs, setStaffs] = useState<any[]>([]);
  const [loadingStaffs, setLoadingStaffs] = useState(false);
  const [staffUsername, setStaffUsername] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRole, setStaffRole] = useState("staff");
  const [staffSuccess, setStaffSuccess] = useState("");
  const [staffError, setStaffError] = useState("");
  const [savingStaff, setSavingStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [savingBanner, setSavingBanner] = useState(false);


  // Loading States
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingFlags, setLoadingFlags] = useState(false);

  // New Integration UI States
  const [feeRules, setFeeRules] = useState<any[]>([]);
  const [loadingFees, setLoadingFees] = useState(false);
  const [reconciliationRuns, setReconciliationRuns] = useState<any[]>([]);
  const [loadingReconciliation, setLoadingReconciliation] = useState(false);
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudits, setLoadingAudits] = useState(false);

  // Fee rule form states
  const [ruleTxnType, setRuleTxnType] = useState("transfer");
  const [ruleFeeType, setRuleFeeType] = useState("fixed");
  const [ruleValue, setRuleValue] = useState("");
  const [ruleMinAmount, setRuleMinAmount] = useState("");
  const [ruleMaxAmount, setRuleMaxAmount] = useState("");
  const [ruleIsActive, setRuleIsActive] = useState(true);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Reconciliation file state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<any>(null);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Login failed");
        return;
      }
      localStorage.setItem("admin_token", data.token);
      setToken(data.token);
    } catch (err) {
      setLoginError("Unable to connect to server");
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
    setAnalytics(null);
    setUsers([]);
    setFlags([]);
    setFeeRules([]);
    setReconciliationRuns([]);
    setAuditLogs([]);
  };

  // Fetch Data Functions
  const fetchAnalytics = async () => {
    if (!token) return;
    setLoadingAnalytics(true);
    try {
      const res = await fetch("/api/admin/analytics", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (res.ok) setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchUsers = async () => {
    if (!token) return;
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchFlags = async () => {
    if (!token) return;
    setLoadingFlags(true);
    try {
      const res = await fetch("/api/admin/flags", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (res.ok) setFlags(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFlags(false);
    }
  };

  const fetchBanners = async () => {
    if (!token) return;
    setLoadingBanners(true);
    try {
      const res = await fetch("/api/admin/banners", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (res.ok) setBanners(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBanners(false);
    }
  };

  const fetchFeeRules = async () => {
    if (!token) return;
    setLoadingFees(true);
    try {
      const res = await fetch("/api/admin/fee-rules", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setFeeRules(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFees(false);
    }
  };

  const fetchReconciliationRuns = async () => {
    if (!token) return;
    setLoadingReconciliation(true);
    try {
      const res = await fetch("/api/admin/reconciliation", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setReconciliationRuns(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReconciliation(false);
    }
  };

  const fetchAuditLogs = async () => {
    if (!token) return;
    setLoadingAudits(true);
    try {
      const res = await fetch("/api/admin/audit-logs", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setAuditLogs(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAudits(false);
    }
  };

  const fetchStaffs = async () => {
    if (!token) return;
    setLoadingStaffs(true);
    try {
      const res = await fetch("/api/admin/staffs", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setStaffs(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStaffs(false);
    }
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffUsername || !staffRole) {
      setStaffError("Username and role are required.");
      return;
    }
    if (!editingStaff && !staffPassword) {
      setStaffError("Password is required for new staff.");
      return;
    }
    setSavingStaff(true);
    setStaffError("");
    setStaffSuccess("");
    try {
      const url = editingStaff ? `/api/admin/staffs/${editingStaff.id}` : "/api/admin/staffs";
      const method = editingStaff ? "PUT" : "POST";
      const body: any = { username: staffUsername, role: staffRole };
      if (staffPassword) {
        body.password = staffPassword;
      }
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        setStaffSuccess(editingStaff ? "Staff member updated successfully." : "Staff member created successfully.");
        setStaffUsername("");
        setStaffPassword("");
        setStaffRole("staff");
        setEditingStaff(null);
        fetchStaffs();
      } else {
        setStaffError(data.error || "Failed to save staff member.");
      }
    } catch (err: any) {
      setStaffError(err.message || "Failed to save staff member.");
    } finally {
      setSavingStaff(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) return;
    setStaffError("");
    setStaffSuccess("");
    try {
      const res = await fetch(`/api/admin/staffs/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStaffSuccess("Staff member deleted successfully.");
        fetchStaffs();
      } else {
        setStaffError(data.error || "Failed to delete staff member.");
      }
    } catch (err: any) {
      setStaffError(err.message || "Failed to delete staff.");
    }
  };

  const handleSaveFeeRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/fee-rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          id: editingRuleId,
          transactionType: ruleTxnType,
          feeType: ruleFeeType,
          value: parseFloat(ruleValue),
          minAmount: ruleMinAmount ? parseFloat(ruleMinAmount) : 0,
          maxAmount: ruleMaxAmount ? parseFloat(ruleMaxAmount) : null,
          isActive: ruleIsActive
        })
      });
      if (res.ok) {
        fetchFeeRules();
        setEditingRuleId(null);
        setRuleValue("");
        setRuleMinAmount("");
        setRuleMaxAmount("");
        alert("Fee rule saved successfully!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFeeRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this fee rule?")) return;
    try {
      const res = await fetch(`/api/admin/fee-rules/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) fetchFeeRules();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadReconciliation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
    setReconciling(true);
    setReconcileResult(null);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const csvData = evt.target?.result as string;
        const res = await fetch("/api/admin/reconciliation/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ fileName: csvFile.name, csvData })
        });
        const data = await res.json();
        if (res.ok) {
          setReconcileResult(data);
          fetchReconciliationRuns();
          setCsvFile(null);
          alert("Reconciliation run completed successfully!");
        } else {
          alert(data.error || "Failed to parse reconciliation file");
        }
        setReconciling(false);
      };
      reader.readAsText(csvFile);
    } catch (err) {
      console.error(err);
      setReconciling(false);
    }
  };

  const handleReverseTransaction = async (txnId: string) => {
    if (!confirm("CRITICAL WARNING: You are about to initiate an administrative transaction reversal. This will refund the transaction amount and any associated fees to the customer's ledger. Proceed?")) return;
    try {
      const res = await fetch(`/api/admin/transactions/${txnId}/reverse`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert("Transaction reversed successfully!");
        fetchUsers();
        fetchAnalytics();
        fetchAuditLogs();
        if (selectedUser) {
          const updatedUsers = users.find(u => u.id === selectedUser.id);
          if (updatedUsers) setSelectedUser(updatedUsers);
        }
      } else {
        alert(data.error || "Failed to reverse transaction");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReconciliationDetails = async (runId: string) => {
    try {
      const res = await fetch(`/api/admin/reconciliation/${runId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedRun(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load Initial Data
  useEffect(() => {
    if (token) {
      fetchAnalytics();
      fetchUsers();
      fetchFlags();
      fetchGatewayKeys();
      fetchBanners();
      fetchFeeRules();
      fetchReconciliationRuns();
      fetchAuditLogs();
      fetchSupportSettings();
      fetchStaffs();
    }
  }, [token]);

  // Handle Flag Toggle
  const handleToggleFlag = async (flagId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/flags/${flagId}/toggle`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ isEnabled: !currentStatus })
      });
      if (res.ok) {
        fetchFlags();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle KYC Status Update
  const handleUpdateKYC = async (userId: string, status: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/kyc`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchUsers();
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser({ ...selectedUser, kycStatus: status });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Card Toggle Freeze
  const handleToggleCardFreeze = async (cardId: string) => {
    try {
      const res = await fetch(`/api/admin/cards/${cardId}/toggle-freeze`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        fetchUsers(); // refresh data
        if (selectedUser) {
          const updatedCards = selectedUser.cards.map((c: any) => 
            c.id === cardId ? { ...c, status: data.status } : c
          );
          setSelectedUser({ ...selectedUser, cards: updatedCards });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Send Notification Announcement Broadcast
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcastSuccess("");
    setBroadcastError("");
    if (!broadcastTitle || !broadcastMessage) {
      setBroadcastError("Title and message are required");
      return;
    }
    setSendingBroadcast(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title: broadcastTitle, message: broadcastMessage })
      });
      const data = await res.json();
      if (!res.ok) {
        setBroadcastError(data.error || "Broadcast failed");
        return;
      }
      setBroadcastSuccess(data.message || "Alert broadcasted successfully!");
      setBroadcastTitle("");
      setBroadcastMessage("");
    } catch (err) {
      setBroadcastError("Unable to connect to server");
    } finally {
      setSendingBroadcast(false);
    }
  };

  const fetchSupportSettings = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/support-settings", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSupportEmail(data.email || "");
        setSupportWhatsapp(data.whatsapp || "");
        setSupportLiveChatUrl(data.liveChatUrl || "");
      }
    } catch (err) {
      console.error("Failed to fetch support settings:", err);
    }
  };

  const handleSaveSupportSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupportSuccess("");
    setSupportError("");
    setSavingSupport(true);
    try {
      const res = await fetch("/api/admin/support-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          email: supportEmail,
          whatsapp: supportWhatsapp,
          liveChatUrl: supportLiveChatUrl
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSupportSuccess(data.message || "Support settings saved successfully!");
        fetchSupportSettings();
      } else {
        setSupportError(data.error || "Failed to save support settings");
      }
    } catch (err) {
      setSupportError("Unable to connect to server");
    } finally {
      setSavingSupport(false);
    }
  };

  const fetchGatewayKeys = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/gateway-keys", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPaystackPublicKey(data.paystackPublicKey || "");
        setPaystackSecretKey(data.paystackSecretKey || "");
        setFlutterwavePublicKey(data.flutterwavePublicKey || "");
        setFlutterwaveSecretKey(data.flutterwaveSecretKey || "");
        setStripeSecretKey(data.stripeSecretKey || "");
        setSmileIdApiKey(data.smileIdApiKey || "");
        setSudoApiKey(data.sudoApiKey || "");
        setBridgecardApiKey(data.bridgecardApiKey || "");
      }
    } catch (err) {
      console.error("Failed to fetch gateway credentials:", err);
    }
  };

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeysSuccess("");
    setKeysError("");
    setSavingKeys(true);
    try {
      const res = await fetch("/api/admin/gateway-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          paystackPublicKey,
          paystackSecretKey,
          flutterwavePublicKey,
          flutterwaveSecretKey,
          stripeSecretKey,
          smileIdApiKey,
          sudoApiKey,
          bridgecardApiKey
        })
      });
      const data = await res.json();
      if (res.ok) {
        setKeysSuccess(data.message || "Credentials saved successfully!");
        fetchGatewayKeys(); // reload (will show masked values)
      } else {
        setKeysError(data.error || "Failed to save credentials");
      }
    } catch (err) {
      setKeysError("Unable to connect to server");
    } finally {
      setSavingKeys(false);
    }
  };

  // Create Banner
  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerSuccess("");
    setBannerError("");
    if (!newBannerTitle) {
      setBannerError("Title is required");
      return;
    }
    setSavingBanner(true);
    try {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newBannerTitle,
          description: newBannerDesc,
          imageUrl: newBannerImage,
          linkUrl: newBannerLink
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setBannerError(data.error || "Failed to create banner");
        return;
      }
      setBannerSuccess("Banner created successfully!");
      setNewBannerTitle("");
      setNewBannerDesc("");
      setNewBannerImage("");
      setNewBannerLink("");
      fetchBanners();
    } catch (err) {
      setBannerError("Unable to connect to server");
    } finally {
      setSavingBanner(false);
    }
  };

  // Toggle Banner Active
  const handleToggleBanner = async (bannerId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/banners/${bannerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (res.ok) {
        fetchBanners();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Banner
  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    try {
      const res = await fetch(`/api/admin/banners/${bannerId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchBanners();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Users list
  const filteredUsers = users.filter(u => 
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone.includes(searchQuery)
  );

  // LOGIN PAGE SCREEN
  if (!token) {
    return (
      <div className="min-h-screen bg-[#430016] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

        {/* Glowing drifting background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/[0.05] blur-[120px] pointer-events-none animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-500/[0.05] blur-[140px] pointer-events-none animate-blob animation-delay-2000"></div>

        <div className="w-full max-w-md glass-panel rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-8 relative z-10 hover:border-indigo-500/20 transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          
          <div className="flex flex-col items-center mb-8">
            <div className="h-14 w-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mb-4 shadow-[0_4px_20px_rgba(229,169,60,0.3)] hover:rotate-6 transition-all duration-300">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Novamoni Control Center</h1>
            <p className="text-slate-400 text-sm mt-1.5 text-center font-medium">Enter credentials to authenticate system access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Username</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 transition-all duration-200 text-sm shadow-inner"
                placeholder="Enter username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Password</label>
              <input 
                type="password" 
                className="w-full px-4 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 transition-all duration-200 text-sm shadow-inner"
                placeholder="Enter password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {loginError && (
              <div className="bg-rose-950/30 border border-rose-500/30 text-rose-200 text-sm p-3.5 rounded-xl flex items-center gap-2 animate-pulse">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl transition-all duration-300 active:scale-[0.98] shadow-[0_4px_25px_rgba(229,169,60,0.25)] hover:shadow-[0_4px_30px_rgba(229,169,60,0.45)] cursor-pointer"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  const renderIndividualServiceSettings = () => {
    const serviceFlags = flags.filter(f => f.key.startsWith("service-"));
    const filteredServices = serviceFlags.filter(flag => {
      const serviceName = flag.description.replace("Individual service toggle for: ", "");
      return serviceName.toLowerCase().includes(serviceSearch.toLowerCase()) || flag.key.toLowerCase().includes(serviceSearch.toLowerCase());
    });

    const SERVICE_CATEGORIES: { [key: string]: string[] } = {
      "E-commerce": ["aliexpress", "gift-cards", "chowdeck"],
      "International Services": ["remit"],
      "Bills Payment": [
        "electricity", "solar", "products-and-services", "school-exam", "internet-services", 
        "financial-services", "invoice-payments", "aid-grants-and-donations", "religious", 
        "government-payments", "embassies", "tv-others", "shopping", "online-shopping", 
        "merchant-payments", "blackberry", "paychoice", "commerce-retail-trade", 
        "prepaid-card-services", "international-airtime", "transport-toll", "travel-hotel"
      ],
      "Finance": ["owealth", "fixed", "safebox", "targets", "spend-save", "bnpl"],
      "Rewards": ["daily-check-in", "play4achild", "refer-earn"],
      "Others": ["physical-card", "virtual-card"]
    };

    // Grouping
    const groupedServices: { [key: string]: typeof filteredServices } = {
      "E-commerce": [],
      "International Services": [],
      "Bills Payment": [],
      "Finance": [],
      "Rewards": [],
      "Others": [],
    };

    filteredServices.forEach(flag => {
      const slug = flag.key.replace("service-", "");
      let placed = false;
      for (const [category, slugs] of Object.entries(SERVICE_CATEGORIES)) {
        if (slugs.includes(slug)) {
          groupedServices[category].push(flag);
          placed = true;
          break;
        }
      }
      if (!placed) {
        groupedServices["Others"].push(flag);
      }
    });

    return (
      <div className="border-t border-white/[0.04] pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h4 className="text-xs font-black text-indigo-400/90 uppercase tracking-wider">Individual Service Settings</h4>
            <p className="text-slate-400 text-xs mt-1 font-medium font-sans">Control both the visibility (Show/Hide) and functionality (ON/OFF) of each individual service.</p>
          </div>
          
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="h-4 w-4" />
            </div>
            <input 
              type="text" 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner font-sans"
              placeholder="Search service name (e.g. Bills)..." 
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
            />
            {serviceSearch && (
              <button 
                onClick={() => setServiceSearch("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 text-xs cursor-pointer font-bold"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {filteredServices.length === 0 ? (
          <div className="bg-slate-950/20 border border-dashed border-white/[0.04] rounded-2xl p-8 text-center text-slate-500 text-xs font-medium">
            No services found matching "{serviceSearch}"
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedServices).map(([categoryName, flagsInCategory]) => {
              if (flagsInCategory.length === 0) return null;

              return (
                <div key={categoryName} className="bg-slate-950/15 border border-white/[0.03] p-5 rounded-2xl">
                  {/* Category Header */}
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/[0.02]">
                    <Folder className="h-4 w-4 text-indigo-400" />
                    <h5 className="text-xs font-black text-slate-200 uppercase tracking-wide">{categoryName}</h5>
                    <span className="text-[9px] bg-slate-950 border border-white/[0.04] text-slate-400 px-2 py-0.5 rounded-full font-bold">
                      {flagsInCategory.length}
                    </span>
                  </div>

                  {/* Services in Category */}
                  <div className="space-y-3">
                    {flagsInCategory.map((flag) => {
                      const serviceName = flag.description.replace("Individual service toggle for: ", "");
                      const visibilityKey = flag.key.replace("service-", "visibility-");
                      const visFlag = flags.find(f => f.key === visibilityKey);
                      const isExpanded = expandedService === flag.id;

                      return (
                        <div 
                          key={flag.id} 
                          className={`border rounded-2xl overflow-hidden transition-all duration-300 bg-slate-950/25 shadow-sm ${
                            isExpanded 
                              ? "border-indigo-500/40 ring-1 ring-indigo-500/10" 
                              : "border-white/[0.04] hover:border-indigo-500/25 hover:bg-slate-950/35"
                          }`}
                        >
                          <button
                            onClick={() => setExpandedService(isExpanded ? null : flag.id)}
                            className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none bg-slate-950/40 hover:bg-slate-900/20 transition duration-150 cursor-pointer"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-inner ${
                                flag.isEnabled 
                                  ? "bg-emerald-500/10 text-emerald-450 border border-emerald-500/15" 
                                  : "bg-rose-500/10 text-rose-450 border border-rose-500/15"
                              }`}>
                                {serviceName.charAt(0)}
                              </div>
                              <div>
                                <h5 className="font-bold text-white text-sm tracking-tight">{serviceName}</h5>
                                <span className="font-mono text-[9px] text-slate-500 mt-1 block truncate">
                                  {flag.key.replace("service-", "")}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 flex-wrap justify-end">
                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                                  visFlag?.isEnabled 
                                    ? "bg-indigo-950/50 text-indigo-400 border-indigo-500/20" 
                                    : "bg-slate-950 text-slate-500 border-white/[0.02]"
                                }`}>
                                  {visFlag?.isEnabled ? "Visible in App" : "Hidden in App"}
                                </span>
                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                                  flag.isEnabled 
                                    ? "bg-emerald-950/50 text-emerald-450 border-emerald-500/20" 
                                    : "bg-rose-950/50 text-rose-450 border-rose-500/20"
                                }`}>
                                  {flag.isEnabled ? "ON (Active)" : "OFF (Offline)"}
                                </span>
                              </div>
                              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isExpanded ? "transform rotate-180 text-indigo-400" : ""}`} />
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-6 py-5 bg-slate-950/70 border-t border-white/[0.03] space-y-4 animate-slideDown">
                              <div className="bg-slate-900/40 border border-white/[0.02] p-4 rounded-xl">
                                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                                  Configuration panel for <strong>{serviceName}</strong>. Show or hide this service from the mobile home dashboard or simulate downtime to handle updates.
                                </p>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* 1. Visibility toggle */}
                                <div className="bg-slate-950/40 border border-white/[0.03] p-4.5 rounded-xl flex items-center justify-between shadow-inner">
                                  <div>
                                    <span className="text-xs font-bold text-slate-200 block">Show in Mobile App</span>
                                    <span className="text-[10px] text-slate-500 font-medium">Determines if the icon displays in grid</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-black uppercase tracking-wider ${visFlag?.isEnabled ? "text-indigo-400" : "text-slate-500"}`}>
                                      {visFlag?.isEnabled ? "VISIBLE" : "HIDDEN"}
                                    </span>
                                    {visFlag && (
                                      <button 
                                        onClick={() => handleToggleFlag(visFlag.id, visFlag.isEnabled)}
                                        className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border border-white/[0.08] transition-all duration-300 ease-in-out focus:outline-none ${
                                          visFlag.isEnabled 
                                            ? "bg-gradient-to-r from-indigo-650 to-violet-650 shadow-[0_0_8px_rgba(229,169,60,0.25)]" 
                                            : "bg-slate-900 shadow-inner"
                                        }`}
                                      >
                                        <span 
                                          className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.4)] ring-0 transition duration-300 ease-in-out mt-0.5 ${
                                            visFlag.isEnabled ? "translate-x-5" : "translate-x-0.5"
                                          }`}
                                        />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* 2. Functionality toggle */}
                                <div className="bg-slate-950/40 border border-white/[0.03] p-4.5 rounded-xl flex items-center justify-between shadow-inner">
                                  <div>
                                    <span className="text-xs font-bold text-slate-200 block">Service Active State</span>
                                    <span className="text-[10px] text-slate-500 font-medium">ON sets live, OFF triggers offline alert</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-black uppercase tracking-wider ${flag.isEnabled ? "text-emerald-400" : "text-rose-450"}`}>
                                      {flag.isEnabled ? "ON (ACTIVE)" : "OFF (OFFLINE)"}
                                    </span>
                                    <button 
                                      onClick={() => handleToggleFlag(flag.id, flag.isEnabled)}
                                      className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border border-white/[0.08] transition-all duration-300 ease-in-out focus:outline-none ${
                                        flag.isEnabled 
                                          ? "bg-gradient-to-r from-emerald-650 to-teal-650 shadow-[0_0_8px_rgba(16,185,129,0.25)]" 
                                          : "bg-slate-900 shadow-inner"
                                      }`}
                                    >
                                      <span 
                                        className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.4)] ring-0 transition duration-300 ease-in-out mt-0.5 ${
                                          flag.isEnabled ? "translate-x-5" : "translate-x-0.5"
                                        }`}
                                      />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // MAIN DASHBOARD LAYOUT
  return (
    <div className="min-h-screen bg-[#430016] relative overflow-hidden flex flex-col md:flex-row text-slate-100 font-sans">
      {/* Ambient Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      {/* Glowing drifting background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/[0.04] blur-[120px] pointer-events-none animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-500/[0.04] blur-[140px] pointer-events-none animate-blob animation-delay-2000"></div>
      <div className="absolute top-[40%] right-[20%] w-[400px] h-[400px] rounded-full bg-emerald-500/[0.02] blur-[100px] pointer-events-none animate-blob animation-delay-4000"></div>

      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-slate-950/40 backdrop-blur-xl border-r border-white/[0.04] flex flex-col shrink-0 z-10">
        <div className="p-6 flex items-center gap-3 border-b border-white/[0.04] bg-slate-950/20">
          <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(229,169,60,0.3)] hover:scale-105 transition-all duration-300">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-extrabold text-white tracking-tight leading-none text-base">Novamoni</h2>
            <span className="text-[9px] uppercase font-black tracking-widest text-indigo-400/80 mt-1.5 inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 led-pulse shadow-[0_0_8px_rgba(229,169,60,0.8)]"></span>
              Control Center
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === "overview" 
                ? "bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 pl-3 shadow-[0_0_20px_rgba(229,169,60,0.06)]" 
                : "text-slate-400 hover:bg-white/[0.02] hover:text-slate-200 hover:pl-5"
            }`}
          >
            <Activity className="h-5 w-5" />
            <span>Overview & Analytics</span>
          </button>
          <button 
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === "users" 
                ? "bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 pl-3 shadow-[0_0_20px_rgba(229,169,60,0.06)]" 
                : "text-slate-400 hover:bg-white/[0.02] hover:text-slate-200 hover:pl-5"
            }`}
          >
            <Users className="h-5 w-5" />
            <span>User Accounts & KYC</span>
          </button>
          <button 
            onClick={() => setActiveTab("flags")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === "flags" 
                ? "bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 pl-3 shadow-[0_0_20px_rgba(229,169,60,0.06)]" 
                : "text-slate-400 hover:bg-white/[0.02] hover:text-slate-200 hover:pl-5"
            }`}
          >
            <Layers className="h-5 w-5" />
            <span>App Feature Flags</span>
          </button>
          <button 
            onClick={() => setActiveTab("banners")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === "banners" 
                ? "bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 pl-3 shadow-[0_0_20px_rgba(229,169,60,0.06)]" 
                : "text-slate-400 hover:bg-white/[0.02] hover:text-slate-200 hover:pl-5"
            }`}
          >
            <Megaphone className="h-5 w-5" />
            <span>Promotions & Banners</span>
          </button>
          <button 
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === "settings" 
                ? "bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 pl-3 shadow-[0_0_20px_rgba(229,169,60,0.06)]" 
                : "text-slate-400 hover:bg-white/[0.02] hover:text-slate-200 hover:pl-5"
            }`}
          >
            <Settings className="h-5 w-5" />
            <span>Gateways & Alerts</span>
          </button>
          <button 
            onClick={() => setActiveTab("support")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === "support" 
                ? "bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 pl-3 shadow-[0_0_20px_rgba(229,169,60,0.06)]" 
                : "text-slate-400 hover:bg-white/[0.02] hover:text-slate-200 hover:pl-5"
            }`}
          >
            <HelpCircle className="h-5 w-5" />
            <span>Help & Support</span>
          </button>
          <button 
            onClick={() => setActiveTab("fees")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === "fees" 
                ? "bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 pl-3 shadow-[0_0_20px_rgba(229,169,60,0.06)]" 
                : "text-slate-400 hover:bg-white/[0.02] hover:text-slate-200 hover:pl-5"
            }`}
          >
            <CreditCard className="h-5 w-5" />
            <span>Fee Management</span>
          </button>
          <button 
            onClick={() => setActiveTab("reconciliation")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === "reconciliation" 
                ? "bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 pl-3 shadow-[0_0_20px_rgba(229,169,60,0.06)]" 
                : "text-slate-400 hover:bg-white/[0.02] hover:text-slate-200 hover:pl-5"
            }`}
          >
            <Activity className="h-5 w-5" />
            <span>Reconciliation</span>
          </button>
          <button 
            onClick={() => setActiveTab("audit")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === "audit" 
                ? "bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 pl-3 shadow-[0_0_20px_rgba(229,169,60,0.06)]" 
                : "text-slate-400 hover:bg-white/[0.02] hover:text-slate-200 hover:pl-5"
            }`}
          >
            <Shield className="h-5 w-5" />
            <span>Audit Trail</span>
          </button>
          <button 
            onClick={() => setActiveTab("staffs")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === "staffs" 
                ? "bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-500 pl-3 shadow-[0_0_20px_rgba(229,169,60,0.06)]" 
                : "text-slate-400 hover:bg-white/[0.02] hover:text-slate-200 hover:pl-5"
            }`}
          >
            <Users className="h-5 w-5" />
            <span>Staff & Roles</span>
          </button>
        </nav>

        <div className="p-4 border-t border-white/[0.04] bg-slate-950/20 space-y-4">
          <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-950/50 border border-white/[0.03] rounded-xl shadow-inner">
            <div className="relative">
              <div className="h-9 w-9 bg-indigo-500/10 rounded-full border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 text-sm">
                AD
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-slate-950 led-pulse shadow-[0_0_8px_#10b981]"></span>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Administrator</div>
              <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Live Session</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-rose-400 rounded-xl font-semibold hover:bg-rose-500/10 transition-all duration-300 cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN MAIN VIEW */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 relative z-10">
        
        {/* HEADER */}
        <header className="flex items-center justify-between border-b border-white/[0.06] pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              {activeTab === "overview" && "Dashboard Analytics"}
              {activeTab === "users" && "User Directory & KYC Control"}
              {activeTab === "flags" && "Application Features Manager"}
              {activeTab === "banners" && "Promotions & Banner Ads"}
              {activeTab === "settings" && "System Settings & Gateways"}
              {activeTab === "support" && "Help & Support Settings"}
              {activeTab === "fees" && "Transaction Fee Rules"}
              {activeTab === "reconciliation" && "NIBSS Settlement Reconciliation"}
              {activeTab === "audit" && "Administrative Audit Log"}
              {activeTab === "staffs" && "Staff Members & Role Permissions"}
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-medium">Novamoni live ledger audit console</p>
          </div>
          
          <button 
            onClick={() => {
              fetchAnalytics();
              fetchUsers();
              fetchFlags();
              fetchGatewayKeys();
              fetchBanners();
              fetchFeeRules();
              fetchReconciliationRuns();
              fetchAuditLogs();
              fetchSupportSettings();
              fetchStaffs();
            }}
            className="px-4.5 py-2.5 bg-slate-900/60 hover:bg-indigo-600 border border-white/[0.06] hover:border-indigo-500 text-slate-200 hover:text-white text-sm font-bold rounded-xl transition duration-300 active:scale-[0.98] shadow-md hover:shadow-[0_0_15px_rgba(229,169,60,0.35)] cursor-pointer"
          >
            Refresh Data
          </button>
        </header>

        {/* TAB CONTENTS */}
        
        {/* 1. OVERVIEW & ANALYTICS TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Loading Indicator */}
            {loadingAnalytics && !analytics && (
              <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-3">
                <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading metrics...</span>
              </div>
            )}

            {analytics && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="glass-panel glass-panel-hover rounded-2xl p-6 flex items-center justify-between shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/[0.02] rounded-full blur-xl group-hover:bg-violet-500/[0.08] transition-all duration-500"></div>
                    <div>
                      <span className="text-slate-400 text-xs font-black uppercase tracking-wider">Total Users</span>
                      <h3 className="text-3.5xl font-black text-white mt-2 font-sans tracking-tight">{analytics.totalUsers}</h3>
                    </div>
                    <div className="h-12 w-12 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-violet-400 shadow-inner group-hover:scale-110 transition-all duration-300">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="glass-panel glass-panel-hover rounded-2xl p-6 flex items-center justify-between shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/[0.02] rounded-full blur-xl group-hover:bg-cyan-500/[0.08] transition-all duration-500"></div>
                    <div>
                      <span className="text-slate-400 text-xs font-black uppercase tracking-wider">Active Cards</span>
                      <h3 className="text-3.5xl font-black text-white mt-2 font-sans tracking-tight">{analytics.activeCards}</h3>
                    </div>
                    <div className="h-12 w-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400 shadow-inner group-hover:scale-110 transition-all duration-300">
                      <CreditCard className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="glass-panel glass-panel-hover rounded-2xl p-6 flex items-center justify-between shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.02] rounded-full blur-xl group-hover:bg-emerald-500/[0.08] transition-all duration-500"></div>
                    <div>
                      <span className="text-slate-400 text-xs font-black uppercase tracking-wider">Total Cash Inflow</span>
                      <h3 className="text-3.5xl font-black text-emerald-400 mt-2 font-sans tracking-tight">{formatNaira(analytics.totalInflow)}</h3>
                    </div>
                    <div className="h-12 w-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-110 transition-all duration-300 animate-pulse">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="glass-panel glass-panel-hover rounded-2xl p-6 flex items-center justify-between shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/[0.02] rounded-full blur-xl group-hover:bg-rose-500/[0.08] transition-all duration-500"></div>
                    <div>
                      <span className="text-slate-400 text-xs font-black uppercase tracking-wider">Total Cash Outflow</span>
                      <h3 className="text-3.5xl font-black text-rose-400 mt-2 font-sans tracking-tight">{formatNaira(analytics.totalOutflow)}</h3>
                    </div>
                    <div className="h-12 w-12 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-400 shadow-inner group-hover:scale-110 transition-all duration-300">
                      <TrendingDown className="h-6 w-6" />
                    </div>
                  </div>
                </div>

                {/* Graph Trend Section */}
                <div className="glass-panel rounded-2xl p-6 shadow-xl relative overflow-hidden border-t-2 border-indigo-500/30">
                  <h3 className="text-lg font-bold text-white mb-6 tracking-tight flex items-center gap-2">
                    <Activity className="h-5 w-5 text-indigo-400" />
                    <span>Cash Flow Volume Trend (Last 30 Days)</span>
                  </h3>
                  <div className="h-80 w-full">
                    {analytics.trends && analytics.trends.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.trends} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00B894" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#00B894" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#E74C3C" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#E74C3C" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                          <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend verticalAlign="top" height={36} iconType="circle"/>
                          <Area name="Inflow (₦)" type="monotone" dataKey="inflow" stroke="#00B894" strokeWidth={3} fillOpacity={1} fill="url(#colorInflow)" />
                          <Area name="Outflow (₦)" type="monotone" dataKey="outflow" stroke="#E74C3C" strokeWidth={3} fillOpacity={1} fill="url(#colorOutflow)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-500 font-medium">No transactions recorded yet to display trend graph</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 2. USERS & KYC TAB */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* Search Box */}
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                <input 
                  type="text" 
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-800/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 text-sm transition-all"
                  placeholder="Search by name, email, or phone number"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {loadingUsers && users.length === 0 ? (
              <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-3">
                <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading user accounts...</span>
              </div>
            ) : (
              <div className="glass-panel rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/85 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-950/20">
                        <th className="py-4.5 px-6">Name</th>
                        <th className="py-4.5 px-6">Email / Phone</th>
                        <th className="py-4.5 px-6">KYC Status</th>
                        <th className="py-4.5 px-6">Total Balance</th>
                        <th className="py-4.5 px-6">Joined Date</th>
                        <th className="py-4.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-sm">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-800/20 transition-all duration-150">
                            <td className="py-4 px-6 font-bold text-white">{user.firstName} {user.lastName}</td>
                            <td className="py-4 px-6">
                              <div className="text-slate-300 font-medium">{user.email}</div>
                              <div className="text-slate-500 text-xs mt-0.5">{user.phone}</div>
                            </td>
                            <td className="py-4 px-6">
                              {user.kycStatus === "approved" ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 led-pulse neon-glow-emerald"></span>
                                  <span>Approved</span>
                                </span>
                              ) : user.kycStatus === "rejected" ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400 led-pulse neon-glow-rose"></span>
                                  <span>Rejected</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 led-pulse neon-glow-amber"></span>
                                  <span>Pending</span>
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 font-extrabold text-slate-200">{formatNaira(user.totalBalance)}</td>
                            <td className="py-4 px-6 text-slate-400 font-medium">{new Date(user.createdAt).toLocaleDateString("en-NG", { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                            <td className="py-4 px-6 text-right">
                              <button 
                                onClick={() => setSelectedUser(user)}
                                className="px-4 py-2 bg-indigo-600/10 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white text-indigo-400 text-xs font-bold rounded-xl transition duration-200 shadow-sm"
                              >
                                Manage User
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-500 font-medium">No users found matching search query</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* USER DETAIL MODAL POPUP */}
            {selectedUser && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-all duration-300">
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-[0_0_50px_rgba(229,169,60,0.15)] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500"></div>

                  {/* Modal Header */}
                  <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/30">
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight">{selectedUser.firstName} {selectedUser.lastName}</h3>
                      <span className="text-slate-500 text-xs font-mono mt-1 block">USER ID: {selectedUser.id}</span>
                    </div>
                    <button 
                      onClick={() => setSelectedUser(null)}
                      className="text-slate-400 hover:text-white font-bold bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition duration-200"
                    >
                      ×
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    
                    {/* KYC Controls */}
                    <div className="bg-slate-950/60 p-5 border border-slate-800 rounded-xl space-y-4 shadow-inner">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-300 flex items-center gap-2">
                          <Shield className="h-4.5 w-4.5 text-indigo-400" />
                          <span>Identity KYC Verification</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Status:</span>
                          {selectedUser.kycStatus === "approved" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="h-1 w-1 bg-emerald-400 rounded-full neon-glow-emerald"></span>
                              <span>Approved</span>
                            </span>
                          ) : selectedUser.kycStatus === "rejected" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <span className="h-1 w-1 bg-rose-400 rounded-full neon-glow-rose"></span>
                              <span>Rejected</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <span className="h-1 w-1 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                              <span>Pending</span>
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1.5">
                        <div className="text-xs text-slate-400 leading-relaxed font-medium">
                          BVN Provided: <span className="font-mono text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{selectedUser.bvn || "None Provided"}</span>
                        </div>
                        <div className="text-xs text-slate-400 leading-relaxed font-medium">
                          NIN Provided: <span className="font-mono text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{selectedUser.nin || "None Provided"}</span>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-1">
                        <button 
                          onClick={() => handleUpdateKYC(selectedUser.id, "approved")}
                          disabled={selectedUser.kycStatus === "approved"}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-[0.98] shadow-md shadow-emerald-950/20"
                        >
                          <UserCheck className="h-4 w-4" />
                          <span>Approve KYC Verification</span>
                        </button>
                        <button 
                          onClick={() => handleUpdateKYC(selectedUser.id, "rejected")}
                          disabled={selectedUser.kycStatus === "rejected"}
                          className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-[0.98] shadow-md shadow-rose-950/20"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Reject KYC Submission</span>
                        </button>
                      </div>
                    </div>

                    {/* Bank Accounts */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Linked Accounts ledger</h4>
                      <div className="space-y-3">
                        {selectedUser.accounts && selectedUser.accounts.length > 0 ? (
                          selectedUser.accounts.map((acc: any) => (
                            <div key={acc.id} className="bg-slate-950/40 p-4 border border-slate-800/80 rounded-xl flex items-center justify-between shadow-sm hover:border-slate-700 transition">
                              <div>
                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                  <span>{acc.bankName} Account</span>
                                </div>
                                <div className="text-xs text-slate-500 mt-1">Number: <b className="font-mono text-slate-300">{acc.accountNumber}</b> • <span className="capitalize">{acc.type}</span></div>
                              </div>
                              <div className="text-right">
                                <div className="text-base font-black text-indigo-400">{formatNaira(parseFloat(acc.balance))}</div>
                                <span className="text-[10px] text-emerald-400 font-extrabold uppercase bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10 mt-1 inline-block">{acc.status}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-5 bg-slate-950/20 rounded-xl text-slate-500 border border-slate-800/50">No linked bank accounts found</div>
                        )}
                      </div>
                    </div>

                    {/* Virtual Cards */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Active Virtual Cards</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedUser.cards && selectedUser.cards.length > 0 ? (
                          selectedUser.cards.map((card: any) => (
                            <div key={card.id} className="flex flex-col gap-3">
                              <div className={`holo-card ${card.status === "active" ? "" : "holo-card-frozen"} rounded-2xl p-5 flex flex-col justify-between h-44 w-full border border-white/[0.08] relative overflow-hidden hover:scale-[1.02] transition duration-300 shadow-xl`}>
                                {/* Gloss overlay */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/[0.03] to-transparent rounded-full blur-xl pointer-events-none"></div>
                                
                                <div className="flex items-center justify-between relative z-10">
                                  <div>
                                    <div className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{card.type} CARD</div>
                                    <div className="h-6 w-8 bg-gradient-to-r from-amber-400/80 to-amber-500/80 rounded border border-amber-300/35 flex items-center justify-center mt-2 overflow-hidden shadow-inner">
                                      <svg viewBox="0 0 100 100" className="h-full w-full opacity-60">
                                        <rect x="10" y="10" width="80" height="80" rx="10" fill="none" stroke="#000" strokeWidth="6"/>
                                        <line x1="10" y1="50" x2="90" y2="50" stroke="#000" strokeWidth="6"/>
                                        <line x1="50" y1="10" x2="50" y2="90" stroke="#000" strokeWidth="6"/>
                                      </svg>
                                    </div>
                                  </div>
                                  <span className={`text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full border tracking-wider relative z-10 ${
                                    card.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                  }`}>
                                    {card.status}
                                  </span>
                                </div>

                                <div className="mt-3 relative z-10">
                                  <div className="text-lg font-black text-white font-mono tracking-widest text-center">
                                    ••••  ••••  ••••  {card.last4}
                                  </div>
                                </div>

                                <div className="flex items-end justify-between relative z-10">
                                  <div>
                                    <div className="text-[7px] text-slate-500 uppercase font-black tracking-wider">Card Holder</div>
                                    <div className="text-xs font-bold text-slate-300 tracking-wide truncate max-w-[130px]">{card.cardHolder}</div>
                                  </div>
                                  <div>
                                    <div className="text-[7px] text-slate-500 uppercase font-black tracking-wider text-right">Expires</div>
                                    <div className="text-xs font-mono font-bold text-slate-300 mt-0.5">{card.expiryMonth.toString().padStart(2, '0')}/{card.expiryYear.toString().slice(-2)}</div>
                                  </div>
                                </div>
                              </div>

                              <button 
                                onClick={() => handleToggleCardFreeze(card.id)}
                                className={`w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition duration-200 active:scale-[0.98] cursor-pointer shadow-sm ${
                                  card.status === "active" 
                                    ? "bg-rose-600/15 text-rose-400 border border-rose-500/20 hover:bg-rose-600 hover:text-white" 
                                    : "bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white"
                                }`}
                              >
                                {card.status === "active" ? (
                                  <>
                                    <Lock className="h-3.5 w-3.5" />
                                    <span>Freeze Virtual Card</span>
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="h-3.5 w-3.5" />
                                    <span>Unfreeze Virtual Card</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 text-center py-8 bg-slate-950/40 rounded-2xl text-slate-500 border border-white/[0.04]">No virtual cards generated for this user</div>
                        )}
                      </div>
                    </div>

                    {/* User Transaction History & Reversals */}
                    <div className="pt-2 border-t border-slate-800/60">
                      <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Transaction History & Reversals</h4>
                      <div className="glass-panel rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/30 shadow-inner max-h-72 overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-800/60 text-slate-500 font-bold uppercase tracking-wider bg-slate-950/20">
                              <th className="py-3 px-4">Date</th>
                              <th className="py-3 px-4">Reference / Desc</th>
                              <th className="py-3 px-4">Amount</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850 text-slate-350">
                            {selectedUser.transactions && selectedUser.transactions.length > 0 ? (
                              selectedUser.transactions.map((txn: any) => {
                                const isDebit = txn.type === "debit";
                                const isPending = txn.status === "pending";
                                const isCompleted = txn.status === "completed";
                                const isReversible = isDebit && !txn.isReversed && (isCompleted || isPending);

                                return (
                                  <tr key={txn.id} className="hover:bg-slate-800/10">
                                    <td className="py-3 px-4 text-slate-400 font-mono">
                                      {new Date(txn.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                                    </td>
                                    <td className="py-3 px-4 font-medium">
                                      <div className="text-slate-200 truncate max-w-[180px]" title={txn.description}>{txn.description}</div>
                                      <div className="text-[10px] text-slate-550 font-mono mt-0.5">{txn.reference}</div>
                                    </td>
                                    <td className={`py-3 px-4 font-mono font-bold ${isDebit ? "text-rose-450" : "text-emerald-450"}`}>
                                      {isDebit ? "-" : "+"}{formatNaira(parseFloat(txn.amount))}
                                      {parseFloat(txn.fee) > 0 && <span className="text-[9px] text-slate-500 block font-normal">(fee: ₦{parseFloat(txn.fee)})</span>}
                                    </td>
                                    <td className="py-3 px-4">
                                      {txn.isReversed ? (
                                        <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider">Reversed</span>
                                      ) : (
                                        <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                          txn.status === "completed" ? "text-emerald-400" : txn.status === "pending" ? "text-amber-400" : "text-rose-400"
                                        }`}>
                                          {txn.status}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                      {isReversible && (
                                        <button
                                          onClick={() => handleReverseTransaction(txn.id)}
                                          className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-450 hover:bg-rose-600 hover:text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
                                        >
                                          Reverse
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={5} className="text-center py-6 text-slate-550 font-medium">No recent transactions recorded for this user</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. FEATURE FLAGS TAB */}
        {activeTab === "flags" && (
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              
              {/* Header with Switcher */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">App Features Toggle Panel</h3>
                    <p className="text-slate-400 text-xs">Enable or disable core customer features and individual service routes in real-time.</p>
                  </div>
                </div>

                {/* View switcher buttons */}
                <div className="flex items-center bg-slate-900/60 p-1 rounded-xl border border-white/[0.04] self-start md:self-auto shadow-inner">
                  {(["list", "tiles", "medium", "large"] as const).map((view) => (
                    <button
                      key={view}
                      onClick={() => setViewOption(view)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 capitalize cursor-pointer ${
                        viewOption === view
                          ? "bg-indigo-600 text-white shadow"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                      }`}
                    >
                      {view}
                    </button>
                  ))}
                </div>
              </div>

              {loadingFlags && flags.length === 0 ? (
                <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-3">
                  <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading system flags...</span>
                </div>
              ) : (
                <div className="space-y-8 animate-fadeIn">

                  {/* ========================================================================= */}
                  {/* VIEW OPTION: LIST (Detailed list of all flags)                            */}
                  {/* ========================================================================= */}
                  {viewOption === "list" && (
                    <div className="space-y-6">
                      <h4 className="text-xs font-black text-indigo-400/90 uppercase tracking-wider">All Flags List</h4>
                      <div className="divide-y divide-slate-800/60 border border-white/[0.03] rounded-2xl bg-slate-950/20 px-6 py-2 shadow-inner">
                        {flags.filter(f => !f.key.startsWith("sandbox-")).map((flag) => (
                          <div key={flag.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 group">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 border border-indigo-800/40 rounded-lg">
                                  {flag.key}
                                </span>
                                <span className={`inline-flex h-1.5 w-1.5 rounded-full ${flag.isEnabled ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-rose-500 shadow-[0_0_8px_#f43f5e]"}`}></span>
                              </div>
                              <p className="text-slate-400 text-xs mt-2 font-medium">{flag.description}</p>
                            </div>

                            <div className="shrink-0 flex items-center justify-between sm:justify-end gap-4">
                              <span className={`text-[10px] font-black uppercase tracking-wider ${flag.isEnabled ? "text-emerald-400" : "text-rose-400"}`}>
                                {flag.isEnabled ? "ON (ACTIVE)" : "OFF (OFFLINE)"}
                              </span>
                              
                              <button 
                                onClick={() => handleToggleFlag(flag.id, flag.isEnabled)}
                                className={`relative inline-flex h-5.5 w-10.5 shrink-0 cursor-pointer rounded-full border border-white/[0.08] transition-all duration-350 ease-in-out focus:outline-none ${
                                  flag.isEnabled 
                                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 shadow-[0_0_10px_rgba(229,169,60,0.3)]" 
                                    : "bg-slate-900 shadow-inner"
                                }`}
                              >
                                <span 
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.4)] ring-0 transition duration-305 ease-in-out mt-0.5 ${
                                    flag.isEnabled ? "translate-x-5.5" : "translate-x-0.5"
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ========================================================================= */}
                  {/* VIEW OPTION: TILES (Very compact grid view)                              */}
                  {/* ========================================================================= */}
                  {viewOption === "tiles" && (
                    <div className="space-y-8">
                      <div>
                        <h4 className="text-xs font-black text-indigo-400/90 mb-4 uppercase tracking-wider">Global Core Features</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {flags.filter(f => !f.key.startsWith("sandbox-") && !f.key.startsWith("service-") && !f.key.startsWith("visibility-")).map((flag) => (
                            <div key={flag.id} className="bg-slate-950/20 border border-white/[0.03] rounded-xl p-4 flex items-center justify-between shadow-inner">
                              <div className="min-w-0 flex-1">
                                <span className="font-mono text-xs font-bold text-indigo-400 block truncate">{flag.key}</span>
                                <p className="text-slate-400 text-xs mt-1 truncate">{flag.description}</p>
                              </div>
                              <button 
                                onClick={() => handleToggleFlag(flag.id, flag.isEnabled)}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-white/[0.08] transition-all duration-300 focus:outline-none ${
                                  flag.isEnabled ? "bg-indigo-600" : "bg-slate-900"
                                }`}
                              >
                                <span className={`pointer-events-none inline-block h-3.8 w-3.8 transform rounded-full bg-white transition duration-300 mt-0.5 ${flag.isEnabled ? "translate-x-4.5" : "translate-x-0.5"}`} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {renderIndividualServiceSettings()}
                    </div>
                  )}

                  {/* ========================================================================= */}
                  {/* VIEW OPTION: MEDIUM (Clean, simplified grid cards)                      */}
                  {/* ========================================================================= */}
                  {viewOption === "medium" && (
                    <div className="space-y-8">
                      <div>
                        <h4 className="text-xs font-black text-indigo-400/90 mb-4 uppercase tracking-wider">Global Core Features</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {flags.filter(f => !f.key.startsWith("sandbox-") && !f.key.startsWith("service-") && !f.key.startsWith("visibility-")).map((flag) => (
                            <div key={flag.id} className="bg-slate-950/20 border border-white/[0.03] rounded-xl p-4 flex items-center justify-between shadow-inner">
                              <div className="min-w-0 flex-1">
                                <span className="font-mono text-xs font-bold text-indigo-400 block truncate">{flag.key}</span>
                                <p className="text-slate-400 text-xs mt-1 truncate">{flag.description}</p>
                              </div>
                              <button 
                                onClick={() => handleToggleFlag(flag.id, flag.isEnabled)}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-white/[0.08] transition-all duration-300 focus:outline-none ${
                                  flag.isEnabled ? "bg-indigo-650" : "bg-slate-900"
                                }`}
                              >
                                <span className={`pointer-events-none inline-block h-3.8 w-3.8 transform rounded-full bg-white transition duration-300 mt-0.5 ${flag.isEnabled ? "translate-x-4.5" : "translate-x-0.5"}`} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {renderIndividualServiceSettings()}
                    </div>
                  )}

                  {/* ========================================================================= */}
                  {/* VIEW OPTION: LARGE (Detailed 3-column cards grid view)                   */}
                  {/* ========================================================================= */}
                  {viewOption === "large" && (
                    <div className="space-y-8">
                      {/* Global Core Features */}
                      <div>
                        <h4 className="text-xs font-black text-indigo-400/90 mb-4 uppercase tracking-wider">Global Core Features</h4>
                        <div className="divide-y divide-slate-800/60">
                          {flags.filter(f => !f.key.startsWith("sandbox-") && !f.key.startsWith("service-") && !f.key.startsWith("visibility-")).map((flag) => (
                            <div key={flag.id} className="py-5 flex items-center justify-between gap-4 group">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/60 px-2.5 py-1 border border-indigo-800/40 rounded-lg">
                                    {flag.key}
                                  </span>
                                  <span className={`inline-flex h-2 w-2 rounded-full ${flag.isEnabled ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-rose-500 shadow-[0_0_8px_#f43f5e]"}`}></span>
                                </div>
                                <p className="text-slate-400 text-sm mt-3 font-medium leading-relaxed">{flag.description}</p>
                              </div>

                              <div className="shrink-0 flex items-center gap-4">
                                <span className={`text-xs font-extrabold uppercase tracking-wider ${flag.isEnabled ? "text-emerald-400" : "text-rose-400"}`}>
                                  {flag.isEnabled ? "ACTIVE" : "DISABLED"}
                                </span>
                                
                                <button 
                                  onClick={() => handleToggleFlag(flag.id, flag.isEnabled)}
                                  className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border border-white/[0.08] transition-all duration-300 ease-in-out focus:outline-none ${
                                    flag.isEnabled 
                                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 shadow-[0_0_12px_rgba(229,169,60,0.4)]" 
                                      : "bg-slate-900 shadow-inner"
                                  }`}
                                >
                                  <span 
                                    className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.4)] ring-0 transition duration-300 ease-in-out mt-0.5 ${
                                      flag.isEnabled ? "translate-x-6" : "translate-x-0.5"
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {renderIndividualServiceSettings()}
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. SYSTEM SETTINGS & GATEWAYS TAB */}
        {activeTab === "settings" && (
          <div className="space-y-8">
            {/* Gateways Grid */}
            <div className="glass-panel rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Third-Party Gateway Sandboxes</h3>
                  <p className="text-slate-400 text-sm">Configure simulator behavior for integration testing. Toggle 'Offline' to simulate third-party downtime or network outages.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {flags.filter(f => f.key.startsWith("sandbox-")).map((flag) => {
                  let providerName = "Gateway";
                  let description = flag.description;
                  if (flag.key.includes("smileid")) {
                    providerName = "Smile ID (KYC Verification)";
                  } else if (flag.key.includes("flutterwave")) {
                    providerName = "Flutterwave (Transfers & Payouts)";
                  } else if (flag.key.includes("stripe")) {
                    providerName = "Stripe Issuing (Virtual Cards)";
                  } else if (flag.key.includes("paystack")) {
                    providerName = "Paystack (Payments & Collections)";
                  }

                  return (
                    <div key={flag.id} className="bg-slate-950/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition duration-200">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-white text-sm tracking-tight">{providerName}</h4>
                          <span className={`h-2.5 w-2.5 rounded-full led-pulse ${flag.isEnabled ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-rose-500 shadow-[0_0_8px_#f43f5e]"}`}></span>
                        </div>
                        <p className="text-slate-400 text-xs mt-2 leading-relaxed font-medium">{description}</p>
                      </div>

                      <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/[0.04]">
                        <span className={`text-xs font-black tracking-wider uppercase ${flag.isEnabled ? "text-emerald-400" : "text-rose-400"}`}>
                          {flag.isEnabled ? "ONLINE (SUCCESS)" : "OFFLINE (OUTAGE)"}
                        </span>

                        <button 
                          onClick={() => handleToggleFlag(flag.id, flag.isEnabled)}
                          className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border border-white/[0.08] transition-all duration-300 ease-in-out focus:outline-none ${
                            flag.isEnabled 
                              ? "bg-gradient-to-r from-emerald-650 to-teal-650 shadow-[0_0_12px_rgba(16,185,129,0.4)]" 
                              : "bg-slate-900 shadow-inner"
                          }`}
                        >
                          <span 
                            className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.4)] ring-0 transition duration-300 ease-in-out mt-0.5 ${
                              flag.isEnabled ? "translate-x-6" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form layout grid: Gateway credentials and Broadcast notifications side-by-side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Gateway API Credentials Form */}
              <div className="lg:col-span-2 glass-panel rounded-2xl p-6 shadow-xl relative overflow-hidden border-t-2 border-indigo-500/30">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500"></div>
              
              <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-[280px] flex-1">
                  <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Third-Party Gateway API Credentials</h3>
                    <p className="text-slate-400 text-sm">Enter your API keys to integrate and connect the actual production environments of Paystack, Flutterwave, Stripe, Smile ID, Sudo Africa, and Bridgecard.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDocs(true)}
                  className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/20 rounded-xl text-xs transition duration-200 cursor-pointer flex items-center gap-2 animate-pulse"
                >
                  <Activity className="h-4 w-4 shrink-0" />
                  <span>Integration Guide</span>
                </button>
              </div>

              <form onSubmit={handleSaveKeys} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Paystack Panel */}
                  <div className="bg-slate-950/30 border border-white/[0.03] p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider border-b border-white/[0.04] pb-2">Paystack Integration</h4>
                    <div>
                      <label className="block text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">Public Key</label>
                      <input 
                        type="text"
                        className="w-full px-4.5 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white text-xs font-mono placeholder-slate-655 focus:outline-none focus:border-indigo-500 transition shadow-inner"
                        placeholder="pk_test_..."
                        value={paystackPublicKey}
                        onChange={(e) => setPaystackPublicKey(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">Secret Key</label>
                      <input 
                        type="text"
                        className="w-full px-4.5 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white text-xs font-mono placeholder-slate-655 focus:outline-none focus:border-indigo-500 transition shadow-inner"
                        placeholder="sk_test_..."
                        value={paystackSecretKey}
                        onChange={(e) => setPaystackSecretKey(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Flutterwave Panel */}
                  <div className="bg-slate-950/30 border border-white/[0.03] p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider border-b border-white/[0.04] pb-2">Flutterwave Integration</h4>
                    <div>
                      <label className="block text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">Public Key</label>
                      <input 
                        type="text"
                        className="w-full px-4.5 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white text-xs font-mono placeholder-slate-655 focus:outline-none focus:border-indigo-505 transition shadow-inner"
                        placeholder="FLWPUBK_TEST-..."
                        value={flutterwavePublicKey}
                        onChange={(e) => setFlutterwavePublicKey(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">Secret Key</label>
                      <input 
                        type="text"
                        className="w-full px-4.5 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white text-xs font-mono placeholder-slate-655 focus:outline-none focus:border-indigo-505 transition shadow-inner"
                        placeholder="FLWSECK_TEST-..."
                        value={flutterwaveSecretKey}
                        onChange={(e) => setFlutterwaveSecretKey(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Stripe Panel */}
                  <div className="bg-slate-950/30 border border-white/[0.03] p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider border-b border-white/[0.04] pb-2">Stripe Issuing</h4>
                    <div>
                      <label className="block text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">Secret Key</label>
                      <input 
                        type="text"
                        className="w-full px-4.5 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white text-xs font-mono placeholder-slate-655 focus:outline-none focus:border-indigo-505 transition shadow-inner"
                        placeholder="sk_test_..."
                        value={stripeSecretKey}
                        onChange={(e) => setStripeSecretKey(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Smile ID Panel */}
                  <div className="bg-slate-950/30 border border-white/[0.03] p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider border-b border-white/[0.04] pb-2">Smile ID (KYC)</h4>
                    <div>
                      <label className="block text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">API Key</label>
                      <input 
                        type="text"
                        className="w-full px-4.5 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white text-xs font-mono placeholder-slate-655 focus:outline-none focus:border-indigo-505 transition shadow-inner"
                        placeholder="Enter API Key"
                        value={smileIdApiKey}
                        onChange={(e) => setSmileIdApiKey(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Sudo Africa Panel */}
                  <div className="bg-slate-950/30 border border-white/[0.03] p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider border-b border-white/[0.04] pb-2">Sudo Africa (Cards)</h4>
                    <div>
                      <label className="block text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">API Key</label>
                      <input 
                        type="text"
                        className="w-full px-4.5 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white text-xs font-mono placeholder-slate-655 focus:outline-none focus:border-indigo-505 transition shadow-inner"
                        placeholder="sudo_live_..."
                        value={sudoApiKey}
                        onChange={(e) => setSudoApiKey(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Bridgecard Panel */}
                  <div className="bg-slate-950/30 border border-white/[0.03] p-5 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black text-indigo-400 uppercase tracking-wider border-b border-white/[0.04] pb-2">Bridgecard (Cards)</h4>
                    <div>
                      <label className="block text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">API Key / Token</label>
                      <input 
                        type="text"
                        className="w-full px-4.5 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white text-xs font-mono placeholder-slate-655 focus:outline-none focus:border-indigo-505 transition shadow-inner"
                        placeholder="bridge_live_..."
                        value={bridgecardApiKey}
                        onChange={(e) => setBridgecardApiKey(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {keysSuccess && (
                  <div className="bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-sm p-4 rounded-xl flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                    <span>{keysSuccess}</span>
                  </div>
                )}

                {keysError && (
                  <div className="bg-rose-950/30 border border-rose-500/30 text-rose-200 text-sm p-4 rounded-xl flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-rose-400 shrink-0" />
                    <span>{keysError}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={savingKeys}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition duration-300 active:scale-[0.98] shadow-md shadow-indigo-950/30 cursor-pointer"
                >
                  {savingKeys ? "Saving Credentials..." : "Save & Update Credentials"}
                </button>
              </form>
            </div>

            {/* Broadcast Form */}
            <div className="lg:col-span-1 glass-panel rounded-2xl p-6 shadow-xl relative overflow-hidden border-t-2 border-indigo-500/30">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Broadcast System Notifications</h3>
                  <p className="text-slate-400 text-sm font-medium">Send a real-time system announcement to all users' notification centers.</p>
                </div>
              </div>

              <form onSubmit={handleBroadcast} className="space-y-5">
                <div>
                  <label className="block text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Notification Title</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 transition duration-200 shadow-inner"
                    placeholder="e.g., Scheduled Maintenance"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Notification Message</label>
                  <textarea 
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 transition duration-200 shadow-inner resize-none"
                    placeholder="e.g., Novamoni services will be undergoing scheduled maintenance from 2 AM to 4 AM WAT. Transacting might be temporarily affected."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    required
                  />
                </div>

                {broadcastSuccess && (
                  <div className="bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-sm p-4 rounded-xl flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                    <span>{broadcastSuccess}</span>
                  </div>
                )}

                {broadcastError && (
                  <div className="bg-rose-950/30 border border-rose-500/30 text-rose-200 text-sm p-4 rounded-xl flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-rose-400 shrink-0" />
                    <span>{broadcastError}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={sendingBroadcast}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition duration-300 active:scale-[0.98] shadow-md shadow-indigo-950/30 cursor-pointer"
                >
                  {sendingBroadcast ? "Sending Announcement..." : "Broadcast Alert"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

        {/* HELP & SUPPORT SETTINGS TAB */}
        {activeTab === "support" && (
          <div className="space-y-8">
            <div className="glass-panel rounded-2xl p-6 shadow-xl relative overflow-hidden max-w-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                  <HelpCircle className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Help & Support Settings</h3>
                  <p className="text-slate-400 text-sm font-medium">Update the support details and external contact links visible to mobile users.</p>
                </div>
              </div>

              <form onSubmit={handleSaveSupportSettings} className="space-y-5">
                <div>
                  <label className="block text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Support Email</label>
                  <input 
                    type="email"
                    className="w-full px-4 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 transition duration-200 shadow-inner"
                    placeholder="support@novamoni.ng"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-black uppercase tracking-wider mb-2">WhatsApp Contact URL</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 transition duration-200 shadow-inner"
                    placeholder="https://wa.me/2348000000000"
                    value={supportWhatsapp}
                    onChange={(e) => setSupportWhatsapp(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Live Chat Widget / Link URL</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 transition duration-200 shadow-inner"
                    placeholder="https://example.com/live-chat"
                    value={supportLiveChatUrl}
                    onChange={(e) => setSupportLiveChatUrl(e.target.value)}
                    required
                  />
                </div>

                {supportSuccess && (
                  <div className="bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-sm p-4 rounded-xl flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                    <span>{supportSuccess}</span>
                  </div>
                )}

                {supportError && (
                  <div className="bg-rose-950/30 border border-rose-500/30 text-rose-200 text-sm p-4 rounded-xl flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-rose-400 shrink-0" />
                    <span>{supportError}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={savingSupport}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition duration-300 active:scale-[0.98] shadow-md shadow-indigo-950/30 cursor-pointer"
                >
                  {savingSupport ? "Saving..." : "Save Support Details"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 5. PROMOTIONS & BANNERS TAB */}
        {activeTab === "banners" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* CREATE BANNER FORM */}
              <div className="glass-panel rounded-2xl p-6 shadow-xl relative overflow-hidden h-fit border-t-2 border-indigo-500/30">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500"></div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Create Promotion Banner</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Publish a new promotional banner or in-app advertisement.</p>
                  </div>
                </div>

                <form onSubmit={handleCreateBanner} className="space-y-4">
                  <div>
                    <label className="block text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Banner Title *</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 transition duration-200 shadow-inner"
                      placeholder="e.g., Get 10% Cashback on Airtime!"
                      value={newBannerTitle}
                      onChange={(e) => setNewBannerTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Description / Subtitle</label>
                    <textarea 
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/10 transition duration-200 shadow-inner resize-none"
                      placeholder="e.g., Purchase airtime this week and get instant cashback."
                      value={newBannerDesc}
                      onChange={(e) => setNewBannerDesc(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Image URL</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white text-xs font-mono placeholder-slate-655 focus:outline-none focus:border-indigo-505 transition shadow-inner"
                      placeholder="e.g., https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=800"
                      value={newBannerImage}
                      onChange={(e) => setNewBannerImage(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Action / Link URL</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white text-xs font-mono placeholder-slate-655 focus:outline-none focus:border-indigo-505 transition shadow-inner"
                      placeholder="e.g., novamoni://airtime"
                      value={newBannerLink}
                      onChange={(e) => setNewBannerLink(e.target.value)}
                    />
                  </div>

                  {bannerSuccess && (
                    <div className="bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs p-3.5 rounded-xl flex items-center gap-2">
                      <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                      <span>{bannerSuccess}</span>
                    </div>
                  )}

                  {bannerError && (
                    <div className="bg-rose-950/30 border border-rose-500/30 text-rose-200 text-xs p-3.5 rounded-xl flex items-center gap-2">
                      <XCircle className="h-4.5 w-4.5 text-rose-400 shrink-0" />
                      <span>{bannerError}</span>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={savingBanner}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition duration-300 active:scale-[0.98] shadow-md shadow-indigo-950/30 cursor-pointer"
                  >
                    {savingBanner ? "Publishing..." : "Publish Banner"}
                  </button>
                </form>
              </div>

              {/* BANNERS LISTING */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-indigo-400" />
                    <span>Active & Inactive Banners ({banners.length})</span>
                  </h3>
                </div>

                {loadingBanners && banners.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-3 glass-panel rounded-2xl">
                    <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading banners...</span>
                  </div>
                ) : banners.length === 0 ? (
                  <div className="glass-panel rounded-2xl p-12 text-center text-slate-500 font-medium">
                    <Megaphone className="h-12 w-12 mx-auto text-slate-600 mb-4 animate-pulse" />
                    <p>No banners or promotional advertisements created yet.</p>
                    <p className="text-xs text-slate-600 mt-1">Use the form on the left to add one.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {banners.map((banner) => (
                      <div key={banner.id} className="glass-panel rounded-2xl overflow-hidden shadow-lg relative flex flex-col justify-between group hover:border-white/[0.08] transition duration-300">
                        {/* Banner Image Preview / Placeholder */}
                        <div className="h-32 w-full bg-slate-950/80 relative flex items-center justify-center overflow-hidden border-b border-white/[0.04]">
                          {banner.imageUrl ? (
                            <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" onError={(e) => { (e.target as any).style.display = 'none'; }} />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-slate-950 flex items-center justify-center">
                              <Megaphone className="h-10 w-10 text-indigo-500/40" />
                            </div>
                          )}
                          <span className={`absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            banner.isActive 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                              : "bg-slate-900/60 text-slate-500 border-white/[0.04]"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${banner.isActive ? "bg-emerald-400 led-pulse" : "bg-slate-500"}`}></span>
                            <span>{banner.isActive ? "Active" : "Inactive"}</span>
                          </span>
                        </div>

                        {/* Banner Info */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-white text-base tracking-tight line-clamp-1">{banner.title}</h4>
                            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed font-medium line-clamp-2">{banner.description || "No description provided."}</p>
                            
                            {banner.linkUrl && (
                              <div className="mt-3 flex items-center gap-1 text-[10px] font-mono text-indigo-400 bg-indigo-950/40 border border-indigo-900/30 px-2 py-1 rounded w-fit">
                                <span className="text-slate-500">Action:</span>
                                <span className="truncate max-w-[180px]">{banner.linkUrl}</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/[0.04]">
                            <button
                              onClick={() => handleDeleteBanner(banner.id)}
                              className="text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg border border-transparent hover:border-rose-500/25 transition duration-200 cursor-pointer"
                            >
                              Delete
                            </button>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Show in App</span>
                              <button 
                                onClick={() => handleToggleBanner(banner.id, banner.isActive)}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-white/[0.08] transition-all duration-300 ease-in-out focus:outline-none ${
                                  banner.isActive 
                                    ? "bg-gradient-to-r from-emerald-650 to-teal-650 shadow-[0_0_8px_rgba(16,185,129,0.25)]" 
                                    : "bg-slate-900 shadow-inner"
                                }`}
                              >
                                <span 
                                  className={`pointer-events-none inline-block h-3.8 w-3.8 transform rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.4)] ring-0 transition duration-300 ease-in-out mt-0.5 ${
                                    banner.isActive ? "translate-x-4.5" : "translate-x-0.5"
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}

              </div>

            </div>
          </div>
        )}

        {/* 6. TRANSACTION FEE RULES TAB */}
        {activeTab === "fees" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* CREATE/EDIT FEE RULE FORM */}
              <div className="glass-panel rounded-2xl p-6 shadow-xl relative overflow-hidden h-fit border-t-2 border-indigo-500/30">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500"></div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {editingRuleId ? "Edit Fee Rule" : "Create Fee Rule"}
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">Configure transaction fees applied during routing.</p>
                  </div>
                </div>

                <form onSubmit={handleSaveFeeRule} className="space-y-4">
                  <div>
                    <label className="block text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Transaction Type</label>
                    <select
                      className="w-full px-4 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition shadow-inner cursor-pointer"
                      value={ruleTxnType}
                      onChange={(e) => setRuleTxnType(e.target.value)}
                    >
                      <option value="transfer">Transfer (EasyPay Payout)</option>
                      <option value="airtime">Airtime Purchase</option>
                      <option value="bills">Bill Payments</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs font-black uppercase tracking-wider mb-2">Fee Type</label>
                    <select
                      className="w-full px-4 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition shadow-inner cursor-pointer"
                      value={ruleFeeType}
                      onChange={(e) => setRuleFeeType(e.target.value)}
                    >
                      <option value="fixed">Fixed Flat Rate (₦)</option>
                      <option value="percentage">Percentage-Based (%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs font-black uppercase tracking-wider mb-2 font-semibold">
                      Fee Value {ruleFeeType === "percentage" ? "(e.g., 0.015 for 1.5%)" : "(e.g., 50 for ₦50)"}
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      className="w-full px-4 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition shadow-inner font-mono"
                      placeholder={ruleFeeType === "percentage" ? "0.015" : "10"}
                      value={ruleValue}
                      onChange={(e) => setRuleValue(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">Min Trxn Amount</label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition shadow-inner font-mono"
                        placeholder="0"
                        value={ruleMinAmount}
                        onChange={(e) => setRuleMinAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">Max Trxn Amount</label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition shadow-inner font-mono"
                        placeholder="Unlimited"
                        value={ruleMaxAmount}
                        onChange={(e) => setRuleMaxAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="ruleIsActive"
                      checked={ruleIsActive}
                      onChange={(e) => setRuleIsActive(e.target.checked)}
                      className="rounded bg-slate-950 border-white/[0.06] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="ruleIsActive" className="text-xs text-slate-350 font-bold uppercase tracking-wider cursor-pointer select-none">
                      Rule is Active
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    {editingRuleId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRuleId(null);
                          setRuleValue("");
                          setRuleMinAmount("");
                          setRuleMaxAmount("");
                        }}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition duration-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl text-xs transition duration-200 shadow-md cursor-pointer"
                    >
                      {editingRuleId ? "Save Changes" : "Create Rule"}
                    </button>
                  </div>
                </form>
              </div>

              {/* FEE RULES LISTING */}
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-white/[0.03]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800/85 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-950/20">
                          <th className="py-4 px-6">Transaction Type</th>
                          <th className="py-4 px-6">Fee Model</th>
                          <th className="py-4 px-6">Value</th>
                          <th className="py-4 px-6">Trxn Limits</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 text-sm">
                        {loadingFees && feeRules.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-slate-400">Loading fee rules...</td>
                          </tr>
                        ) : feeRules.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-slate-500">No active fee rules configured. Default is ₦0.00 fee.</td>
                          </tr>
                        ) : (
                          feeRules.map((rule) => (
                            <tr key={rule.id} className="hover:bg-slate-800/10 transition">
                              <td className="py-4 px-6 font-bold text-white capitalize">{rule.transactionType}</td>
                              <td className="py-4 px-6 font-semibold text-slate-300 capitalize">{rule.feeType}</td>
                              <td className="py-4 px-6 font-mono font-bold text-indigo-400">
                                {rule.feeType === "percentage" 
                                  ? `${(parseFloat(rule.value) * 100).toFixed(2)}%` 
                                  : formatNaira(parseFloat(rule.value))}
                              </td>
                              <td className="py-4 px-6 font-mono text-slate-400 text-xs">
                                ₦{parseFloat(rule.minAmount)} - {rule.maxAmount ? `₦${parseFloat(rule.maxAmount)}` : "∞"}
                              </td>
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  rule.isActive 
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                    : "bg-slate-800 text-slate-500 border-slate-700"
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${rule.isActive ? "bg-emerald-400 led-pulse" : "bg-slate-500"}`}></span>
                                  {rule.isActive ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingRuleId(rule.id);
                                    setRuleTxnType(rule.transactionType);
                                    setRuleFeeType(rule.feeType);
                                    setRuleValue(rule.value);
                                    setRuleMinAmount(rule.minAmount);
                                    setRuleMaxAmount(rule.maxAmount || "");
                                    setRuleIsActive(rule.isActive);
                                  }}
                                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteFeeRule(rule.id)}
                                  className="text-xs text-rose-450 hover:text-rose-350 font-bold cursor-pointer"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. NIBSS RECONCILIATION TAB */}
        {activeTab === "reconciliation" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* UPLOAD FORM */}
              <div className="glass-panel rounded-2xl p-6 shadow-xl relative overflow-hidden h-fit border-t-2 border-indigo-500/30">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500"></div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Upload NIBSS Settlement File</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Upload daily bank transaction logs (CSV format) to run reconciliation checks.</p>
                  </div>
                </div>

                <form onSubmit={handleUploadReconciliation} className="space-y-5">
                  <div className="border-2 border-dashed border-white/[0.08] rounded-xl p-6 text-center bg-slate-950/20 hover:border-indigo-500/40 transition">
                    <input
                      type="file"
                      accept=".csv"
                      id="reconcileFile"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="hidden"
                      required
                    />
                    <label htmlFor="reconcileFile" className="cursor-pointer block space-y-2">
                      <div className="text-indigo-455 font-bold text-sm">
                        {csvFile ? csvFile.name : "Select daily settlement CSV"}
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">CSV must have 'Reference' and 'Amount' headers</p>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={reconciling || !csvFile}
                    className="w-full py-3 bg-gradient-to-r from-indigo-650 to-violet-650 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition duration-200 cursor-pointer"
                  >
                    {reconciling ? "Running Reconciliation..." : "Upload & Reconcile"}
                  </button>
                </form>
              </div>

              {/* PAST RECONCILIATION RUNS */}
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-panel rounded-2xl p-6 shadow-xl relative border border-white/[0.03]">
                  <h3 className="text-lg font-bold text-white mb-4">Reconciliation Logs History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase font-bold bg-slate-950/20">
                          <th className="py-4 px-6">Run Date</th>
                          <th className="py-4 px-6">File Name</th>
                          <th className="py-4 px-6">Total</th>
                          <th className="py-4 px-6">Matched</th>
                          <th className="py-4 px-6">Unmatched</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {loadingReconciliation && reconciliationRuns.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-6 text-slate-400">Loading reconciliation logs...</td>
                          </tr>
                        ) : reconciliationRuns.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-6 text-slate-500 font-medium">No reconciliation runs recorded yet. Upload a CSV on the left.</td>
                          </tr>
                        ) : (
                          reconciliationRuns.map((run) => (
                            <tr key={run.id} className="hover:bg-slate-850/10">
                              <td className="py-3.5 px-6 font-medium text-white">
                                {new Date(run.createdAt).toLocaleString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </td>
                              <td className="py-3.5 px-6 text-slate-300 font-mono text-xs">{run.fileName}</td>
                              <td className="py-3.5 px-6 font-mono font-semibold">{run.totalTransactions}</td>
                              <td className="py-3.5 px-6 font-mono text-emerald-400 font-bold">{run.matchedCount}</td>
                              <td className="py-3.5 px-6 font-mono text-rose-455 font-bold">{run.unmatchedCount}</td>
                              <td className="py-3.5 px-6">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  run.status === "balanced" 
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                }`}>
                                  {run.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-3.5 px-6 text-right">
                                <button
                                  onClick={() => fetchReconciliationDetails(run.id)}
                                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                                >
                                  Inspect
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* RUN DISCREPANCY RESULTS DETAILED INSPECTOR */}
                {selectedRun && (
                  <div className="glass-panel rounded-2xl p-6 shadow-xl relative border border-rose-500/10 bg-slate-900/60 animate-fadeIn border-t-2">
                    <div className="flex items-center justify-between border-b border-white/[0.04] pb-4 mb-4">
                      <div>
                        <h4 className="font-bold text-white text-base">Reconciliation Inspector details</h4>
                        <span className="text-slate-500 text-xs font-mono">File: {selectedRun.run.fileName}</span>
                      </div>
                      <button
                        onClick={() => setSelectedRun(null)}
                        className="text-slate-400 hover:text-white text-xs font-bold bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg cursor-pointer"
                      >
                        Close Inspector
                      </button>
                    </div>

                    <div className="overflow-x-auto max-h-80">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-550 uppercase font-black tracking-wider bg-slate-950/20">
                            <th className="py-3 px-4">Txn Reference</th>
                            <th className="py-3 px-4">Ledger Amt</th>
                            <th className="py-3 px-4">NIBSS Amt</th>
                            <th className="py-3 px-4">Ledger Status</th>
                            <th className="py-3 px-4">NIBSS Status</th>
                            <th className="py-3 px-4">Comparison Result</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 font-mono">
                          {selectedRun.logs.map((log: any) => (
                            <tr key={log.id} className="hover:bg-white/[0.01]">
                              <td className="py-3 px-4 text-slate-200">{log.transactionReference}</td>
                              <td className="py-3 px-4 text-slate-350">₦{parseFloat(log.amountInternal || "0")}</td>
                              <td className="py-3 px-4 text-slate-355">₦{parseFloat(log.amountNibss || "0")}</td>
                              <td className="py-3 px-4 capitalize text-slate-400">{log.statusInternal || "N/A"}</td>
                              <td className="py-3 px-4 capitalize text-slate-400">{log.statusNibss || "N/A"}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  log.comparisonResult === "matched" 
                                    ? "text-emerald-400 bg-emerald-500/5 border border-emerald-500/10" 
                                    : log.comparisonResult === "amount_mismatch" || log.comparisonResult === "status_mismatch"
                                    ? "text-amber-400 bg-amber-500/5 border border-amber-500/10"
                                    : "text-rose-450 bg-rose-500/5 border border-rose-500/10"
                                }`}>
                                  {log.comparisonResult.replace(/_/g, " ").toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 8. ADMINISTRATIVE AUDIT TRAIL TAB */}
        {activeTab === "audit" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="glass-panel rounded-2xl p-6 shadow-xl relative border border-white/[0.03]">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-400 animate-pulse" />
                <span>Security Audit Log History</span>
              </h3>
              <p className="text-slate-400 text-xs mb-6 font-medium">Complete audit trace of operations performed by control center administrators.</p>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase font-bold bg-slate-950/20">
                      <th className="py-4 px-6">Timestamp</th>
                      <th className="py-4 px-6">Admin ID</th>
                      <th className="py-4 px-6">Action Type</th>
                      <th className="py-4 px-6">IP Address</th>
                      <th className="py-4 px-6">Target Resource</th>
                      <th className="py-4 px-6">Audit Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-xs">
                    {loadingAudits && auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-400">Loading audit records...</td>
                      </tr>
                    ) : auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-500">No admin operations audited yet.</td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => {
                        let badgeColor = "bg-slate-800 text-slate-400 border-slate-700";
                        if (log.action.includes("reversal")) {
                          badgeColor = "bg-rose-500/10 text-rose-450 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.06)]";
                        } else if (log.action.includes("create") || log.action.includes("upload") || log.action.includes("run")) {
                          badgeColor = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                        } else if (log.action.includes("update") || log.action.includes("delete")) {
                          badgeColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                        }

                        return (
                          <tr key={log.id} className="hover:bg-slate-850/15 text-xs font-medium">
                            <td className="py-4.5 px-6 text-white font-mono shrink-0">
                              {new Date(log.createdAt).toLocaleString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </td>
                            <td className="py-4.5 px-6 font-mono text-slate-450">{log.adminId}</td>
                            <td className="py-4.5 px-6">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border tracking-wider uppercase ${badgeColor}`}>
                                {log.action.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="py-4.5 px-6 font-mono text-slate-450">{log.ipAddress || "127.0.0.1"}</td>
                            <td className="py-4.5 px-6 font-mono text-slate-300">
                              {log.targetType.toUpperCase()}:{log.targetId ? log.targetId.slice(0, 12) : "N/A"}
                            </td>
                            <td className="py-4.5 px-6 max-w-sm truncate text-slate-450 font-mono text-[10px]" title={log.details}>
                              {log.details}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 9. STAFF MEMBERS & ROLE PERMISSIONS TAB */}
        {activeTab === "staffs" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fadeIn">
            {/* Staff Members List */}
            <div className="lg:col-span-2 glass-panel rounded-2xl p-6 shadow-xl relative border border-white/[0.03] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-400" />
                    <span>Control Center Staff Members</span>
                  </h3>
                  <p className="text-slate-400 text-xs mt-1 font-medium">Manage team members, staff administrators, and their assigned permission roles.</p>
                </div>
              </div>

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase font-bold bg-slate-950/20">
                      <th className="py-4 px-6">Username</th>
                      <th className="py-4 px-6">Role Permission</th>
                      <th className="py-4 px-6">Created Date</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-xs">
                    {loadingStaffs && staffs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-slate-400">Loading staff records...</td>
                      </tr>
                    ) : staffs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-slate-500">No staff members configured.</td>
                      </tr>
                    ) : (
                      staffs.map((staff) => {
                        let roleBadge = "bg-slate-800 text-slate-300 border-slate-700";
                        if (staff.role === "superadmin") {
                          roleBadge = "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.06)]";
                        } else if (staff.role === "manager") {
                          roleBadge = "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
                        } else if (staff.role === "support") {
                          roleBadge = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                        } else if (staff.role === "compliance") {
                          roleBadge = "bg-teal-500/10 text-teal-400 border border-teal-500/20";
                        } else if (staff.role === "finance") {
                          roleBadge = "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
                        }

                        return (
                          <tr key={staff.id} className="hover:bg-slate-850/15 text-xs font-medium">
                            <td className="py-4.5 px-6 text-white font-bold font-mono">
                              {staff.username}
                            </td>
                            <td className="py-4.5 px-6">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border tracking-wider uppercase ${roleBadge}`}>
                                {staff.role}
                              </span>
                            </td>
                            <td className="py-4.5 px-6 text-slate-400">
                              {new Date(staff.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
                            </td>
                            <td className="py-4.5 px-6 text-right space-x-2">
                              <button 
                                onClick={() => {
                                  setEditingStaff(staff);
                                  setStaffUsername(staff.username);
                                  setStaffRole(staff.role);
                                  setStaffPassword("");
                                }}
                                className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-lg transition duration-200 cursor-pointer"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteStaff(staff.id)}
                                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold rounded-lg transition duration-200 cursor-pointer"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Staff Form */}
            <div className="glass-panel rounded-2xl p-6 shadow-xl relative border border-white/[0.03] space-y-5">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingStaff ? "Edit Staff Member" : "Add Staff Member"}
                </h3>
                <p className="text-slate-450 text-xs mt-1">Configure credentials and specific role scopes for backend access control.</p>
              </div>

              <form onSubmit={handleSaveStaff} className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">Username</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 transition shadow-inner"
                    placeholder="staff_username"
                    value={staffUsername}
                    onChange={(e) => setStaffUsername(e.target.value)}
                    required
                    disabled={!!editingStaff}
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">
                    Password {editingStaff && "(Leave blank to keep current)"}
                  </label>
                  <input 
                    type="password"
                    className="w-full px-4 py-3 bg-slate-950/60 border border-white/[0.06] rounded-xl text-white text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 transition shadow-inner"
                    placeholder="••••••••"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    required={!editingStaff}
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">Management Role</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-950 border border-white/[0.06] rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500/80 transition cursor-pointer"
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                  >
                    <option value="staff" className="bg-slate-950">Staff (Default)</option>
                    <option value="support" className="bg-slate-950">Support (KYC & Directory)</option>
                    <option value="compliance" className="bg-slate-950">Compliance (Audit logs & Banners)</option>
                    <option value="finance" className="bg-slate-950">Finance (Settlements & Fees)</option>
                    <option value="manager" className="bg-slate-950">Manager (Analytics & Systems)</option>
                    <option value="superadmin" className="bg-slate-950">Superadmin (All Privileges)</option>
                  </select>
                </div>

                {staffSuccess && (
                  <div className="bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs p-4.5 rounded-xl flex items-center gap-2">
                    <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                    <span>{staffSuccess}</span>
                  </div>
                )}

                {staffError && (
                  <div className="bg-rose-950/30 border border-rose-500/30 text-rose-200 text-xs p-4.5 rounded-xl flex items-center gap-2">
                    <XCircle className="h-4.5 w-4.5 text-rose-400 shrink-0" />
                    <span>{staffError}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button 
                    type="submit"
                    disabled={savingStaff}
                    className="flex-1 px-4 py-3 bg-indigo-650 hover:bg-indigo-555 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition duration-300 active:scale-[0.98] shadow-md shadow-indigo-950/30 cursor-pointer"
                  >
                    {savingStaff ? "Saving Staff..." : editingStaff ? "Update Staff" : "Add Staff"}
                  </button>

                  {editingStaff && (
                    <button 
                      type="button"
                      onClick={() => {
                        setEditingStaff(null);
                        setStaffUsername("");
                        setStaffPassword("");
                        setStaffRole("staff");
                      }}
                      className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition duration-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* DEVELOPER SETUP & INTEGRATION GUIDE MODAL */}
      {showDocs && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-all duration-300">
          <div className="bg-slate-900/95 border border-slate-800 rounded-3xl shadow-[0_0_60px_rgba(229,169,60,0.2)] w-full max-w-4xl overflow-hidden flex flex-col max-h-[85vh] relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

            {/* Modal Header */}
            <div className="p-6 border-b border-white/[0.04] flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                  <Activity className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Gateway Integration Developer Guides</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Step-by-step developer references to switch from local simulation to live webhooks and APIs.</p>
                </div>
              </div>
              <button
                onClick={() => setShowDocs(false)}
                className="text-slate-400 hover:text-white font-bold bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition duration-200 cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Tab Bar */}
            <div className="flex bg-slate-950/20 border-b border-white/[0.03] px-6 overflow-x-auto scrollbar-thin">
              {[
                { id: "paystack", name: "Paystack (Payments)" },
                { id: "flutterwave", name: "Flutterwave (Transfers)" },
                { id: "stripe", name: "Stripe (Virtual Cards)" },
                { id: "smileid", name: "Smile ID (KYC)" },
                { id: "sudo", name: "Sudo Africa (Cards)" },
                { id: "bridgecard", name: "Bridgecard (Cards)" }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveDocTab(t.id)}
                  className={`px-5 py-4 text-xs font-bold transition border-b-2 cursor-pointer shrink-0 ${
                    activeDocTab === t.id
                      ? "text-indigo-400 border-indigo-500 bg-white/[0.02]"
                      : "text-slate-500 border-transparent hover:text-slate-305"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm text-slate-300 leading-relaxed font-sans scrollbar-thin">
              
              {/* PAYSTACK GUIDE */}
              {activeDocTab === "paystack" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-base mb-1">
                    <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-800/40 rounded-lg text-xs font-mono">STEP 1</span>
                    <span>Set Up Environment Variables</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Add the API keys you provided in the credentials form to your system environment variables. In production, these should match the backend secret storage and Expo client runtime:
                  </p>
                  <pre className="bg-slate-950/70 p-4 rounded-xl border border-white/[0.04] text-xs font-mono text-slate-350 overflow-x-auto">
                    {PAYSTACK_ENV_SNIPPET}
                  </pre>

                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-base mt-6 mb-1">
                    <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-800/40 rounded-lg text-xs font-mono">STEP 2</span>
                    <span>Initialize Transaction (Backend API)</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    To initiate payments, create an endpoint at <code className="text-indigo-300 font-mono text-[11px] bg-slate-950/40 px-1 py-0.5 rounded border border-white/[0.04]">/api/paystack/initialize</code>. This contacts Paystack's endpoint to request checkout authorization.
                  </p>
                  <pre className="bg-slate-950/70 p-4 rounded-xl border border-white/[0.04] text-xs font-mono text-slate-355 overflow-x-auto max-h-[220px]">
                    {PAYSTACK_INIT_SNIPPET}
                  </pre>

                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-base mt-6 mb-1">
                    <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-800/40 rounded-lg text-xs font-mono">STEP 3</span>
                    <span>Listen to Paystack Webhook events</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Webhooks guarantee that wallets are credited even if the user drops off or closes their mobile application before redirecting back. We verify signature headers using the HMAC SHA512 hashing protocol.
                  </p>
                  <pre className="bg-slate-950/70 p-4 rounded-xl border border-white/[0.04] text-xs font-mono text-slate-355 overflow-x-auto max-h-[220px]">
                    {PAYSTACK_WEBHOOK_SNIPPET}
                  </pre>

                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-base mt-6 mb-1">
                    <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-800/40 rounded-lg text-xs font-mono">STEP 4</span>
                    <span>Initialize Checkout WebView on Mobile Client</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Embed the checkout URL returned from step 2 in your React Native WebView layer. Users can complete payments via Card, USSD, or Bank Transfer.
                  </p>
                  <pre className="bg-slate-950/70 p-4 rounded-xl border border-white/[0.04] text-xs font-mono text-slate-355 overflow-x-auto max-h-[220px]">
                    {PAYSTACK_MOBILE_SNIPPET}
                  </pre>
                </div>
              )}

              {/* FLUTTERWAVE GUIDE */}
              {activeDocTab === "flutterwave" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-base mb-1">
                    <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-800/40 rounded-lg text-xs font-mono">STEP 1</span>
                    <span>Environment Configuration</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Verify you have saved Flutterwave credentials in your admin dashboard. Use these variables in your services:
                  </p>
                  <pre className="bg-slate-950/70 p-4 rounded-xl border border-white/[0.04] text-xs font-mono text-slate-350 overflow-x-auto">
                    {FLUTTERWAVE_ENV_SNIPPET}
                  </pre>

                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-base mt-6 mb-1">
                    <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-800/40 rounded-lg text-xs font-mono">STEP 2</span>
                    <span>Initiate Standard Checkout Payment</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Call the Flutterwave standard payment API endpoint `https://api.flutterwave.com/v3/payments` to initialize the checkout session.
                  </p>
                  <pre className="bg-slate-950/70 p-4 rounded-xl border border-white/[0.04] text-xs font-mono text-slate-355 overflow-x-auto max-h-[220px]">
                    {FLUTTERWAVE_INIT_SNIPPET}
                  </pre>

                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-base mt-6 mb-1">
                    <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-800/40 rounded-lg text-xs font-mono">STEP 3</span>
                    <span>Verify Payment with Webhooks</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Receive real-time notifications on transaction success. Verify the request using the secret hash provided by Flutterwave configuration:
                  </p>
                  <pre className="bg-slate-950/70 p-4 rounded-xl border border-white/[0.04] text-xs font-mono text-slate-355 overflow-x-auto max-h-[220px]">
                    {FLUTTERWAVE_WEBHOOK_SNIPPET}
                  </pre>
                </div>
              )}

              {/* STRIPE ISSUING GUIDE */}
              {activeDocTab === "stripe" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-base mb-1">
                    <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-800/40 rounded-lg text-xs font-mono">STEP 1</span>
                    <span>Connect Stripe Secret Key</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Ensure the Stripe API key is added to the backend environment configurations.
                  </p>
                  <pre className="bg-slate-950/70 p-4 rounded-xl border border-white/[0.04] text-xs font-mono text-slate-350 overflow-x-auto">
                    {STRIPE_ENV_SNIPPET}
                  </pre>

                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-base mt-6 mb-1">
                    <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-800/40 rounded-lg text-xs font-mono">STEP 2</span>
                    <span>Implement Stripe Card Issuing Route</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Novamoni supports issuing physical or virtual cards using Stripe Issuing. The following route hooks into Stripe to create cards programmatically:
                  </p>
                  <pre className="bg-slate-950/70 p-4 rounded-xl border border-white/[0.04] text-xs font-mono text-slate-355 overflow-x-auto max-h-[220px]">
                    {STRIPE_CREATE_SNIPPET}
                  </pre>
                </div>
              )}

              {/* SMILE ID KYC GUIDE */}
              {activeDocTab === "smileid" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-base mb-1">
                    <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-800/40 rounded-lg text-xs font-mono">STEP 1</span>
                    <span>Connect API Key</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Smile ID facilitates KYC and identity verification. Configure your credentials inside the Settings dashboard to bind your partner accounts.
                  </p>
                  <pre className="bg-slate-950/70 p-4 rounded-xl border border-white/[0.04] text-xs font-mono text-slate-350 overflow-x-auto">
                    {SMILEID_ENV_SNIPPET}
                  </pre>

                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-base mt-6 mb-1">
                    <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-800/40 rounded-lg text-xs font-mono">STEP 2</span>
                    <span>Identity Verification Flow & Webhook</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Users upload selfie biometric logs and ID documents via the mobile client. Initialize a verification job on Smile ID and verify result callbacks to unlock full transactional permissions.
                  </p>
                  <pre className="bg-slate-950/70 p-4 rounded-xl border border-white/[0.04] text-xs font-mono text-slate-355 overflow-x-auto max-h-[220px]">
                    {SMILEID_WEBHOOK_SNIPPET}
                  </pre>
                </div>
              )}

              {/* SUDO AFRICA GUIDE */}
              {activeDocTab === "sudo" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-base mb-1">
                    <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-800/40 rounded-lg text-xs font-mono">STEP 1</span>
                    <span>Set up Sudo API Key</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Configure your Sudo Africa integration credentials under the settings tab. Get these keys from the Sudo Africa developer dashboard.
                  </p>
                  <pre className="bg-slate-950/70 p-4 rounded-xl border border-white/[0.04] text-xs font-mono text-slate-355 overflow-x-auto">
                    {SUDO_ENV_SNIPPET}
                  </pre>

                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-base mt-6 mb-1">
                    <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-800/40 rounded-lg text-xs font-mono">STEP 2</span>
                    <span>Issue Virtual or Physical Card</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Sudo Africa's card endpoint can generate active debit cards programmatically:
                  </p>
                  <pre className="bg-slate-950/70 p-4 rounded-xl border border-white/[0.04] text-xs font-mono text-slate-355 overflow-x-auto max-h-[220px]">
                    {SUDO_CREATE_SNIPPET}
                  </pre>
                </div>
              )}

              {/* BRIDGECARD GUIDE */}
              {activeDocTab === "bridgecard" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-base mb-1">
                    <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-800/40 rounded-lg text-xs font-mono">STEP 1</span>
                    <span>Set up Bridgecard API Key</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Set your Bridgecard API keys and token inside the settings dashboard to initiate live card programs.
                  </p>
                  <pre className="bg-slate-950/70 p-4 rounded-xl border border-white/[0.04] text-xs font-mono text-slate-355 overflow-x-auto">
                    {BRIDGECARD_ENV_SNIPPET}
                  </pre>

                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-base mt-6 mb-1">
                    <span className="px-2 py-0.5 bg-indigo-950 border border-indigo-800/40 rounded-lg text-xs font-mono">STEP 2</span>
                    <span>Issue Cards and Manage Wallets</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    Issue physical or virtual cards, map them to wallets, and authorize transactions in real-time:
                  </p>
                  <pre className="bg-slate-950/70 p-4 rounded-xl border border-white/[0.04] text-xs font-mono text-slate-355 overflow-x-auto max-h-[220px]">
                    {BRIDGECARD_CREATE_SNIPPET}
                  </pre>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950/40 border-t border-white/[0.04] flex justify-end">
              <button
                onClick={() => setShowDocs(false)}
                className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition duration-200 cursor-pointer"
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ============================================================================
// DEVELOPER SETUP & INTEGRATION SNIPPETS FOR THIRD-PARTY GATEWAYS
// ============================================================================

const PAYSTACK_ENV_SNIPPET = `# Backend API (.env)
PAYSTACK_SECRET_KEY=sk_live_xxxxxx...
PAYSTACK_PUBLIC_KEY=pk_live_xxxxxx...

# Mobile App Client (.env)
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxx...`;

const PAYSTACK_INIT_SNIPPET = `// Backend Route: /api/paystack/initialize
import { Router } from "express";
import fetch from "node-fetch";

const router = Router();

router.post("/paystack/initialize", async (req, res) => {
  const { amount, fromAccountId } = req.body;
  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: \`Bearer \${process.env.PAYSTACK_SECRET_KEY}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: req.userEmail, // retrieved from token middleware
        amount: Math.round(Number(amount) * 100), // convert Naira to kobo
        callback_url: "novamoni://payment-complete",
        metadata: { accountId: fromAccountId, userId: req.userId }
      })
    });
    
    const result = await response.json();
    if (!response.ok) return res.status(400).json({ error: result.message });
    
    res.json({
      authorization_url: result.data.authorization_url,
      reference: result.data.reference
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`;

const PAYSTACK_WEBHOOK_SNIPPET = `// Webhook endpoint: /api/paystack/webhook
import crypto from "crypto";
import { db, accountsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

router.post("/paystack/webhook", async (req, res) => {
  const signature = req.headers["x-paystack-signature"];
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== signature) return res.status(401).send("Invalid signature");

  const { event, data } = req.body;
  if (event === "charge.success") {
    const { reference, amount, metadata } = data;
    const actualAmount = Number(amount) / 100; // back to Naira

    // Credit user's wallet using a secure database transaction
    await db.transaction(async (tx) => {
      const [account] = await tx
        .select()
        .from(accountsTable)
        .where(eq(accountsTable.id, metadata.accountId))
        .for("update"); // row-level lock

      if (account) {
        const newBalance = (parseFloat(account.balance) + actualAmount).toFixed(2);
        await tx.update(accountsTable)
          .set({ balance: newBalance })
          .where(eq(accountsTable.id, account.id));
      }
    });
  }
  res.sendStatus(200);
});`;

const PAYSTACK_MOBILE_SNIPPET = `import { WebView } from "react-native-webview";

export default function FundWalletScreen({ route, navigation }) {
  const { authorizationUrl, reference } = route.params;

  return (
    <WebView
      source={{ uri: authorizationUrl }}
      onNavigationStateChange={(navState) => {
        if (navState.url.includes("novamoni://payment-complete")) {
          // Trigger wallet balance query refresh
          navigation.navigate("Home", { refresh: true });
        }
      }}
    />
  );
}`;

const FLUTTERWAVE_ENV_SNIPPET = `# Environment keys (.env)
FLUTTERWAVE_SECRET_KEY=FLWSECK_live_xxxx...
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_live_xxxx...`;

const FLUTTERWAVE_INIT_SNIPPET = `// Route: /api/flutterwave/initialize
import { Router } from "express";
import fetch from "node-fetch";

const router = Router();

router.post("/flutterwave/initialize", async (req, res) => {
  const { amount, accountId } = req.body;
  try {
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: \`Bearer \${process.env.FLUTTERWAVE_SECRET_KEY}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tx_ref: \`novamoni-\${Date.now()}-\${accountId}\`,
        amount: amount,
        currency: "NGN",
        redirect_url: "novamoni://flutterwave-complete",
        customer: {
          email: req.userEmail,
          name: req.userName,
        },
        customizations: {
          title: "Novamoni Wallet Funding",
          description: "Top-up balance for account " + accountId
        }
      })
    });

    const data = await response.json();
    if (data.status === "success") {
      res.json({ checkout_url: data.data.link });
    } else {
      res.status(400).json({ error: data.message });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`;

const FLUTTERWAVE_WEBHOOK_SNIPPET = `// Webhook endpoint: /api/flutterwave/webhook
import { db, accountsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

router.post("/flutterwave/webhook", async (req, res) => {
  // Validate Flutterwave secret hash header
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
  const signature = req.headers["verif-hash"];
  if (!secretHash || signature !== secretHash) {
    return res.status(401).send("Unauthorized");
  }

  const { event, data } = req.body;
  if (event === "charge.completed" && data.status === "successful") {
    // Extract accountId from tx_ref
    const parts = data.tx_ref.split("-");
    const accountId = parts[2];
    const amount = data.amount;

    await db.transaction(async (tx) => {
      const [account] = await tx
        .select()
        .from(accountsTable)
        .where(eq(accountsTable.id, accountId))
        .for("update");

      if (account) {
        const newBalance = (parseFloat(account.balance) + amount).toFixed(2);
        await tx.update(accountsTable)
          .set({ balance: newBalance })
          .where(eq(accountsTable.id, accountId));
      }
    });
  }
  res.sendStatus(200);
});`;

const STRIPE_ENV_SNIPPET = `# Backend Keys (.env)
STRIPE_SECRET_KEY=sk_live_51...`;

const STRIPE_CREATE_SNIPPET = `// Route: /api/cards/stripe-create
import Stripe from "stripe";
import { db, cardsTable } from "@workspace/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

router.post("/cards/stripe-create", async (req, res) => {
  const { cardholderName, userId } = req.body;
  try {
    // 1. Create cardholder in Stripe
    const cardholder = await stripe.issuing.cardholders.create({
      name: cardholderName,
      email: req.userEmail,
      phone_number: "+18888675309",
      status: "active",
      type: "individual",
      billing: {
        address: {
          line1: "123 Main Street",
          city: "San Francisco",
          state: "CA",
          postal_code: "94111",
          country: "US",
        },
      },
    });

    // 2. Create card in Stripe under cardholder
    const stripeCard = await stripe.issuing.cards.create({
      cardholder: cardholder.id,
      currency: "usd",
      type: "virtual",
      status: "active",
    });

    // 3. Save virtual card details into cardsTable in Drizzle
    const newCard = await db.insert(cardsTable).values({
      id: stripeCard.id,
      userId: userId,
      cardholderName: cardholderName,
      cardNumber: stripeCard.number || "**** **** **** " + stripeCard.last4,
      expiryDate: \`\${stripeCard.exp_month}/\${stripeCard.exp_year}\`,
      cvv: stripeCard.cvc || "331",
      status: "active",
      type: "virtual",
      brand: stripeCard.brand.toLowerCase(),
      createdAt: new Date()
    }).returning();

    res.json({ success: true, card: newCard[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`;

const SMILEID_ENV_SNIPPET = `# Backend Keys (.env)
SMILE_ID_API_KEY=your_smileid_api_key_here
SMILE_ID_PARTNER_ID=your_partner_id`;

const SMILEID_WEBHOOK_SNIPPET = `// Webhook route: /api/kyc/smileid-webhook
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

router.post("/kyc/smileid-webhook", async (req, res) => {
  const { ResultCode, ResultText, PartnerCustomerID, Signature } = req.body;

  // Verify signature using SMILE_ID_API_KEY hash signature check
  // ...

  // Check verification result code (1012 = success)
  const isApproved = ResultCode === "1012";
  const newStatus = isApproved ? "approved" : "rejected";

  try {
    await db.update(usersTable)
      .set({ 
        kycStatus: newStatus, 
        updatedAt: new Date() 
      })
      .where(eq(usersTable.id, PartnerCustomerID));
      
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`;

const SUDO_ENV_SNIPPET = `# Backend Keys (.env)
SUDO_API_KEY=sudo_live_xxxxxxxxxxxxxxxxxxxxxxxx`;

const SUDO_CREATE_SNIPPET = `// Route: /api/cards/sudo-create
router.post("/cards/sudo-create", async (req, res) => {
  const { cardType, cardBrand, userId } = req.body;
  try {
    const response = await fetch("https://api.sudo.cards/cards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${process.env.SUDO_API_KEY}\`
      },
      body: JSON.stringify({
        type: cardType, // "virtual" or "physical"
        brand: cardBrand, // "Verve" or "Mastercard"
        currency: "NGN",
        status: "active"
      })
    });
    const data = await response.json();
    res.json({ success: true, card: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`;

const BRIDGECARD_ENV_SNIPPET = `# Backend Keys (.env)
BRIDGECARD_API_KEY=bridge_live_xxxxxxxxxxxxxxxxxxxxxxxx`;

const BRIDGECARD_CREATE_SNIPPET = `// Route: /api/cards/bridgecard-create
router.post("/cards/bridgecard-create", async (req, res) => {
  const { cardType, cardholderId } = req.body;
  try {
    const response = await fetch("https://api.bridgecard.co/v1/issuing/sandbox/cards/register_card", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "token": \`Bearer \${process.env.BRIDGECARD_API_KEY}\`
      },
      body: JSON.stringify({
        cardholder_id: cardholderId,
        card_type: cardType, // "virtual" or "physical"
        card_brand: "Mastercard"
      })
    });
    const data = await response.json();
    res.json({ success: true, card: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`;
