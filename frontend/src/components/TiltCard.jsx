import { useRef } from "react";
import { useReducedMotion } from "framer-motion";

/* Gentle 3D tilt toward the pointer. Disabled for reduced-motion users. */
export default function TiltCard({ children, className = "", max = 6 }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const move = (e) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.transform = `perspective(900px) rotateY(${x * max}deg) rotateX(${-y * max}deg)`;
  };
  const leave = () => { if (ref.current) ref.current.style.transform = ""; };
  return (
    <div ref={ref} onMouseMove={move} onMouseLeave={leave} className={`transition-transform duration-200 ease-out will-change-transform ${className}`}>
      {children}
    </div>
  );
}
