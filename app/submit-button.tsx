"use client";

import { useFormStatus } from "react-dom";

// Locked while the form is on its way: a double click once created two leads, each with a paid research.
export function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn" type="submit" disabled={pending}>
      {pending ? "Enviando…" : "Enviar"}
    </button>
  );
}
