"use client";

import { useEffect, useRef } from "react";
import { ORIGIN_KEYS } from "@/lib/origin";

// Fills the hidden origin fields in the browser, the only place that knows the referrer. No cookie
// is set. A referrer from this same site is internal navigation, not an origin.
export function OriginFields() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const external = document.referrer && new URL(document.referrer).origin !== window.location.origin;
    for (const input of ref.current?.querySelectorAll("input") ?? []) {
      input.value = input.name === "referrer" ? (external ? document.referrer : "") : (params.get(input.name) ?? "");
    }
  }, []);

  return (
    <div ref={ref} hidden>
      {ORIGIN_KEYS.map((key) => (
        <input key={key} type="hidden" name={key} />
      ))}
    </div>
  );
}
