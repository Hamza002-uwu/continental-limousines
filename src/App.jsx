import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════
   SUPABASE – pour connecter la vraie base de données,
   remplace ces lignes par ton URL + anon key Supabase :
   import { createClient } from '@supabase/supabase-js'
   const supabase = createClient('https://xxx.supabase.co', 'anon-key')
═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   COMPTES (simulation – en prod : Supabase Auth)
═══════════════════════════════════════════════════════════ */
const ACCOUNTS = [
  { id:"a1", email:"admin@continental-limousines.fr",    password:"CL-Admin2024!",  role:"admin",      name:"Direction CL",     avatar:"DI" },
  { id:"a2", email:"dispatch@continental-limousines.fr", password:"CL-Dispatch!",   role:"dispatcher", name:"Centre Dispatch",  avatar:"CD" },
  { id:"a3", email:"ops@continental-limousines.fr",      password:"CL-Ops2024!",    role:"admin",      name:"Ops Manager",      avatar:"OM" },
  { id:"d1", email:"k.benali@continental-limousines.fr", password:"KB-driver!",     role:"driver",     name:"Karim Benali",     avatar:"KB", driverId:1 },
  { id:"d2", email:"s.merabt@continental-limousines.fr", password:"SM-driver!",     role:"driver",     name:"Sofiane Merabt",   avatar:"SM", driverId:2 },
  { id:"d3", email:"y.haddad@continental-limousines.fr", password:"YH-driver!",     role:"driver",     name:"Youssef Haddad",   avatar:"YH", driverId:3 },
  { id:"d4", email:"m.tahar@continental-limousines.fr",  password:"MT-driver!",     role:"driver",     name:"Mehdi Tahar",      avatar:"MT", driverId:4 },
  { id:"c1", email:"l.dupont@client.fr",                 password:"Dupont2024!",    role:"client",     name:"M. Laurent Dupont",avatar:"LD", clientId:3 },
  { id:"c2", email:"techcorp@client.fr",                 password:"TechCorp2024!",  role:"client",     name:"TechCorp SA",      avatar:"TC", clientId:4 },
];

const VEHICLES = [
  { name:"Class S",      icon:"S",  desc:"Berline prestige",  cap:"3 pass.", tag:"VIP",      coords:[48.8566,2.3522] },
  { name:"Class E",      icon:"E",  desc:"Berline executive", cap:"3 pass.", tag:"Business", coords:[48.8606,2.3376] },
  { name:"Class V",      icon:"V",  desc:"Van VIP",           cap:"7 pass.", tag:"Groupe",   coords:[48.8738,2.2950] },
  { name:"Class C",      icon:"C",  desc:"Berline compacte",  cap:"3 pass.", tag:"Standard", coords:[48.8450,2.3700] },
  { name:"Maybach",      icon:"M",  desc:"Ultra-prestige",    cap:"3 pass.", tag:"Prestige", coords:[48.8700,2.3100] },
  { name:"EQV Electric", icon:"⚡", desc:"Van électrique",    cap:"7 pass.", tag:"Éco",      coords:[48.8520,2.3400] },
  { name:"Sprinter VIP", icon:"SP", desc:"Minibus luxe",      cap:"14 pass.",tag:"Groupe+",  coords:[48.8650,2.3600] },
  { name:"Vito",         icon:"VI", desc:"Van compact",       cap:"5 pass.", tag:"Compact",  coords:[48.8580,2.3300] },
];

const INIT_DRIVERS = [
  { id:1, name:"Karim Benali",   phone:"+33 6 12 34 56 78", vehicle:"Class S", plate:"AB-123-CD", license:"PRO-B123456", licenseExp:"2028-03-15", avatar:"KB", status:"available", rating:4.9, trips:142, earnings:18650, joined:"2022-01-10", lat:49.0097, lng:2.5479 },
  { id:2, name:"Sofiane Merabt", phone:"+33 6 98 76 54 32", vehicle:"Class E", plate:"EF-456-GH", license:"PRO-C789012", licenseExp:"2027-09-20", avatar:"SM", status:"available", rating:4.7, trips:98,  earnings:12400, joined:"2022-06-05", lat:48.8698, lng:2.3078 },
  { id:3, name:"Youssef Haddad", phone:"+33 6 55 44 33 22", vehicle:"Class V", plate:"IJ-789-KL", license:"PRO-D345678", licenseExp:"2026-11-30", avatar:"YH", status:"busy",      rating:4.8, trips:207, earnings:29800, joined:"2021-08-18", lat:48.7262, lng:2.3652 },
  { id:4, name:"Mehdi Tahar",    phone:"+33 6 11 22 33 44", vehicle:"Maybach", plate:"MN-012-OP", license:"PRO-E901234", licenseExp:"2029-05-01", avatar:"MT", status:"available", rating:5.0, trips:315, earnings:52100, joined:"2020-03-01", lat:48.9243, lng:2.3601 },
];

const INIT_MISSIONS = []; // Les missions viennent maintenant de Supabase

const SUPABASE_URL      = "https://oiksltqjynwfxvvldflt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_9sDDHh1XJwNTxHd8uIkt3A_pg_RShPX";
const SUPABASE_SVC_KEY  = "sb_secret_JZKhfoerRt5k-LPCsi2PAg_lA-GC2z3";

// Hook pour charger et gérer les missions depuis Supabase
const useMissions = () => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading]   = useState(true);

  const loadMissions = async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/missions?select=*&order=created_at.desc`, {
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Normalise les champs Supabase vers le format de l'app
        const normalized = data.map(m => ({
          id:         m.id,
          title:      m.title,
          client:     m.client,
          clientId:   m.client_id || null,
          pickup:     m.pickup,
          dropoff:    m.dropoff,
          date:       m.date,
          time:       m.time,
          vehicle:    m.vehicle,
          price:      m.price,
          distance:   m.distance,
          notes:      m.notes,
          status:     m.status || "pending",
          driverId:   m.driver_id || null,
          driverEmail:m.driver_email || null,
          pickupLat:  49.0097, pickupLng: 2.5479,
          dropLat:    48.8698, dropLng:   2.3078,
          createdAt:  m.created_at,
        }));
        setMissions(normalized);
      }
    } catch(e) { console.error("loadMissions:", e); }
    setLoading(false);
  };

  const createMission = async (form) => {
    const payload = {
      title:    form.title,
      client:   form.client,
      pickup:   form.pickup,
      dropoff:  form.dropoff,
      date:     form.date,
      time:     form.time,
      vehicle:  form.vehicle,
      price:    Number(form.price),
      distance: form.distance,
      notes:    form.notes,
      status:   "pending",
    };
    const res = await fetch(`${SUPABASE_URL}/rest/v1/missions`, {
      method: "POST",
      headers: {
        "apikey":        SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type":  "application/json",
        "Prefer":        "return=minimal",
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) await loadMissions();
    return res.ok;
  };

  const updateMission = async (id, updates) => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/update_mission_status`, {
      method: "POST",
      headers: {
        "apikey":        SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        mission_id:        id,
        new_status:        updates.status,
        new_driver_email:  updates.driverEmail || null,
      }),
    });
    console.log("updateMission RPC:", res.status);
    await loadMissions();
  };

  useEffect(() => { loadMissions(); }, []);

  return { missions, loading, loadMissions, createMission, updateMission, setMissions };
};

const INIT_MSGS = [
  { id:1, from:"CD", fromName:"Dispatch", to:"KB", toName:"Karim Benali", text:"Karim, le client CDG attend au niveau 2 sortie D.", time:"09:45", read:true },
  { id:2, from:"KB", fromName:"Karim Benali", to:"CD", toName:"Dispatch", text:"Reçu, je suis en route, ETA 15min.", time:"09:47", read:true },
  { id:3, from:"CD", fromName:"Dispatch", to:"KB", toName:"Karim Benali", text:"Parfait. N'oublie pas le panneau nominatif.", time:"09:48", read:false },
];

/* ═══════════════════════════════════════════════════════════  TOKENS  */
const G = "#C9A84C";
const GG = "linear-gradient(135deg,#7A5C10,#C9A84C,#F0D878,#C9A84C,#7A5C10)";
const BG = "#050505";

const STATUS = {
  pending:   { label:"En attente", color:"#C9A84C", bg:"rgba(201,168,76,0.12)"  },
  accepted:  { label:"Acceptée",   color:"#60A5FA", bg:"rgba(96,165,250,0.12)"  },
  assigned:  { label:"Way-Plan ✓", color:"#A78BFA", bg:"rgba(167,139,250,0.12)" },
  completed: { label:"Terminée",   color:"#34D399", bg:"rgba(52,211,153,0.12)"  },
  refused:   { label:"Refusée",    color:"#F87171", bg:"rgba(248,113,113,0.12)" },
};

/* ═══════════════════════════════════════════════════════════  ATOMS  */
const CLLogo = ({ size="md" }) => {
  const fs = { lg:78, md:34, sm:22 }[size] || 34;
  const sw = { lg:18, md:11, sm:8  }[size] || 11;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:size==="lg"?"center":"flex-start" }}>
      <div style={{ fontFamily:"'Didot','Bodoni MT','Playfair Display',Georgia,serif", fontSize:fs, fontWeight:700, color:"#fff", lineHeight:.9, letterSpacing:"-2px", position:"relative", display:"inline-block" }}>
        CL
        <span style={{ position:"absolute", top: size==="lg"?-8:-4, right: size==="lg"?-22:-12, display:"flex", flexDirection:"column", gap:1 }}>
          {[.9,.6,.35].map((op,i)=>(
            <svg key={i} width={sw-i*3} height={sw-i*3} viewBox="0 0 14 14" style={{ marginLeft:i*2 }}>
              <path d="M7 0L8.5 5H14L9.5 8L11 13L7 10L3 13L4.5 8L0 5H5.5Z" fill="white" opacity={op}/>
            </svg>
          ))}
        </span>
      </div>
      {size!=="sm" && <div style={{ fontSize:size==="lg"?11:7, letterSpacing:"0.2em", color:"rgba(255,255,255,0.5)", textTransform:"uppercase", marginTop:size==="lg"?10:3, fontFamily:"Georgia,serif" }}>Continental Limousines</div>}
    </div>
  );
};

const Badge = ({ status }) => {
  const s = STATUS[status]||STATUS.pending;
  return <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:9, fontWeight:700, letterSpacing:"0.1em", padding:"3px 9px", borderRadius:20, color:s.color, background:s.bg, border:`1px solid ${s.color}35`, textTransform:"uppercase", whiteSpace:"nowrap", fontFamily:"Georgia,serif" }}>
    <span style={{ width:5,height:5,borderRadius:"50%",background:s.color,display:"inline-block" }}/>{s.label}
  </span>;
};

