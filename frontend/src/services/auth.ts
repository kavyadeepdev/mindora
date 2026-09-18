export interface UserSession {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: string;
  };
}

export const authService = {
  async getSession(): Promise<UserSession | null> {
    try {
      const res = await fetch('/api/auth/get-session', {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async signIn(email: string, password: string):Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: data.message || 'Failed to sign in' };
      }
      return { ok: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg };
    }
  },

  async signUp(name: string, email: string, password: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch('/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { ok: false, error: data.message || 'Failed to register account' };
      }
      return { ok: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: msg };
    }
  },

  async signOut(): Promise<boolean> {
    try {
      const res = await fetch('/api/auth/sign-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
