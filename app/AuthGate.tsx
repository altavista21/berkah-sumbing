"use client";

import { useEffect, useState } from "react";
import { LockKeyhole, LogIn, ShieldCheck, Store, UserPlus, Wallet, X } from "lucide-react";
import "./auth.css";

type Role = "Kasir" | "Kepala Cabang" | "Manajemen Pusat";
type AuthProfile = { id: string; name: string; role: Role; pinHash: string };
type Shift = { id: string; openedAt: string; openingCash: number; role: Role; userId: string; status: "open" };

const AUTH_KEY = "berkah-sumbing-auth";
const USERS_KEY = "berkah-sumbing-users";
const SHIFT_KEY = "berkah-sumbing-shift";
const SESSION_KEY = "berkah-sumbing-session";

async function hashPin(pin: string) {
  const bytes = new TextEncoder().encode(pin);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function newId() { return crypto.randomUUID(); }

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [users, setUsers] = useState<AuthProfile[]>([]);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [session, setSession] = useState(false);
  const [shift, setShift] = useState<Shift | null>(null);
  const [mode, setMode] = useState<"setup" | "login" | "signup" | "shift">("login");
  const [name, setName] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [role, setRole] = useState<Role>("Kasir");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [openingCash, setOpeningCash] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const savedUsers = localStorage.getItem(USERS_KEY);
      const legacy = localStorage.getItem(AUTH_KEY);
      const savedSession = localStorage.getItem(SESSION_KEY) === "1";
      const savedShift = localStorage.getItem(SHIFT_KEY);
      const parsedShift = savedShift ? JSON.parse(savedShift) as Shift : null;
      let nextUsers: AuthProfile[] = [];
      if (savedUsers) {
        const parsed = JSON.parse(savedUsers) as AuthProfile[];
        if (Array.isArray(parsed)) nextUsers = parsed;
      } else if (legacy) {
        const old = JSON.parse(legacy) as { name: string; role: Role; pinHash: string };
        nextUsers = [{ id: newId(), ...old }];
        localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers));
      }
      setUsers(nextUsers);
      if (nextUsers.length === 0) {
        setMode("setup");
      } else {
        const current = nextUsers.find(u => u.id === parsedShift?.userId) ?? nextUsers[0];
        setProfile(current);
        setSelectedUserId(current.id);
        if (savedSession && parsedShift?.status === "open" && parsedShift.userId === current.id) {
          setSession(true);
          setShift(parsedShift);
        } else {
          setMode("login");
        }
      }
    } catch {
      setMode("setup");
    } finally {
      setReady(true);
    }
  }, []);

  const saveUsers = (next: AuthProfile[]) => {
    setUsers(next);
    localStorage.setItem(USERS_KEY, JSON.stringify(next));
    if (next[0]) localStorage.setItem(AUTH_KEY, JSON.stringify(next[0]));
  };

  const register = async () => {
    const cleanName = name.trim();
    if (!cleanName || !/^\d{4,6}$/.test(pin)) {
      setNotice("Nama dan PIN 4–6 digit wajib diisi.");
      return;
    }
    if (pin !== pinConfirm) {
      setNotice("Konfirmasi PIN tidak sama.");
      return;
    }
    setBusy(true);
    try {
      const next: AuthProfile = { id: newId(), name: cleanName, role, pinHash: await hashPin(pin) };
      const nextUsers = [...users, next];
      saveUsers(nextUsers);
      setProfile(next);
      setSelectedUserId(next.id);
      setName("");
      setPin("");
      setPinConfirm("");
      setNotice("");
      setMode("login");
    } catch {
      setNotice("Pendaftaran gagal disimpan di perangkat.");
    } finally {
      setBusy(false);
    }
  };

  const login = async () => {
    const selected = users.find(u => u.id === selectedUserId);
    if (!selected || !/^\d{4,6}$/.test(pin)) {
      setNotice("Pilih pengguna dan masukkan PIN 4–6 digit.");
      return;
    }
    setBusy(true);
    try {
      const valid = (await hashPin(pin)) === selected.pinHash;
      if (!valid) {
        setNotice("PIN salah.");
        return;
      }
      setProfile(selected);
      localStorage.setItem(SESSION_KEY, "1");
      setPin("");
      const savedShift = localStorage.getItem(SHIFT_KEY);
      const parsed = savedShift ? JSON.parse(savedShift) as Shift : null;
      if (parsed?.status === "open" && parsed.userId === selected.id) {
        setShift(parsed);
        setSession(true);
      } else {
        setShift(null);
        setMode("shift");
      }
    } catch {
      setNotice("Login gagal.");
    } finally {
      setBusy(false);
    }
  };

  const openShift = () => {
    const cash = Number(openingCash);
    if (!Number.isFinite(cash) || cash < 0) {
      setNotice("Modal awal harus 0 atau lebih.");
      return;
    }
    const next: Shift = {
      id: crypto.randomUUID(),
      openedAt: new Date().toISOString(),
      openingCash: cash,
      role: profile?.role ?? "Kasir",
      userId: profile?.id ?? "",
      status: "open"
    };
    localStorage.setItem(SHIFT_KEY, JSON.stringify(next));
    localStorage.setItem(SESSION_KEY, "1");
    setShift(next);
    setSession(true);
    setOpeningCash("");
    setNotice("");
  };

  const lock = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(false);
    setPin("");
    setNotice("");
    setMode("login");
  };

  const closeShift = () => {
    if (!window.confirm("Tutup shift sekarang? Pastikan transaksi hari ini sudah selesai.")) return;
    localStorage.removeItem(SHIFT_KEY);
    localStorage.removeItem(SESSION_KEY);
    setShift(null);
    setSession(false);
    setMode("login");
    setNotice("Shift berhasil ditutup.");
  };

  if (!ready) return <div className="authloading">Memuat Berkah Sumbing POS...</div>;
  if (session && shift) {
    return (
      <>
        <div className="sessionbar">
          <span><Store size={14}/> {profile?.name} • {profile?.role}</span>
          <span className="shiftstatus"><span className="dot"/> Shift aktif • modal {new Intl.NumberFormat("id-ID", {style:"currency",currency:"IDR",maximumFractionDigits:0}).format(shift.openingCash)}</span>
          <div>
            <button onClick={lock} className="sessionbtn"><LockKeyhole size={14}/> Kunci</button>
            <button onClick={closeShift} className="sessionbtn dangerbtn"><X size={14}/> Tutup Shift</button>
          </div>
        </div>
        {children}
      </>
    );
  }

  return (
    <main className="authpage">
      <section className="authcard">
        <div className="authbrand"><div className="authlogo">BS</div><div><b>Berkah Sumbing</b><small>Point of Sale • Lokal</small></div></div>

        {mode === "setup" && (
          <>
            <div className="authtitle"><h1>Daftar pengguna utama</h1><p>Buat akun pertama untuk perangkat POS ini. Pilih Kepala Cabang atau Manajemen Pusat sebagai pengguna utama.</p></div>
            <label>Nama pengguna<input value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Andi" autoFocus /></label>
            <label>Peran<select value={role} onChange={e => setRole(e.target.value as Role)}><option>Kasir</option><option>Kepala Cabang</option><option>Manajemen Pusat</option></select></label>
            <label>PIN<input inputMode="numeric" type="password" maxLength={6} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ""))} placeholder="4–6 digit" /></label>
            <label>Konfirmasi PIN<input inputMode="numeric" type="password" maxLength={6} value={pinConfirm} onChange={e => setPinConfirm(e.target.value.replace(/\D/g, ""))} placeholder="Ulangi PIN" /></label>
            <button className="authprimary" onClick={register} disabled={busy}><ShieldCheck size={17}/>{busy ? "Menyimpan..." : "Daft{mode === "login" && (
          <>
            <div className="authtitle"><h1>Masuk ke POS</h1><p>Pilih pengguna yang terdaftar lalu masukkan PIN.</p></div>
            <label>Pengguna<select value={selectedUserId} onChange={e => { setSelectedUserId(e.target.value); setProfile(users.find(u => u.id === e.target.value) ?? null); }}>
              {users.map(user => <option key={user.id} value={user.id}>{user.name} • {user.role}</option>)}
            </select></label>
            {profile && <div className="rolepill">{profile.role}</div>}
            <label>PIN<input autoFocus inputMode="numeric" type="password" maxLength={6} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ""))} onKeyDown={e => e.key === "Enter" && login()} placeholder="PIN" /></label>
            <button className="authprimary" onClick={login} disabled={busy}><LogIn size={17}/>{busy ? "Memeriksa..." : "Masuk"}</button>
            <button className="authsecondary" onClick={() => { setMode("signup"); setNotice(""); setPin(""); setPinConfirm(""); setName(""); }}><UserPlus size={16}/> Daftar pengguna baru</button>
          </>
        )}

        {mode === "signup" && (
          <>
            <div className="authtitle"><h1>Daftar pengguna</h1><p>Tambahkan akun Kepala Cabang, Kasir, atau Manajemen Pusat pada perangkat ini.</p></div>
            <label>Nama pengguna<input value={name} onChange={e => setName(e.target.value)} placeholder="Nama lengkap" autoFocus /></label>
            <label>Peran<select value={role} onChange={e => setRole(e.target.value as Role)}><option>Kasir</option><option>Kepala Cabang</option><option>Manajemen Pusat</option></select></label>
            <label>PIN<input inputMode="numeric" type="password" maxLength={6} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ""))} placeholder="4–6 digit" /></label>
            <label>Konfirmasi PIN<input inputMode="numeric" type="password" maxLength={6} value={pinConfirm} onChange={e => setPinConfirm(e.target.value.replace(/\D/g, ""))} placeholder="Ulangi PIN" /></label>
            <button className="authprimary" onClick={register} disabled={busy}><UserPlus size={17}/>{busy ? "Mendaftarkan..." : "Daftar Pengguna"}</button>
            <button className="authsecondary" onClick={() => { setMode("login"); setNotice(""); }}><LogIn size={16}/> Kembali ke login</button>
          </>
        )}

        {mode === "shift" && (
          <>
            <div className="authtitle"><h1>Buka shift kasir</h1><p>Masukkan modal awal sebelum mulai transaksi.</p></div>
            <div className="shiftinfo"><Store size={18}/><div><b>{profile?.name}</b><small>{profile?.role}</small></div></div>
            <label>Modal awal<input inputMode="numeric" type="number" min="0" value={openingCash} onChange={e => setOpeningCash(e.target.value)} placeholder="0" autoFocus /></label>
            <button className="authprimary" onClick={openShift}><Wallet size={17}/> Buka Shift</button>
          </>
        )}

        {notice && <div className="authnotice">{notice}</div>}
        <small className="authfoot">Mode lokal: akun, PIN, dan shift tersimpan hanya di perangkat ini.</small>
      </section>
    </main>
  );
}
