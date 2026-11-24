
"use client";

import { useEffect, useState } from "react";
import type { User as AuthUser } from "@supabase/supabase-js";

import {
  Gem,
  Hash,
  Plus,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  Users,
  ScrollText,
  CalendarDays,
  Store,
  Backpack,
  Coins,
  BookOpen,
  Map,
  Megaphone,
  Crown,
  User,
  Menu,
  Search,
  MessageSquare,
  Headphones,
  UserPlus,
  LoaderCircle,
  ArrowLeft,
  Shield,
  ExternalLink,
} from "lucide-react";

import {
  getCategories,
  getChannels,
  getCommunityMembers,
  getMyRole,
} from "@/lib/communities";

import type {
  Community,
  Category,
  Channel,
  ChannelType,
  CommunityMember,
  CommunityRole,
} from "@/lib/communities";

import InviteModal from "@/components/InviteModal";

// ==================================================
// ICONOS SEGÚN TIPO DE CANAL
// ==================================================

const channelIcons = {
  text: Hash,
  announcement: Megaphone,
  forum: MessageSquare,
  missions: ScrollText,
  calendar: CalendarDays,
  characters: Users,
  shop: Store,
  inventory: Backpack,
  treasury: Coins,
  wiki: BookOpen,
  maps: Map,
  chronicles: BookOpen,
  voice_link: Headphones,
};

const roleNames: Record<CommunityRole, string> = {
  owner: "Propietario",
  admin: "Administrador",
  dm: "Dungeon Master",
  player: "Aventurero",
};

const moduleDescriptions: Record<ChannelType, string> = {
  text: "Canal de conversación.",
  announcement: "Anuncios oficiales de la comunidad.",
  forum: "Publicaciones y discusiones.",
  missions: "Explora las aventuras disponibles.",
  calendar: "Organiza tus próximas partidas.",
  characters: "Administra tus personajes.",
  shop: "Compra objetos y equipamiento.",
  inventory: "Consulta tus objetos adquiridos.",
  treasury: "Administra tu oro y transacciones.",
  wiki: "Descubre las historias y reglas del mundo.",
  maps: "Explora las regiones de la campaña.",
  chronicles: "Revive las aventuras de la comunidad.",
  voice_link: "Accede a una llamada externa.",
};

// ==================================================
// PROPIEDADES DEL COMPONENTE
// ==================================================

interface CommunityAppProps {
  user: AuthUser;
  community: Community;
  communities: Community[];
  onSelectCommunity: (community: Community) => void;
  onBack: () => void;
}

// ==================================================
// COMPONENTE PRINCIPAL
// ==================================================

