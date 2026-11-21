import { useEffect, useState } from "react";
import { meta } from "../services/api";

let cache = null;
export default function useRoles() {
  const [roles, setRoles] = useState(cache || []);
  useEffect(() => {
    if (cache) return;
    meta.roles().then((r) => { cache = r.roles; setRoles(r.roles); }).catch(() => {});
  }, []);
  return roles;
}
