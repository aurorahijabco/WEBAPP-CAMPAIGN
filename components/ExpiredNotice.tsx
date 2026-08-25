"use client";

import { useEffect, useState } from "react";

/**
 * Shows a "session expired" notice when middleware bounced the user here
 * because their cookie no longer matched a valid session row (as opposed to
 * having no cookie at all). Reads window.location directly instead of
 * useSearchParams() so these already-client auth pages don't need a
 * Suspense boundary just for this.
 */
export function ExpiredNotice() {
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("expired") === "1") setExpired(true);
  }, []);

  if (!expired) return null;

  return (
    <div className="notice notice-danger mb-4" role="alert">
      <span>Sesi kamu telah berakhir. Silakan masuk kembali.</span>
    </div>
  );
}