export default function CommunityApp({
  user,
  community,
  communities,
  onSelectCommunity,
  onBack,
}: CommunityAppProps) {

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [channels, setChannels] =
    useState<Channel[]>([]);

  const [members, setMembers] =
    useState<CommunityMember[]>([]);

  const [role, setRole] =
    useState<CommunityRole | null>(null);

  const [selectedChannel, setSelectedChannel] =
    useState<Channel | null>(null);

  const [collapsedCategories, setCollapsedCategories] =
    useState<string[]>([]);

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const [inviteOpen, setInviteOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const displayName =
    user.user_metadata.full_name ||
    user.user_metadata.name ||
    user.user_metadata.user_name ||
    "Aventurero";

  const avatarUrl =
    user.user_metadata.avatar_url;

  const isAdmin =
    role === "owner" || role === "admin";

  // ==================================================
  // CARGAR INFORMACIÓN DE LA COMUNIDAD
  // ==================================================

  useEffect(() => {
    let active = true;

    async function loadCommunity() {
      setLoading(true);
      setError("");
      setRole(null);
      setCategories([]);
      setChannels([]);
      setMembers([]);
      setSelectedChannel(null);
      setCollapsedCategories([]);
      setInviteOpen(false);

      try {
        const [
          categoryData,
          channelData,
          memberData,
          myRole,
        ] = await Promise.all([
          getCategories(community.id),
          getChannels(community.id),
          getCommunityMembers(community.id),
          getMyRole(community.id),
        ]);

        if (!active) return;

        setCategories(categoryData);
        setChannels(channelData);
        setMembers(memberData);
        setRole(myRole);

        const defaultChannel =
          channelData.find(
            (channel) =>
              channel.name === "general" &&
              channel.type === "text"
          ) ||
          channelData.find(
            (channel) => channel.type === "text"
          ) ||
          channelData[0] ||
          null;

        setSelectedChannel(defaultChannel);

      } catch (err: unknown) {
        if (!active) return;

        setError(
          err &&
          typeof err === "object" &&
          "message" in err
            ? String(err.message)
            : "No se pudo cargar la comunidad."
        );

      } finally {
        if (active) setLoading(false);
      }
    }

    void loadCommunity();

    return () => {
      active = false;
    };

  }, [community.id]);

  // ==================================================
  // MOSTRAR U OCULTAR CATEGORÍAS
  // ==================================================

  function toggleCategory(categoryId: string) {
    setCollapsedCategories((previous) =>
      previous.includes(categoryId)
        ? previous.filter((id) => id !== categoryId)
        : [...previous, categoryId]
    );
  }

  // ==================================================
  // RENDERIZAR CANALES
  // ==================================================

  function renderChannel(channel: Channel) {
    const Icon = channelIcons[channel.type] || Hash;

    return (
      <button
        key={channel.id}
        className={`channel ${
          selectedChannel?.id === channel.id
            ? "selected"
            : ""
        }`}
        onClick={() => {
          setSelectedChannel(channel);

          if (window.innerWidth <= 500) {
            setSidebarOpen(false);
          }
        }}
      >
        <Icon size={17} />
        <span>{channel.name}</span>
      </button>
    );
  }

  const CurrentIcon = selectedChannel
    ? channelIcons[selectedChannel.type] || Hash
    : Gem;

  const isChat =
    selectedChannel?.type === "text" ||
    selectedChannel?.type === "announcement";

  const staff = members.filter(
    (member) => member.role !== "player"
  );

  const players = members.filter(
    (member) => member.role === "player"
  );

  // ==================================================
  // INTERFAZ PRINCIPAL
  // ==================================================

  return (
    <div className="exodo">

      {/* BARRA DE COMUNIDADES */}

      <aside className="communities">

        <button
          className="brand"
          onClick={onBack}
          title="Mis comunidades"
        >
          <Gem size={27} />
        </button>

        <div className="community-divider" />

        {communities.map((item) => (
          <button
            key={item.id}
            className={`server ${
              item.id === community.id
                ? "active-server"
                : ""
            }`}
            title={item.name}
            onClick={() => onSelectCommunity(item)}
          >
            {item.icon_url ? (
              <img
                src={item.icon_url}
                alt={item.name}
                className="server-image"
              />
            ) : (
              item.name.charAt(0).toUpperCase()
            )}
          </button>
        ))}

        <button
          className="server add-server"
          onClick={onBack}
          title="Crear o unirse a comunidad"
        >
          <Plus size={22} />
        </button>

        <div className="spacer" />

        <button
          className="icon-button"
          title="Configuración"
          disabled
        >
          <Settings size={20} />
        </button>

      </aside>

      {/* MENÚ LATERAL */}

      {sidebarOpen && (
        <aside className="sidebar">

          <div className="server-header">

            <div>
              <h2>{community.name}</h2>
              <span>Comunidad de rol</span>
            </div>

            <button
              className="icon-button"
              onClick={onBack}
              title="Volver a comunidades"
            >
              <ChevronDown size={17} />
            </button>

          </div>

          {isAdmin && !loading && !error && (
            <div className="community-admin-actions">

              <button
                className="invite-button"
                onClick={() => setInviteOpen(true)}
              >
                <UserPlus size={17} />
                Invitar jugadores
              </button>

            </div>
          )}

          <nav className="navigation">

            {loading ? (
              <div className="sidebar-loading">
                <LoaderCircle
                  size={22}
                  className="loading-icon"
                />
                <span>Cargando canales...</span>
              </div>
            ) : error ? (
              <p className="exodo-form-error">
                {error}
              </p>
            ) : (
              <>

                {/* CANALES SIN CATEGORÍA */}

                {channels
                  .filter((channel) => !channel.category_id)
                  .map(renderChannel)}

                {/* CATEGORÍAS PERSONALIZADAS */}

                {categories.map((category) => {

                  const collapsed =
                    collapsedCategories.includes(
                      category.id
                    );

                  return (
                    <div
                      className="channel-group"
                      key={category.id}
                    >

                      <button
                        className="group-title category-toggle"
                        onClick={() =>
                          toggleCategory(category.id)
                        }
                      >
                        {collapsed ? (
                          <ChevronRight size={12} />
                        ) : (
                          <ChevronDown size={12} />
                        )}

                        <span>{category.name}</span>
                      </button>

                      {!collapsed &&
                        channels
                          .filter(
                            (channel) =>
                              channel.category_id ===
                              category.id
                          )
                          .map(renderChannel)}

                    </div>
                  );
                })}

              </>
            )}

          </nav>

          {/* PERFIL DEL USUARIO */}

          <div className="profile">

            <div className="avatar">

              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar de Discord"
                  className="discord-avatar"
                />
              ) : (
                <User size={19} />
              )}

              <span className="online-dot" />

            </div>

            <div className="profile-info">
              <strong>{displayName}</strong>
              <span>
                {role ? roleNames[role] : "Discord"}
              </span>
            </div>

            <button
              className="icon-button"
              disabled
              title="Configuración del perfil"
            >
              <Settings size={17} />
            </button>

          </div>

        </aside>
      )}

      {/* CONTENIDO PRINCIPAL */}

      <main className="main">

        <header className="topbar">

          <button
            className="icon-button"
            onClick={() =>
              setSidebarOpen(!sidebarOpen)
            }
            title="Mostrar u ocultar menú"
          >
            <Menu size={20} />
          </button>

          <CurrentIcon size={20} />

          <h1>
            {selectedChannel?.name || community.name}
          </h1>

          <div className="spacer" />

          <span className="header-brand">
            É X O D O
          </span>

          <button
            className="icon-button"
            title="Buscar"
            disabled
          >
            <Search size={19} />
          </button>

          <button
            className="icon-button"
            title="Notificaciones"
            disabled
          >
            <Bell size={19} />
          </button>

        </header>

        {loading ? (

          <div className="empty-module">
            <LoaderCircle
              size={35}
              className="loading-icon"
            />

            <h2>Cargando comunidad</h2>
            <p>Preparando tu mundo...</p>
          </div>

        ) : error ? (

          <div className="empty-module">

            <Shield size={40} />

            <h2>No se pudo cargar la comunidad</h2>

            <p>{error}</p>

            <button
              className="exodo-secondary-button"
              onClick={onBack}
            >
              <ArrowLeft size={16} />
              Volver a comunidades
            </button>

          </div>

        ) : !selectedChannel ? (

          <div className="empty-module">

            <Hash size={42} />

            <h2>No hay canales disponibles</h2>

            <p>
              Esta comunidad todavía no tiene canales.
            </p>

          </div>

        ) : isChat ? (

          <>

            <div className="chat">

              <div className="welcome">

                <div className="welcome-icon">
                  <CurrentIcon size={32} />
                </div>

                <h2>
                  Bienvenido a #{selectedChannel.name}
                </h2>

                <p>
                  {selectedChannel.description ||
                    `Este es el comienzo de #${selectedChannel.name}.`}
                </p>

              </div>

              <div className="date-divider">
                Inicio de la conversación
              </div>

              <div className="channel-empty-state">

                <MessageSquare size={26} />

                <p>
                  El chat en tiempo real estará
                  disponible en Éxodo v0.4.
                </p>

              </div>

            </div>

            <div className="composer">

              <button
                className="icon-button"
                disabled
              >
                <Plus size={21} />
              </button>

              <input
                placeholder="Chat disponible próximamente"
                disabled
              />

              <MessageSquare size={19} />

            </div>

          </>

        ) : (

          <div className="module">

            <div className="empty-module">

              <CurrentIcon size={45} />

              <h2>{selectedChannel.name}</h2>

              <p>
                {selectedChannel.description ||
                  moduleDescriptions[selectedChannel.type]}
              </p>

              {selectedChannel.type === "voice_link" &&
              selectedChannel.external_url &&
              /^https?:\/\//i.test(
                selectedChannel.external_url
              ) ? (

                <a
                  href={selectedChannel.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="exodo-primary-button"
                >
                  Abrir llamada
                  <ExternalLink size={16} />
                </a>

              ) : (

                <span className="module-coming-soon">
                  Módulo en desarrollo
                </span>

              )}

            </div>

          </div>

        )}

      </main>

      {/* PANEL DE MIEMBROS */}

      <aside className="members">

        <h3>
          EQUIPO DE DIRECCIÓN — {staff.length}
        </h3>

        {staff.map((member) => (
          <div
            className="member"
            key={member.user_id}
          >

            <div className="avatar dm-avatar">
              {member.role === "owner" ? (
                <Crown size={18} />
              ) : (
                <Shield size={18} />
              )}
            </div>

            <div className="member-info">

              <span className="dm-name">
                {member.user_id === user.id
                  ? displayName
                  : roleNames[member.role]}
              </span>

              <small>
                {roleNames[member.role]}
              </small>

            </div>

          </div>
        ))}

        <h3>
          AVENTUREROS — {players.length}
        </h3>

        {players.map((member) => (
          <div
            className="member"
            key={member.user_id}
          >

            <div className="avatar">
              <User size={18} />
            </div>

            <div className="member-info">

              <span>
                {member.user_id === user.id
                  ? displayName
                  : "Aventurero"}
              </span>

              <small>Jugador</small>

            </div>

          </div>
        ))}

      </aside>

      {/* VENTANA DE INVITACIONES */}

      {inviteOpen && isAdmin && (
        <InviteModal
          key={community.id}
          community={community}
          onClose={() => setInviteOpen(false)}
        />
      )}

    </div>
  );
}
