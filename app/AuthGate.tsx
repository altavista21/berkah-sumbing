"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext, type AuthProfile, type Role, type Shift } from "./AuthContext";
import { LockKeyhole, LogIn, ShieldCheck, Store, UserPlus, Wallet, X } from "lucide-react";
import "./auth.css";



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

export default function AuthGate({ children }: { children: ReactNode }) {
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
  const [forgotOpen, setForgotOpen] = useState(false);
  const [recoveryUserId, setRecoveryUserId] = useState("");
  const [recoveryApproverId, setRecoveryApproverId] = useState("");
  const [recoveryApproverPin, setRecoveryApproverPin] = useState("");
  const [recoveryNewPin, setRecoveryNewPin] = useState("");
  const [recoveryConfirmPin, setRecoveryConfirmPin] = useState("");

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
      if (selected.role !== "Kasir") {
        setShift(null);
        setSession(true);
      } else if (parsed?.status === "open" && parsed.userId === selected.id) {
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

  const resetForgottenPin = async () => {
    const target = users.find(u => u.id === recoveryUserId);
    const approver = users.find(u => u.id === recoveryApproverId);
    if (!target || !approver) {
      setNotice("Pilih akun dan pemberi persetujuan.");
      return;
    }
    if (approver.id === target.id) {
      setNotice("Akun yang lupa PIN tidak dapat menjadi pemberi persetujuan.");
      return;
    }
    if (approver.role !== "Kepala Cabang" && approver.role !== "Manajemen Pusat") {
      setNotice("Reset PIN harus disetujui Kepala Cabang atau Manajemen Pusat.");
      return;
    }
    if (!/^\d{4,6}$/.test(recoveryApproverPin) || !/^\d{4,6}$/.test(recoveryNewPin)) {
      setNotice("PIN persetujuan dan PIN baru harus 4–6 digit.");
      return;
    }
    if (recoveryNewPin !== recoveryConfirmPin) {
      setNotice("Konfirmasi PIN baru tidak sama.");
      return;
    }
    setBusy(true);
    try {
      if ((await hashPin(recoveryApproverPin)) !== approver.pinHash) {
        setNotice("PIN persetujuan salah.");
        return;
      }
      const newPinHash = await hashPin(recoveryNewPin);
      const nextUsers = users.map(u => u.id === target.id ? { ...u, pinHash: newPinHash } : u);
      saveUsers(nextUsers);
      setUsers(nextUsers);
      setRecoveryApproverPin("");
      setRecoveryNewPin("");
      setRecoveryConfirmPin("");
      setRecoveryApproverId("");
      setForgotOpen(false);
      setNotice("PIN berhasil direset. Silakan login dengan PIN baru.");
    } catch {
      setNotice("Reset PIN gagal.");
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

  useEffect(() => {
    const handler = () => lock();
    window.addEventListener("berkah-sumbing-lock", handler);
    return () => window.removeEventListener("berkah-sumbing-lock", handler);
  }, [session]);

  const closeShift = () => {
    if (!shift) return;
    const sales = (() => { try { return JSON.parse(localStorage.getItem("berkah-sumbing-sales") || "[]") as any[]; } catch { return []; } })();
    const cashSales = sales
      .filter(s => s.status !== "refunded" && (s.payment_method ?? s.payment) === "Tunai" && new Date(s.created_at ?? s.createdAt ?? 0).getTime() >= new Date(shift.openedAt).getTime())
      .reduce((sum, s) => sum + Number(s.total || 0), 0);
    const expectedCash = shift.openingCash + cashSales;
    const input = window.prompt(
      "Kas akhir fisik saat menutup shift.\n\n" +
      "Modal awal: " + new Intl.NumberFormat("id-ID", {style:"currency",currency:"IDR",maximumFractionDigits:0}).format(shift.openingCash) + "\n" +
      "Penjualan tunai: " + new Intl.NumberFormat("id-ID", {style:"currency",currency:"IDR",maximumFractionDigits:0}).format(cashSales) + "\n" +
      "Kas seharusnya: " + new Intl.NumberFormat("id-ID", {style:"currency",currency:"IDR",maximumFractionDigits:0}).format(expectedCash) + "\n\nMasukkan kas akhir:",
      String(expectedCash)
    );
    if (input === null) return;
    const endingCash = Number(input);
    if (!Number.isFinite(endingCash) || endingCash < 0) {
      setNotice("Kas akhir tidak valid. Shift belum ditutup.");
      return;
    }
    const difference = endingCash - expectedCash;
    const history = (() => { try { return JSON.parse(localStorage.getItem("berkah-sumbing-shift-history") || "[]") as any[]; } catch { return []; } })();
    localStorage.setItem("berkah-sumbing-shift-history", JSON.stringify([{
      ...shift, closedAt: new Date().toISOString(), endingCash, cashSales, expectedCash, difference, status: "closed"
    }, ...history].slice(0, 200)));
    localStorage.removeItem(SHIFT_KEY);
    localStorage.removeItem(SESSION_KEY);
    setShift(null);
    setSession(false);
    setMode("login");
    setNotice("Shift ditutup. Selisih kas: " + new Intl.NumberFormat("id-ID", {style:"currency",currency:"IDR",maximumFractionDigits:0}).format(difference) + ".");
  };

  if (!ready) return <div className="authloading">Memuat Berkah Sumbing POS...</div>;
  if (session && (shift || profile?.role !== "Kasir")) {
    return (
      <>
        <div className="sessionbar">
          <span><Store size={14}/> {profile?.name} • {profile?.role}</span>
          {shift ? <span className="shiftstatus"><span className="dot"/> Shift aktif • modal {new Intl.NumberFormat("id-ID", {style:"currency",currency:"IDR",maximumFractionDigits:0}).format(shift.openingCash)}</span> : <span className="shiftstatus"><span className="dot"/> Mode {profile?.role}</span>}
          <div>
            <button onClick={lock} className="sessionbtn"><LockKeyhole size={14}/> Kunci</button>
            {shift && <button onClick={closeShift} className="sessionbtn dangerbtn"><X size={14}/> Tutup Shift</button>}
          </div>
        </div>
        <AuthContext.Provider value={{ profile, shift }}>{children}</AuthContext.Provider>
      </>
    );
  }

  return (
    <main className="authpage">
      <section className="authcard">
        <div className="authbrand"><div className="authlogo">BS</div><div><b>Berkah Sumbing</b><small>Point of Sale</small></div></div>

        {mode === "setup" && (
          <>
            <div className="authtitle"><h1>Daftar pengguna utama</h1><p>Buat akun pertama untuk perangkat POS ini. Pilih Kepala Cabang atau Manajemen Pusat sebagai pengguna utama.</p></div>
            <label>Nama pengguna<input value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Andi" autoFocus /></label>
            <label>Peran<select value={role} onChange={e => setRole(e.target.value as Role)}><option>Kasir</option><option>Kepala Cabang</option><option>Manajemen Pusat</option></select></label>
            <label>PIN<input inputMode="numeric" type="password" maxLength={6} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ""))} placeholder="4–6 digit" /></label>
            <label>Konfirmasi PIN<input inputMode="numeric" type="password" maxLength={6} value={pinConfirm} onChange={e => setPinConfirm(e.target.value.replace(/\D/g, ""))} placeholder="Ulangi PIN" /></label>
            <button className="authprimary" onClick={register} disabled={busy}><ShieldCheck size={17}/>{busy ? "Menyimpan..." : "Daftar Pengguna"}</button>
            <button className="authsecondary" onClick={() => { setMode("login"); setNotice(""); }}><LogIn size={16}/> Ke login</button>
          </>
        )}

        {mode === "login" && (
          <>
            <div className="authtitle"><h1>Masuk ke POS</h1><p>Pilih pengguna yang terdaftar lalu masukkan PIN.</p></div>
            <label>Pengguna<select value={selectedUserId} onChange={e => { setSelectedUserId(e.target.value); setProfile(users.find(u => u.id === e.target.value) ?? null); }}>
              <optgroup label="Kasir">
                {users.filter(user => user.role === "Kasir").map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
              </optgroup>
              <optgroup label="Kepala Cabang">
                {users.filter(user => user.role === "Kepala Cabang").map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
              </optgroup>
              <optgroup label="Manajemen Pusat">
                {users.filter(user => user.role === "Manajemen Pusat").map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
              </optgroup>
            </select></label>
            {profile && <div className="rolepill">{profile.role}</div>}
            <label>PIN<input autoFocus inputMode="numeric" type="password" maxLength={6} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ""))} onKeyDown={e => e.key === "Enter" && login()} placeholder="PIN" /></label>
            <button className="authlink" type="button" onClick={() => { setRecoveryUserId(selectedUserId); setRecoveryApproverId(""); setRecoveryApproverPin(""); setRecoveryNewPin(""); setRecoveryConfirmPin(""); setNotice(""); setForgotOpen(true); }}>Lupa PIN?</button>
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

        {forgotOpen && (
          <div className="authmodalbackdrop" onClick={() => setForgotOpen(false)}>
            <div className="authmodal" onClick={e => e.stopPropagation()}>
              <div className="authtitle"><h2>Reset PIN</h2><p>Reset PIN harus disetujui Kepala Cabang atau Manajemen Pusat.</p></div>
              <label>Akun
                <select value={recoveryUserId} onChange={e => setRecoveryUserId(e.target.value)}>
                  {users.map(user => <option key={user.id} value={user.id}>{user.name} • {user.role}</option>)}
                </select>
              </label>
              <label>Pemberi persetujuan
                <select value={recoveryApproverId} onChange={e => setRecoveryApproverId(e.target.value)}>
                  <option value="">Pilih Kepala Cabang / Manajemen Pusat</option>
                  {users.filter(user => user.role === "Kepala Cabang" || user.role === "Manajemen Pusat").map(user => <option key={user.id} value={user.id}>{user.name} • {user.role}</option>)}
                </select>
              </label>
              <label>PIN pemberi persetujuan<input inputMode="numeric" type="password" maxLength={6} value={recoveryApproverPin} onChange={e => setRecoveryApproverPin(e.target.value.replace(/\D/g, ""))} /></label>
              <label>PIN baru<input inputMode="numeric" type="password" maxLength={6} value={recoveryNewPin} onChange={e => setRecoveryNewPin(e.target.value.replace(/\D/g, ""))} /></label>
              <label>Konfirmasi PIN baru<input inputMode="numeric" type="password" maxLength={6} value={recoveryConfirmPin} onChange={e => setRecoveryConfirmPin(e.target.value.replace(/\D/g, ""))} /></label>
              <div className="authmodalactions">
                <button className="authsecondary" type="button" onClick={() => setForgotOpen(false)}>Batal</button>
                <button className="authprimary" type="button" onClick={resetForgottenPin} disabled={busy}><ShieldCheck size={16}/> Reset PIN</button>
              </div>
            </div>
          </div>
        )} 

        {notice && <div className="authnotice">{notice}</div>}
        <small className="authfoot">Mode lokal: akun, PIN, dan shift tersimpan hanya di perangkat ini.</small>
      </section>
    </main>
  );
}
