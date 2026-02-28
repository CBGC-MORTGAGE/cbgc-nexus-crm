import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  ChevronRight,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MapPin,
  User,
  Trash2,
  Shield,
  Home,
  Loader2,
  Cloud,
  MessageSquare,
  Clock,
  TrendingUp,
  DollarSign,
  Activity,
  BarChart3,
  Edit2,
  X,
  Bot,
  Copy,
  Layout,
  List,
  ArrowRight,
  Globe,
  Lock,
  LogOut,
  ChevronLeft,
  Users,
  Phone,
  Mail,
  LayoutDashboard,
  Send,
  MessageCircle,
  Contact,
  HeartHandshake,
} from "lucide-react";

// Firebase Imports
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  signInAnonymously,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

// ------------------------------------------------------------------
// Firebase Config
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyAhZYPSsrnt5-3GeQDfdar5cKGjLgLYcDA",
  authDomain: "cbgc-pipeline.firebaseapp.com",
  projectId: "cbgc-pipeline",
  storageBucket: "cbgc-pipeline.firebasestorage.app",
  messagingSenderId: "1051098114911",
  appId: "1:1051098114911:web:27b95c862e824505b9a4ea",
  measurementId: "G-DW8MPLJXH0",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "cbgc-nexus-crm";

// ------------------------------------------------------------------
// Upgraded Brand Logo Component (Matches Uploaded Image)
// ------------------------------------------------------------------
const CBGCLogo = ({ className = "w-12 h-12" }) => (
  <svg
    className={className}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Outer Gold Rings */}
    <circle cx="100" cy="100" r="90" stroke="#D4A574" strokeWidth="8" />
    <circle cx="100" cy="100" r="76" stroke="#D4A574" strokeWidth="3" />
    {/* Chimney */}
    <path
      d="M135 83 L135 55 L145 55 L145 91"
      stroke="#D4A574"
      strokeWidth="6"
      fill="none"
    />
    {/* Outer House Shape */}
    <path
      d="M50 150 L50 95 L100 55 L150 95 L150 150 Z"
      stroke="#D4A574"
      strokeWidth="8"
      fill="none"
      strokeLinejoin="round"
    />
    {/* Inner House Shape */}
    <path
      d="M70 150 L70 110 L100 86 L130 110 L130 150"
      stroke="#D4A574"
      strokeWidth="5"
      fill="none"
      strokeLinejoin="round"
    />
  </svg>
);

