
"use client";

import { useState } from "react";
import {
  Gem,
  Plus,
  Link as LinkIcon,
  ArrowRight,
  X,
  LoaderCircle,
  Users,
} from "lucide-react";

import {
  createCommunity,
  joinCommunity,
} from "@/lib/communities";

import type { Community } from "@/lib/communities";

interface CommunitySelectorProps {
  communities: Community[];
  onSelect: (community: Community) => void;
  onRefresh: (communityId?: string) => Promise<void>;
}

export default function CommunitySelector({
  communities,
  onSelect,
  onRefresh,
}: CommunitySelectorProps) {
  const [modal, setModal] = useState<
    "create" | "join" | null
  >(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ABRIR VENTANA

  function openModal(type: "create" | "join") {
    setError("");
    setName("");
    setDescription("");
    setInviteCode("");
    setModal(type);
  }

  // CERRAR VENTANA

  function closeModal() {
    if (loading) return;

    setModal(null);
    setError("");
  }

  // CREAR COMUNIDAD

  async function handleCreate() {
    if (loading) return;

    if (!name.trim()) {
      setError("Introduce un nombre para tu comunidad.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const communityId = await createCommunity(
        name.trim(),
        description.trim()
      );

      await onRefresh(communityId);

      setModal(null);
      setName("");
      setDescription("");
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "message" in err
          ? String(err.message)
          : "No se pudo crear la comunidad."
      );
    } finally {
      setLoading(false);
    }
  }

  // UNIRSE A COMUNIDAD

  async function handleJoin() {
    if (loading) return;

    const code = inviteCode.trim();

    if (!code) {
      setError("Introduce un código de invitación.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const communityId = await joinCommunity(code);

      await onRefresh(communityId);

      setModal(null);
      setInviteCode("");
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "message" in err
          ? String(err.message)
          : "No se pudo ingresar a la comunidad."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="community-selector">

      {/* ENCABEZADO */}

      <header className="selector-header">
        <div className="selector-brand">
          <Gem size={28} />
          <span>É X O D O</span>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}

      <main className="selector-content">

        <div className="selector-heading">
          <h1>Mis comunidades</h1>

          <p>
            Selecciona una comunidad para continuar
            tu aventura.
          </p>
        </div>

        {/* COMUNIDADES DISPONIBLES */}

        <div className="community-grid">

          {communities.map((community) => (
            <button
              key={community.id}
              className="community-card"
              onClick={() => onSelect(community)}
            >
              <div className="community-card-icon">
                {community.icon_url ? (
                  <img
                    src={community.icon_url}
                    alt={community.name}
                  />
                ) : (
                  community.name.charAt(0).toUpperCase()
                )}
              </div>

              <h2>{community.name}</h2>

              <p>
                {community.description ||
                  "Comunidad de juegos de rol."}
              </p>

              <div className="community-card-footer">
                <span>Entrar a comunidad</span>
                <ArrowRight size={17} />
              </div>
            </button>
          ))}

          {/* CREAR NUEVA COMUNIDAD */}

          <button
            className="community-card create-community-card"
            onClick={() => openModal("create")}
          >
            <div className="create-community-icon">
              <Plus size={35} />
            </div>

            <h2>Crear comunidad</h2>

            <p>
              Construye tu propio mundo y reúne
              a tus aventureros.
            </p>
          </button>

        </div>

        {/* MENSAJE PARA USUARIOS NUEVOS */}

        {communities.length === 0 && (
          <div className="empty-communities">
            <Users size={24} />

            <p>
              Todavía no perteneces a ninguna comunidad.
              Crea una o únete mediante una invitación.
            </p>
          </div>
        )}

        {/* UNIRSE A COMUNIDAD */}

        <button
          className="join-community-button"
          onClick={() => openModal("join")}
        >
          <LinkIcon size={23} />

          <div>
            <strong>Unirse a una comunidad</strong>
            <span>
              Utiliza un código de invitación.
            </span>
          </div>

          <ArrowRight size={18} />
        </button>

      </main>

      {/* VENTANAS MODALES */}

      {modal && (
        <div
          className="exodo-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="exodo-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="community-modal-title"
            onClick={(event) => event.stopPropagation()}
          >

            <div className="exodo-modal-header">

              <h2 id="community-modal-title">
                {modal === "create"
                  ? "Crear comunidad"
                  : "Unirse a una comunidad"}
              </h2>

              <button
                className="icon-button"
                onClick={closeModal}
                disabled={loading}
                aria-label="Cerrar ventana"
              >
                <X size={21} />
              </button>

            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();

                if (modal === "create") {
                  void handleCreate();
                } else {
                  void handleJoin();
                }
              }}
            >

              {modal === "create" ? (
                <>

                  <p className="modal-description">
                    Dale un nombre a tu comunidad
                    y comienza a construir tu mundo.
                  </p>

                  <div className="exodo-form-field">
                    <label htmlFor="community-name">
                      Nombre de la comunidad
                    </label>

                    <input
                      id="community-name"
                      value={name}
                      onChange={(event) =>
                        setName(event.target.value)
                      }
                      placeholder="Ejemplo: Elden"
                      maxLength={80}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="exodo-form-field">
                    <label htmlFor="community-description">
                      Descripción
                    </label>

                    <textarea
                      id="community-description"
                      value={description}
                      onChange={(event) =>
                        setDescription(event.target.value)
                      }
                      placeholder="Describe tu mundo o campaña..."
                      maxLength={500}
                      rows={4}
                      disabled={loading}
                    />

                    <span className="character-count">
                      {description.length}/500
                    </span>
                  </div>

                </>
              ) : (
                <>

                  <p className="modal-description">
                    Introduce el código que te proporcionó
                    el administrador de la comunidad.
                  </p>

                  <div className="exodo-form-field">
                    <label htmlFor="invite-code">
                      Código de invitación
                    </label>

                    <input
                      id="invite-code"
                      value={inviteCode}
                      onChange={(event) =>
                        setInviteCode(event.target.value)
                      }
                      placeholder="Pega tu código aquí"
                      required
                      disabled={loading}
                    />
                  </div>

                </>
              )}

              {error && (
                <div
                  className="exodo-form-error"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div className="exodo-modal-actions">

                <button
                  type="button"
                  className="exodo-secondary-button"
                  onClick={closeModal}
                  disabled={loading}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="exodo-primary-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="loading-icon"
                      />
                      Procesando...
                    </>
                  ) : modal === "create" ? (
                    "Crear comunidad"
                  ) : (
                    "Unirse"
                  )}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      <footer className="selector-footer">
        Éxodo · Versión 0.3
      </footer>

    </div>
  );
}
