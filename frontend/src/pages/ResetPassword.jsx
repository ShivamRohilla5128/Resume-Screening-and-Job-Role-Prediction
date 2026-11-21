import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Spinner } from "../components/ui";
import { Logo } from "../layouts/AppLayout";
import { auth } from "../services/api";
import { useToast } from "../hooks/useToast";
import { errMsg } from "../utils/format";

export default function ResetPassword() {
  const [q] = useSearchParams();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const nav = useNavigate();
  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return toast.error("Password needs 8+ characters with a letter and a number");
    setBusy(true);
    try { await auth.reset(q.get("token") || "", pw); toast.success("Password updated"); nav("/login"); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <div className="grid min-h-screen place-items-center bg-surface p-5">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-7">
        <Logo /><h1 className="text-xl font-semibold">Choose a new password</h1>
        <input type="password" className="input" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" aria-label="New password" />
        <button className="btn btn-primary w-full" disabled={busy}>{busy && <Spinner className="h-4 w-4" />}Update password</button>
        <Link to="/login" className="block text-center text-sm text-brand hover:underline">Back to log in</Link>
      </form>
    </div>
  );
}