const App = () => {
  // ----------------------------------------------------------------
  // Helper Functions
  // ----------------------------------------------------------------
  function formatCurrency(value) {
    if (!value) return "";
    const numValue = parseFloat(value.toString().replace(/[^0-9.]/g, ""));
    if (isNaN(numValue)) return "";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(numValue);
  }

  function handleCurrencyInput(value) {
    return value.replace(/[^0-9.]/g, "");
  }

  const MILESTONES = [
    "Application",
    "Credit Pulled",
    "Documents In",
    "Submitted to UW",
    "Conditional Approval",
    "CTC",
    "Funded",
  ];

  function getMilestoneProgress(milestone) {
    const index = MILESTONES.indexOf(milestone);
    if (index === -1) return 0;
    return ((index + 1) / MILESTONES.length) * 100;
  }

  // ----------------------------------------------------------------
  // State Management
  // ----------------------------------------------------------------
  const [user, setUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Navigation State
  const [currentView, setCurrentView] = useState("dashboard");
  const [viewMode, setViewMode] = useState("list");

  // Modal States
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [isContactPortalOpen, setIsContactPortalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState("activity");

  // Inputs
  const [searchTerm, setSearchTerm] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [taskInput, setTaskInput] = useState("");

  // Filters
  const [filterSource, setFilterSource] = useState("All");
  const [filterContactType, setFilterContactType] = useState("All");

  // Auth Inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Reporting
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportGroupBy, setReportGroupBy] = useState("leadSource");

  // Constants
  const SOURCES = [
    "Dream Finders Orlando",
    "Dream Finders Northeast",
    "Realtor Referral",
    "Past Client",
    "Lead Gen",
    "Client Portal",
    "Other",
  ];
  const CONTACT_TYPES = ["Borrower", "Realtor", "Lender", "Other Partner"];

  // CRM STAGES
  const LEAD_STAGES = ["NEW LEAD", "WARMING", "PRE-APPROVED", "NURTURE"];
  const ACTIVE_STAGES = ["ACTIVE IN ARIVE", "CLOSED - PAST CLIENT"];
  const PARTNER_STAGES = ["ACTIVE PARTNER", "PROSPECTING"];
  const ALL_STATUSES = [...LEAD_STAGES, ...ACTIVE_STAGES, ...PARTNER_STAGES];

  const initialFormState = {
    contactName: "",
    email: "",
    phone: "",
    dob: "",
    spouseName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    contactType: "Borrower",
    status: "NEW LEAD",
    estimatedVolume: "",
    leadSource: "Client Portal",
    loOfficer: "Michael Russell",
    notes: [],
    tasks: [],
    initialNote: "",
  };

  const [formData, setFormData] = useState(initialFormState);

  // ----------------------------------------------------------------
  // Authentication & Data Sync
  // ----------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      if (!currentUser) setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || user.isAnonymous) return;
    const contactsRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "contacts"
    );
    const unsubscribe = onSnapshot(
      contactsRef,
      (snapshot) => {
        const fetchedContacts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        fetchedContacts.sort(
          (a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)
        );
        setContacts(fetchedContacts);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail("");
      setPassword("");
    } catch (error) {
      setLoginError("Invalid credentials.");
    }
  };

  const handlePublicPortalEnter = async () => {
    setIsAuthLoading(true);
    try {
      await signInAnonymously(auth);
      setIsContactPortalOpen(true);
    } catch (error) {
      setLoginError("Could not access portal. Enable Anon Auth in Firebase.");
    }
    setIsAuthLoading(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // ----------------------------------------------------------------
  // Database Operations
  // ----------------------------------------------------------------
  const addContact = async (data = null) => {
    if (!user) return;
    try {
      const contactsRef = collection(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "contacts"
      );
      const dataToSave = data || formData;
      const initialNotesList = dataToSave.initialNote
        ? [
            {
              id: crypto.randomUUID(),
              text: dataToSave.initialNote,
              timestamp: new Date().toISOString(),
            },
          ]
        : [];
      const { initialNote, ...cleanData } = dataToSave;

      await addDoc(contactsRef, {
        ...cleanData,
        notes: initialNotesList,
        tasks: [],
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      setIsAddingContact(false);
      setFormData(initialFormState);
    } catch (error) {
      console.error("Error adding contact:", error);
    }
  };

  const updateContact = async (id, updates) => {
    if (!user) return;
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    await updateDoc(
      doc(db, "artifacts", appId, "public", "data", "contacts", id),
      { ...updates, updatedAt: serverTimestamp() }
    );
    if (selectedContact?.id === id)
      setSelectedContact((prev) => ({ ...prev, ...updates }));
  };

  const addNote = async () => {
    if (!selectedContact || !noteInput.trim()) return;
    const newNote = {
      id: crypto.randomUUID(),
      text: noteInput,
      timestamp: new Date().toISOString(),
    };
    const updatedNotes = [...(selectedContact.notes || []), newNote];
    setSelectedContact({ ...selectedContact, notes: updatedNotes });
    updateContact(selectedContact.id, { notes: updatedNotes });
    setNoteInput("");
  };

  const addTask = async () => {
    if (!selectedContact || !taskInput.trim()) return;
    const newTask = {
      id: crypto.randomUUID(),
      text: taskInput,
      completed: false,
    };
    const updatedTasks = [...(selectedContact.tasks || []), newTask];
    setSelectedContact({ ...selectedContact, tasks: updatedTasks });
    updateContact(selectedContact.id, { tasks: updatedTasks });
    setTaskInput("");
  };

  const toggleTask = (taskId) => {
    const updatedTasks = (selectedContact.tasks || []).map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    updateContact(selectedContact.id, { tasks: updatedTasks });
  };

  const deleteContact = async (id) => {
    if (!confirm("Are you sure? This deletes the contact permanently.")) return;
    await deleteDoc(
      doc(db, "artifacts", appId, "public", "data", "contacts", id)
    );
    if (selectedContact?.id === id) setSelectedContact(null);
  };

  // ----------------------------------------------------------------
  // Logic & Reporting
  // ----------------------------------------------------------------
  const filteredData = useMemo(() => {
    let data = contacts.filter(
      (c) =>
        ((c.contactName || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
          (c.email || "").toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterSource === "All" || c.leadSource === filterSource) &&
        (filterContactType === "All" || c.contactType === filterContactType)
    );

    if (currentView === "crm")
      return data.filter(
        (c) =>
          LEAD_STAGES.includes(c.status) || PARTNER_STAGES.includes(c.status)
      );
    if (currentView === "active")
      return data.filter((c) => ACTIVE_STAGES.includes(c.status));

    return data;
  }, [contacts, searchTerm, currentView, filterSource, filterContactType]);

  const kanbanColumns = useMemo(() => {
    const cols =
      currentView === "crm"
        ? [...LEAD_STAGES, ...PARTNER_STAGES]
        : ACTIVE_STAGES;
    const grouped = {};
    cols.forEach((s) => (grouped[s] = []));
    filteredData.forEach((c) => {
      if (grouped[c.status]) grouped[c.status].push(c);
    });
    return grouped;
  }, [filteredData, currentView]);

  const analytics = useMemo(() => {
    const leads = contacts.filter((c) => LEAD_STAGES.includes(c.status));
    const active = contacts.filter((c) => c.status === "ACTIVE IN ARIVE");
    const volume = active.reduce(
      (acc, c) =>
        acc +
        parseFloat(c.estimatedVolume?.toString().replace(/[^0-9.]/g, "") || 0),
      0
    );
    const partners = contacts.filter(
      (c) => c.contactType === "Realtor" || c.contactType === "Lender"
    );
    return {
      leads: leads.length,
      active: active.length,
      volume,
      partners: partners.length,
    };
  }, [contacts]);

  // Safe definition for Reports
  const groupedForReport = useMemo(() => {
    return contacts.reduce((acc, contact) => {
      const key = contact[reportGroupBy] || "Unassigned";
      if (!acc[key]) acc[key] = [];
      acc[key].push(contact);
      return acc;
    }, {});
  }, [contacts, reportGroupBy]);

  const generateReportSummary = (contact) => {
    const lastNote =
      contact.notes && contact.notes.length > 0
        ? contact.notes[contact.notes.length - 1].text
        : "No recent notes.";
    return `👤 ${contact.contactName} (${contact.contactType})\n• Status: ${contact.status}\n• Latest Update: ${lastNote}`;
  };

  const copyGroupReport = (groupName, groupContacts) => {
    const header = `CRM Update: ${groupName}\n----------------------------------------\n\n`;
    const body = groupContacts.map(generateReportSummary).join("\n\n");
    const textToCopy = header + body;
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      alert(`Report for ${groupName} copied to clipboard!`);
    } catch (err) {
      alert("Failed to copy.");
    }
    document.body.removeChild(textArea);
  };

  const handleDragStart = (e, contactId) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", contactId);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    if (draggedId) {
      setContacts((prev) =>
        prev.map((c) => (c.id === draggedId ? { ...c, status: newStatus } : c))
      );
      await updateContact(draggedId, { status: newStatus });
    }
  };

  // ----------------------------------------------------------------
  // PORTAL (Basic Contact / CRM Intake)
  // ----------------------------------------------------------------
  const BasicContactPortal = () => {
    const [cData, setCData] = useState({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dob: "",
      contactType: "Borrower",
      spouseName: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      notes: "",
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      const fullName = `${cData.firstName} ${cData.lastName}`;
      await addContact({
        ...initialFormState,
        contactName: fullName,
        email: cData.email,
        phone: cData.phone,
        dob: cData.dob,
        spouseName: cData.spouseName,
        address: cData.address,
        city: cData.city,
        state: cData.state,
        zip: cData.zip,
        contactType: cData.contactType,
        status: cData.contactType === "Borrower" ? "NEW LEAD" : "PROSPECTING",
        leadSource: "Client Portal",
        initialNote: `Online form submitted.\nNotes: ${cData.notes}`,
      });
      alert("Information submitted securely! Thank you.");
      await signOut(auth);
      setIsContactPortalOpen(false);
    };

    return (
      <div className="fixed inset-0 bg-[#121212] z-50 overflow-y-auto font-sans">
        <div className="bg-[#1a1a1a] p-6 text-white shadow-xl sticky top-0 z-10 flex justify-between items-center border-b border-white/10">
          <div className="flex items-center gap-4">
            <CBGCLogo className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-bold tracking-widest text-[#D4A574] uppercase">
                CBGC Mortgage
              </h1>
              <p className="text-white/60 text-xs font-medium uppercase tracking-widest">
                Client Portal
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              await signOut(auth);
              setIsContactPortalOpen(false);
            }}
            className="text-[#D4A574] hover:text-white flex items-center gap-2 text-sm font-bold transition-colors uppercase tracking-wider"
          >
            <LogOut size={16} /> Exit
          </button>
        </div>

        <div className="max-w-2xl mx-auto p-4 md:p-8 mt-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50 text-center">
              <h2 className="text-3xl font-bold text-[#1a1a1a] uppercase tracking-wide">
                Stay in Touch
              </h2>
              <p className="text-slate-500 mt-2 font-medium">
                Please provide your contact information below so we can connect.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
                    First Name
                  </label>
                  <input
                    required
                    className="w-full border-b-2 border-slate-200 p-2 focus:border-[#D4A574] outline-none transition-colors"
                    value={cData.firstName}
                    onChange={(e) =>
                      setCData({ ...cData, firstName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
                    Last Name
                  </label>
                  <input
                    required
                    className="w-full border-b-2 border-slate-200 p-2 focus:border-[#D4A574] outline-none transition-colors"
                    value={cData.lastName}
                    onChange={(e) =>
                      setCData({ ...cData, lastName: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full border-b-2 border-slate-200 p-2 focus:border-[#D4A574] outline-none transition-colors"
                    value={cData.email}
                    onChange={(e) =>
                      setCData({ ...cData, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full border-b-2 border-slate-200 p-2 focus:border-[#D4A574] outline-none transition-colors"
                    value={cData.phone}
                    onChange={(e) =>
                      setCData({ ...cData, phone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
                    Birthday
                  </label>
                  <input
                    type="date"
                    className="w-full border-b-2 border-slate-200 p-2 focus:border-[#D4A574] outline-none text-slate-700 transition-colors"
                    value={cData.dob}
                    onChange={(e) =>
                      setCData({ ...cData, dob: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
                    I am a...
                  </label>
                  <select
                    className="w-full border-b-2 border-slate-200 p-2 focus:border-[#D4A574] outline-none bg-white transition-colors"
                    value={cData.contactType}
                    onChange={(e) =>
                      setCData({ ...cData, contactType: e.target.value })
                    }
                  >
                    <option value="Borrower">Borrower / Homebuyer</option>
                    <option value="Realtor">Real Estate Agent</option>
                    <option value="Lender">Lender / Partner</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-[#1a1a1a] uppercase tracking-wider mb-4">
                  Optional Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
                      Spouse / Co-Borrower Name
                    </label>
                    <input
                      className="w-full border-b-2 border-slate-200 p-2 focus:border-[#D4A574] outline-none transition-colors"
                      value={cData.spouseName}
                      onChange={(e) =>
                        setCData({ ...cData, spouseName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-500 mb-1">
                      Mailing Address
                    </label>
                    <input
                      className="w-full border-b-2 border-slate-200 p-2 focus:border-[#D4A574] outline-none transition-colors"
                      placeholder="123 Main St"
                      value={cData.address}
                      onChange={(e) =>
                        setCData({ ...cData, address: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <input
                      className="w-full border-b-2 border-slate-200 p-2 focus:border-[#D4A574] outline-none transition-colors"
                      placeholder="City"
                      value={cData.city}
                      onChange={(e) =>
                        setCData({ ...cData, city: e.target.value })
                      }
                    />
                    <input
                      className="w-full border-b-2 border-slate-200 p-2 focus:border-[#D4A574] outline-none transition-colors"
                      placeholder="State"
                      value={cData.state}
                      onChange={(e) =>
                        setCData({ ...cData, state: e.target.value })
                      }
                    />
                    <input
                      className="w-full border-b-2 border-slate-200 p-2 focus:border-[#D4A574] outline-none transition-colors"
                      placeholder="Zip"
                      value={cData.zip}
                      onChange={(e) =>
                        setCData({ ...cData, zip: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-500 mb-1 mt-2">
                      Any additional notes?
                    </label>
                    <textarea
                      className="w-full border-2 border-slate-200 p-3 rounded-lg h-24 focus:border-[#D4A574] outline-none resize-none transition-colors"
                      value={cData.notes}
                      onChange={(e) =>
                        setCData({ ...cData, notes: e.target.value })
                      }
                    ></textarea>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-[#D4A574] hover:bg-[#c29362] text-[#1a1a1a] font-bold py-4 rounded-lg shadow-lg mt-6 transition-transform hover:-translate-y-1 uppercase tracking-widest text-sm"
              >
                Submit Information
              </button>
            </form>
            <div className="bg-slate-100 p-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
              &copy; {new Date().getFullYear()} CBGC Mortgage. All Rights
              Reserved.
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------------------
  // Render Main Layout
  // ----------------------------------------------------------------

  if (isAuthLoading)
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#D4A574]" size={48} />
      </div>
    );

  // Render Portal if open
  if (isContactPortalOpen) return <BasicContactPortal />;

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
        <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-md p-8 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#D4A574] to-[#f3d3a3]"></div>
          <div className="flex flex-col items-center mb-8 pt-4">
            <CBGCLogo className="w-24 h-24 mb-6" />
            <h1 className="text-3xl font-bold text-[#D4A574] mb-1 uppercase tracking-widest">
              CBGC Mortgage
            </h1>
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest">
              Nexus CRM Portal
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {loginError && (
              <div className="bg-red-900/30 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-900/50">
                <AlertCircle size={16} />
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-[10px] uppercase font-bold text-white/50 mb-1.5 tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#121212] border border-white/10 text-white p-3 rounded-lg outline-none focus:border-[#D4A574] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-white/50 mb-1.5 tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#121212] border border-white/10 text-white p-3 rounded-lg outline-none focus:border-[#D4A574] transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#D4A574] hover:bg-[#c29362] text-[#1a1a1a] font-bold py-3.5 rounded-lg shadow-lg transition-all uppercase tracking-widest text-sm mt-2"
            >
              Sign In
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <button
              onClick={handlePublicPortalEnter}
              className="w-full bg-white/5 hover:bg-white/10 text-[#D4A574] font-bold py-3 rounded-lg border border-[#D4A574]/30 flex items-center justify-center gap-2 transition-all text-sm uppercase tracking-wider"
            >
              <Contact size={18} /> Share Client Intake
            </button>
          </div>

          <div className="mt-8 text-center text-[10px] text-white/30 uppercase tracking-widest font-bold">
            &copy; {new Date().getFullYear()} CBGC Mortgage.
          </div>
        </div>
      </div>
    );
  }

  // MAIN APP LAYOUT
  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans">
      {/* SIDEBAR */}
      <aside className="w-20 lg:w-64 bg-[#1a1a1a] text-slate-300 flex flex-col shrink-0 transition-all duration-300 shadow-2xl z-20 border-r border-black">
        <div className="p-6 flex flex-col items-center lg:items-start gap-4 border-b border-white/10">
          <CBGCLogo className="w-12 h-12" />
          <div className="hidden lg:block text-center lg:text-left w-full">
            <h1 className="font-bold text-[#D4A574] text-xl tracking-widest uppercase">
              CBGC
            </h1>
            <p className="text-[10px] uppercase font-bold text-white/50 tracking-widest">
              Nexus CRM
            </p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button
            onClick={() => setCurrentView("dashboard")}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
              currentView === "dashboard"
                ? "bg-[#D4A574] text-[#1a1a1a] shadow-lg font-bold"
                : "hover:bg-white/5 text-white/70"
            }`}
          >
            <LayoutDashboard size={20} />{" "}
            <span className="hidden lg:block text-sm uppercase tracking-wider">
              Dashboard
            </span>
          </button>
          <button
            onClick={() => setCurrentView("crm")}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
              currentView === "crm"
                ? "bg-[#D4A574] text-[#1a1a1a] shadow-lg font-bold"
                : "hover:bg-white/5 text-white/70"
            }`}
          >
            <Users size={20} />{" "}
            <span className="hidden lg:block text-sm uppercase tracking-wider">
              Leads & Partners
            </span>
          </button>
          <button
            onClick={() => setCurrentView("active")}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
              currentView === "active"
                ? "bg-[#D4A574] text-[#1a1a1a] shadow-lg font-bold"
                : "hover:bg-white/5 text-white/70"
            }`}
          >
            <Activity size={20} />{" "}
            <span className="hidden lg:block text-sm uppercase tracking-wider">
              Active in ARIVE
            </span>
          </button>
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => setIsAddingContact(true)}
            className="w-full bg-white/10 hover:bg-white/20 text-[#D4A574] border border-[#D4A574]/30 font-bold p-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Plus size={20} />{" "}
            <span className="hidden lg:block text-sm uppercase tracking-wider">
              Add Contact
            </span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-100">
        {/* TOP HEADER */}
        <header className="bg-white border-b border-slate-200 h-20 px-8 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-6 flex-1">
            <h2 className="text-xl font-bold text-[#1a1a1a] uppercase tracking-widest">
              {currentView === "active" ? "ARIVE Pipeline" : currentView}
            </h2>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="relative max-w-lg w-full">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                className="pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-full w-full text-sm focus:ring-2 focus:ring-[#D4A574] outline-none transition-all placeholder-slate-400 font-medium"
                placeholder="Search people, phone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsGeneratingReport(true)}
              className="hidden md:flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-600 hover:text-[#D4A574] transition-colors"
            >
              <Bot size={18} /> Reports
            </button>
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <div className="w-10 h-10 bg-[#1a1a1a] text-[#D4A574] rounded-full flex items-center justify-center font-bold text-sm border border-[#D4A574]/50">
              {user.email[0].toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* VIEW CONTENT */}
        <div className="flex-1 overflow-auto p-8">
          {/* DASHBOARD VIEW */}
          {currentView === "dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in">
              <div className="bg-[#1a1a1a] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 text-white/5 group-hover:text-white/10 transition-colors">
                  <Users size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="bg-[#D4A574]/20 p-3 rounded-xl text-[#D4A574]">
                      <Users size={28} />
                    </div>
                  </div>
                  <div className="text-5xl font-bold mb-2 tracking-tight">
                    {analytics.leads}
                  </div>
                  <div className="text-white/60 text-xs font-bold uppercase tracking-widest">
                    CRM Leads
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-lg relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 text-slate-50 group-hover:text-slate-100 transition-colors">
                  <Activity size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="bg-slate-900 p-3 rounded-xl text-[#D4A574]">
                      <Activity size={28} />
                    </div>
                  </div>
                  <div className="text-5xl font-bold text-[#1a1a1a] mb-2 tracking-tight">
                    {analytics.active}
                  </div>
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                    Active in ARIVE
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-lg relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 text-slate-50 group-hover:text-slate-100 transition-colors">
                  <HeartHandshake size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="bg-slate-100 p-3 rounded-xl text-slate-700">
                      <HeartHandshake size={28} />
                    </div>
                  </div>
                  <div className="text-5xl font-bold text-[#1a1a1a] mb-2 tracking-tight">
                    {analytics.partners}
                  </div>
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                    Realtors / Partners
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LIST / BOARD VIEW */}
          {(currentView === "crm" || currentView === "active") && (
            <div className="h-full flex flex-col">
              <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div className="flex gap-3">
                  <select
                    className="border border-slate-200 rounded-lg px-4 py-2 text-sm bg-white text-slate-700 font-bold uppercase tracking-wider shadow-sm outline-none focus:border-[#D4A574]"
                    value={filterContactType}
                    onChange={(e) => setFilterContactType(e.target.value)}
                  >
                    <option value="All">All Types</option>
                    {CONTACT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <select
                    className="border border-slate-200 rounded-lg px-4 py-2 text-sm bg-white text-slate-700 font-bold uppercase tracking-wider shadow-sm outline-none focus:border-[#D4A574]"
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                  >
                    <option value="All">All Sources</option>
                    {SOURCES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 bg-slate-200/50 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === "list"
                        ? "bg-white shadow-sm text-[#1a1a1a]"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <List size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode("board")}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === "board"
                        ? "bg-white shadow-sm text-[#1a1a1a]"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Layout size={20} />
                  </button>
                </div>
              </div>

              {viewMode === "list" ? (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex-1">
                  <table className="w-full text-left">
                    <thead className="bg-[#1a1a1a] text-[#D4A574] text-[10px] uppercase font-bold tracking-widest">
                      <tr>
                        <th className="px-6 py-5">Contact Details</th>
                        <th className="px-6 py-5">Type & Stage</th>
                        <th className="px-6 py-5">
                          {currentView === "crm" ? "Source" : "Volume"}
                        </th>
                        <th className="px-6 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredData.map((contact) => (
                        <tr
                          key={contact.id}
                          className="hover:bg-slate-50 transition-colors group"
                        >
                          <td className="px-6 py-5">
                            <div className="font-bold text-slate-900 text-base mb-1">
                              {contact.contactName}
                            </div>
                            <div className="text-xs text-slate-500 flex flex-col gap-1.5 font-medium">
                              {contact.email && (
                                <span className="flex items-center gap-2">
                                  <Mail size={12} /> {contact.email}
                                </span>
                              )}
                              {contact.phone && (
                                <span className="flex items-center gap-2">
                                  <Phone size={12} /> {contact.phone}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col items-start gap-2">
                              <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md tracking-wider border border-slate-200">
                                {contact.contactType}
                              </span>
                              <select
                                value={contact.status}
                                onChange={(e) =>
                                  updateContact(contact.id, {
                                    status: e.target.value,
                                  })
                                }
                                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md border border-slate-200 outline-none cursor-pointer uppercase tracking-wider ${
                                  contact.status === "NEW LEAD"
                                    ? "bg-blue-50 text-blue-700"
                                    : contact.status === "ACTIVE IN ARIVE"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-white text-slate-700"
                                }`}
                              >
                                {ALL_STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="px-6 py-5 font-medium">
                            <span className="text-xs text-slate-500 block mb-2">
                              {contact.leadSource}
                            </span>
                            {contact.estimatedVolume && (
                              <span className="font-bold text-sm bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100">
                                {formatCurrency(contact.estimatedVolume)}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <button
                              onClick={() => {
                                setSelectedContact(contact);
                                setActiveModalTab("activity");
                              }}
                              className="px-4 py-2 hover:bg-[#D4A574] hover:text-[#1a1a1a] text-slate-600 rounded-lg transition-colors border border-slate-200 font-bold text-xs uppercase tracking-wider flex items-center gap-2 ml-auto"
                            >
                              Open <ChevronRight size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex gap-6 overflow-x-auto h-full pb-4 items-start">
                  {(currentView === "crm"
                    ? [...LEAD_STAGES, ...PARTNER_STAGES]
                    : ACTIVE_STAGES
                  ).map((stage) => (
                    <div
                      key={stage}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, stage)}
                      className="w-80 shrink-0 bg-slate-200/50 rounded-2xl border border-slate-200 flex flex-col max-h-full"
                    >
                      <div className="p-4 font-bold text-xs text-slate-600 uppercase tracking-widest border-b border-slate-200 flex justify-between items-center bg-slate-100 rounded-t-2xl">
                        {stage}{" "}
                        <span className="bg-[#1a1a1a] text-[#D4A574] px-2.5 py-0.5 rounded-full shadow-sm">
                          {kanbanColumns[stage]?.length || 0}
                        </span>
                      </div>
                      <div className="p-3 flex-1 overflow-y-auto space-y-3">
                        {kanbanColumns[stage]?.map((contact) => (
                          <div
                            key={contact.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, contact.id)}
                            onClick={() => {
                              setSelectedContact(contact);
                              setActiveModalTab("activity");
                            }}
                            className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-grab hover:shadow-lg hover:border-[#D4A574] transition-all"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-bold text-slate-900">
                                {contact.contactName}
                              </div>
                              <span
                                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                  contact.contactType === "Realtor"
                                    ? "bg-orange-50 text-orange-700 border border-orange-200"
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}
                              >
                                {contact.contactType}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-3 truncate flex items-center gap-1 font-medium">
                              {contact.phone && (
                                <>
                                  <Phone size={12} /> {contact.phone}
                                </>
                              )}
                            </div>
                            {contact.estimatedVolume && (
                              <div className="mt-3 text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded inline-block border border-emerald-100">
                                {formatCurrency(contact.estimatedVolume)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Dashboard Footer */}
        <footer className="bg-white border-t border-slate-200 p-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest shrink-0">
          &copy; {new Date().getFullYear()} CBGC Mortgage. All Rights Reserved.
        </footer>
      </main>

      {/* ADD NEW CONTACT MODAL */}
      {isAddingContact && (
        <div className="fixed inset-0 bg-[#1a1a1a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="p-6 bg-[#1a1a1a] text-[#D4A574] flex justify-between items-center">
              <h2 className="font-bold text-lg uppercase tracking-widest">
                Add CRM Record
              </h2>
              <button
                onClick={() => setIsAddingContact(false)}
                className="text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-5 bg-slate-50">
              <div className="flex gap-4 mb-2 bg-white p-2 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 cursor-pointer">
                  <input
                    type="radio"
                    name="ctype"
                    checked={formData.contactType === "Borrower"}
                    onChange={() =>
                      setFormData({ ...formData, contactType: "Borrower" })
                    }
                    className="accent-[#D4A574]"
                  />{" "}
                  Borrower
                </label>
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 cursor-pointer">
                  <input
                    type="radio"
                    name="ctype"
                    checked={formData.contactType === "Realtor"}
                    onChange={() =>
                      setFormData({ ...formData, contactType: "Realtor" })
                    }
                    className="accent-[#D4A574]"
                  />{" "}
                  Realtor
                </label>
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 cursor-pointer">
                  <input
                    type="radio"
                    name="ctype"
                    checked={formData.contactType === "Lender"}
                    onChange={() =>
                      setFormData({ ...formData, contactType: "Lender" })
                    }
                    className="accent-[#D4A574]"
                  />{" "}
                  Lender
                </label>
              </div>
              <input
                className="w-full border-b-2 border-slate-200 p-2 focus:border-[#D4A574] outline-none bg-transparent transition-colors font-medium"
                placeholder="Full Name"
                value={formData.contactName}
                onChange={(e) =>
                  setFormData({ ...formData, contactName: e.target.value })
                }
              />
              <div className="grid grid-cols-2 gap-6">
                <input
                  className="border-b-2 border-slate-200 p-2 focus:border-[#D4A574] outline-none bg-transparent transition-colors font-medium"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
                <input
                  className="border-b-2 border-slate-200 p-2 focus:border-[#D4A574] outline-none bg-transparent transition-colors font-medium"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              {formData.contactType === "Borrower" && (
                <div className="flex bg-slate-200 p-1 rounded-lg mt-4">
                  <button
                    onClick={() =>
                      setFormData({ ...formData, status: "NEW LEAD" })
                    }
                    className={`flex-1 py-2 text-xs uppercase tracking-widest font-bold rounded-md transition-all ${
                      formData.status === "NEW LEAD"
                        ? "bg-[#1a1a1a] text-[#D4A574] shadow"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Start as Lead
                  </button>
                  <button
                    onClick={() =>
                      setFormData({ ...formData, status: "ACTIVE IN ARIVE" })
                    }
                    className={`flex-1 py-2 text-xs uppercase tracking-widest font-bold rounded-md transition-all ${
                      formData.status === "ACTIVE IN ARIVE"
                        ? "bg-[#1a1a1a] text-[#D4A574] shadow"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Active in Arive
                  </button>
                </div>
              )}

              <textarea
                className="w-full border-2 border-slate-200 p-3 rounded-xl h-24 focus:border-[#D4A574] outline-none resize-none transition-colors mt-4"
                placeholder="Initial Note..."
                value={formData.initialNote}
                onChange={(e) =>
                  setFormData({ ...formData, initialNote: e.target.value })
                }
              />
            </div>
            <div className="p-6 bg-white flex justify-end gap-4 border-t border-slate-100">
              <button
                onClick={() => setIsAddingContact(false)}
                className="px-6 py-2.5 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => addContact()}
                className="bg-[#1a1a1a] hover:bg-[#333] text-[#D4A574] px-8 py-2.5 rounded-lg font-bold shadow-lg text-xs uppercase tracking-widest transition-transform hover:-translate-y-1"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORTS MODAL */}
      {isGeneratingReport && (
        <div className="fixed inset-0 bg-[#1a1a1a]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-white/10 bg-[#1a1a1a] text-[#D4A574] flex justify-between items-center">
              <h2 className="font-bold text-lg flex items-center gap-3 uppercase tracking-widest">
                <Bot size={24} /> Reporting Engine
              </h2>
              <button
                onClick={() => setIsGeneratingReport(false)}
                className="text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 bg-slate-50">
              <div className="mb-6 flex gap-3">
                <button
                  onClick={() => setReportGroupBy("leadSource")}
                  className={`px-5 py-2.5 rounded-lg border font-bold text-xs uppercase tracking-widest transition-all ${
                    reportGroupBy === "leadSource"
                      ? "bg-[#1a1a1a] border-[#1a1a1a] text-[#D4A574]"
                      : "bg-white border-slate-200 text-slate-500"
                  }`}
                >
                  By Source
                </button>
                <button
                  onClick={() => setReportGroupBy("loOfficer")}
                  className={`px-5 py-2.5 rounded-lg border font-bold text-xs uppercase tracking-widest transition-all ${
                    reportGroupBy === "loOfficer"
                      ? "bg-[#1a1a1a] border-[#1a1a1a] text-[#D4A574]"
                      : "bg-white border-slate-200 text-slate-500"
                  }`}
                >
                  By LO
                </button>
                <button
                  onClick={() => setReportGroupBy("contactType")}
                  className={`px-5 py-2.5 rounded-lg border font-bold text-xs uppercase tracking-widest transition-all ${
                    reportGroupBy === "contactType"
                      ? "bg-[#1a1a1a] border-[#1a1a1a] text-[#D4A574]"
                      : "bg-white border-slate-200 text-slate-500"
                  }`}
                >
                  By Type
                </button>
              </div>
              {Object.entries(groupedForReport).map(([group, list]) => (
                <div
                  key={group}
                  className="mb-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
                >
                  <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between font-bold text-slate-800 items-center uppercase tracking-widest text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#D4A574]"></div>{" "}
                      {group}{" "}
                      <span className="text-slate-400 font-medium text-xs">
                        ({list.length})
                      </span>
                    </span>
                    <button
                      onClick={() => copyGroupReport(group, list)}
                      className="text-[#1a1a1a] hover:text-[#D4A574] bg-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold border border-slate-200 shadow-sm"
                    >
                      <Copy size={14} /> Copy
                    </button>
                  </div>
                  <div className="p-4 text-sm space-y-4">
                    {list.map((c) => (
                      <div
                        key={c.id}
                        className="border-l-4 border-[#D4A574] pl-4 py-1"
                      >
                        <div className="font-bold text-slate-800 flex justify-between">
                          {c.contactName}{" "}
                          <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500 border border-slate-200">
                            {c.status}
                          </span>
                        </div>
                        <div className="text-slate-500 text-xs mt-1 leading-relaxed italic">
                          "
                          {c.notes?.[c.notes.length - 1]?.text ||
                            "No notes available."}
                          "
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DETAIL DRAWER */}
      {selectedContact && (
        <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-slate-50 shadow-2xl z-50 border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-8 bg-[#1a1a1a] text-white shrink-0 shadow-lg relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold tracking-tight text-[#D4A574]">
                    {selectedContact.contactName}
                  </h2>
                  <span className="text-[10px] bg-white/10 border border-[#D4A574]/30 text-[#D4A574] px-2.5 py-1 rounded uppercase font-bold tracking-widest">
                    {selectedContact.contactType}
                  </span>
                </div>
                <div className="flex items-center gap-5 text-sm text-white/70 font-medium">
                  {selectedContact.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail size={14} /> {selectedContact.email}
                    </span>
                  )}
                  {selectedContact.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone size={14} /> {selectedContact.phone}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="bg-white/10 p-2.5 rounded-xl hover:bg-white/20 transition-colors text-[#D4A574]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex overflow-x-auto gap-8 text-xs font-bold uppercase tracking-widest border-b border-white/10 no-scrollbar pt-2">
              <button
                onClick={() => setActiveModalTab("activity")}
                className={`pb-4 border-b-2 whitespace-nowrap transition-colors ${
                  activeModalTab === "activity"
                    ? "border-[#D4A574] text-white"
                    : "border-transparent text-white/40 hover:text-white/70"
                }`}
              >
                Activity
              </button>
              <button
                onClick={() => setActiveModalTab("tasks")}
                className={`pb-4 border-b-2 whitespace-nowrap transition-colors ${
                  activeModalTab === "tasks"
                    ? "border-[#D4A574] text-white"
                    : "border-transparent text-white/40 hover:text-white/70"
                }`}
              >
                Tasks
              </button>
              <button
                onClick={() => setActiveModalTab("comms")}
                className={`pb-4 border-b-2 whitespace-nowrap transition-colors ${
                  activeModalTab === "comms"
                    ? "border-[#D4A574] text-white"
                    : "border-transparent text-white/40 hover:text-white/70"
                }`}
              >
                Templates
              </button>
              <button
                onClick={() => setActiveModalTab("details")}
                className={`pb-4 border-b-2 whitespace-nowrap transition-colors ${
                  activeModalTab === "details"
                    ? "border-[#D4A574] text-white"
                    : "border-transparent text-white/40 hover:text-white/70"
                }`}
              >
                Details
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {/* NOTES TAB */}
            {activeModalTab === "activity" && (
              <div className="space-y-6">
                <div className="flex gap-3">
                  <input
                    className="flex-1 border-2 border-slate-200 p-3.5 rounded-xl shadow-sm focus:border-[#D4A574] outline-none transition-colors font-medium"
                    placeholder="Log a call, email, or note..."
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addNote()}
                  />
                  <button
                    onClick={addNote}
                    className="bg-[#1a1a1a] hover:bg-[#333] text-[#D4A574] px-6 rounded-xl shadow-md font-bold text-xs uppercase tracking-widest transition-transform hover:-translate-y-1"
                  >
                    Post
                  </button>
                </div>
                <div className="space-y-4">
                  {selectedContact.notes?.length > 0 ? (
                    [...selectedContact.notes].reverse().map((note) => (
                      <div
                        key={note.id}
                        className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 w-1 h-full bg-[#D4A574]"></div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">
                          <Clock size={12} />{" "}
                          {new Date(note.timestamp).toLocaleString()}
                        </div>
                        <div className="text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
                          {note.text}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-400 py-12 font-medium">
                      No history yet. Add a note above!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TASKS TAB */}
            {activeModalTab === "tasks" && (
              <div className="space-y-4">
                <div className="flex gap-3 mb-6">
                  <input
                    className="flex-1 border-2 border-slate-200 p-3.5 rounded-xl shadow-sm focus:border-[#D4A574] outline-none transition-colors font-medium"
                    placeholder="Add new task..."
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTask()}
                  />
                  <button
                    onClick={addTask}
                    className="bg-[#1a1a1a] text-[#D4A574] px-5 rounded-xl hover:bg-[#333] transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="space-y-3">
                  {selectedContact.tasks &&
                    selectedContact.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm"
                      >
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                            task.completed
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-slate-300"
                          }`}
                        >
                          {task.completed && <CheckCircle2 size={14} />}
                        </button>
                        <span
                          className={`font-medium ${
                            task.completed
                              ? "line-through text-slate-400"
                              : "text-slate-800"
                          }`}
                        >
                          {task.text}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* COMMS & DRIP TAB */}
            {activeModalTab === "comms" && (
              <div className="space-y-8">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl text-sm text-[#D4A574] flex items-start gap-3 shadow-lg">
                  <Bot className="shrink-0 mt-0.5" size={20} />
                  <p className="font-medium leading-relaxed">
                    Clicking a template below will automatically launch your
                    device's default Email or SMS application, pre-filled with
                    the contact's details.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4 uppercase tracking-widest text-xs">
                    <Send size={16} className="text-[#D4A574]" /> Email
                    Templates
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedContact.contactType === "Realtor" ? (
                      <a
                        href={`mailto:${selectedContact.email}?subject=Connecting with CBGC Mortgage&body=Hi ${selectedContact.contactName},%0D%0A%0D%0AI'd love to connect and see how CBGC Mortgage can help support your buyers...`}
                        className="bg-white border border-slate-200 p-4 rounded-xl hover:border-[#D4A574] hover:shadow-md transition-all flex items-center justify-between group"
                      >
                        <span className="font-bold text-slate-700">
                          1. Realtor Intro
                        </span>
                        <ChevronRight
                          size={18}
                          className="text-slate-400 group-hover:text-[#D4A574]"
                        />
                      </a>
                    ) : (
                      <a
                        href={`mailto:${selectedContact.email}?subject=Welcome to CBGC Mortgage!&body=Hi ${selectedContact.contactName},%0D%0A%0D%0AThank you for reaching out to CBGC Mortgage. We are excited to help you.%0D%0A%0D%0ALet me know a good time to call.%0D%0A%0D%0ABest,%0D%0AThe CBGC Team`}
                        className="bg-white border border-slate-200 p-4 rounded-xl hover:border-[#D4A574] hover:shadow-md transition-all flex items-center justify-between group"
                      >
                        <span className="font-bold text-slate-700">
                          1. Client Welcome / Intro Email
                        </span>
                        <ChevronRight
                          size={18}
                          className="text-slate-400 group-hover:text-[#D4A574]"
                        />
                      </a>
                    )}
                    <a
                      href={`mailto:${selectedContact.email}?subject=Happy Birthday from CBGC Mortgage!&body=Hi ${selectedContact.contactName},%0D%0A%0D%0AWishing you a wonderful birthday today!%0D%0A%0D%0ABest,%0D%0AThe CBGC Team`}
                      className="bg-white border border-slate-200 p-4 rounded-xl hover:border-[#D4A574] hover:shadow-md transition-all flex items-center justify-between group"
                    >
                      <span className="font-bold text-slate-700">
                        2. Happy Birthday Wish
                      </span>
                      <ChevronRight
                        size={18}
                        className="text-slate-400 group-hover:text-[#D4A574]"
                      />
                    </a>
                    <a
                      href={`mailto:${selectedContact.email}?subject=Checking In&body=Hi ${selectedContact.contactName},%0D%0A%0D%0AJust checking in to see if you had any questions...`}
                      className="bg-white border border-slate-200 p-4 rounded-xl hover:border-[#D4A574] hover:shadow-md transition-all flex items-center justify-between group"
                    >
                      <span className="font-bold text-slate-700">
                        3. General Check-in
                      </span>
                      <ChevronRight
                        size={18}
                        className="text-slate-400 group-hover:text-[#D4A574]"
                      />
                    </a>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4 uppercase tracking-widest text-xs mt-8">
                    <MessageCircle size={16} className="text-[#D4A574]" /> Text
                    (SMS) Templates
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    <a
                      href={`sms:${selectedContact.phone}?body=Hi ${selectedContact.contactName}, this is CBGC Mortgage. Do you have 5 mins to chat today?`}
                      className="bg-white border border-slate-200 p-4 rounded-xl hover:border-[#D4A574] hover:shadow-md transition-all flex items-center justify-between group"
                    >
                      <span className="font-bold text-slate-700">
                        1. Quick Check-in Text
                      </span>
                      <ChevronRight
                        size={18}
                        className="text-slate-400 group-hover:text-[#D4A574]"
                      />
                    </a>
                    <a
                      href={`sms:${selectedContact.phone}?body=Hi ${selectedContact.contactName}, great news! Just wanted to share a quick update.`}
                      className="bg-white border border-slate-200 p-4 rounded-xl hover:border-[#D4A574] hover:shadow-md transition-all flex items-center justify-between group"
                    >
                      <span className="font-bold text-slate-700">
                        2. Good News Text
                      </span>
                      <ChevronRight
                        size={18}
                        className="text-slate-400 group-hover:text-[#D4A574]"
                      />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* DETAILS & EDIT TAB */}
            {activeModalTab === "details" && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                      Primary Contact Name
                    </label>
                    <input
                      className="w-full border-b-2 border-slate-100 py-2 focus:outline-none focus:border-[#D4A574] font-bold text-lg transition-colors"
                      value={selectedContact.contactName}
                      onChange={(e) =>
                        updateContact(selectedContact.id, {
                          contactName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                        Email
                      </label>
                      <input
                        className="w-full border-b-2 border-slate-100 py-2 focus:outline-none focus:border-[#D4A574] transition-colors font-medium text-slate-800"
                        value={selectedContact.email}
                        onChange={(e) =>
                          updateContact(selectedContact.id, {
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                        Phone
                      </label>
                      <input
                        className="w-full border-b-2 border-slate-100 py-2 focus:outline-none focus:border-[#D4A574] transition-colors font-medium text-slate-800"
                        value={selectedContact.phone}
                        onChange={(e) =>
                          updateContact(selectedContact.id, {
                            phone: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                        Birthday (DOB)
                      </label>
                      <input
                        type="date"
                        className="w-full border-b-2 border-slate-100 py-2 focus:outline-none focus:border-[#D4A574] transition-colors font-medium text-slate-800"
                        value={selectedContact.dob}
                        onChange={(e) =>
                          updateContact(selectedContact.id, {
                            dob: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                        Spouse / Partner
                      </label>
                      <input
                        className="w-full border-b-2 border-slate-100 py-2 focus:outline-none focus:border-[#D4A574] transition-colors font-medium text-slate-800"
                        value={selectedContact.spouseName}
                        onChange={(e) =>
                          updateContact(selectedContact.id, {
                            spouseName: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="pt-6 mt-2 border-t border-slate-100">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">
                      Mailing Address
                    </label>
                    <input
                      className="w-full border-b-2 border-slate-100 py-2 mb-4 focus:outline-none focus:border-[#D4A574] placeholder-slate-300 transition-colors font-medium text-slate-800"
                      placeholder="Street Address"
                      value={selectedContact.address}
                      onChange={(e) =>
                        updateContact(selectedContact.id, {
                          address: e.target.value,
                        })
                      }
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <input
                        className="w-full border-b-2 border-slate-100 py-2 focus:outline-none focus:border-[#D4A574] placeholder-slate-300 transition-colors font-medium text-slate-800"
                        placeholder="City"
                        value={selectedContact.city}
                        onChange={(e) =>
                          updateContact(selectedContact.id, {
                            city: e.target.value,
                          })
                        }
                      />
                      <input
                        className="w-full border-b-2 border-slate-100 py-2 focus:outline-none focus:border-[#D4A574] placeholder-slate-300 transition-colors font-medium text-slate-800"
                        placeholder="State"
                        value={selectedContact.state}
                        onChange={(e) =>
                          updateContact(selectedContact.id, {
                            state: e.target.value,
                          })
                        }
                      />
                      <input
                        className="w-full border-b-2 border-slate-100 py-2 focus:outline-none focus:border-[#D4A574] placeholder-slate-300 transition-colors font-medium text-slate-800"
                        placeholder="Zip"
                        value={selectedContact.zip}
                        onChange={(e) =>
                          updateContact(selectedContact.id, {
                            zip: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-6 mt-2 border-t border-slate-100">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                        Contact Type
                      </label>
                      <select
                        className="w-full border-2 border-slate-100 py-2.5 px-3 rounded-xl bg-white focus:outline-none focus:border-[#D4A574] font-bold text-slate-700 transition-colors"
                        value={selectedContact.contactType}
                        onChange={(e) =>
                          updateContact(selectedContact.id, {
                            contactType: e.target.value,
                          })
                        }
                      >
                        <option value="Borrower">Borrower</option>
                        <option value="Realtor">Realtor</option>
                        <option value="Lender">Lender</option>
                        <option value="Other Partner">Other Partner</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                        Status
                      </label>
                      <select
                        className="w-full border-2 border-slate-100 py-2.5 px-3 rounded-xl bg-white focus:outline-none focus:border-[#D4A574] font-bold text-slate-700 transition-colors"
                        value={selectedContact.status}
                        onChange={(e) =>
                          updateContact(selectedContact.id, {
                            status: e.target.value,
                          })
                        }
                      >
                        {ALL_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Simplified tracking volume instead of heavy loan details */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-widest text-xs">
                    Business Tracking
                  </h4>
                  <div className="grid grid-cols-2 gap-6 pt-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                        Est. Vol / Loan Amt
                      </label>
                      <input
                        className="w-full border-b-2 border-slate-100 py-2 focus:outline-none focus:border-[#D4A574] font-bold text-slate-800 transition-colors"
                        value={selectedContact.estimatedVolume}
                        onChange={(e) =>
                          updateContact(selectedContact.id, {
                            estimatedVolume: handleCurrencyInput(
                              e.target.value
                            ),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                        Lead Source
                      </label>
                      <select
                        className="w-full border-b-2 border-slate-100 py-2 bg-white focus:outline-none focus:border-[#D4A574] font-medium text-slate-800 transition-colors"
                        value={selectedContact.leadSource}
                        onChange={(e) =>
                          updateContact(selectedContact.id, {
                            leadSource: e.target.value,
                          })
                        }
                      >
                        {SOURCES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deleteContact(selectedContact.id)}
                  className="w-full py-4 mt-6 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-transform hover:-translate-y-1"
                >
                  <Trash2 size={16} /> Delete Contact Forever
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
