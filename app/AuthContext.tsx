import { createContext, useContext } from "react";

export type Role = "Kasir" | "Kepala Cabang" | "Manajemen Pusat";
export type AuthProfile = { id: string; name: string; role: Role; pinHash: string };
export type Shift = { id: string; openedAt: string; openingCash: number; role: Role; userId: string; status: "open" };

export const AuthContext = createContext<{ profile: AuthProfile | null; shift: Shift | null }>({
  profile: null,
  shift: null
});

export const useAuth = () => useContext(AuthContext);
