"use client";

import { useEffect, useState } from "react";
import { LockKeyhole, LogIn, ShieldCheck, Store, Wallet, X } from "lucide-react";
import "./auth.css";

type Role = "Kasir" | "Admin Cabang" | "Manajemen Pusat";
type AuthProfile = { name: string; role: Role; pinHash: string };
type Shift = { id: string; openedAt: string; openingCash: number; role: Role; status: "open" };

const AUTH_KEY = "berkah-sumbing-auth";
const SHIFT_KEY = "berkah-sumbing-shift";
const SESSION_KEY = "berkah-sumbing-session";

async function hashPin(pin: string) {
  const bytes = new TextEncoder().encode(pin);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [session, setSession] = useState(false);
  const [shift, setShift] = useState<Shift | null>(null);
  const [mode, setMode] = useState<"setup" | "login" | "shift">("login");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("Kasir");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [openingCash, setOpeningCash] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTH_KEY);
      const savedSession = localStorage.getItem(SESSION_KEY) === "1";
      const savedShift = localStorage.getItem(SHIFT_KEY);
      const parsedShift = savedShift ? JSON.parse(savedShift) as Shift : null;

      if (!saved) setMode("setup");
      else {
        setProfile(JSON.parse(saved) as AuthProfile);
        if (savedSession && parsedShift?.status === "open") {
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

  const setup = async () => {
    const cleanName = name.trim();
    if (!cleanName || pin.length < 4 || pin.length > 6 || !/^\\d+$/.test(pin)) {
      setNotice("Nama dan PIN 4–6 digit wajib diisi.");
      return;
    }
    if (pin !== pinConfirm) {
      setNotice("Konfirmasi PIN tidak sama.");
      return;
    }
    setBusy(true);
    try {
      const next: AuthProfile = { name: cleanName, role, pinHash: await hashPin(pin) };
      localStorage.setItem(AUTH_KEY, JSON.stringify(next));
      setProfile(next);
      setPin("");
      setPinConfirm("");
      setNotice("");
      setMode("login");
    } catch {
      setNotice("Profil gagal disimpan di perangkat.");
    } finally {
      setBusy(false);
    }
  };

  const login = async () => {
    if (!profile || !/^\\d{4,6}$/.test(pin)) {
      setNotice("Masukkan PIN 4–6 digit.");
      return;
    }
    setBusy(true);
    try {
      const valid = (await hashPin(pin)) === profile.pinHash;
      if (!valid) {
        setNotice("PIN salah.");
        return;
      }
      localStorage.setItem(SESSION_KEY, "1");
      setPin("");
      const savedShift = localStorage.getItem(SHIFT_KEY);
      const parsed = savedShift ? JSON.parse(savedShift) as Shift : null;
      if (parsed?.status === "open") {
        setShift(parsed);
        setSession(true);
      } else {
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
            <div className="authtitle"><h1>Siapkan akses kasir</h1><p>Buat PIN lokal untuk mengunci aplikasi di perangkat ini.</p></div>
            <label>Nama pengguna<input value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Andi" autoFocus /></label>
            <label>Peran<select value={role} onChange={e => setRole(e.target.value as Role)}><option>Kasir</option><option>Admin Cabang</option><option>Manajemen Pusat</option></select></label>
            <label>PIN<input inputMode="numeric" type="password" maxLength={6} value={pin} onChange={e => setPin(e.target.value.replace(/\\D/g, ""))} placeholder="4–6 digit" /></label>
            <label>Konfirmasi PIN<input inputMode="numeric" type="password" maxLength={6} value={pinConfirm} onChange={e => setPinConfirm(e.target.value.replace(/\\D/g, ""))} placeholder="Ulangi PIN" /></label>
            <button className="authprimary" onClick={setup} disabled={busy}><ShieldCheck size={17}/>{busy ? "Menyimpan..." : "Simpan & Lanjut"}</button>
          </>
        )}

        {mode === "login" && (
          <>
            <div className="authtitle"><h1>Masuk ke POS</h1><p>Masukkan PIN pengguna <b>{profile?.name}</b>.</p></div>
            <div className="rolepill">{profile?.role}</div>
            <label>PIN<input autoFocus inputMode="numeric" type="password" maxLength={6} value={pin} onChange={e => setPin(e.target.value.replace(/\\D/g, ""))} onKeyDown={e => e.key === "Enter" && login()} placeholder="PIN" /></label>
            <button className="authprimary" onClick={login} disabled={busy}><LogIn size={17}/>{busy ? "Memeriksa..." : "Masuk"}</button>
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
        <small className="authfoot">Mode lokal: PIN dan shift tersimpan hanya di perangkat ini.</small>
      </section>
    </main>
  );
}
