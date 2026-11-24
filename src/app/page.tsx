
"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import {
  Gem,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import AuthGate from "@/components/AuthGate";
import CommunitySelector from "@/components/CommunitySelector";
import CommunityApp from "@/components/CommunityApp";

import { getCommunities } from "@/lib/communities";
import type { Community } from "@/lib/communities";

// ==================================================
// AUTENTICACIÓN PRINCIPAL
// ==================================================

export default function Home() {
  return (
    <AuthGate>
      {(user) => (
        <ExodoApp key={user.id} user={user} />
      )}
    </AuthGate>
  );
}

// ==================================================
// APLICACIÓN PRINCIPAL
// ==================================================

function ExodoApp({ user }: { user: User }) {
  const [communities, setCommunities] =
    useState<Community[]>([]);

  const [selectedCommunity, setSelectedCommunity] =
    useState<Community | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==================================================
  // CARGAR COMUNIDADES
  // ==================================================

  const refreshCommunities = useCallback(
    async (communityId?: string) => {
      setError("");

      const data = await getCommunities();

      setCommunities(data);

      if (communityId) {
        const community = data.find(
          (item) => item.id === communityId
        );

        if (community) {
          setSelectedCommunity(community);
        }
      }
    },
    []
  );

  // ==================================================
  // CARGA INICIAL
  // ==================================================

  const loadCommunities = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      await refreshCommunities();
    } catch (err: unknown) {
      setError(
        err &&
        typeof err === "object" &&
        "message" in err
          ? String(err.message)
          : "No se pudieron cargar las comunidades."
      );
    } finally {
      setLoading(false);
    }
  }, [refreshCommunities]);

  useEffect(() => {
    void loadCommunities();
  }, [loadCommunities]);

  // ==================================================
  // SELECCIONAR COMUNIDAD
  // ==================================================

  function selectCommunity(community: Community) {
    setSelectedCommunity(community);
  }

  function backToCommunities() {
    setSelectedCommunity(null);
  }

  // ==================================================
  // PANTALLA DE CARGA
  // ==================================================

  if (loading) {
    return (
      <div className="login-screen">

        <Gem size={45} color="#c9b38a" />

        <LoaderCircle
          size={28}
          className="loading-icon"
        />

        <p>Preparando tus comunidades...</p>

      </div>
    );
  }

  // ==================================================
  // PANTALLA DE ERROR
  // ==================================================

  if (error) {
    return (
      <div className="login-screen">

        <Gem size={45} color="#c9b38a" />

        <div className="login-card">

          <h2>No se pudo cargar Éxodo</h2>

          <p>{error}</p>

          <button
            className="exodo-primary-button"
            onClick={() => void loadCommunities()}
          >
            <RefreshCw size={17} />
            Reintentar
          </button>

        </div>

      </div>
    );
  }

  // ==================================================
  // COMUNIDAD SELECCIONADA
  // ==================================================

  if (selectedCommunity) {
    return (
      <CommunityApp
        key={selectedCommunity.id}
        user={user}
        community={selectedCommunity}
        communities={communities}
        onSelectCommunity={selectCommunity}
        onBack={backToCommunities}
      />
    );
  }

  // ==================================================
  // SELECTOR DE COMUNIDADES
  // ==================================================

  return (
    <CommunitySelector
      communities={communities}
      onSelect={selectCommunity}
      onRefresh={refreshCommunities}
    />
  );
}
