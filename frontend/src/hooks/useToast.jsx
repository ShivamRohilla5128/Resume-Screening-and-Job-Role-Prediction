import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info } from "lucide-react";

const Ctx = createContext(null);
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((type, msg) => {
    const id = Math.random().toString(36).slice(2);
    setItems((s) => [...s, { id, type, msg }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 4500);
  }, []);
  const api = { success: (m) => push("success", m), error: (m) => push("error", m), info: (m) => push("info", m) };
  const Icon = { success: CheckCircle2, error: XCircle, info: Info };
  const tone = { success: "text-success", error: "text-red-600", info: "text-brand" };
  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2" role="status" aria-live="polite">
        <AnimatePresence>
          {items.map((t) => {
            const I = Icon[t.type];
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}
                className="card flex items-start gap-3 p-3.5 text-sm">
                <I className={`mt-0.5 h-5 w-5 shrink-0 ${tone[t.type]}`} /> <span>{t.msg}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
