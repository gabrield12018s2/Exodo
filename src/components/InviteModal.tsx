
"use client";

import { useState } from "react";
import {
  X,
  UserPlus,
  Copy,
  Check,
  LoaderCircle,
  Link as LinkIcon,
} from "lucide-react";

import { createInvitation } from "@/lib/communities";
import type { Community } from "@/lib/communities";

interface InviteModalProps {
  community: Community;
  onClose: () => void;
}

export default function InviteModal({
  community,
  onClose,
}: InviteModalProps) {
  const [duration, setDuration] = useState("168");
  const [maxUses, setMaxUses] = useState("0");

  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // GENERAR INVITACIÓN

  async function generateInvitation() {
    if (loading) return;

    setLoading(true);
    setError("");
    setCopied(false);
    setCode("");

    try {
      const expiresAt =
        duration === "0"
          ? null
          : new Date(
              Date.now() +
                Number(duration) * 60 * 60 * 1000
            ).toISOString();

      const uses =
        maxUses === "0"
          ? null
          : Number(maxUses);

      const invitationCode = await createInvitation(
        community.id,
        uses,
        expiresAt
      );

      setCode(invitationCode);

    } catch (err: unknown) {
      setError(
        err &&
        typeof err === "object" &&
        "message" in err
          ? String(err.message)
          : "No se pudo crear la invitación."
      );
    } finally {
      setLoading(false);
    }
  }

  // COPIAR CÓDIGO

  async function copyCode() {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);

      setCopied(true);
      setError("");
    } catch {
      setError(
        "No se pudo copiar. Selecciona el código manualmente."
      );
    }
  }

  function closeModal() {
    if (!loading) {
      onClose();
    }
  }

  return (
    <div
      className="exodo-modal-overlay"
      onClick={closeModal}
    >
      <div
        className="exodo-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-title"
        onClick={(event) => event.stopPropagation()}
      >

        {/* ENCABEZADO */}

        <div className="exodo-modal-header">

          <div className="invite-heading">
            <UserPlus size={23} />

            <h2 id="invite-title">
              Invitar jugadores
            </h2>
          </div>

          <button
            className="icon-button"
            onClick={closeModal}
            disabled={loading}
            aria-label="Cerrar ventana"
          >
            <X size={21} />
          </button>

        </div>

        <p className="modal-description">
          Genera una invitación para que nuevos
          aventureros puedan unirse a {community.name}.
        </p>

        {/* DURACIÓN */}

        <div className="exodo-form-field">

          <label htmlFor="invite-duration">
            Expirar después de
          </label>

          <select
            id="invite-duration"
            value={duration}
            disabled={loading}
            onChange={(event) => {
              setDuration(event.target.value);
              setCode("");
            }}
          >
            <option value="1">1 hora</option>
            <option value="24">24 horas</option>
            <option value="168">7 días</option>
            <option value="720">30 días</option>
            <option value="0">Nunca</option>
          </select>

        </div>

        {/* NÚMERO DE USOS */}

        <div className="exodo-form-field">

          <label htmlFor="invite-uses">
            Número máximo de usos
          </label>

          <select
            id="invite-uses"
            value={maxUses}
            disabled={loading}
            onChange={(event) => {
              setMaxUses(event.target.value);
              setCode("");
            }}
          >
            <option value="0">Sin límite</option>
            <option value="1">1 uso</option>
            <option value="5">5 usos</option>
            <option value="10">10 usos</option>
            <option value="25">25 usos</option>
            <option value="50">50 usos</option>
            <option value="100">100 usos</option>
          </select>

        </div>

        {/* CÓDIGO GENERADO */}

        {code && (
          <div className="invite-result">

            <label>
              Código de invitación
            </label>

            <div className="invite-code-container">

              <LinkIcon size={18} />

              <input
                value={code}
                readOnly
                aria-label="Código de invitación"
                onFocus={(event) =>
                  event.target.select()
                }
              />

              <button
                className="invite-copy-button"
                onClick={copyCode}
              >
                {copied ? (
                  <Check size={17} />
                ) : (
                  <Copy size={17} />
                )}

                {copied ? "Copiado" : "Copiar"}
              </button>

            </div>

            <p className="invite-help">
              Comparte este código con tus jugadores.
              Podrán utilizarlo desde la opción
              &quot;Unirse a una comunidad&quot;.
            </p>

          </div>
        )}

        {/* ERRORES */}

        {error && (
          <div
            className="exodo-form-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* BOTONES */}

        <div className="exodo-modal-actions">

          <button
            className="exodo-secondary-button"
            onClick={closeModal}
            disabled={loading}
          >
            Cerrar
          </button>

          <button
            className="exodo-primary-button"
            onClick={generateInvitation}
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle
                  size={17}
                  className="loading-icon"
                />
                Generando...
              </>
            ) : code ? (
              "Generar otro código"
            ) : (
              "Crear invitación"
            )}
          </button>

        </div>

      </div>
    </div>
  );
}
