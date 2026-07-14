import React, { useState } from "react";
import Head from "next/head";

// --- Design System Tokens (DESIGN.md) ---
const COLORS = {
  surfaceBase: "#F8F9FC",
  surfaceRaised: "#FFFFFF",
  inkPrimary: "#0F172A",
  inkSecondary: "#475569",
  inkDisabled: "#94A3B8",
  accentPrimary: "#2563EB",
  borderHairline: "#E2E8F0",
  
  colorKid1: "#3B82F6",
  colorKid2: "#EC4899",
  colorSwim: "#06B6D4",
  colorMusic: "#F59E0B",
  
  colorAlertRed: "#EF4444",
  colorAlertOrange: "#F97316",
  colorSuccessGreen: "#10B981",
};

const INITIAL_OFFERS = [
  { id: "o1", player: "Maya Mills", team: "Barca Academy U12 Soccer", amount: "$350.00", status: "Paid", tx: "ch_stripe_98234", updated: "2026-07-13" },
  { id: "o2", player: "Leo Mills", team: "Downtown Dance Studio Ballet Prep", amount: "$210.00", status: "Opened", tx: "-", updated: "2026-07-12" },
  { id: "o3", player: "Emma Watson", team: "Atlanta Swim Club Red", amount: "$150.00", status: "Sent", tx: "-", updated: "2026-07-13" },
  { id: "o4", player: "Jack Ryan", team: "Scout Troop 45 Patrol", amount: "$75.00", status: "Declined", tx: "-", updated: "2026-07-10" },
];

const INITIAL_LANES = [
  { lane: 1, swimmer: "Maya Mills", seed: "34.50s", touch: "34.12s", status: "Verified" },
  { lane: 2, swimmer: "Sarah Jenkins", seed: "35.10s", touch: "36.80s", status: "Touchpad Missed" },
  { lane: 3, swimmer: "Chloe Zhao", seed: "33.80s", touch: "33.65s", status: "Verified" },
  { lane: 4, swimmer: "Ashley Cole", seed: "36.20s", touch: "35.90s", status: "Verified" },
];

const MOCK_EVENTS = [
  {
    id: "e1",
    kid: "Maya",
    kidColor: COLORS.colorKid1,
    title: "Travel Soccer Practice",
    group: "Barca Academy U12",
    time: "4:00 PM - 5:30 PM",
    attire: "Blue Training Kit, shin guards, cleats, water",
    location: "Oak Park Field #4",
    lat: 33.7890,
    lng: -84.3879,
  },
  {
    id: "e2",
    kid: "Leo",
    kidColor: COLORS.colorKid2,
    title: "Ballet Recital Prep",
    group: "Downtown Dance Studio",
    time: "5:15 PM - 6:45 PM",
    attire: "Black leotard, pink tights, ballet shoes",
    location: "Symphony Hall entrance B",
    lat: 33.7899,
    lng: -84.3820,
    isConflict: true,
    conflictMsg: "Conflict: Tight Travel (Less than 10 mins buffer)",
  },
];

