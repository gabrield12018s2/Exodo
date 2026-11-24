
"use client";

import { useEffect, useState } from "react";
import {
  X,
  User,
  LoaderCircle,
  Save,
} from "lucide-react";

import {
  getMyProfile,
  updateMyProfile,
} from "@/lib/communities";

import type { Profile } from "@/lib/communities";

interface ProfileModalProps {
  onClose: () => void;
  onSaved: (profile: Profile) => void;
}

export default function ProfileModal({
  onClose,
  onSaved,
}: ProfileModalProps) {

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [displayName, setDisplayName] =
    useState("");

  const [bio, setBio] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  // ==========================================
  // CARGAR PERFIL
  // ==========================================

  useEffect(() => {

    let active = true;

    async function loadProfile() {

      try {

        const data = await getMyProfile();

        if (!active) return;

        setProfile(data);
        setDisplayName(data.display_name);
        setBio(data.bio || "");

      } catch (err: unknown) {

        if (!active) return;

        setError(
          err &&
          typeof err === "object" &&
          "message" in err
            ? String(err.message)
            : "No se pudo cargar tu perfil."
        );

      } finally {

        if (active) setLoading(false);

      }

    }

    void loadProfile();

    return () => {
      active = false;
    };

  }, []);

  // ==========================================
  // GUARDAR PERFIL
  // ==========================================

  async function handleSave() {

    if (!profile || saving) return;

    const name = displayName.trim();

    if (!name || name.length > 80) {

      setError(
        "El nombre debe contener entre 1 y 80 caracteres."
      );

      return;

    }

    if (bio.length > 500) {

      setError(
        "La biografía no puede superar los 500 caracteres."
      );

      return;

    }

    setSaving(true);
    setError("");

    try {

      await updateMyProfile(name, bio);

      const updatedProfile: Profile = {
        ...profile,
        display_name: name,
        bio: bio.trim(),
      };

      onSaved(updatedProfile);
      onClose();

    } catch (err: unknown) {

      setError(
        err &&
        typeof err === "object" &&
        "message" in err
          ? String(err.message)
          : "No se pudieron guardar los cambios."
      );

    } finally {

      setSaving(false);

    }

  }

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (

    <div
      className="exodo-modal-overlay"
      onClick={() => {
        if (!saving) onClose();
      }}
    >

      <div
        className="exodo-modal profile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        <div className="exodo-modal-header">

          <h2 id="profile-modal-title">
            Mi perfil
          </h2>

          <button
            className="icon-button"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar"
          >
            <X size={21} />
          </button>

        </div>

        {loading ? (

          <div className="sidebar-loading">

            <LoaderCircle
              size={30}
              className="loading-icon"
            />

            <p>Cargando perfil...</p>

          </div>

        ) : (

          <>

            {profile && (

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSave();
                }}
              >

                {/* INFORMACIÓN DE DISCORD */}

                <div className="profile-modal-user">

                  <div className="profile-modal-avatar">

                    {profile.avatar_url ? (

                      <img
                        src={profile.avatar_url}
                        alt="Fotografía de perfil"
                        className="discord-avatar"
                      />

                    ) : (

                      <User size={32} />

                    )}

                  </div>

                  <div className="profile-modal-identity">

                    <strong>
                      {profile.username}
                    </strong>

                    <span>
                      Cuenta vinculada con Discord
                    </span>

                    <small>
                      Fotografía de Discord
                    </small>

                  </div>

                </div>

                {/* NOMBRE VISIBLE */}

                <div className="exodo-form-field">

                  <label htmlFor="profile-name">
                    Nombre visible
                  </label>

                  <input
                    id="profile-name"
                    type="text"
                    value={displayName}
                    maxLength={80}
                    disabled={saving}
                    placeholder="Tu nombre visible"
                    onChange={(event) =>
                      setDisplayName(event.target.value)
                    }
                    required
                  />

                  <span className="character-count">
                    {displayName.length}/80
                  </span>

                </div>

                {/* BIOGRAFÍA */}

                <div className="exodo-form-field">

                  <label htmlFor="profile-bio">
                    Biografía
                  </label>

                  <textarea
                    id="profile-bio"
                    value={bio}
                    maxLength={500}
                    disabled={saving}
                    placeholder="Cuéntanos un poco sobre ti..."
                    onChange={(event) =>
                      setBio(event.target.value)
                    }
                    rows={4}
                  />

                  <span className="character-count">
                    {bio.length}/500
                  </span>

                </div>

                <p className="profile-modal-notice">
                  Los cambios en tu perfil se aplicarán
                  a todas tus comunidades de Éxodo.
                </p>

                {error && (

                  <div className="exodo-form-error">
                    {error}
                  </div>

                )}

                {/* BOTONES */}

                <div className="exodo-modal-actions">

                  <button
                    type="button"
                    className="exodo-secondary-button"
                    onClick={onClose}
                    disabled={saving}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="exodo-primary-button"
                    disabled={
                      saving ||
                      !displayName.trim()
                    }
                  >

                    {saving ? (

                      <LoaderCircle
                        size={17}
                        className="loading-icon"
                      />

                    ) : (

                      <Save size={17} />

                    )}

                    {saving
                      ? "Guardando..."
                      : "Guardar cambios"}

                  </button>

                </div>

              </form>

            )}

            {!profile && error && (

              <div className="exodo-form-error">
                {error}
              </div>

            )}

          </>

        )}

      </div>

    </div>

  );

}