const Av = ({ txt, size=40, color=G }) => (
  <div style={{ width:size, height:size, borderRadius:"50%", background:"linear-gradient(135deg,#1a1408,#2a2010)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*.3, fontWeight:700, color, flexShrink:0, border:`1.5px solid ${color}40`, fontFamily:"Georgia,serif" }}>{txt}</div>
);

const Card = ({ children, glow=false, style={} }) => (
  <div style={{ background:"rgba(255,255,255,0.025)", border:`1px solid ${glow?G+"45":"rgba(255,255,255,0.07)"}`, borderRadius:18, padding:"16px 18px", marginBottom:10, boxShadow:glow?`0 0 24px ${G}12`:"none", ...style }}>{children}</div>
);

const Inp = ({ label, error, ...p }) => {
  const [f,setF] = useState(false);
  return <div style={{ marginBottom:12 }}>
    {label && <div style={{ fontSize:9, color:`${G}90`, marginBottom:5, textTransform:"uppercase", letterSpacing:"0.12em", fontFamily:"Georgia,serif" }}>{label}</div>}
    <input {...p} onFocus={e=>{setF(true);p.onFocus?.(e)}} onBlur={e=>{setF(false);p.onBlur?.(e)}}
      style={{ width:"100%", padding:"11px 14px", background:"rgba(255,255,255,0.04)", border:`1px solid ${error?"#F87171":f?G+"60":"rgba(255,255,255,0.1)"}`, borderRadius:12, color:"#fff", fontSize:14, boxSizing:"border-box", outline:"none", fontFamily:"Georgia,serif", transition:"border-color .2s", ...p.style }}/>
    {error && <div style={{ fontSize:11, color:"#F87171", marginTop:4 }}>{error}</div>}
  </div>;
};

const Sel = ({ label, children, ...p }) => (
  <div style={{ marginBottom:12 }}>
    {label && <div style={{ fontSize:9, color:`${G}90`, marginBottom:5, textTransform:"uppercase", letterSpacing:"0.12em", fontFamily:"Georgia,serif" }}>{label}</div>}
    <select {...p} style={{ width:"100%", padding:"11px 14px", background:"#0d0d0d", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, color:"#fff", fontSize:14, boxSizing:"border-box", outline:"none", fontFamily:"Georgia,serif" }}>{children}</select>
  </div>
);

const Btn = ({ children, onClick, v="gold", disabled=false, style={} }) => {
  const S = { gold:{background:GG,color:"#080604",border:"none"}, outline:{background:"transparent",color:G,border:`1px solid ${G}50`}, danger:{background:"rgba(239,68,68,0.12)",color:"#F87171",border:"1px solid rgba(239,68,68,0.3)"}, success:{background:"linear-gradient(135deg,#064E3B,#059669)",color:"#fff",border:"none"}, ghost:{background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.5)",border:"1px solid rgba(255,255,255,0.09)"} };
  return <button onClick={onClick} disabled={disabled} style={{ padding:"12px 18px", borderRadius:13, fontWeight:700, fontSize:13, cursor:disabled?"not-allowed":"pointer", fontFamily:"Georgia,serif", letterSpacing:"0.05em", width:"100%", opacity:disabled?.4:1, transition:"all .2s", ...S[v], ...style }}>{children}</button>;
};

const SecTitle = ({ icon, children, sub }) => (
  <div style={{ marginBottom:14 }}>
    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
      {icon && <span style={{ color:G, fontSize:12 }}>{icon}</span>}
      <span style={{ fontSize:10, fontWeight:700, color:`${G}CC`, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:"Georgia,serif" }}>{children}</span>
    </div>
    {sub && <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:3 }}>{sub}</div>}
  </div>
);

const Divider = () => (
  <div style={{ display:"flex", alignItems:"center", gap:10, margin:"14px 0" }}>
    <div style={{ flex:1, height:1, background:`linear-gradient(to right,transparent,${G}25)` }}/>
    <div style={{ width:3,height:3,background:G,transform:"rotate(45deg)",opacity:.4 }}/>
    <div style={{ flex:1, height:1, background:`linear-gradient(to left,transparent,${G}25)` }}/>
  </div>
);

const Dot = ({ on }) => <div style={{ width:8,height:8,borderRadius:"50%",background:on?"#34D399":"#F59E0B",boxShadow:`0 0 7px ${on?"#34D399":"#F59E0B"}`,flexShrink:0 }}/>;

const Toast = ({ msg, type="success" }) => (
  <div style={{ position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:9999,background:"rgba(8,6,4,.97)",border:`1px solid ${type==="success"?G:"#F87171"}60`,color:type==="success"?G:"#F87171",padding:"11px 26px",borderRadius:30,fontWeight:700,fontSize:13,display:"flex",gap:9,alignItems:"center",fontFamily:"Georgia,serif",letterSpacing:".04em",boxShadow:`0 8px 40px ${type==="success"?G:"#F87171"}20`,whiteSpace:"nowrap",backdropFilter:"blur(20px)",animation:"toastIn .3s ease" }}>
    <span>{type==="success"?"✦":"✕"}</span>{msg}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   NOTIFICATION PUSH (Web Notifications API)
═══════════════════════════════════════════════════════════ */
const requestNotifPermission = async () => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const p = await Notification.requestPermission();
  return p === "granted";
};

const sendPushNotif = (title, body, icon="VTC") => {
  if (Notification.permission === "granted") {
    new Notification(`${icon} ${title}`, { body, icon:"/favicon.ico", badge:"/favicon.ico", vibrate:[200,100,200] });
  }
  // Vibration API
  if ("vibrate" in navigator) navigator.vibrate([200,100,200,100,200]);
};

/* ═══════════════════════════════════════════════════════════
   CARTE GPS (SVG stylisée – remplacer par Mapbox/Google Maps en prod)
═══════════════════════════════════════════════════════════ */
const MapView = ({ mission, drivers, standalone=false }) => {
  const toSvg = (lat, lng) => {
    const x = ((lng - 2.15) / 0.55) * 320;
    const y = ((49.12 - lat) / 0.52) * 220;
    return { x: Math.max(10, Math.min(310, x)), y: Math.max(10, Math.min(210, y)) };
  };

  const activeDrivers = drivers.filter(d => d.status === "busy" || d.status === "available");

  return (
    <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, overflow:"hidden", position:"relative", height: standalone ? 320 : 200 }}>
      {/* Fond carte */}
      <svg width="100%" height="100%" viewBox="0 0 320 220" style={{ position:"absolute", inset:0 }}>
        {/* Fond */}
        <rect width="320" height="220" fill="#0d0d0d"/>
        {/* Grille routes */}
        {[40,80,120,160,200,240,280].map(x => <line key={`v${x}`} x1={x} y1={0} x2={x} y2={220} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>)}
        {[40,80,120,160,200].map(y => <line key={`h${y}`} x1={0} y1={y} x2={320} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>)}
        {/* Routes principales simulées */}
        <path d="M0,110 Q80,90 160,110 Q240,130 320,110" stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none"/>
        <path d="M160,0 Q150,60 160,110 Q170,160 160,220" stroke="rgba(255,255,255,0.08)" strokeWidth="2" fill="none"/>
        <path d="M0,60 Q60,50 120,80 Q180,110 240,70 Q280,50 320,60" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" fill="none"/>
        <path d="M0,160 Q80,150 160,170 Q240,190 320,160" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" fill="none"/>
        {/* Bord Paris */}
        <circle cx="160" cy="110" r="60" stroke={`${G}15`} strokeWidth="1" fill="none" strokeDasharray="4 4"/>

        {/* Mission en cours */}
        {mission && (() => {
          const p = toSvg(mission.pickupLat, mission.pickupLng);
          const d = toSvg(mission.dropLat, mission.dropLng);
          return <>
            {/* Ligne trajet */}
            <line x1={p.x} y1={p.y} x2={d.x} y2={d.y} stroke={G} strokeWidth="2" strokeDasharray="6 4" opacity=".7"/>
            {/* Départ */}
            <circle cx={p.x} cy={p.y} r="8" fill={`${G}30`} stroke={G} strokeWidth="1.5"/>
            <circle cx={p.x} cy={p.y} r="3" fill={G}/>
            <text x={p.x} y={p.y-12} textAnchor="middle" fill={G} fontSize="8" fontFamily="Georgia,serif">DÉPART</text>
            {/* Arrivée */}
            <circle cx={d.x} cy={d.y} r="8" fill="rgba(52,211,153,0.3)" stroke="#34D399" strokeWidth="1.5"/>
            <circle cx={d.x} cy={d.y} r="3" fill="#34D399"/>
            <text x={d.x} y={d.y-12} textAnchor="middle" fill="#34D399" fontSize="8" fontFamily="Georgia,serif">ARRIVÉE</text>
          </>;
        })()}

        {/* Chauffeurs */}
        {activeDrivers.map(d => {
          const pos = toSvg(d.lat, d.lng);
          return <g key={d.id}>
            <circle cx={pos.x} cy={pos.y} r="12" fill={d.status==="busy"?"rgba(245,158,11,0.2)":"rgba(52,211,153,0.2)"} stroke={d.status==="busy"?"#F59E0B":"#34D399"} strokeWidth="1.5"/>
            <text x={pos.x} y={pos.y+4} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700" fontFamily="Georgia,serif">{d.avatar}</text>
          </g>;
        })}

        {/* Label Paris */}
        <text x="160" y="115" textAnchor="middle" fill={`${G}40`} fontSize="10" fontFamily="Georgia,serif" letterSpacing="2">PARIS</text>
      </svg>

      {/* Légende */}
      <div style={{ position:"absolute", bottom:10, left:12, display:"flex", gap:12, fontSize:9, fontFamily:"Georgia,serif" }}>
        <span style={{ display:"flex", alignItems:"center", gap:4, color:"#34D399" }}><span style={{ width:6,height:6,borderRadius:"50%",background:"#34D399",display:"inline-block" }}/>Disponible</span>
        <span style={{ display:"flex", alignItems:"center", gap:4, color:"#F59E0B" }}><span style={{ width:6,height:6,borderRadius:"50%",background:"#F59E0B",display:"inline-block" }}/>En course</span>
      </div>
      <div style={{ position:"absolute", top:10, right:12, fontSize:9, color:`${G}60`, fontFamily:"Georgia,serif", letterSpacing:"0.1em" }}>ILE-DE-FRANCE</div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   CHAT DISPATCH ↔ CHAUFFEUR
═══════════════════════════════════════════════════════════ */
const ChatView = ({ currentUser, drivers, messages, setMessages }) => {
  const [activeChat, setActiveChat] = useState(null);
  const [newMsg, setNewMsg] = useState("");
  const scrollRef = useRef(null);

  const myId = currentUser.avatar;
  const isDispatch = currentUser.role === "dispatcher" || currentUser.role === "admin";

  const contacts = isDispatch
    ? drivers.map(d => ({ id:d.avatar, name:d.name, avatar:d.avatar, vehicle:d.vehicle, status:d.status }))
    : [{ id:"CD", name:"Centre Dispatch", avatar:"CD", vehicle:"", status:"available" }];

  const conversation = activeChat
    ? messages.filter(m => (m.from===myId && m.to===activeChat) || (m.from===activeChat && m.to===myId))
    : [];

  const unreadCount = (contactId) => messages.filter(m => m.from===contactId && m.to===myId && !m.read).length;

  const sendMsg = () => {
    if (!newMsg.trim() || !activeChat) return;
    const contact = contacts.find(c => c.id === activeChat);
    const msg = {
      id: Date.now(),
      from: myId,
      fromName: currentUser.name,
      to: activeChat,
      toName: contact?.name || activeChat,
      text: newMsg.trim(),
      time: new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}),
      read: false,
    };
    setMessages(p => [...p, msg]);
    setNewMsg("");
    // Notif push simulée pour l'autre côté
    sendPushNotif("Nouveau message", `${currentUser.name}: ${newMsg.trim()}`, "Chat");
    setTimeout(() => scrollRef.current?.scrollTo(0, 9999), 100);
  };

  // Marquer comme lu
  useEffect(() => {
    if (activeChat) setMessages(p => p.map(m => m.from===activeChat && m.to===myId ? {...m, read:true} : m));
  }, [activeChat]);

  useEffect(() => { scrollRef.current?.scrollTo(0, 9999); }, [conversation.length]);

  if (activeChat) {
    const contact = contacts.find(c => c.id === activeChat);
    return (
      <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 220px)", minHeight:400 }}>
        {/* Header conversation */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
          <button onClick={()=>setActiveChat(null)} style={{ width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>←</button>
          <Av txt={contact?.avatar||"?"} size={36}/>
          <div>
            <div style={{ fontFamily:"Georgia,serif", fontWeight:700, fontSize:14, color:"#fff" }}>{contact?.name}</div>
            {contact?.vehicle && <div style={{ fontSize:11, color:`${G}80` }}>{contact.vehicle}</div>}
          </div>
          <div style={{ marginLeft:"auto" }}><Dot on={contact?.status==="available"}/></div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:8, paddingBottom:8 }}>
          {conversation.length === 0 && (
            <div style={{ textAlign:"center", color:"rgba(255,255,255,0.2)", paddingTop:40, fontFamily:"Georgia,serif", fontSize:13 }}>Démarrez la conversation…</div>
          )}
          {conversation.map(m => {
            const isMine = m.from === myId;
            return (
              <div key={m.id} style={{ display:"flex", justifyContent:isMine?"flex-end":"flex-start" }}>
                <div style={{ maxWidth:"78%", padding:"10px 14px", borderRadius:isMine?"16px 16px 4px 16px":"16px 16px 16px 4px", background:isMine?`${G}20`:"rgba(255,255,255,0.06)", border:`1px solid ${isMine?G+"35":"rgba(255,255,255,0.08)"}` }}>
                  <div style={{ fontSize:13, color:"#fff", lineHeight:1.5, fontFamily:"Georgia,serif" }}>{m.text}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:5, textAlign:"right", letterSpacing:"0.04em" }}>{m.time}{isMine && <span style={{ marginLeft:4, color:m.read?G:"rgba(255,255,255,0.3)" }}>✓✓</span>}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div style={{ display:"flex", gap:8, paddingTop:10, borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <input
            value={newMsg}
            onChange={e=>setNewMsg(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&sendMsg()}
            placeholder="Votre message…"
            style={{ flex:1, padding:"11px 14px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, color:"#fff", fontSize:14, outline:"none", fontFamily:"Georgia,serif" }}
          />
          <button onClick={sendMsg} style={{ width:44,height:44,borderRadius:12,background:GG,border:"none",color:"#0a0808",fontSize:18,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>→</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SecTitle icon="Chat" sub="Communication sécurisée">Messagerie</SecTitle>
      {contacts.map(c => {
        const unread = unreadCount(c.id);
        const lastMsg = messages.filter(m=>(m.from===c.id&&m.to===myId)||(m.from===myId&&m.to===c.id)).slice(-1)[0];
        return (
          <Card key={c.id} style={{ cursor:"pointer" }} glow={unread>0}>
            <div onClick={()=>setActiveChat(c.id)} style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ position:"relative" }}>
                <Av txt={c.avatar} size={44}/>
                {unread > 0 && <div style={{ position:"absolute",top:-4,right:-4,width:18,height:18,borderRadius:"50%",background:GG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#0a0808" }}>{unread}</div>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"Georgia,serif", fontWeight:700, fontSize:14, color:"#fff" }}>{c.name}</div>
                {c.vehicle && <div style={{ fontSize:11, color:`${G}80`, marginTop:1 }}>{c.vehicle}</div>}
                {lastMsg && <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginTop:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{lastMsg.text}</div>}
              </div>
              <div style={{ textAlign:"right" }}>
                <Dot on={c.status==="available"}/>
                {lastMsg && <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:6 }}>{lastMsg.time}</div>}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   STATISTIQUES
═══════════════════════════════════════════════════════════ */
const StatsView = ({ missions, drivers, currentUser }) => {
  const driver = currentUser.role === "driver" ? drivers.find(d=>d.id===currentUser.driverId) : null;
  const myMissions = driver ? missions.filter(m=>m.driverId===driver.id) : missions;
  const completed  = myMissions.filter(m=>m.status==="completed");
  const revenue    = completed.reduce((a,m)=>a+m.price,0);

  const months = ["Jan","Fév","Mar","Avr","Mai","Jun"];
  const monthData = months.map((m,i)=>({ m, v: Math.floor(Math.random()*8+2), r: Math.floor(Math.random()*2000+500) }));
  const maxV = Math.max(...monthData.map(d=>d.v));

  const kpis = driver
    ? [
        { label:"Missions totales", val:driver.trips, color:G, icon:"◆" },
        { label:"Note moyenne",     val:`★ ${driver.rating}`, color:"#F59E0B", icon:"★" },
        { label:"Gains totaux",     val:`${driver.earnings.toLocaleString()}€`, color:"#34D399", icon:"€" },
        { label:"Ce mois",          val:`${completed.length} course${completed.length>1?"s":""}`, color:"#60A5FA", icon:"Mois" },
      ]
    : [
        { label:"Total missions",  val:missions.length,                                                    color:G,        icon:"◆" },
        { label:"Chiffre réalisé", val:`${missions.filter(m=>m.status==="completed").reduce((a,m)=>a+m.price,0)}€`, color:"#34D399", icon:"€" },
        { label:"En cours",        val:missions.filter(m=>["accepted","assigned"].includes(m.status)).length, color:"#60A5FA", icon:"VTC" },
        { label:"Chauffeurs actifs",val:drivers.filter(d=>d.status==="available").length, color:"#A78BFA", icon:"◈" },
      ];

  return (
    <div>
      <SecTitle icon="◆" sub={driver?`${driver.name}`:"Vue globale"}>Statistiques</SecTitle>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
        {kpis.map(k=>(
          <div key={k.label} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"16px 14px", textAlign:"center" }}>
            <div style={{ fontSize:9, color:`${G}60`, textTransform:"uppercase", letterSpacing:"0.1em", fontFamily:"Georgia,serif", marginBottom:6 }}>{k.label}</div>
            <div style={{ fontSize:22, fontWeight:700, color:k.color, fontFamily:"Georgia,serif" }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Bar chart missions par mois */}
      <Card style={{ marginBottom:14 }}>
        <SecTitle>Missions par mois</SecTitle>
        <div style={{ display:"flex", gap:8, alignItems:"flex-end", height:100, padding:"0 4px" }}>
          {monthData.map(d=>(
            <div key={d.m} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <div style={{ fontSize:9, color:`${G}90`, fontFamily:"Georgia,serif" }}>{d.v}</div>
              <div style={{ width:"100%", height:`${(d.v/maxV)*80}px`, background:`linear-gradient(to top,${G}60,${G}20)`, borderRadius:"4px 4px 0 0", border:`1px solid ${G}30`, minHeight:8, transition:"height .3s" }}/>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", fontFamily:"Georgia,serif" }}>{d.m}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Top chauffeurs (admin/dispatcher uniquement) */}
      {!driver && (
        <Card>
          <SecTitle>Classement chauffeurs</SecTitle>
          {[...drivers].sort((a,b)=>b.trips-a.trips).map((d,i)=>(
            <div key={d.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ width:22, height:22, borderRadius:"50%", background:i===0?GG:i===1?"rgba(192,192,192,0.2)":i===2?"rgba(205,127,50,0.2)":"rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:i===0?"#0a0808":"rgba(255,255,255,0.5)", border:`1px solid ${i===0?G:i===1?"#C0C0C0":i===2?"#CD7F32":"rgba(255,255,255,0.1)"}50` }}>{i+1}</div>
              <Av txt={d.avatar} size={32}/>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"Georgia,serif", fontSize:13, fontWeight:700, color:"#fff" }}>{d.name}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{d.vehicle} · ★ {d.rating}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:13, fontWeight:700, color:G, fontFamily:"Georgia,serif" }}>{d.trips}</div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.06em" }}>missions</div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Historique missions du chauffeur */}
      {driver && myMissions.length > 0 && (
        <Card>
          <SecTitle>Dernières missions</SecTitle>
          {myMissions.slice(0,5).map(m=>(
            <div key={m.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.8)", fontFamily:"Georgia,serif" }}>{m.title.split("–")[0].trim()}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:2 }}>{m.date}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:13, color:G, fontWeight:700 }}>{m.price}€</div>
                <Badge status={m.status}/>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   LOGIN SÉCURISÉ
═══════════════════════════════════════════════════════════ */
const LoginScreen = ({ onLogin, onRegister }) => {
  const [email, setEmail]   = useState("");
  const [pw, setPw]         = useState("");
  const [show, setShow]     = useState(false);
  const [err, setErr]       = useState("");
  const [loading, setLoading] = useState(false);

  const SUPABASE_URL      = "https://oiksltqjynwfxvvldflt.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_9sDDHh1XJwNTxHd8uIkt3A_pg_RShPX";

  const handle = async () => {
    setErr("");
    if (!email||!pw) { setErr("Veuillez remplir tous les champs."); return; }
    setLoading(true);

    // 1. Vérifie d'abord dans les comptes fixes (admin, dispatch, clients)
    const acc = ACCOUNTS.find(a=>a.email.toLowerCase()===email.toLowerCase()&&a.password===pw);
    if (acc) { requestNotifPermission(); onLogin(acc); setLoading(false); return; }

    // 2. Vérifie dans Supabase pour les chauffeurs inscrits
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/chauffeurs?email=eq.${encodeURIComponent(email.toLowerCase())}&select=*`,
        { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const chauffeur = data[0];

          // Vérifie le mot de passe
          if (chauffeur.mot_de_passe !== pw) {
            setErr("Identifiants incorrects. Vérifiez votre email et mot de passe.");
            setLoading(false);
            return;
          }

          // Vérifie le statut du dossier
          if (chauffeur.statut === "en_attente") {
            setErr("Votre dossier est en cours de vérification. Vous recevrez un email dès qu'il sera approuvé.");
            setLoading(false);
            return;
          }

          if (chauffeur.statut === "refusé") {
            setErr("Votre dossier a été refusé. Contactez Continental Limousines pour plus d'informations.");
            setLoading(false);
            return;
          }

          // Statut approuvé → connexion autorisée
          if (chauffeur.statut === "approuvé") {
            requestNotifPermission();
            onLogin({
              id:       `d-${chauffeur.id}`,
              email:    chauffeur.email,
              role:     "driver",
              name:     `${chauffeur.prenom} ${chauffeur.nom}`,
              avatar:   `${chauffeur.prenom?.charAt(0)||"?"}${chauffeur.nom?.charAt(0)||"?"}`.toUpperCase(),
              driverId: chauffeur.id,
              vehicle:  chauffeur.vehicule,
              plate:    chauffeur.plaque,
              statut:   chauffeur.statut,
            });
            setLoading(false);
            return;
          }
        }
      }
    } catch(e) { console.error(e); }

    setErr("Identifiants incorrects. Vérifiez votre email et mot de passe.");
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:BG, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"28px 20px", fontFamily:"Georgia,serif", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse 80% 60% at 50% 20%, rgba(201,168,76,0.07) 0%, transparent 70%)", pointerEvents:"none" }}/>
      <div style={{ position:"fixed", top:0, left:0, right:0, height:1, background:`linear-gradient(to right,transparent,${G}55,transparent)` }}/>

      <div style={{ width:"100%", maxWidth:380, position:"relative", zIndex:1 }}>
        <div style={{ textAlign:"center", marginBottom:44 }}>
          <CLLogo size="lg"/>
          <div style={{ width:80, height:1, background:`linear-gradient(to right,transparent,${G},transparent)`, margin:"14px auto 0" }}/>
          <div style={{ fontSize:9, color:`${G}60`, marginTop:10, letterSpacing:"0.18em", textTransform:"uppercase" }}>Espace sécurisé</div>
        </div>

        <Card style={{ border:`1px solid ${G}20` }}>
          <div style={{ fontFamily:"Georgia,serif", fontSize:15, fontWeight:700, color:"#fff", marginBottom:4 }}>Connexion</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginBottom:18 }}>Accès réservé aux membres autorisés</div>
          <Inp label="Adresse email" type="email" placeholder="votre@continental-limousines.fr" value={email} onChange={e=>{setEmail(e.target.value);setErr("")}}/>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:9, color:`${G}90`, marginBottom:5, textTransform:"uppercase", letterSpacing:"0.12em" }}>Mot de passe</div>
            <div style={{ position:"relative" }}>
              <input type={show?"text":"password"} placeholder="••••••••••" value={pw} onChange={e=>{setPw(e.target.value);setErr("")}} onKeyDown={e=>e.key==="Enter"&&handle()}
                style={{ width:"100%", padding:"11px 44px 11px 14px", background:"rgba(255,255,255,0.04)", border:`1px solid ${err?"#F87171":"rgba(255,255,255,0.1)"}`, borderRadius:12, color:"#fff", fontSize:14, boxSizing:"border-box", outline:"none", fontFamily:"Georgia,serif" }}/>
              <button onClick={()=>setShow(!show)} style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"rgba(255,255,255,0.35)",cursor:"pointer",fontSize:14,padding:4 }}>{show?"🙈":"👁"}</button>
            </div>
          </div>
          {err && <div style={{ display:"flex",gap:8,padding:"10px 14px",background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.25)",borderRadius:12,marginBottom:14 }}>
            <span style={{ fontSize:13 }}>!</span><span style={{ fontSize:12,color:"#F87171" }}>{err}</span>
          </div>}
          <Btn onClick={handle} disabled={loading}>{loading?"Vérification…":"Se connecter"}</Btn>
        </Card>

        <div style={{ marginTop:14, padding:"12px 16px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14 }}>
          <div style={{ fontSize:10, color:`${G}60`, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6, fontFamily:"Georgia,serif" }}>Accès restreint</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", lineHeight:1.7 }}>Cet espace est réservé aux collaborateurs et partenaires Continental Limousines.</div>
        </div>

        <div style={{ textAlign:"center", marginTop:14 }}>
          <button onClick={onRegister} style={{ background:"none",border:"none",color:`${G}60`,fontSize:12,cursor:"pointer",fontFamily:"Georgia,serif",textDecoration:"underline",textDecorationColor:`${G}30` }}>Demande d'inscription chauffeur</button>
        </div>
        <div style={{ textAlign:"center", marginTop:20, fontSize:10, color:"rgba(255,255,255,0.18)", letterSpacing:"0.06em" }}>© Continental Limousines · Roissy CDG · Genève</div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   INSCRIPTION CHAUFFEUR
═══════════════════════════════════════════════════════════ */
const RegisterScreen = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [done, setDone]           = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [vtcFile, setVtcFile]     = useState(null);
  const [vtcPreview, setVtcPreview] = useState(null);
  const [licFile, setLicFile]     = useState(null);
  const [licPreview, setLicPreview] = useState(null);
  const [showPw, setShowPw]       = useState(false);
  const [form, setForm] = useState({ firstName:"",lastName:"",phone:"",email:"",password:"",confirmPassword:"",vehicle:"Class S",plate:"",license:"",licenseExp:"" });
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));
  const steps = [{label:"Identité",num:1},{label:"Véhicule",num:2},{label:"Documents",num:3}];

  /* ── Upload vers Supabase Storage ──────────────────────────
     En production, remplace SUPABASE_URL et SUPABASE_ANON_KEY
     par tes vraies valeurs depuis supabase.com > Settings > API
     et crée un bucket "vtc-documents" en mode privé.
  ────────────────────────────────────────────────────────── */
  const SUPABASE_URL      = "https://oiksltqjynwfxvvldflt.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_9sDDHh1XJwNTxHd8uIkt3A_pg_RShPX";

  const uploadFile = async (file, path) => {
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/vtc-documents/${encodedPath}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "apikey":         SUPABASE_ANON_KEY,
        "Content-Type":   file.type,
        "x-upsert":       "true",
        "Cache-Control":  "3600",
      },
      body: file,
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("Upload error:", res.status, errText);
      throw new Error(`Upload échoué : ${res.status}`);
    }
    return `${SUPABASE_URL}/storage/v1/object/public/vtc-documents/${encodedPath}`;
  };

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setUploadErr("Fichier trop volumineux (max 5 Mo)"); return; }
    const allowed = ["image/jpeg","image/png","image/jpg","application/pdf"];
    if (!allowed.includes(file.type)) { setUploadErr("Format non supporté. Utilisez JPG, PNG ou PDF."); return; }
    setUploadErr("");
    const url = URL.createObjectURL(file);
    if (type === "vtc") { setVtcFile(file); setVtcPreview(url); }
    else                { setLicFile(file); setLicPreview(url); }
  };

  const handleSubmit = async () => {
    if (!vtcFile) { setUploadErr("Veuillez uploader votre carte professionnelle VTC."); return; }
    setUploading(true);
    setUploadErr("");
    try {
      const ts   = Date.now();
      const slug = `${form.lastName}-${form.firstName}-${ts}`.toLowerCase().replace(/\s+/g,"-");

      // 1. Upload carte VTC
      const vtcPath = `${slug}/carte-vtc.${vtcFile.name.split(".").pop()}`;
      const vtcUrl  = await uploadFile(vtcFile, vtcPath);

      // 2. Upload permis (optionnel)
      let licUrl = null;
      if (licFile) {
        const licPath = `${slug}/permis.${licFile.name.split(".").pop()}`;
        licUrl = await uploadFile(licFile, licPath);
      }

      // 3. Enregistrer l'inscription dans la table Supabase
      const payload = {
        nom:          form.lastName,
        prenom:       form.firstName,
        email:        form.email.toLowerCase(),
        mot_de_passe: form.password,
        telephone:    form.phone,
        vehicule:     form.vehicle,
        plaque:       form.plate,
        permis:       form.license,
        permis_exp:   form.licenseExp,
        vtc_url:      vtcUrl,
        statut:       "en_attente",
      };

      const res = await fetch(`${SUPABASE_URL}/rest/v1/chauffeurs`, {
        method: "POST",
        headers: {
          "apikey":       SUPABASE_ANON_KEY,
          "Authorization":`Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          "Prefer":       "return=minimal",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      setDone(true);
    } catch(e) {
      console.error(e);
      setUploadErr("Erreur lors de l'envoi. Vérifiez votre connexion et réessayez.");
    }
    setUploading(false);
  };

  // Composant zone de dépôt
  const UploadZone = ({ label, file, preview, inputId, onSelect, accept }) => (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:9,color:`${G}90`,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"Georgia,serif" }}>{label}</div>
      <label htmlFor={inputId} style={{ display:"block", cursor:"pointer" }}>
        <input id={inputId} type="file" accept={accept} onChange={onSelect} style={{ display:"none" }}/>
        {file ? (
          <div style={{ border:`1px solid ${G}50`,borderRadius:13,padding:"14px 16px",background:`${G}08`,display:"flex",alignItems:"center",gap:12 }}>
            {/* Icône document SVG */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12,fontWeight:700,color:"#fff",fontFamily:"Georgia,serif" }}>{file.name}</div>
              <div style={{ fontSize:10,color:`${G}80`,marginTop:2 }}>{(file.size/1024).toFixed(0)} Ko · Appuyer pour changer</div>
            </div>
            {/* Icône check SVG */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        ) : (
          <div style={{ border:"1.5px dashed rgba(201,168,76,0.3)",borderRadius:13,padding:"24px",textAlign:"center",background:`${G}04`,transition:"all .2s" }}>
            {/* Icône upload SVG */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin:"0 auto 10px",display:"block" }}>
              <polyline points="16 16 12 12 8 16"/>
              <line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
            </svg>
            <div style={{ fontSize:12,color:"rgba(255,255,255,0.5)",fontFamily:"Georgia,serif" }}>Appuyer pour sélectionner</div>
            <div style={{ fontSize:10,color:"rgba(255,255,255,0.25)",marginTop:4 }}>JPG · PNG · PDF — Max 5 Mo</div>
          </div>
        )}
      </label>
    </div>
  );

  if (done) return (
    <div style={{ minHeight:"100vh", background:BG, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:28, fontFamily:"Georgia,serif", textAlign:"center" }}>
      {/* Icône check SVG */}
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:20 }}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      <div style={{ fontFamily:"Georgia,serif",fontSize:20,fontWeight:700,color:"#fff",marginBottom:10 }}>Dossier transmis</div>
      <div style={{ fontSize:13,color:"rgba(255,255,255,0.4)",lineHeight:1.8,marginBottom:32 }}>
        Votre dossier est en cours de vérification.<br/>
        Vos identifiants vous seront envoyés<br/>par email sous 24–48h.
      </div>
      <Btn onClick={onBack} style={{ maxWidth:260 }}>Retour à la connexion</Btn>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:BG, fontFamily:"Georgia,serif", color:"#fff" }}>
      <div style={{ padding:"16px 18px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", gap:14, background:"rgba(5,5,5,0.95)", position:"sticky", top:0, zIndex:10, backdropFilter:"blur(20px)" }}>
        <button onClick={onBack} style={{ width:34,height:34,borderRadius:"50%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.5)",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <CLLogo size="sm"/>
        <div style={{ marginLeft:"auto",fontSize:10,color:`${G}70`,textTransform:"uppercase",letterSpacing:"0.08em" }}>Inscription chauffeur</div>
      </div>
      <div style={{ padding:"22px 18px 80px", maxWidth:420, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", marginBottom:28 }}>
          {steps.map((s,i)=>(
            <div key={s.num} style={{ display:"flex",alignItems:"center",flex:1 }}>
              <div style={{ display:"flex",flexDirection:"column",alignItems:"center",flex:"0 0 auto" }}>
                <div style={{ width:28,height:28,borderRadius:"50%",background:step>=s.num?GG:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:step>=s.num?"#080604":"rgba(255,255,255,0.3)",transition:"all .3s" }}>
                  {step>s.num
                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : s.num}
                </div>
                <div style={{ fontSize:9,color:step>=s.num?`${G}90`:"rgba(255,255,255,0.25)",marginTop:5,textTransform:"uppercase",letterSpacing:"0.06em" }}>{s.label}</div>
              </div>
              {i<steps.length-1&&<div style={{ flex:1,height:1,background:step>s.num?`${G}50`:"rgba(255,255,255,0.08)",margin:"0 6px",marginBottom:16,transition:"all .3s" }}/>}
            </div>
          ))}
        </div>

        {step===1&&<>
          <SecTitle icon="◆">Informations personnelles</SecTitle>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            <Inp label="Prénom" placeholder="Jean" value={form.firstName} onChange={f("firstName")}/>
            <Inp label="Nom" placeholder="Dupont" value={form.lastName} onChange={f("lastName")}/>
          </div>
          <Inp label="Téléphone" type="tel" placeholder="+33 6 xx xx xx xx" value={form.phone} onChange={f("phone")}/>
          <Inp label="Email (sera votre identifiant)" type="email" placeholder="votre@email.com" value={form.email} onChange={f("email")}/>

          {/* Mot de passe */}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:9, color:`${G}90`, marginBottom:5, textTransform:"uppercase", letterSpacing:"0.12em", fontFamily:"Georgia,serif" }}>Mot de passe</div>
            <div style={{ position:"relative" }}>
              <input
                type={showPw?"text":"password"}
                placeholder="Choisissez un mot de passe"
                value={form.password}
                onChange={f("password")}
                style={{ width:"100%", padding:"11px 44px 11px 14px", background:"rgba(255,255,255,0.04)", border:`1px solid ${form.password&&form.password.length<6?"#F87171":"rgba(255,255,255,0.1)"}`, borderRadius:12, color:"#fff", fontSize:14, boxSizing:"border-box", outline:"none", fontFamily:"Georgia,serif" }}
              />
              <button onClick={()=>setShowPw(!showPw)} style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"rgba(255,255,255,0.35)",cursor:"pointer",fontSize:14 }}>
                {showPw?"🙈":"👁"}
              </button>
            </div>
            {form.password && form.password.length < 6 && <div style={{ fontSize:11,color:"#F87171",marginTop:4 }}>Minimum 6 caractères</div>}
          </div>

          <Inp
            label="Confirmer le mot de passe"
            type="password"
            placeholder="Répétez le mot de passe"
            value={form.confirmPassword}
            onChange={f("confirmPassword")}
            error={form.confirmPassword && form.password !== form.confirmPassword ? "Les mots de passe ne correspondent pas" : ""}
          />

          {/* Indicateur force mot de passe */}
          {form.password && (
            <div style={{ marginBottom:14 }}>
              <div style={{ display:"flex", gap:4, marginBottom:4 }}>
                {[1,2,3,4].map(i => {
                  const strength = form.password.length >= 8 ? (
                    /[A-Z]/.test(form.password) ? (/[0-9]/.test(form.password) ? (/[^A-Za-z0-9]/.test(form.password) ? 4 : 3) : 2) : 2
                  ) : form.password.length >= 6 ? 1 : 0;
                  return <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i<=strength ? (strength<=1?"#F87171":strength<=2?"#F59E0B":strength<=3?"#60A5FA":"#34D399") : "rgba(255,255,255,0.08)", transition:"all .3s" }}/>;
                })}
              </div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.06em" }}>
                {form.password.length<6?"Trop court":form.password.length<8?"Faible":!/[A-Z]/.test(form.password)?"Moyen":!/[0-9]/.test(form.password)?"Bon":"Fort"}
              </div>
            </div>
          )}

          <Btn
            onClick={()=>{
              if (!form.firstName||!form.lastName||!form.email||!form.phone) { setUploadErr("Veuillez remplir tous les champs."); return; }
              if (form.password.length < 6) { setUploadErr("Le mot de passe doit faire au moins 6 caractères."); return; }
              if (form.password !== form.confirmPassword) { setUploadErr("Les mots de passe ne correspondent pas."); return; }
              setUploadErr(""); setStep(2);
            }}
          >Continuer</Btn>
          {uploadErr && <div style={{ display:"flex",gap:8,padding:"10px 14px",background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.25)",borderRadius:12,marginTop:10 }}><span style={{ fontSize:12,color:"#F87171" }}>{uploadErr}</span></div>}
        </>}

        {step===2&&<>
          <SecTitle icon="▲">Véhicule & Immatriculation</SecTitle>
          <Sel label="Classe de véhicule" value={form.vehicle} onChange={f("vehicle")}>
            {VEHICLES.map(v=><option key={v.name} value={v.name}>{v.name} — {v.desc} ({v.cap})</option>)}
          </Sel>
          {(()=>{ const v=VEHICLES.find(x=>x.name===form.vehicle); return v?(
            <div style={{ padding:"12px 16px",background:`${G}08`,border:`1px solid ${G}25`,borderRadius:14,marginBottom:12 }}>
              <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                <div style={{ width:44,height:44,borderRadius:12,background:`${G}15`,border:`1px solid ${G}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:G }}>{v.icon}</div>
                <div><div style={{ fontWeight:700,color:"#fff",fontSize:14,fontFamily:"Georgia,serif" }}>{v.name}</div><div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:2 }}>{v.desc} · {v.cap}</div></div>
                <div style={{ marginLeft:"auto",fontSize:9,padding:"3px 8px",borderRadius:10,background:`${G}15`,color:G,border:`1px solid ${G}25`,textTransform:"uppercase",letterSpacing:"0.06em" }}>{v.tag}</div>
              </div>
            </div>
          ):null; })()}
          <Inp label="Immatriculation" placeholder="AB-123-CD" value={form.plate} onChange={f("plate")}/>
          <div style={{ display:"flex",gap:10 }}>
            <Btn onClick={()=>setStep(1)} v="outline" style={{ flex:1 }}>Retour</Btn>
            <Btn onClick={()=>setStep(3)} style={{ flex:1 }}>Continuer</Btn>
          </div>
        </>}

        {step===3&&<>
          <SecTitle icon="●">Documents & Permis</SecTitle>
          <Inp label="Numéro de permis de conduire" placeholder="PRO-123456" value={form.license} onChange={f("license")}/>
          <Inp label="Date d'expiration du permis" type="date" value={form.licenseExp} onChange={f("licenseExp")}/>

          <UploadZone
            label="Carte professionnelle VTC *"
            file={vtcFile}
            preview={vtcPreview}
            inputId="vtc-upload"
            onSelect={e=>handleFileSelect(e,"vtc")}
            accept="image/jpeg,image/png,image/jpg,application/pdf"
          />

          <UploadZone
            label="Permis de conduire (recto)"
            file={licFile}
            preview={licPreview}
            inputId="lic-upload"
            onSelect={e=>handleFileSelect(e,"lic")}
            accept="image/jpeg,image/png,image/jpg,application/pdf"
          />

          {uploadErr && (
            <div style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.25)",borderRadius:12,marginBottom:14 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span style={{ fontSize:12,color:"#F87171" }}>{uploadErr}</span>
            </div>
          )}

          <div style={{ padding:"12px 14px",background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,marginBottom:16 }}>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.3)",lineHeight:1.7 }}>
              En soumettant, vous certifiez être titulaire d'une carte professionnelle VTC valide conformément au Code du Tourisme. Vos identifiants seront envoyés après validation de votre dossier.
            </div>
          </div>

          <div style={{ display:"flex",gap:10 }}>
            <Btn onClick={()=>setStep(2)} v="outline" style={{ flex:1 }}>Retour</Btn>
            <Btn onClick={handleSubmit} disabled={uploading} style={{ flex:1 }}>
              {uploading ? (
                <span style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation:"spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Envoi en cours…
                </span>
              ) : "Soumettre le dossier"}
            </Btn>
          </div>
        </>}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   VUE ADMIN
═══════════════════════════════════════════════════════════ */
/* ── DossiersView : validation des inscriptions chauffeurs ── */
const DossiersView = ({ supabaseUrl, supabaseKey }) => {
  const [dossiers, setDossiers]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [approved, setApproved]     = useState(null);
  const [processing, setProcessing] = useState(null);
  const [emailStatus, setEmailStatus] = useState(null); // "sending" | "sent" | "error"

  const RESEND_KEY = "re_2fHpAuQA_EnB7XzjJ35BR6ntPjEABYcXi";

  // Génère l'email professionnel
  const genEmail = (prenom, nom) => {
    const p = prenom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g,"-");
    const n = nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g,"-");
    return `${p.charAt(0)}.${n}@continental-limousines.fr`;
  };

  // Envoie l'email d'approbation via Resend
  const sendApprovalEmail = async (chauffeur) => {
    setEmailStatus("sending");
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_KEY}`,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({
          from:    "Continental Limousines <onboarding@resend.dev>",
          to:      ["hamza.oubakrim@etu.isae-ensma.fr"], // Email de test — remplacer par chauffeur.email une fois le domaine vérifié
          subject: "Votre dossier Continental Limousines a été approuvé",
          html: `
            <div style="background:#050505;color:#fff;font-family:Georgia,serif;padding:40px;max-width:520px;margin:0 auto;">
              <div style="text-align:center;margin-bottom:32px;">
                <div style="font-size:64px;font-weight:700;color:#fff;letter-spacing:-3px;line-height:1;">CL</div>
                <div style="font-size:11px;letter-spacing:0.2em;color:rgba(255,255,255,0.5);text-transform:uppercase;margin-top:8px;">Continental Limousines</div>
                <div style="width:60px;height:1px;background:linear-gradient(to right,transparent,#C9A84C,transparent);margin:14px auto 0;"></div>
              </div>

              <div style="background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.3);border-radius:14px;padding:20px;text-align:center;margin-bottom:28px;">
                <div style="font-size:28px;margin-bottom:8px;">✓</div>
                <div style="font-size:18px;font-weight:700;color:#34D399;">Dossier approuvé</div>
              </div>

              <p style="color:rgba(255,255,255,0.8);line-height:1.9;font-size:14px;">
                Bonjour <strong style="color:#fff;">${chauffeur.prenom} ${chauffeur.nom}</strong>,
              </p>
              <p style="color:rgba(255,255,255,0.7);line-height:1.9;font-size:14px;">
                Nous avons le plaisir de vous confirmer que votre dossier d'inscription en tant que chauffeur <strong style="color:#C9A84C;">Continental Limousines</strong> a été examiné et approuvé par notre équipe.
              </p>

              <div style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.25);border-radius:14px;padding:20px;margin:24px 0;">
                <div style="font-size:10px;color:rgba(201,168,76,0.7);text-transform:uppercase;letter-spacing:0.12em;margin-bottom:14px;">Vos informations</div>
                <table style="width:100%;border-collapse:collapse;">
                  <tr><td style="color:rgba(255,255,255,0.45);font-size:12px;padding:6px 0;width:40%;">Nom complet</td><td style="color:#fff;font-weight:700;font-size:13px;">${chauffeur.prenom} ${chauffeur.nom}</td></tr>
                  <tr><td style="color:rgba(255,255,255,0.45);font-size:12px;padding:6px 0;">Véhicule</td><td style="color:#fff;font-weight:700;font-size:13px;">${chauffeur.vehicule}</td></tr>
                  <tr><td style="color:rgba(255,255,255,0.45);font-size:12px;padding:6px 0;">Immatriculation</td><td style="color:#fff;font-weight:700;font-size:13px;">${chauffeur.plaque}</td></tr>
                  <tr><td style="color:rgba(255,255,255,0.45);font-size:12px;padding:6px 0;">Email de connexion</td><td style="color:#C9A84C;font-weight:700;font-size:13px;">${chauffeur.email}</td></tr>
                </table>
              </div>

              <p style="color:rgba(255,255,255,0.7);line-height:1.9;font-size:14px;">
                Vous pouvez dès maintenant vous connecter à l'application avec votre email et le mot de passe que vous avez choisi lors de votre inscription.
              </p>

              <div style="text-align:center;margin:32px 0;">
                <a href="https://continental-limousines.vercel.app"
                  style="display:inline-block;background:linear-gradient(135deg,#8B6914,#C9A84C,#E8C96A);color:#080604;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.05em;">
                  Accéder à l'application
                </a>
              </div>

              <p style="color:rgba(255,255,255,0.5);font-size:12px;line-height:1.8;">
                En cas de problème de connexion, contactez notre équipe à<br/>
                <a href="mailto:dispatch@continental-limousines.fr" style="color:#C9A84C;">dispatch@continental-limousines.fr</a>
              </p>

              <div style="border-top:1px solid rgba(255,255,255,0.06);margin-top:28px;padding-top:20px;text-align:center;">
                <div style="font-size:10px;color:rgba(255,255,255,0.25);letter-spacing:0.08em;">© Continental Limousines · Roissy CDG · Genève</div>
              </div>
            </div>
          `,
        }),
      });
      setEmailStatus(res.ok ? "sent" : "error");
    } catch(e) {
      console.error("Email error:", e);
      setEmailStatus("error");
    }
  };

  // Charge les dossiers depuis Supabase
  const loadDossiers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/chauffeurs?select=*`, {
        headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
      });
      if (res.ok) { const data = await res.json(); setDossiers(data); }
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadDossiers(); }, []);

  // Met à jour le statut dans Supabase
  const SUPABASE_SERVICE_KEY = "sb_secret_JZKhfoerRt5k-LPCsi2PAg_lA-GC2z3";

  const updateStatut = async (email, statut) => {
    setProcessing(email);
    try {
      const fnName = statut === "approuvé" ? "approve_chauffeur" : "refuse_chauffeur";
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fnName}`, {
        method: "POST",
        headers: {
          "apikey":        supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({ chauffeur_email: email }),
      });
      const text = await res.text();
      console.log("RPC result:", res.status, text);
      await loadDossiers();
    } catch(e) { console.error("RPC exception:", e); }
    setProcessing(null);
  };

  const handleApprove = async (d) => {
    await updateStatut(d.email, "approuvé");
    await sendApprovalEmail(d);
    setApproved({ email: d.email, nom: `${d.prenom} ${d.nom}`, prenom: d.prenom });
  };

  const handleRefuse = async (d) => {
    await updateStatut(d.email, "refusé");
  };

  const StatusBadgeDossier = ({ s }) => {
    const cfg = {
      "en_attente": { color:"#C9A84C", bg:"rgba(201,168,76,0.12)", label:"En attente" },
      "approuvé":   { color:"#34D399", bg:"rgba(52,211,153,0.12)",  label:"Approuvé"  },
      "refusé":     { color:"#F87171", bg:"rgba(248,113,113,0.12)", label:"Refusé"    },
    }[s] || { color:"#888", bg:"rgba(128,128,128,0.1)", label:s };
    return <span style={{ fontSize:9,fontWeight:700,letterSpacing:"0.1em",padding:"3px 9px",borderRadius:20,color:cfg.color,background:cfg.bg,border:`1px solid ${cfg.color}35`,textTransform:"uppercase",fontFamily:"Georgia,serif" }}>{cfg.label}</span>;
  };

  // Modal identifiants générés
  if (approved) return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20 }}>
      <div style={{ background:"#0e0e0e",border:`1px solid ${G}40`,borderRadius:20,padding:"28px 24px",maxWidth:380,width:"100%" }}>
        <div style={{ textAlign:"center",marginBottom:20 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin:"0 auto 12px",display:"block" }}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <div style={{ fontFamily:"Georgia,serif",fontSize:18,fontWeight:700,color:"#fff",marginBottom:4 }}>Dossier approuvé</div>
          <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)" }}>{approved.nom}</div>
        </div>

        {/* Statut email */}
        <div style={{ padding:"14px 16px",borderRadius:14,marginBottom:16,
          background: emailStatus==="sent" ? "rgba(52,211,153,0.08)" : emailStatus==="error" ? "rgba(248,113,113,0.08)" : "rgba(201,168,76,0.08)",
          border: `1px solid ${emailStatus==="sent" ? "rgba(52,211,153,0.3)" : emailStatus==="error" ? "rgba(248,113,113,0.3)" : "rgba(201,168,76,0.25)"}`,
        }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            {emailStatus==="sending" && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation:"spin 1s linear infinite",flexShrink:0 }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            )}
            {emailStatus==="sent" && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            {emailStatus==="error" && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            )}
            <div>
              <div style={{ fontSize:12,fontWeight:700,
                color: emailStatus==="sent"?"#34D399":emailStatus==="error"?"#F87171":G,
                fontFamily:"Georgia,serif"
              }}>
                {emailStatus==="sending" ? "Envoi de l'email…"
                 :emailStatus==="sent"    ? "Email envoyé avec succès"
                 :emailStatus==="error"   ? "Échec de l'envoi email"
                 :"Email en préparation"}
              </div>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:3 }}>{approved.email}</div>
            </div>
          </div>
        </div>

        <div style={{ background:`${G}08`,border:`1px solid ${G}25`,borderRadius:14,padding:"16px",marginBottom:16 }}>
          <div style={{ fontSize:10,color:`${G}80`,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8,fontFamily:"Georgia,serif" }}>Le chauffeur reçoit par email</div>
          <div style={{ fontSize:12,color:"rgba(255,255,255,0.6)",lineHeight:1.7 }}>
            — Confirmation d'approbation<br/>
            — Ses informations (véhicule, plaque)<br/>
            — Lien direct vers l'application<br/>
            — Rappel de connexion avec son email
          </div>
        </div>

        <div style={{ fontSize:11,color:"rgba(255,255,255,0.3)",marginBottom:16,lineHeight:1.7,textAlign:"center" }}>
          Le chauffeur peut se connecter avec<br/>son email et le mot de passe qu'il a choisi.
        </div>

        <Btn onClick={()=>{ setApproved(null); setEmailStatus(null); }}>Fermer</Btn>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
        <SecTitle sub={`${dossiers.filter(d=>d.statut==="en_attente").length} en attente de validation`}>Dossiers chauffeurs</SecTitle>
        <button onClick={loadDossiers} style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"6px 12px",color:"rgba(255,255,255,0.5)",fontSize:11,cursor:"pointer",fontFamily:"Georgia,serif" }}>
          Actualiser
        </button>
      </div>

      {loading && <div style={{ textAlign:"center",color:"rgba(255,255,255,0.2)",padding:"40px 0",fontFamily:"Georgia,serif" }}>Chargement…</div>}

      {!loading && dossiers.length===0 && (
        <div style={{ textAlign:"center",color:"rgba(255,255,255,0.2)",padding:"40px 0",fontFamily:"Georgia,serif" }}>
          <div style={{ fontSize:32,marginBottom:12,opacity:.3 }}>◆</div>
          <div>Aucune inscription reçue pour l'instant</div>
        </div>
      )}

      {dossiers.map(d=>(
        <Card key={d.id} glow={d.statut==="en_attente"}>
          {/* Header */}
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
            <div style={{ display:"flex",gap:10,alignItems:"center" }}>
              <Av txt={`${(d.prenom||"?").charAt(0)}${(d.nom||"?").charAt(0)}`} size={40}/>
              <div>
                <div style={{ fontFamily:"Georgia,serif",fontWeight:700,fontSize:15,color:"#fff" }}>{d.prenom} {d.nom}</div>
                <div style={{ fontSize:11,color:`${G}80`,marginTop:2 }}>{d.vehicule} · {d.plaque}</div>
              </div>
            </div>
            <StatusBadgeDossier s={d.statut}/>
          </div>

          <Divider/>

          {/* Infos */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12 }}>
            {[
              ["Téléphone", d.telephone||"—"],
              ["Email",     d.email||"—"],
              ["Permis",    d.permis||"—"],
              ["Expiration",d.permis_exp||"—"],
            ].map(([k,v])=>(
              <div key={k} style={{ background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"8px 10px" }}>
                <div style={{ fontSize:9,color:`${G}60`,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3,fontFamily:"Georgia,serif" }}>{k}</div>
                <div style={{ fontSize:12,color:"#fff",fontWeight:600,wordBreak:"break-all" }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Document VTC */}
          {d.vtc_url && (
            <a href={d.vtc_url} target="_blank" rel="noreferrer"
              style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:`${G}08`,border:`1px solid ${G}25`,borderRadius:12,marginBottom:12,textDecoration:"none" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12,fontWeight:700,color:G,fontFamily:"Georgia,serif" }}>Carte professionnelle VTC</div>
                <div style={{ fontSize:10,color:"rgba(255,255,255,0.35)",marginTop:1 }}>Appuyer pour ouvrir le document</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          )}

          {/* Identifiants générés si déjà approuvé */}
          {d.statut==="approuvé" && d.email_genere && (
            <div style={{ padding:"10px 12px",background:"rgba(52,211,153,0.06)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:12,marginBottom:12 }}>
              <div style={{ fontSize:9,color:"#34D399",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6,fontFamily:"Georgia,serif" }}>Identifiants transmis</div>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.6)" }}>{d.email_genere}</div>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.6)",marginTop:2 }}>{d.mdp_genere}</div>
            </div>
          )}

          {/* Boutons action */}
          {d.statut==="en_attente" && (
            <div style={{ display:"flex",gap:10 }}>
              <Btn
                onClick={()=>handleApprove(d)}
                disabled={processing===d.email}
                v="success"
                style={{ flex:1 }}
              >
                {processing===d.email ? "Traitement…" : "Approuver"}
              </Btn>
              <Btn
                onClick={()=>handleRefuse(d)}
                disabled={processing===d.email}
                v="danger"
                style={{ flex:1 }}
              >
                Refuser
              </Btn>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

const AdminView = ({ missions, setMissions, drivers, messages, setMessages, currentUser, tab, createMission, setToast: showToast }) => {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [form, setForm]         = useState({ title:"",client:"",pickup:"",dropoff:"",date:"",time:"",vehicle:"Class S",price:"",distance:"",notes:"" });
  const g = k=>e=>setForm(p=>({...p,[k]:e.target.value}));

  const SUPABASE_URL      = "https://oiksltqjynwfxvvldflt.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_9sDDHh1XJwNTxHd8uIkt3A_pg_RShPX";

  if (tab==="map")      return <div><SecTitle sub="Flotte en temps réel">Carte GPS</SecTitle><MapView mission={missions.find(m=>m.status==="accepted")} drivers={drivers} standalone/></div>;
  if (tab==="chat")     return <ChatView currentUser={currentUser} drivers={drivers} messages={messages} setMessages={setMessages}/>;
  if (tab==="stats")    return <StatsView missions={missions} drivers={drivers} currentUser={currentUser}/>;
  if (tab==="dossiers") return <DossiersView supabaseUrl={SUPABASE_URL} supabaseKey={SUPABASE_ANON_KEY}/>;

  const filtered = missions.filter(m=>filter==="all"||m.status===filter).filter(m=>!search||(m.title+(m.client||"")).toLowerCase().includes(search.toLowerCase()));

  const create = async () => {
    if (!form.title||!form.pickup||!form.dropoff||!form.date||!form.time) return;
    const ok = await createMission(form);
    if (ok) {
      sendPushNotif("Nouvelle mission publiée", form.title, "VTC");
      setForm({title:"",client:"",pickup:"",dropoff:"",date:"",time:"",vehicle:"Class S",price:"",distance:"",notes:""});
      setShowForm(false);
      showToast("Mission publiée ✦");
    }
  };

  const revenue=missions.filter(m=>m.status==="completed").reduce((a,m)=>a+m.price,0);
  const kpis=[{label:"Missions",val:missions.length,color:G},{label:"En attente",val:missions.filter(m=>m.status==="pending").length,color:"#C9A84C"},{label:"En cours",val:missions.filter(m=>["accepted","assigned"].includes(m.status)).length,color:"#60A5FA"},{label:"CA",val:`${revenue}€`,color:"#34D399"}];

  return <div>
    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20 }}>
      {kpis.map(k=><div key={k.label} style={{ background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"14px 16px",textAlign:"center" }}>
        <div style={{ fontSize:22,fontWeight:700,color:k.color,fontFamily:"Georgia,serif",lineHeight:1 }}>{k.val}</div>
        <div style={{ fontSize:9,color:"rgba(255,255,255,0.35)",marginTop:4,textTransform:"uppercase",letterSpacing:"0.1em" }}>{k.label}</div>
      </div>)}
    </div>
    <Btn onClick={()=>setShowForm(!showForm)} style={{ marginBottom:14 }}>{showForm?"✕  Annuler":"Nouvelle mission"}</Btn>
    {showForm&&<Card glow style={{ marginBottom:18 }}>
      <SecTitle icon="✦">Créer une mission</SecTitle>
      <Inp label="Intitulé" placeholder="Transfert VIP CDG → Le Bristol" value={form.title} onChange={g("title")}/>
      <Inp label="Client" placeholder="M. Laurent Dupont" value={form.client} onChange={g("client")}/>
      <Inp label="Adresse de départ" placeholder="CDG Terminal 2E, Roissy" value={form.pickup} onChange={g("pickup")}/>
      <Inp label="Adresse d'arrivée" placeholder="Hôtel Le Bristol, Paris 8e" value={form.dropoff} onChange={g("dropoff")}/>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}><Inp label="Date" type="date" value={form.date} onChange={g("date")}/><Inp label="Heure" type="time" value={form.time} onChange={g("time")}/></div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}><Inp label="Prix (€)" type="number" placeholder="0" value={form.price} onChange={g("price")}/><Inp label="Distance" placeholder="35 km" value={form.distance} onChange={g("distance")}/></div>
      <Sel label="Véhicule requis" value={form.vehicle} onChange={g("vehicle")}>{VEHICLES.map(v=><option key={v.name} value={v.name}>{v.name} — {v.cap}</option>)}</Sel>
      <Inp label="Notes / Instructions" placeholder="ex : accueil avec panneau…" value={form.notes} onChange={g("notes")}/>
      <Btn onClick={create}>Publier la mission</Btn>
    </Card>}
    <Inp placeholder="🔍  Rechercher…" value={search} onChange={e=>setSearch(e.target.value)}/>
    <div style={{ display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4 }}>
      {[["all","Toutes"],["pending","Attente"],["accepted","Acceptées"],["assigned","Way-Plan"],["completed","Terminées"],["refused","Refusées"]].map(([v,l])=>(
        <button key={v} onClick={()=>setFilter(v)} style={{ padding:"6px 14px",borderRadius:20,border:"1px solid",borderColor:filter===v?G:"rgba(255,255,255,0.1)",background:filter===v?`${G}15`:"transparent",color:filter===v?G:"rgba(255,255,255,0.45)",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"Georgia,serif",letterSpacing:"0.04em",transition:"all .2s" }}>{l}</button>
      ))}
    </div>
    {filtered.length===0&&<div style={{ textAlign:"center",color:"rgba(255,255,255,0.2)",padding:"40px 0",fontFamily:"Georgia,serif" }}>Aucune mission</div>}
    {filtered.map(m=>{const drv=drivers.find(d=>d.id===m.driverId); return(
      <Card key={m.id}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7 }}><div style={{ fontWeight:700,fontSize:14,color:"#fff",flex:1,marginRight:10,fontFamily:"Georgia,serif",lineHeight:1.4 }}>{m.title}</div><Badge status={m.status}/></div>
        {m.client&&<div style={{ fontSize:12,color:`${G}90`,marginBottom:7,fontStyle:"italic" }}>— {m.client}</div>}
        <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:3 }}><span style={{color:"rgba(201,168,76,0.7)",fontWeight:600,marginRight:4}}>Départ</span>{m.pickup}</div>
        <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:8 }}><span style={{color:"rgba(201,168,76,0.7)",fontWeight:600,marginRight:4}}>Arrivée</span>{m.dropoff}</div>
        <div style={{ display:"flex",flexWrap:"wrap",gap:10,fontSize:12,color:"rgba(255,255,255,0.4)" }}>
          <span>{m.date} · {m.time}</span><span style={{ color:G,fontWeight:700 }}>{m.price} €</span>{m.distance&&<span>{m.distance}</span>}<span style={{ color:"rgba(255,255,255,0.25)" }}>{m.vehicle}</span>
        </div>
        {m.notes&&<div style={{ fontSize:11,color:"rgba(255,255,255,0.3)",fontStyle:"italic",marginTop:8,borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:8 }}>Note : {m.notes}</div>}
        {drv&&<div style={{ marginTop:10,display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:`${G}08`,borderRadius:12,border:`1px solid ${G}20` }}><Av txt={drv.avatar} size={30}/><div><div style={{ fontSize:12,fontWeight:700,color:G,fontFamily:"Georgia,serif" }}>{drv.name}</div><div style={{ fontSize:11,color:"rgba(255,255,255,0.35)" }}>{drv.vehicle} · {drv.plate}</div></div><div style={{ marginLeft:"auto" }}><Dot on={drv.status==="available"}/></div></div>}
      </Card>
    );})}
  </div>;
};

/* ═══════════════════════════════════════════════════════════
   VUE DISPATCHER
═══════════════════════════════════════════════════════════ */
const DispatcherView = ({ missions, setMissions, drivers, messages, setMessages, currentUser, setToast, tab, updateMission, loadMissions }) => {
  if (tab==="map")   return <div><SecTitle sub="Flotte en temps réel">Carte GPS</SecTitle><MapView mission={missions.find(m=>m.status==="accepted")} drivers={drivers} standalone/></div>;
  if (tab==="chat")  return <ChatView currentUser={currentUser} drivers={drivers} messages={messages} setMessages={setMessages}/>;
  if (tab==="stats") return <StatsView missions={missions} drivers={drivers} currentUser={currentUser}/>;

  const accepted = missions.filter(m=>m.status==="accepted");
  const assigned  = missions.filter(m=>m.status==="assigned");
  const sendWP = async (id) => {
    await updateMission(id, { status:"assigned" });
    setToast("Envoyé sur Way-Plan ✦");
  };
  const reassign = async (mid, did) => {
    await updateMission(mid, { driverId: Number(did) });
  };

  if (tab==="fleet") return <div>
    <SecTitle icon="▲" sub="Statut en temps réel">Flotte Continental Limousines</SecTitle>
    {drivers.map(d=><Card key={d.id}><div style={{ display:"flex",gap:14,alignItems:"center" }}><Av txt={d.avatar} size={46}/><div style={{ flex:1 }}><div style={{ fontFamily:"Georgia,serif",fontWeight:700,fontSize:15,color:"#fff" }}>{d.name}</div><div style={{ fontSize:12,color:G,marginTop:2 }}>{d.vehicle} · {d.plate}</div><div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:2 }}>★ {d.rating} · {d.trips} missions · {d.phone}</div></div><div style={{ textAlign:"center" }}><Dot on={d.status==="available"}/><div style={{ fontSize:9,color:"rgba(255,255,255,0.35)",marginTop:5,textTransform:"uppercase",letterSpacing:"0.05em" }}>{d.status==="available"?"Dispo":"En course"}</div></div></div><Divider/><div style={{ display:"flex",gap:16,flexWrap:"wrap" }}>{[["Permis",d.license],["Exp.",d.licenseExp]].map(([k,v])=><div key={k} style={{ fontSize:11,color:"rgba(255,255,255,0.35)" }}><span style={{ color:`${G}70`,fontSize:9,textTransform:"uppercase",letterSpacing:"0.06em" }}>{k} </span>{v}</div>)}</div></Card>)}
  </div>;

  return <div>
    <div style={{ fontFamily:"Georgia,serif",fontSize:20,fontWeight:700,color:"#fff",marginBottom:4 }}>Dispatch Center</div>
    <div style={{ fontSize:12,color:"rgba(255,255,255,0.35)",marginBottom:20 }}>{accepted.length} à dispatcher · {assigned.length} sur Way-Plan</div>
    <SecTitle sub="Disponibilité en direct">Chauffeurs</SecTitle>
    <div style={{ display:"flex",gap:8,overflowX:"auto",paddingBottom:10,marginBottom:20 }}>
      {drivers.map(d=><div key={d.id} style={{ background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"14px",minWidth:130,flexShrink:0,textAlign:"center" }}>
        <Av txt={d.avatar} size={38}/><div style={{ fontFamily:"Georgia,serif",fontSize:12,fontWeight:700,color:"#fff",marginTop:8 }}>{d.name.split(" ")[0]}</div><div style={{ fontSize:10,color:`${G}80`,marginTop:2 }}>{d.vehicle}</div>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:5,marginTop:7 }}><Dot on={d.status==="available"}/><span style={{ fontSize:9,color:d.status==="available"?"#34D399":"#F59E0B",textTransform:"uppercase",letterSpacing:"0.05em" }}>{d.status==="available"?"Dispo":"En course"}</span></div>
      </div>)}
    </div>
    <SecTitle icon="◈" sub="Missions acceptées par les chauffeurs">À envoyer sur Way-Plan</SecTitle>
    {accepted.length===0&&<div style={{ textAlign:"center",color:"rgba(255,255,255,0.2)",padding:"30px 0",fontFamily:"Georgia,serif",fontSize:13 }}>Aucune mission en attente</div>}
    {accepted.map(m=>{ const drv=drivers.find(d=>d.id===m.driverId); return(
      <Card key={m.id} style={{ border:"1px solid rgba(96,165,250,0.2)" }}>
        <div style={{ fontFamily:"Georgia,serif",fontWeight:700,fontSize:14,color:"#fff",marginBottom:5 }}>{m.title}</div>
        {m.client&&<div style={{ fontSize:12,color:`${G}90`,marginBottom:7 }}>— {m.client}</div>}
        <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:3 }}><span style={{color:"rgba(201,168,76,0.7)",fontWeight:600,marginRight:4}}>Départ</span>{m.pickup}</div>
        <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:10 }}><span style={{color:"rgba(201,168,76,0.7)",fontWeight:600,marginRight:4}}>Arrivée</span>{m.dropoff}</div>
        <div style={{ display:"flex",gap:12,fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:12 }}><span>{m.date} · {m.time}</span><span style={{ color:G,fontWeight:700 }}>{m.price} €</span><span>{m.vehicle}</span></div>
        {drv&&<div style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"rgba(255,255,255,0.03)",borderRadius:12,marginBottom:10 }}><Av txt={drv.avatar} size={30}/><div><div style={{ fontSize:12,fontWeight:700,color:"#fff",fontFamily:"Georgia,serif" }}>{drv.name}</div><div style={{ fontSize:11,color:"rgba(255,255,255,0.35)" }}>★ {drv.rating} · {drv.vehicle} · {drv.plate}</div></div></div>}
        <Sel label="Réassigner si besoin" value={m.driverId||""} onChange={e=>reassign(m.id,e.target.value)}>{drivers.filter(d=>d.status==="available").map(d=><option key={d.id} value={d.id}>{d.name} · {d.vehicle} · {d.plate}</option>)}</Sel>
        <Btn onClick={()=>sendWP(m.id)}>Envoyer sur Way-Plan</Btn>
      </Card>
    );})}
    {assigned.length>0&&<div style={{ marginTop:24 }}><SecTitle icon="✦">Sur Way-Plan</SecTitle>{assigned.map(m=>{ const drv=drivers.find(d=>d.id===m.driverId); return(<Card key={m.id} style={{ border:"1px solid rgba(167,139,250,0.2)",background:"rgba(167,139,250,0.04)" }}><div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}><div><div style={{ fontFamily:"Georgia,serif",fontWeight:700,fontSize:13,color:"#fff" }}>{m.title}</div><div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:4 }}>{drv?`${drv.name} · ${drv.plate}`:"—"} · {m.date} · {m.time}</div></div><Badge status="assigned"/></div></Card>);})}</div>}
  </div>;
};

