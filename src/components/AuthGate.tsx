"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { Gem, LogOut, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AuthGate({
  children,
}: {
  children: (user: User) => ReactNode;
}) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (active) {
        setUser(data.user ?? null);
        setLoading(false);
      }
    });

    const { data: listener } =
      supabase.auth.onAuthStateChange((_event, session) => {
        if (active) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      });

    if (
      new URLSearchParams(window.location.search)
        .has("auth_error")
    ) {
      setError(
        "No se pudo iniciar sesión. Inténtalo nuevamente."
      );
    }

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function login() {
    setSigningIn(true);
    setError("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "identify email",
      },
    });

    if (error) {
      setError(error.message);
      setSigningIn(false);
    }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      window.alert("No se pudo cerrar la sesión.");
    }
  }

  if (loading) {
    return (
      <div className="login-screen">
        <LoaderCircle className="loading-icon" size={32} />
        <p>Cargando Éxodo...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="login-screen">
        <div className="login-brand">
          <Gem size={48} />
          <h1>É X O D O</h1>
          <p>Tu comunidad. Tus aventuras. Tu mundo.</p>
        </div>

        <div className="login-card">
          <h2>Bienvenido, aventurero</h2>

          <p>
            Inicia sesión para acceder a tus comunidades
            y comenzar tu próxima aventura.
          </p>

          <button
            className="discord-login"
            onClick={login}
            disabled={signingIn}
          >
            {signingIn
              ? "Conectando con Discord..."
              : "Iniciar sesión con Discord"}
          </button>

          {error && (
            <p className="login-error">{error}</p>
          )}

          <span className="login-footer">
            Un mundo de aventuras te espera.
          </span>
        </div>

        <span className="login-version">
          Éxodo · Versión 0.2
        </span>
      </div>
    );
  }

  return (
    <>
      {children(user)}

      <button
        className="logout-button"
        onClick={logout}
        title="Cerrar sesión"
      >
        <LogOut size={16} />
        Cerrar sesión
      </button>
    </>
  );
}