export default function Home() {
  // Tabs: "mobile_calendar" | "mobile_profiles" | "mobile_shifts" | "settings" | "ledger" | "operator"
  const [activeTab, setActiveTab] = useState<string>("mobile_calendar");
  
  // Roster profiles state (COPPA)
  const [parentName, setParentName] = useState("Dave Mills");
  const [parentEmail, setParentEmail] = useState("dave@getonsides.com");
  const [parentPhone, setParentPhone] = useState("(555) 304-9821");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [children, setChildren] = useState([
    { id: "1", name: "Maya", age: "11", coppa: true },
    { id: "2", name: "Leo", age: "8", coppa: true }
  ]);

  // Account Hierarchy & SSO settings state (Story 5.4, 5.5)
  const [activeRole, setActiveRole] = useState<"owner" | "coach" | "parent">("owner");
  const [ssoProvider, setSsoProvider] = useState<"google" | "apple" | null>(null);
  const [pushActive, setPushActive] = useState(true);
  const [smsActive, setSmsActive] = useState(true);
  const [appTheme, setAppTheme] = useState<"light" | "dark">("light");
  const [payoutConnected, setPayoutConnected] = useState(true);

  // Meet Operator State
  const [lanes, setLanes] = useState(INITIAL_LANES);
  const [touchpadOverride, setTouchpadOverride] = useState("");
  const [overrideLane, setOverrideLane] = useState<number | null>(null);

  // Volunteer Shift state
  const [shifts, setShifts] = useState([
    { id: "s1", role: "Timer - Shift 1 (Events 1-30)", time: "8:00 AM - 11:30 AM", claimed: false },
    { id: "s2", role: "Timer - Shift 2 (Events 31-60)", time: "11:30 AM - 2:00 PM", claimed: false },
    { id: "s3", role: "Clerk of Course", time: "8:00 AM - 1:00 PM", claimed: true }
  ]);

  const toggleShift = (id: string) => {
    setShifts(shifts.map(s => s.id === id ? { ...s, claimed: !s.claimed } : s));
  };

  const handleAddChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName || !childAge) return;

    const ageNum = parseInt(childAge, 10);
    const isCoppa = ageNum < 13;

    if (isCoppa) {
      const confirm = window.confirm(`COPPA compliance policy check:\nAdding ${childName} (Age ${childAge}) requires parental consent. They will be added as a passive sub-profile with zero direct login or chat credentials. Proceed?`);
      if (!confirm) return;
    }

    setChildren([...children, { id: Math.random().toString(), name: childName, age: childAge, coppa: isCoppa }]);
    setChildName("");
    setChildAge("");
  };

  const applyOverride = (laneNum: number) => {
    if (!touchpadOverride) return;
    setLanes(lanes.map(l => l.lane === laneNum ? { ...l, touch: touchpadOverride, status: "Operator Overridden ✓" } : l));
    setTouchpadOverride("");
    setOverrideLane(null);
  };

  const openGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, "_blank");
  };

  const triggerSSOLogin = (provider: "google" | "apple") => {
    setSsoProvider(provider);
    alert(`SSO Simulated Login: Authenticated successfully using ${provider === "google" ? "Google SSO API" : "Apple ID Token"}.`);
  };

  // Helper to determine if tab is locked based on active role
  const isTabLocked = (tab: string) => {
    if (tab === "ledger" && activeRole !== "owner") return true;
    if (tab === "operator" && activeRole === "parent") return true;
    return false;
  };

  return (
    <div style={{ ...styles.container, backgroundColor: appTheme === "dark" ? "#0F172A" : COLORS.surfaceBase, color: appTheme === "dark" ? "#F8F9FC" : COLORS.inkPrimary }}>
      <Head>
        <title>Omni Unified Activities Hub</title>
        <meta name="description" content="Unified client portal and supervisor dashboard." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* HEADER */}
      <header style={{ ...styles.header, backgroundColor: appTheme === "dark" ? "#1E293B" : COLORS.surfaceRaised, borderColor: appTheme === "dark" ? "#334155" : COLORS.borderHairline }}>
        <div style={styles.headerContent}>
          <span style={styles.logo}>Omni Hub</span>
          <span style={{ ...styles.badge, backgroundColor: COLORS.accentPrimary + "20" }}>
            Role Context: {activeRole.toUpperCase()}
          </span>
          {ssoProvider && (
            <span style={{ ...styles.badge, backgroundColor: COLORS.colorSuccessGreen + "20", color: COLORS.colorSuccessGreen }}>
              SSO Linked ({ssoProvider})
            </span>
          )}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main style={styles.main}>
        {/* TABS */}
        <div style={{ ...styles.tabContainer, borderColor: appTheme === "dark" ? "#334155" : COLORS.borderHairline }}>
          <button 
            style={activeTab === "mobile_calendar" ? styles.activeTabButton : styles.tabButton} 
            onClick={() => setActiveTab("mobile_calendar")}
          >
            📱 Parent Calendar
          </button>
          <button 
            style={activeTab === "mobile_profiles" ? styles.activeTabButton : styles.tabButton} 
            onClick={() => setActiveTab("mobile_profiles")}
          >
            👤 Roster & Profiles
          </button>
          <button 
            style={activeTab === "mobile_shifts" ? styles.activeTabButton : styles.tabButton} 
            onClick={() => setActiveTab("mobile_shifts")}
          >
            🙋 Volunteer Shifts
          </button>
          <button 
            style={activeTab === "settings" ? styles.activeTabButton : styles.tabButton} 
            onClick={() => setActiveTab("settings")}
          >
            ⚙️ Settings & SSO
          </button>
          <button 
            style={isTabLocked("ledger") ? styles.tabLockedButton : (activeTab === "ledger" ? styles.activeTabButton : styles.tabButton)} 
            onClick={() => {
              if (isTabLocked("ledger")) {
                alert("Access Denied: Stripe Placement Ledger is restricted to Activity Owners (CEOs). Change your role in the Settings tab to access.");
              } else {
                setActiveTab("ledger");
              }
            }}
          >
            📊 Stripe Ledger {isTabLocked("ledger") && "🔒"}
          </button>
          <button 
            style={isTabLocked("operator") ? styles.tabLockedButton : (activeTab === "operator" ? styles.activeTabButton : styles.tabButton)} 
            onClick={() => {
              if (isTabLocked("operator")) {
                alert("Access Denied: Computer Operator Deck Panel is restricted to Coaches and Owners. Change your role in the Settings tab to access.");
              } else {
                setActiveTab("operator");
              }
            }}
          >
            ⏱️ Operator Deck {isTabLocked("operator") && "🔒"}
          </button>
        </div>

        {/* --- TABS RENDERING --- */}

        {/* ⚙️ USER SETTINGS & SSO ROLES PANEL */}
        {activeTab === "settings" && (
          <div style={styles.splitView}>
            <div style={{ ...styles.card, backgroundColor: appTheme === "dark" ? "#1E293B" : COLORS.surfaceRaised, borderColor: appTheme === "dark" ? "#334155" : COLORS.borderHairline }}>
              <h2 style={{ ...styles.sectionTitle, color: appTheme === "dark" ? "#FFFFFF" : COLORS.inkPrimary }}>Account Configurations</h2>
              <p style={styles.sectionSubtitle}>Manage role privileges, single sign-on connections, and global preferences.</p>

              {/* SSO Configuration */}
              <div style={styles.settingsSection}>
                <h4 style={styles.settingsHeading}>Single Sign-On (SSO) Connection</h4>
                {ssoProvider ? (
                  <div style={styles.ssoStatusBox}>
                    <p style={{ margin: 0, fontWeight: "bold" }}>Linked successfully with {ssoProvider === "google" ? "Google Account" : "Apple ID"}</p>
                    <button style={styles.ssoDisconnectBtn} onClick={() => setSsoProvider(null)}>Disconnect SSO</button>
                  </div>
                ) : (
                  <div style={styles.ssoButtonGroup}>
                    <button style={styles.googleSsoBtn} onClick={() => triggerSSOLogin("google")}>
                      🌐 Continue with Google
                    </button>
                    <button style={styles.appleSsoBtn} onClick={() => triggerSSOLogin("apple")}>
                      🍎 Continue with Apple
                    </button>
                  </div>
                )}
              </div>

              {/* Role Context Hierarchy Selector */}
              <div style={styles.settingsSection}>
                <h4 style={styles.settingsHeading}>Active Role Context (Account Hierarchy)</h4>
                <p style={{ fontSize: "13px", color: COLORS.inkSecondary, margin: "0 0 12px 0" }}>
                  Switch your account context dynamically to test privilege boundaries on administrative views.
                </p>
                <select 
                  style={{ ...styles.dropdownInput, backgroundColor: appTheme === "dark" ? "#334155" : "#FFFFFF", color: appTheme === "dark" ? "#FFFFFF" : COLORS.inkPrimary }} 
                  value={activeRole} 
                  onChange={(e) => setActiveRole(e.target.value as any)}
                >
                  <option value="owner">Activity Owner (Soccer CEO / Dance Studio Owner) - All Access</option>
                  <option value="coach">Coach / Teacher - Restrict Billing/Ledger</option>
                  <option value="parent">Parent Profile - Read-only Timeline & Quotas</option>
                </select>
              </div>

              {/* Notification & Preference Attributes */}
              <div style={styles.settingsSection}>
                <h4 style={styles.settingsHeading}>Global Preferences</h4>
                
                <div style={styles.toggleRow}>
                  <span>Enable Push Notifications</span>
                  <input 
                    type="checkbox" 
                    checked={pushActive} 
                    onChange={(e) => setPushActive(e.target.checked)} 
                  />
                </div>

                <div style={styles.toggleRow}>
                  <span>Emergency SMS Announcements (SMS Bypass)</span>
                  <input 
                    type="checkbox" 
                    checked={smsActive} 
                    onChange={(e) => setSmsActive(e.target.checked)} 
                  />
                </div>

                <div style={styles.toggleRow}>
                  <span>Dark Mode Theme</span>
                  <input 
                    type="checkbox" 
                    checked={appTheme === "dark"} 
                    onChange={(e) => setAppTheme(e.target.checked ? "dark" : "light")} 
                  />
                </div>

                <div style={styles.toggleRow}>
                  <span>Stripe Payout Deposits (For Owners)</span>
                  <input 
                    type="checkbox" 
                    disabled={activeRole !== "owner"}
                    checked={payoutConnected && activeRole === "owner"} 
                    onChange={(e) => setPayoutConnected(e.target.checked)} 
                  />
                </div>
              </div>
            </div>

            <div style={{ ...styles.sideNotes, backgroundColor: appTheme === "dark" ? "#1E293B" : COLORS.surfaceRaised, borderColor: appTheme === "dark" ? "#334155" : COLORS.borderHairline }}>
              <h3 style={{ margin: "0 0 12px 0" }}>⚙️ SSO & Settings Hardening</h3>
              <ul>
                <li><strong>Dynamic Context Permissions</strong>: Changing your active role dropdown updates interface accessibility immediately (simulating backend RBAC validation).</li>
                <li><strong>OAuth Mock Tokens</strong>: Connecting Google/Apple triggers secure verification payloads in backend schemas.</li>
                <li><strong>Preference Storage</strong>: Notification preferences and HSTS dark modes parse directly to the user profile settings schema.</li>
              </ul>
            </div>
          </div>
        )}

        {/* 📱 PARENT MOBILE MASTER CALENDAR */}
        {activeTab === "mobile_calendar" && (
          <div style={styles.splitView}>
            <div style={styles.mobileContainer}>
              <div style={styles.mobileScreen}>
                <div style={styles.phoneHeader}>
                  <span>9:41</span>
                  <span>Omni App</span>
                  <span>🔋 100%</span>
                </div>

                <div style={styles.phoneContent}>
                  <h3 style={styles.phoneTitle}>Maya & Leo's Agenda</h3>
                  <p style={styles.phoneSubtitle}>Weekly consolidated schedule view</p>

                  <div style={styles.phoneAlertBanner}>
                    <strong>⚠️ Logistics Alert:</strong> Overlapping schedules detected. Tight travel warning active.
                  </div>

                  {MOCK_EVENTS.map((event) => (
                    <div key={event.id} style={styles.eventCard}>
                      <div style={{ ...styles.colorBar, backgroundColor: event.kidColor }} />
                      <div style={styles.eventInfo}>
                        <div style={styles.eventTopRow}>
                          <span style={styles.eventTitle}>{event.title}</span>
                          <span style={{ ...styles.kidBadge, color: event.kidColor, borderColor: event.kidColor }}>
                            {event.kid}
                          </span>
                        </div>
                        <p style={styles.eventText}>⏰ {event.time}</p>
                        <p style={styles.eventText}>👚 Gear: {event.attire}</p>
                        
                        <button 
                          style={styles.mapsButton}
                          onClick={() => openGoogleMaps(event.lat, event.lng)}
                        >
                          📍 Navigate to field: {event.location}
                        </button>

                        {event.isConflict && (
                          <div style={styles.tightTravelBox}>
                            <p style={styles.tightTravelText}>⚠️ {event.conflictMsg}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ ...styles.sideNotes, backgroundColor: appTheme === "dark" ? "#1E293B" : COLORS.surfaceRaised, borderColor: appTheme === "dark" ? "#334155" : COLORS.borderHairline }}>
              <h3 style={{ margin: "0 0 12px 0" }}>📱 Parent Mobile Calendar</h3>
              <p>This layout emulates the native mobile experience built in `apps/mobile`:</p>
              <ul>
                <li><strong>Unified Feed Timeline</strong>: iCal sources compile into a single timeline.</li>
                <li><strong>Color-Coding</strong>: Visual identifiers distinguish between different children.</li>
                <li><strong>Driving Distance checks</strong>: Estimates transit distance using the Haversine formula and checks drive times between slots.</li>
              </ul>
            </div>
          </div>
        )}

        {/* 👤 ROSTER & COPPA PROFILES */}
        {activeTab === "mobile_profiles" && (
          <div style={styles.splitView}>
            <div style={styles.mobileContainer}>
              <div style={styles.mobileScreen}>
                <div style={styles.phoneHeader}>
                  <span>9:41</span>
                  <span>Roster Setup</span>
                  <span>🔋 100%</span>
                </div>

                <div style={styles.phoneContent}>
                  <h3 style={styles.phoneTitle}>Account Profiles</h3>
                  <p style={styles.phoneSubtitle}>Manage parent identity and player accounts.</p>

                  <div style={styles.formCard}>
                    <h4>Parent Details</h4>
                    <p style={styles.detailsText}>Name: {parentName}</p>
                    <p style={styles.detailsText}>Email: {parentEmail}</p>
                    <p style={styles.detailsText}>Phone: {parentPhone}</p>
                  </div>

                  <form onSubmit={handleAddChild} style={styles.formCard}>
                    <h4 style={{ margin: "0 0 12px 0" }}>Add Child Sub-Profile</h4>
                    
                    <label style={styles.fieldLabel}>Name</label>
                    <input 
                      style={styles.fieldInput} 
                      placeholder="e.g. Maya"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                    />

                    <label style={styles.fieldLabel}>Age</label>
                    <input 
                      style={styles.fieldInput} 
                      placeholder="e.g. 11"
                      value={childAge}
                      onChange={(e) => setChildAge(e.target.value)}
                    />

                    <button type="submit" style={styles.formButton}>Create Player Profile</button>
                  </form>

                  <div style={styles.formCard}>
                    <h4 style={{ margin: "0 0 12px 0" }}>Active Players</h4>
                    {children.map((child) => (
                      <div key={child.id} style={styles.playerRow}>
                        <div>
                          <strong style={{ fontSize: "15px" }}>{child.name}</strong>
                          <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: COLORS.inkSecondary }}>
                            Age {child.age} • {child.coppa ? "COPPA Passive sub-profile" : "Standard profile"}
                          </p>
                        </div>
                        <span style={styles.checkBadge}>Active</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ ...styles.sideNotes, backgroundColor: appTheme === "dark" ? "#1E293B" : COLORS.surfaceRaised, borderColor: appTheme === "dark" ? "#334155" : COLORS.borderHairline }}>
              <h3 style={{ margin: "0 0 12px 0" }}>🔒 COPPA & Roster Segregation</h3>
              <p>Enforces strict child privacy rules at the profile and data tiers:</p>
              <ul>
                <li><strong>No Minor Accounts</strong>: Children under 13 cannot register login details, create message accounts, or access public profiles directly.</li>
                <li><strong>Consent Gates</strong>: Creating profiles for minors forces explicit parent consent boxes.</li>
              </ul>
            </div>
          </div>
        )}

        {/* 🙋 PARENT VOLUNTEER SHIFTS */}
        {activeTab === "mobile_shifts" && (
          <div style={styles.splitView}>
            <div style={styles.mobileContainer}>
              <div style={styles.mobileScreen}>
                <div style={styles.phoneHeader}>
                  <span>9:41</span>
                  <span>Volunteer Portal</span>
                  <span>🔋 100%</span>
                </div>

                <div style={styles.phoneContent}>
                  <h3 style={styles.phoneTitle}>Volunteer Shifts</h3>
                  <p style={styles.phoneSubtitle}>Each family must claim shifts to meet meet requirements.</p>

                  {shifts.map((shift) => (
                    <div key={shift.id} style={styles.shiftCard}>
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: "15px" }}>{shift.role}</strong>
                        <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: COLORS.inkSecondary }}>🕒 {shift.time}</p>
                      </div>
                      <button 
                        style={{
                          ...styles.claimBtn,
                          backgroundColor: shift.claimed ? COLORS.colorSuccessGreen : COLORS.surfaceBase,
                          color: shift.claimed ? "#FFFFFF" : COLORS.accentPrimary,
                          border: `1px solid ${shift.claimed ? COLORS.colorSuccessGreen : COLORS.accentPrimary}`,
                        }}
                        onClick={() => toggleShift(shift.id)}
                      >
                        {shift.claimed ? "Claimed ✓" : "Claim"}
                      </button>
                    </div>
                  ))}

                  <div style={styles.quotaBox}>
                    <strong style={{ fontSize: "14px" }}>Volunteer Quota status</strong>
                    <p style={{ fontSize: "12px", margin: "4px 0", color: COLORS.inkSecondary }}>
                      Swimmer Count: 2 • Shifts Required: 2 • Shifts Claimed: {shifts.filter(s => s.claimed).length}
                    </p>
                    <div style={{
                      fontWeight: "bold",
                      fontSize: "14px",
                      color: shifts.filter(s => s.claimed).length >= 2 ? COLORS.colorSuccessGreen : COLORS.colorAlertRed
                    }}>
                      {shifts.filter(s => s.claimed).length >= 2 ? "✅ Quotas complete! Meet entries authorized." : "❌ Quota Incomplete"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ ...styles.sideNotes, backgroundColor: appTheme === "dark" ? "#1E293B" : COLORS.surfaceRaised, borderColor: appTheme === "dark" ? "#334155" : COLORS.borderHairline }}>
              <h3 style={{ margin: "0 0 12px 0" }}>🏊 Swim Meet Quotas</h3>
              <p>Coordinates volunteer roles for meets dynamically:</p>
              <ul>
                <li><strong>Quotas enforcement</strong>: System calculates quota parameters based on registered player entries.</li>
                <li><strong>Automatic Locking</strong>: Blocks parent declarations and swimmer entries until volunteer quotas are fully claimed.</li>
              </ul>
            </div>
          </div>
        )}

        {/* 📊 STRIPE PLACEMENT LEDGER (CEO) */}
        {activeTab === "ledger" && (
          <section style={{ ...styles.section, backgroundColor: appTheme === "dark" ? "#1E293B" : COLORS.surfaceRaised, borderColor: appTheme === "dark" ? "#334155" : COLORS.borderHairline }}>
            <h2 style={styles.sectionTitle}>Digital Offers Status Log</h2>
            <p style={styles.sectionSubtitle}>Real-time transaction ledgers linked with Stripe webhooks for program placements.</p>

            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.tableHeader}>Player</th>
                  <th style={styles.tableHeader}>Activity Group</th>
                  <th style={styles.tableHeader}>Program Fee</th>
                  <th style={styles.tableHeader}>Status</th>
                  <th style={styles.tableHeader}>Stripe Transaction ID</th>
                  <th style={styles.tableHeader}>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {INITIAL_OFFERS.map((offer) => (
                  <tr key={offer.id} style={{ ...styles.tableRow, borderColor: appTheme === "dark" ? "#334155" : COLORS.borderHairline }}>
                    <td style={styles.tableCell}><strong>{offer.player}</strong></td>
                    <td style={styles.tableCell}>{offer.team}</td>
                    <td style={styles.tableCell}>{offer.amount}</td>
                    <td style={styles.tableCell}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: 
                          offer.status === "Paid" ? COLORS.colorSuccessGreen + "20" :
                          offer.status === "Opened" ? COLORS.colorAlertOrange + "20" :
                          offer.status === "Sent" ? COLORS.accentPrimary + "20" :
                          COLORS.colorAlertRed + "20",
                        color:
                          offer.status === "Paid" ? COLORS.colorSuccessGreen :
                          offer.status === "Opened" ? COLORS.colorAlertOrange :
                          offer.status === "Sent" ? COLORS.accentPrimary :
                          COLORS.colorAlertRed,
                      }}>
                        {offer.status}
                      </span>
                    </td>
                    <td style={styles.tableCell}>{offer.tx}</td>
                    <td style={styles.tableCell}>{offer.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* ⏱️ MEET OPERATOR PANEL */}
        {activeTab === "operator" && (
          <section style={{ ...styles.section, backgroundColor: appTheme === "dark" ? "#1E293B" : COLORS.surfaceRaised, borderColor: appTheme === "dark" ? "#334155" : COLORS.borderHairline }}>
            <div style={styles.operatorHeader}>
              <div>
                <h2 style={styles.sectionTitle}>High-Privilege Deck Control</h2>
                <p style={styles.sectionSubtitle}>Synergy Swim Touchpad Integration. Seed adjustments, scratches, and time overrides.</p>
              </div>
              <span style={styles.liveIndicator}>● LIVE TIMING STREAM</span>
            </div>

            <div style={{ ...styles.card, backgroundColor: appTheme === "dark" ? "#0F172A" : COLORS.surfaceBase, borderColor: appTheme === "dark" ? "#334155" : COLORS.borderHairline }}>
              <h3 style={styles.cardTitle}>Event 12: Girls 11-12 50 Long Course Backstroke</h3>
              <p style={styles.cardSubtitle}>Heat 3 of 4 (Touchpad Console Stream)</p>

              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.tableHeader}>Lane</th>
                    <th style={styles.tableHeader}>Swimmer</th>
                    <th style={styles.tableHeader}>Seed Time</th>
                    <th style={styles.tableHeader}>Touch Time</th>
                    <th style={styles.tableHeader}>Status</th>
                    <th style={styles.tableHeader}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lanes.map((lane) => (
                    <tr key={lane.lane} style={{ ...styles.tableRow, borderColor: appTheme === "dark" ? "#334155" : COLORS.borderHairline }}>
                      <td style={styles.tableCell}><strong>Lane {lane.lane}</strong></td>
                      <td style={styles.tableCell}>{lane.swimmer}</td>
                      <td style={styles.tableCell}>{lane.seed}</td>
                      <td style={styles.tableCell}>
                        <span style={lane.status === "Touchpad Missed" ? { color: COLORS.colorAlertRed, fontWeight: "bold" } : {}}>
                          {lane.touch}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        <span style={{
                          fontWeight: "bold",
                          color: lane.status === "Verified" ? COLORS.colorSuccessGreen : COLORS.colorAlertRed
                        }}>
                          {lane.status}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        {overrideLane === lane.lane ? (
                          <div style={styles.inlineForm}>
                            <input
                              style={styles.inlineInput}
                              placeholder="e.g., 34.82s"
                              value={touchpadOverride}
                              onChange={(e) => setTouchpadOverride(e.target.value)}
                            />
                            <button style={styles.saveButton} onClick={() => applyOverride(lane.lane)}>Save</button>
                            <button style={styles.cancelButton} onClick={() => setOverrideLane(null)}>X</button>
                          </div>
                        ) : (
                          <button style={styles.overrideButton} onClick={() => setOverrideLane(lane.lane)}>
                            Override Time
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "system-ui, -apple-system, sans-serif",
    minHeight: "100vh",
    transition: "background-color 0.2s ease, color 0.2s ease",
  },
  header: {
    borderBottom: "1px solid",
    padding: "0 40px",
    height: "70px",
    display: "flex",
    alignItems: "center",
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  logo: {
    fontSize: "24px",
    fontWeight: 900,
    letterSpacing: "-0.5px",
  },
  badge: {
    color: COLORS.accentPrimary,
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "bold" as "bold",
  },
  main: {
    maxWidth: "1200px",
    margin: "40px auto",
    padding: "0 20px",
  },
  tabContainer: {
    display: "flex",
    gap: "8px",
    marginBottom: "32px",
    borderBottom: "2px solid",
    paddingBottom: "8px",
    flexWrap: "wrap" as "wrap",
  },
  tabButton: {
    background: "none",
    border: "none",
    padding: "12px 18px",
    fontSize: "15px",
    fontWeight: 600,
    color: COLORS.inkSecondary,
    cursor: "pointer",
    borderRadius: "8px",
  },
  tabLockedButton: {
    background: "none",
    border: "none",
    padding: "12px 18px",
    fontSize: "15px",
    fontWeight: 600,
    color: COLORS.inkDisabled,
    cursor: "not-allowed" as "not-allowed",
    borderRadius: "8px",
    opacity: 0.5,
  },
  activeTabButton: {
    background: COLORS.accentPrimary,
    border: "none",
    padding: "12px 18px",
    fontSize: "15px",
    fontWeight: 700,
    color: "#FFFFFF",
    cursor: "pointer",
    borderRadius: "8px",
  },
  splitView: {
    display: "grid",
    gridTemplateColumns: "380px 1fr",
    gap: "40px",
    alignItems: "start",
  },
  mobileContainer: {
    display: "flex",
    justifyContent: "center",
    backgroundColor: "#1E293B",
    padding: "16px 12px 24px 12px",
    borderRadius: "44px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
  },
  mobileScreen: {
    width: "350px",
    height: "640px",
    backgroundColor: COLORS.surfaceBase,
    borderRadius: "32px",
    overflow: "hidden" as "hidden",
    border: "2px solid #0F172A",
    display: "flex",
    flexDirection: "column" as "column",
    color: COLORS.inkPrimary,
  },
  phoneHeader: {
    height: "36px",
    backgroundColor: "#FFFFFF",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px",
    fontSize: "12px",
    fontWeight: "bold",
    color: COLORS.inkSecondary,
    borderBottom: `1px solid ${COLORS.borderHairline}`,
  },
  phoneContent: {
    flex: 1,
    padding: "16px",
    overflowY: "auto" as "auto",
  },
  phoneTitle: {
    fontSize: "22px",
    fontWeight: 800,
    margin: "0 0 4px 0",
  },
  phoneSubtitle: {
    fontSize: "13px",
    color: COLORS.inkSecondary,
    margin: "0 0 16px 0",
  },
  phoneAlertBanner: {
    backgroundColor: "#FEE2E2",
    border: `1px solid #FCA5A5`,
    color: COLORS.colorAlertRed,
    padding: "10px",
    borderRadius: "8px",
    fontSize: "12px",
    marginBottom: "16px",
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "10px",
    border: `1px solid ${COLORS.borderHairline}`,
    marginBottom: "12px",
    display: "flex",
    overflow: "hidden",
  },
  colorBar: {
    width: "5px",
    height: "100%",
  },
  eventInfo: {
    flex: 1,
    padding: "12px",
  },
  eventTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px",
  },
  eventTitle: {
    fontWeight: 800,
    fontSize: "15px",
  },
  kidBadge: {
    fontSize: "11px",
    fontWeight: "bold",
    padding: "2px 6px",
    borderRadius: "4px",
    border: "1px solid",
  },
  eventText: {
    margin: "4px 0",
    fontSize: "13px",
    color: COLORS.inkSecondary,
  },
  mapsButton: {
    background: "none",
    border: "none",
    color: COLORS.accentPrimary,
    fontWeight: "bold",
    fontSize: "13px",
    padding: "8px 0",
    cursor: "pointer",
    textAlign: "left" as "left",
  },
  tightTravelBox: {
    backgroundColor: "#FFEDD5",
    border: "1px solid #FED7AA",
    borderRadius: "6px",
    padding: "8px",
    marginTop: "8px",
  },
  tightTravelText: {
    color: COLORS.colorAlertOrange,
    fontWeight: "bold",
    fontSize: "11px",
    margin: 0,
  },
  sideNotes: {
    borderRadius: "16px",
    padding: "32px",
    border: "1px solid",
  },
  card: {
    borderRadius: "16px",
    padding: "32px",
    border: "1px solid",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "10px",
    padding: "16px",
    border: `1px solid ${COLORS.borderHairline}`,
    marginBottom: "12px",
    color: COLORS.inkPrimary,
  },
  detailsText: {
    margin: "4px 0",
    fontSize: "13px",
    color: COLORS.inkSecondary,
  },
  fieldLabel: {
    display: "block",
    fontSize: "12px",
    fontWeight: 700,
    marginBottom: "4px",
    color: COLORS.inkSecondary,
  },
  fieldInput: {
    width: "100%",
    padding: "8px",
    borderRadius: "6px",
    border: `1px solid ${COLORS.borderHairline}`,
    marginBottom: "12px",
    boxSizing: "border-box" as "border-box",
  },
  formButton: {
    width: "100%",
    backgroundColor: COLORS.accentPrimary,
    color: "#FFFFFF",
    border: "none",
    padding: "10px",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  playerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: `1px solid ${COLORS.borderHairline}`,
  },
  checkBadge: {
    backgroundColor: COLORS.colorSuccessGreen + "15",
    color: COLORS.colorSuccessGreen,
    fontSize: "11px",
    fontWeight: "bold",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  shiftCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "10px",
    border: `1px solid ${COLORS.borderHairline}`,
    padding: "12px",
    display: "flex",
    alignItems: "center",
    marginBottom: "12px",
    color: COLORS.inkPrimary,
  },
  claimBtn: {
    padding: "8px 16px",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "13px",
  },
  quotaBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: "10px",
    border: `1px solid ${COLORS.borderHairline}`,
    padding: "16px",
    alignItems: "center",
    textAlign: "center" as "center",
    color: COLORS.inkPrimary,
  },
  section: {
    borderRadius: "16px",
    padding: "32px",
    border: "1px solid",
  },
  sectionTitle: {
    fontSize: "24px",
    fontWeight: 800,
    margin: "0 0 8px 0",
  },
  sectionSubtitle: {
    fontSize: "16px",
    color: COLORS.inkSecondary,
    margin: "0 0 24px 0",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as "collapse",
    textAlign: "left" as "left",
  },
  tableHeaderRow: {
    borderBottom: `2px solid ${COLORS.borderHairline}`,
  },
  tableHeader: {
    padding: "16px",
    fontWeight: 700,
    fontSize: "14px",
    color: COLORS.inkSecondary,
  },
  tableRow: {
    borderBottom: "1px solid",
  },
  tableCell: {
    padding: "16px",
    fontSize: "15px",
  },
  statusBadge: {
    padding: "4px 8px",
    borderRadius: "6px",
    fontWeight: 700,
    fontSize: "13px",
    display: "inline-block" as "inline-block",
  },
  operatorHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  liveIndicator: {
    color: COLORS.colorAlertRed,
    fontWeight: 800,
    fontSize: "14px",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: 700,
    margin: "0 0 4px 0",
  },
  cardSubtitle: {
    fontSize: "14px",
    color: COLORS.inkSecondary,
    margin: "0 0 20px 0",
  },
  overrideButton: {
    backgroundColor: COLORS.surfaceRaised,
    border: `1px solid ${COLORS.borderHairline}`,
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    color: COLORS.inkPrimary,
  },
  inlineForm: {
    display: "flex",
    gap: "8px",
  },
  inlineInput: {
    padding: "6px",
    border: `1px solid ${COLORS.borderHairline}`,
    borderRadius: "4px",
    fontSize: "13px",
    width: "80px",
    color: COLORS.inkPrimary,
  },
  saveButton: {
    backgroundColor: COLORS.colorSuccessGreen,
    color: "#FFFFFF",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: COLORS.colorAlertRed,
    color: "#FFFFFF",
    border: "none",
    padding: "6px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "bold",
  },
  settingsSection: {
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: `1px solid ${COLORS.borderHairline}`,
  },
  settingsHeading: {
    fontSize: "16px",
    fontWeight: 700,
    margin: "0 0 8px 0",
  },
  ssoButtonGroup: {
    display: "flex",
    flexDirection: "column" as "column",
    gap: "10px",
    maxWidth: "280px",
  },
  googleSsoBtn: {
    backgroundColor: "#FFFFFF",
    color: COLORS.inkPrimary,
    border: `1px solid ${COLORS.borderHairline}`,
    padding: "10px",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
    textAlign: "left" as "left",
  },
  appleSsoBtn: {
    backgroundColor: "#000000",
    color: "#FFFFFF",
    border: "none",
    padding: "10px",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
    textAlign: "left" as "left",
  },
  ssoStatusBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.colorSuccessGreen + "15",
    padding: "12px",
    borderRadius: "8px",
    color: COLORS.colorSuccessGreen,
    fontSize: "14px",
  },
  ssoDisconnectBtn: {
    backgroundColor: COLORS.colorAlertRed,
    color: "#FFFFFF",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "12px",
  },
  dropdownInput: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: `1px solid ${COLORS.borderHairline}`,
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  toggleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    fontSize: "14px",
  },
};
