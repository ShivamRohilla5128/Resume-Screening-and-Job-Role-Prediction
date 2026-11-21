import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth, clearToken, getToken, setToken } from "../services/api";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  useEffect(() => {
    if (!getToken()) return;
    auth.me().then(setUser).catch(() => clearToken()).finally(() => setLoading(false));
  }, []);

  const finish = useCallback((res, remember) => { setToken(res.access_token, remember); setUser(res.user); return res.user; }, []);
  const login = useCallback(async (email, password, remember) => finish(await auth.login({ email, password, remember }), remember), [finish]);
  const register = useCallback(async (name, email, password) => finish(await auth.register({ name, email, password }), true), [finish]);
  const logout = useCallback(() => { clearToken(); setUser(null); }, []);

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}
