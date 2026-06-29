'use client';

import { useEffect, useState } from 'react';

const VISITOR_ID_KEY = 'twitchan_visitor_id_v1';
const VISITOR_TOKEN_KEY = 'twitchan_visitor_token_v1';

function generateId(): string {
  // 128 bits of randomness = 32 hex chars
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface VisitorInfo {
  id: string;          // random 32-char hex (NOT PII)
  token: string;       // HMAC-signed token for API auth
  ready: boolean;
}

export function useVisitor(): VisitorInfo | null {
  const [visitor, setVisitor] = useState<VisitorInfo | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(VISITOR_ID_KEY, id);
    }

    // Fetch a signed token from the server. The server signs the ID + an
    // expiry timestamp with HMAC-SHA256 using a secret key.
    fetch('/api/visitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.token) {
          localStorage.setItem(VISITOR_TOKEN_KEY, j.token);
          setVisitor({ id: id!, token: j.token, ready: true });
        } else {
          // Fallback: use the bare ID (server may not have signing key)
          setVisitor({ id: id!, token: id!, ready: true });
        }
      })
      .catch(() => {
        // Network error — fall back to bare ID
        setVisitor({ id: id!, token: id!, ready: true });
      });
  }, []);

  return visitor;
}

// Get the stored visitor token (for use in non-React contexts)
export function getStoredVisitorToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(VISITOR_TOKEN_KEY);
}
