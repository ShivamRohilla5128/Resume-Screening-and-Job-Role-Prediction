import { createContext, useContext, useEffect, useState } from "react";

const CurrentResumeContext = createContext(null);

export function CurrentResumeProvider({ user, children }) {
  const key = user?.email ? `resumeai:current-resume:${user.email.toLowerCase()}` : null;
  const [currentResume, setCurrentResume] = useState(null);

  useEffect(() => {
    const saved = key ? localStorage.getItem(key) : null;
    setCurrentResume(saved ? JSON.parse(saved) : null);
  }, [key]);

  const selectResume = (resume) => {
    setCurrentResume(resume);
    if (key) {
      if (resume) localStorage.setItem(key, JSON.stringify(resume));
      else localStorage.removeItem(key);
    }
  };

  return (
    <CurrentResumeContext.Provider value={{ currentResume, selectResume }}>
      {children}
    </CurrentResumeContext.Provider>
  );
}

export function useCurrentResume() {
  const value = useContext(CurrentResumeContext);
  if (!value) throw new Error("useCurrentResume must be used within CurrentResumeProvider");
  return value;
}