/* ═══════════════════════════════════════════════════════════
   VUE CHAUFFEUR
═══════════════════════════════════════════════════════════ */
const DriverView = ({ missions, setMissions, drivers, messages, setMessages, currentUser, setToast, tab, updateMission }) => {
  // Chauffeur depuis la liste fixe OU depuis Supabase (inscription)
  const driver = drivers.find(d=>d.id===currentUser.driverId) || {
    id:        currentUser.driverId,
    name:      currentUser.name,
    avatar:    currentUser.avatar,
    vehicle:   currentUser.vehicle || "Class S",
    plate:     currentUser.plate   || "—",
    license:   "—",
    licenseExp:"—",
    phone:     "—",
    status:    "available",
    rating:    5.0,
    trips:     0,
    earnings:  0,
  };
  const myMissions = missions.filter(m=>m.driverId===driver.id);
  const available  = missions.filter(m=>m.status==="pending"&&m.vehicle===driver.vehicle);
  const active     = myMissions.filter(m=>["accepted","assigned"].includes(m.status));

  const accept = async (id) => {
    await updateMission(id, { status:"accepted", driverId: driver.id });
    setToast("Mission acceptée ✦");
    sendPushNotif("Mission acceptée","Le dispatch a été notifié.","VTC");
  };
  const refuse = async (id) => {
    await updateMission(id, { status:"refused" });
    setToast("Mission déclinée","warn");
  };

  if (tab==="chat")  return <ChatView currentUser={currentUser} drivers={drivers} messages={messages} setMessages={setMessages}/>;
  if (tab==="stats") return <StatsView missions={missions} drivers={drivers} currentUser={currentUser}/>;

  if (tab==="map") return <div>
    <SecTitle sub="Ma position & trajet">Carte GPS</SecTitle>
    <MapView mission={active[0]} drivers={drivers} standalone/>
    {active.length>0&&<Card glow style={{ marginTop:14 }}><div style={{ fontSize:13,fontWeight:700,color:"#fff",fontFamily:"Georgia,serif",marginBottom:6 }}>{active[0].title}</div><div style={{ fontSize:12,color:"rgba(255,255,255,0.45)" }}><span style={{color:"rgba(201,168,76,0.7)",fontWeight:600,marginRight:4}}>Départ</span>{active[0].pickup}</div><div style={{ fontSize:12,color:"rgba(255,255,255,0.45)",marginTop:3 }}><span style={{color:"rgba(201,168,76,0.7)",fontWeight:600,marginRight:4}}>Arrivée</span>{active[0].dropoff}</div></Card>}
  </div>;

  if (tab==="profile") return <div>
    <Card glow style={{ marginBottom:20 }}>
      <div style={{ display:"flex",gap:14,alignItems:"center",marginBottom:16 }}><Av txt={driver.avatar} size={58}/><div><div style={{ fontFamily:"Georgia,serif",fontSize:18,fontWeight:700,color:"#fff" }}>{driver.name}</div><div style={{ fontSize:12,color:G,marginTop:3 }}>★ {driver.rating} · {driver.trips} missions</div><div style={{ display:"flex",alignItems:"center",gap:6,marginTop:5 }}><Dot on={driver.status==="available"}/><span style={{ fontSize:11,color:"rgba(255,255,255,0.4)" }}>{driver.status==="available"?"Disponible":"En course"}</span></div></div></div>
      <Divider/>
      {[["Véhicule",driver.vehicle],["Immatriculation",driver.plate],["N° Permis",driver.license],["Exp. permis",driver.licenseExp],["Téléphone",driver.phone]].map(([k,v])=><div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.04)" }}><span style={{ fontSize:11,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:"Georgia,serif" }}>{k}</span><span style={{ fontSize:12,color:"#fff",fontWeight:600 }}>{v}</span></div>)}
    </Card>
    <SecTitle icon="▲">Mon véhicule</SecTitle>
    {(()=>{ const v=VEHICLES.find(x=>x.name===driver.vehicle); return v?(<Card><div style={{ display:"flex",alignItems:"center",gap:14 }}><div style={{ width:50,height:50,borderRadius:14,background:`${G}15`,border:`1px solid ${G}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:G }}>{v.icon}</div><div><div style={{ fontWeight:700,color:"#fff",fontFamily:"Georgia,serif",fontSize:15 }}>{v.name}</div><div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:3 }}>{v.desc} · {v.cap}</div></div><div style={{ marginLeft:"auto",fontSize:9,padding:"3px 8px",borderRadius:10,background:`${G}15`,color:G,border:`1px solid ${G}25`,textTransform:"uppercase",letterSpacing:"0.06em" }}>{v.tag}</div></div></Card>):null; })()}
  </div>;

  return <div>
    <Card glow style={{ marginBottom:20 }}>
      <div style={{ display:"flex",gap:12,alignItems:"center" }}><Av txt={driver.avatar} size={50}/><div style={{ flex:1 }}><div style={{ fontFamily:"Georgia,serif",fontSize:16,fontWeight:700,color:"#fff" }}>{driver.name}</div><div style={{ fontSize:12,color:G,marginTop:2 }}>★ {driver.rating} · {driver.vehicle} · {driver.plate}</div></div><div style={{ textAlign:"center" }}><Dot on={driver.status==="available"}/><div style={{ fontSize:9,color:"rgba(255,255,255,0.35)",marginTop:5,textTransform:"uppercase",letterSpacing:"0.05em" }}>{driver.status==="available"?"Dispo":"En course"}</div></div></div>
    </Card>

    {available.length>0&&<div style={{ marginBottom:20 }}>
      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12 }}>
        <div style={{ width:8,height:8,borderRadius:"50%",background:G,boxShadow:`0 0 10px ${G}`,animation:"pulse 1.5s infinite" }}/>
        <div style={{ fontSize:11,fontWeight:700,color:G,textTransform:"uppercase",letterSpacing:"0.1em",fontFamily:"Georgia,serif" }}>{available.length} mission{available.length>1?"s":""} disponible{available.length>1?"s":""}</div>
      </div>
      {available.map(m=><Card key={m.id} glow>
        <div style={{ fontFamily:"Georgia,serif",fontWeight:700,fontSize:15,color:"#fff",marginBottom:5 }}>{m.title}</div>
        {m.client&&<div style={{ fontSize:12,color:`${G}90`,marginBottom:8 }}>— {m.client}</div>}
        <div style={{ fontSize:12,color:"rgba(255,255,255,0.5)",marginBottom:3 }}><span style={{color:"rgba(201,168,76,0.7)",fontWeight:600,marginRight:4}}>Départ</span>{m.pickup}</div>
        <div style={{ fontSize:12,color:"rgba(255,255,255,0.5)",marginBottom:10 }}><span style={{color:"rgba(201,168,76,0.7)",fontWeight:600,marginRight:4}}>Arrivée</span>{m.dropoff}</div>
        <div style={{ display:"flex",gap:14,fontSize:12,marginBottom:m.notes?10:14 }}><span style={{ color:"rgba(255,255,255,0.45)" }}>{m.date} · {m.time}</span><span style={{ color:G,fontWeight:700 }}>{m.price} €</span>{m.distance&&<span style={{ color:"rgba(255,255,255,0.35)" }}>{m.distance}</span>}</div>
        {m.notes&&<div style={{ fontSize:11,color:"rgba(255,255,255,0.3)",fontStyle:"italic",marginBottom:14,borderLeft:`2px solid ${G}30`,paddingLeft:10 }}>Note : {m.notes}</div>}
        <div style={{ display:"flex",gap:10 }}><Btn onClick={()=>accept(m.id)} v="success" style={{ flex:1 }}>✓ Accepter</Btn><Btn onClick={()=>refuse(m.id)} v="danger" style={{ flex:1 }}>✕ Décliner</Btn></div>
      </Card>)}
    </div>}

    {available.length===0&&myMissions.length===0&&<div style={{ textAlign:"center",padding:"50px 20px",color:"rgba(255,255,255,0.2)",fontFamily:"Georgia,serif" }}><div style={{ fontSize:36,marginBottom:12,opacity:.3 }}>◆</div><div style={{ fontSize:14,marginBottom:8 }}>Aucune mission disponible</div><div style={{ fontSize:12 }}>Vous serez alerté dès qu'une mission {driver.vehicle} est publiée</div></div>}

    {active.length>0&&<>
      <SecTitle icon="◆">Missions actives</SecTitle>
      {active.map(m => {
        // Encode l'adresse d'arrivée pour les liens GPS
        const dest = encodeURIComponent(m.dropoff);
        const origin = encodeURIComponent(m.pickup);
        const gpsApps = [
          {
            name: "Google Maps",
            icon: "G",
            color: "#4285F4",
            bg: "rgba(66,133,244,0.12)",
            url: `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`,
          },
          {
            name: "Waze",
            icon: "W",
            color: "#33CCFF",
            bg: "rgba(51,204,255,0.12)",
            url: `https://waze.com/ul?q=${dest}&navigate=yes`,
          },
          {
            name: "Plans",
            icon: "A",
            color: "#34D399",
            bg: "rgba(52,211,153,0.12)",
            url: `http://maps.apple.com/?saddr=${origin}&daddr=${dest}&dirflg=d`,
          },
        ];
        return (
          <Card key={m.id} glow>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
              <div style={{ fontFamily:"Georgia,serif",fontWeight:700,fontSize:14,color:"#fff",flex:1,marginRight:10 }}>{m.title}</div>
              <Badge status={m.status}/>
            </div>
            {m.client&&<div style={{ fontSize:12,color:`${G}90`,marginBottom:8 }}>— {m.client}</div>}
            <div style={{ fontSize:12,color:"rgba(255,255,255,0.5)",marginBottom:3 }}>
              <span style={{ color:`${G}80`,fontWeight:600,marginRight:4 }}>Départ</span>{m.pickup}
            </div>
            <div style={{ fontSize:12,color:"rgba(255,255,255,0.5)",marginBottom:10 }}>
              <span style={{ color:`${G}80`,fontWeight:600,marginRight:4 }}>Arrivée</span>{m.dropoff}
            </div>
            <div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:14 }}>
              {m.date} · {m.time} · <span style={{ color:G,fontWeight:700 }}>{m.price} €</span>
              {m.distance&&<span style={{ color:"rgba(255,255,255,0.35)",marginLeft:8 }}>{m.distance}</span>}
            </div>
            {m.notes&&<div style={{ fontSize:11,color:"rgba(255,255,255,0.3)",fontStyle:"italic",marginBottom:14,borderLeft:`2px solid ${G}30`,paddingLeft:10 }}>Note : {m.notes}</div>}

            {/* Boutons GPS */}
            <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:12,marginTop:4 }}>
              <div style={{ fontSize:9,color:`${G}70`,textTransform:"uppercase",letterSpacing:"0.1em",fontFamily:"Georgia,serif",marginBottom:10 }}>
                Naviguer vers le client
              </div>
              <div style={{ display:"flex",gap:8 }}>
                {gpsApps.map(app => (
                  <a
                    key={app.name}
                    href={app.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"10px 8px",background:app.bg,border:`1px solid ${app.color}35`,borderRadius:12,textDecoration:"none",transition:"all .2s" }}
                  >
                    <div style={{ width:32,height:32,borderRadius:"50%",background:`${app.color}20`,border:`1.5px solid ${app.color}60`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:app.color,fontFamily:"Georgia,serif" }}>
                      {app.icon}
                    </div>
                    <div style={{ fontSize:10,color:app.color,fontWeight:600,fontFamily:"Georgia,serif",letterSpacing:"0.03em" }}>{app.name}</div>
                  </a>
                ))}
              </div>
            </div>
          </Card>
        );
      })}
    </>}

    {myMissions.filter(m=>!["accepted","assigned"].includes(m.status)).length>0&&<><SecTitle icon="●">Historique</SecTitle>{myMissions.filter(m=>!["accepted","assigned"].includes(m.status)).map(m=><Card key={m.id}><div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}><div><div style={{ fontFamily:"Georgia,serif",fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.65)" }}>{m.title.split("–")[0].trim()}</div><div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:3 }}>{m.date} · <span style={{ color:`${G}80` }}>{m.price} €</span></div></div><Badge status={m.status}/></div></Card>)}</>}
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
  </div>;
};

/* ═══════════════════════════════════════════════════════════
   VUE CLIENT
═══════════════════════════════════════════════════════════ */
const ClientView = ({ missions, drivers, currentUser, tab }) => {
  const myMissions = missions.filter(m=>m.clientId===currentUser.clientId);
  const activeM    = myMissions.find(m=>["accepted","assigned"].includes(m.status));

  if (tab==="map") return <div><SecTitle sub="Votre course en temps réel">Carte GPS</SecTitle><MapView mission={activeM} drivers={drivers} standalone/>{activeM?<Card glow style={{ marginTop:14 }}><div style={{ fontSize:13,fontWeight:700,color:"#fff",fontFamily:"Georgia,serif",marginBottom:6 }}>{activeM.title}</div><div style={{ fontSize:12,color:"rgba(255,255,255,0.45)" }}><span style={{color:"rgba(201,168,76,0.7)",fontWeight:600,marginRight:4}}>Départ</span>{activeM.pickup}</div><div style={{ fontSize:12,color:"rgba(255,255,255,0.45)",marginTop:3 }}><span style={{color:"rgba(201,168,76,0.7)",fontWeight:600,marginRight:4}}>Arrivée</span>{activeM.dropoff}</div></Card>:<div style={{ textAlign:"center",padding:"30px 0",color:"rgba(255,255,255,0.2)",fontFamily:"Georgia,serif",fontSize:13 }}>Aucune course en cours</div>}</div>;

  if (tab==="vehicles") return <div><SecTitle icon="★" sub="Flotte Continental Limousines">Nos véhicules</SecTitle>{VEHICLES.map(v=><Card key={v.name}><div style={{ display:"flex",alignItems:"center",gap:14 }}><div style={{ width:50,height:50,borderRadius:14,background:`${G}15`,border:`1px solid ${G}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:G }}>{v.icon}</div><div style={{ flex:1 }}><div style={{ fontFamily:"Georgia,serif",fontWeight:700,fontSize:14,color:"#fff" }}>{v.name}</div><div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:2 }}>{v.desc} · {v.cap}</div></div><div style={{ fontSize:9,padding:"4px 9px",borderRadius:12,background:`${G}15`,color:G,border:`1px solid ${G}25`,textTransform:"uppercase",letterSpacing:"0.06em" }}>{v.tag}</div></div></Card>)}</div>;

  return <div>
    <Card glow style={{ marginBottom:22 }}>
      <div style={{ display:"flex",gap:14,alignItems:"center" }}><Av txt={currentUser.avatar} size={52}/><div><div style={{ fontFamily:"Georgia,serif",fontSize:17,fontWeight:700,color:"#fff" }}>{currentUser.name}</div><div style={{ fontSize:12,color:G,marginTop:3 }}>★ Client VIP · Compte Premium</div><div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:2 }}>Service 24h/24 · 7j/7</div></div></div>
    </Card>
    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:22 }}>
      {[["📞","Standard","+33 1 85 400 102"],["✉️","Email","contact@continental-limousines.fr"]].map(([ic,lbl,val])=><div key={lbl} style={{ padding:"14px 12px",background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,textAlign:"center" }}><div style={{ fontSize:20,marginBottom:5 }}>{ic}</div><div style={{ fontSize:9,color:`${G}70`,textTransform:"uppercase",letterSpacing:"0.1em",fontFamily:"Georgia,serif",marginBottom:4 }}>{lbl}</div><div style={{ fontSize:11,color:"#fff",fontWeight:600,wordBreak:"break-all" }}>{val}</div></div>)}
    </div>
    <SecTitle icon="◆" sub="Suivi en temps réel">Mes courses</SecTitle>
    {myMissions.length===0?<div style={{ textAlign:"center",padding:"40px 20px",color:"rgba(255,255,255,0.2)",fontFamily:"Georgia,serif" }}><div style={{ fontSize:32,marginBottom:12,opacity:.3 }}>★</div><div>Aucune course enregistrée</div></div>:myMissions.map(m=>{ const drv=drivers.find(d=>d.id===m.driverId); return(<Card key={m.id}><div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}><div style={{ fontFamily:"Georgia,serif",fontWeight:700,fontSize:14,color:"#fff",flex:1,marginRight:10 }}>{m.title}</div><Badge status={m.status}/></div><div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:3 }}><span style={{color:"rgba(201,168,76,0.7)",fontWeight:600,marginRight:4}}>Départ</span>{m.pickup}</div><div style={{ fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:8 }}><span style={{color:"rgba(201,168,76,0.7)",fontWeight:600,marginRight:4}}>Arrivée</span>{m.dropoff}</div><div style={{ fontSize:12,color:"rgba(255,255,255,0.4)" }}>{m.date} · {m.time} · <span style={{ color:G,fontWeight:700 }}>{m.price} €</span></div>{drv&&<div style={{ marginTop:10,display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:`${G}08`,borderRadius:12,border:`1px solid ${G}20` }}><Av txt={drv.avatar} size={28}/><div><div style={{ fontSize:12,fontWeight:700,color:G,fontFamily:"Georgia,serif" }}>{drv.name}</div><div style={{ fontSize:11,color:"rgba(255,255,255,0.35)" }}>★ {drv.rating} · {drv.vehicle} · {drv.plate}</div></div></div>}</Card>); })}
  </div>;
};

/* ═══════════════════════════════════════════════════════════
   NAVIGATION PAR RÔLE
═══════════════════════════════════════════════════════════ */
const NAV = {
  admin:      [{id:"missions",icon:"◆",label:"Missions"},{id:"dossiers",icon:"◈",label:"Dossiers"},{id:"map",icon:"Carte",label:"Carte"},{id:"chat",icon:"Chat",label:"Chat"},{id:"stats",icon:"Stats",label:"Stats"}],
  dispatcher: [{id:"dispatch",icon:"◈",label:"Dispatch"},{id:"fleet",icon:"▲",label:"Flotte"},{id:"map",icon:"Carte",label:"Carte"},{id:"chat",icon:"Chat",label:"Chat"},{id:"stats",icon:"Stats",label:"Stats"}],
  driver:     [{id:"missions",icon:"◆",label:"Missions"},{id:"map",icon:"Carte",label:"Carte"},{id:"chat",icon:"Chat",label:"Chat"},{id:"stats",icon:"Stats",label:"Stats"},{id:"profile",icon:"●",label:"Profil"}],
  client:     [{id:"rides",icon:"★",label:"Courses"},{id:"map",icon:"Carte",label:"Ma course"},{id:"vehicles",icon:"▲",label:"Véhicules"}],
};
const ROLE_LABELS = { admin:"Administrateur", dispatcher:"Dispatcher", driver:"Chauffeur", client:"Client VIP" };

/* ═══════════════════════════════════════════════════════════
   APP ROOT
═══════════════════════════════════════════════════════════ */
export default function App() {
  const [screen, setScreen]   = useState("login");
  const [user, setUser]       = useState(null);
  const [tab, setTab]         = useState(null);
  const [drivers]             = useState(INIT_DRIVERS);
  const [messages, setMessages] = useState(INIT_MSGS);
  const [toast, setToast]     = useState(null);
  const [toastType, setToastType] = useState("success");

  // Missions depuis Supabase
  const { missions, loading: missionsLoading, loadMissions, createMission, updateMission } = useMissions();

  // Wrapper setMissions pour compatibilité avec les vues existantes
  const setMissions = async (updater) => {
    if (typeof updater === "function") {
      // Pour les updates de statut depuis les vues (accept/refuse)
      const current = missions;
      const updated = updater(current);
      const changed = updated.find((m, i) => m.status !== current[i]?.status || m.driverId !== current[i]?.driverId);
      if (changed) {
        await updateMission(changed.id, { status: changed.status, driverId: changed.driverId });
      }
    }
  };

  const showToast = (msg, type="success") => {
    setToast(msg); setToastType(type);
    setTimeout(()=>setToast(null), 3200);
  };

  const login = acc => { setUser(acc); setTab(NAV[acc.role][0].id); setScreen("app"); };
  const logout = () => { setUser(null); setTab(null); setScreen("login"); };

  if (screen==="register") return <RegisterScreen onBack={()=>setScreen("login")}/>;
  if (screen==="login")    return <LoginScreen onLogin={login} onRegister={()=>setScreen("register")}/>;

  const role = user.role;
  const navItems = NAV[role]||[];

  // Badges de notification
  const driver = role==="driver" ? drivers.find(d=>d.id===user.driverId) : null;
  const badgeCount = (itemId) => {
    if (itemId==="missions"&&role==="driver")     return missions.filter(m=>m.status==="pending"&&m.vehicle===driver?.vehicle).length;
    if (itemId==="missions"&&role==="admin")      return missions.filter(m=>m.status==="pending").length;
    if (itemId==="dispatch"&&role==="dispatcher") return missions.filter(m=>m.status==="accepted").length;
    if (itemId==="chat") return messages.filter(m=>m.to===user.avatar&&!m.read).length;
    return 0;
  };

  const renderView = () => {
    const props = { missions, setMissions, drivers, messages, setMessages, currentUser:user, setToast:showToast, tab, createMission, updateMission, loadMissions };
    if (role==="admin")      return <AdminView      {...props}/>;
    if (role==="dispatcher") return <DispatcherView {...props}/>;
    if (role==="driver")     return <DriverView     {...props}/>;
    if (role==="client")     return <ClientView     {...props}/>;
  };

  return (
    <div style={{ background:BG, minHeight:"100vh", fontFamily:"Georgia,serif", color:"#fff" }}>
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse 70% 50% at 50% 0%, rgba(201,168,76,0.05) 0%, transparent 60%)", pointerEvents:"none", zIndex:0 }}/>
      <div style={{ position:"fixed", top:0, left:0, right:0, height:1, background:`linear-gradient(to right,transparent,${G}45,transparent)`, zIndex:20 }}/>

      {/* HEADER */}
      <div style={{ position:"sticky", top:0, zIndex:50, background:"rgba(5,5,5,0.96)", backdropFilter:"blur(24px)", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"11px 18px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <CLLogo size="sm"/>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:9, color:`${G}60`, textTransform:"uppercase", letterSpacing:"0.1em" }}>{ROLE_LABELS[role]}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.55)", marginTop:1 }}>{user.name}</div>
            </div>
            <Av txt={user.avatar} size={32}/>
            <button onClick={logout} style={{ width:30, height:30, borderRadius:"50%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", color:"rgba(255,255,255,0.35)", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>⏻</button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding:"20px 18px 120px", maxWidth:500, margin:"0 auto", position:"relative", zIndex:1 }}>
        {renderView()}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:50, background:"rgba(5,5,5,0.97)", backdropFilter:"blur(24px)", borderTop:"1px solid rgba(255,255,255,0.07)", paddingBottom:"env(safe-area-inset-bottom,0px)" }}>
        <div style={{ display:"flex", justifyContent:"space-around", maxWidth:500, margin:"0 auto", padding:"8px 0 13px" }}>
          {navItems.map(item => {
            const active = tab===item.id;
            const n = badgeCount(item.id);
            return (
              <button key={item.id} onClick={()=>setTab(item.id)}
                style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"5px 0", background:"none", border:"none", cursor:"pointer", position:"relative", flex:1 }}>
                {n>0 && <div style={{ position:"absolute",top:0,right:"calc(50% - 18px)",width:16,height:16,borderRadius:"50%",background:GG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#080604" }}>{n}</div>}
                <div style={{ fontSize:item.icon.length>2?14:18, color:active?G:"rgba(255,255,255,0.22)", transition:"all .2s", transform:active?"scale(1.1)":"scale(1)", lineHeight:1 }}>{item.icon}</div>
                <div style={{ fontSize:9, color:active?G:"rgba(255,255,255,0.22)", fontFamily:"Georgia,serif", letterSpacing:"0.06em", textTransform:"uppercase", fontWeight:active?700:400, transition:"all .2s" }}>{item.label}</div>
                {active&&<div style={{ width:16,height:1.5,background:GG,borderRadius:1,marginTop:1 }}/>}
              </button>
            );
          })}
        </div>
      </div>

      {toast&&<Toast msg={toast} type={toastType}/>}

      <style>{`
        *{-webkit-tap-highlight-color:transparent;box-sizing:border-box}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.2);border-radius:2px}
        select option{background:#0d0d0d;color:#fff}
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator{filter:invert(.6) sepia(1) saturate(3) hue-rotate(5deg);opacity:.7}
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
      `}</style>
    </div>
  );
}
