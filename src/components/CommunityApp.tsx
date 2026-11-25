"use client";

import { useEffect, useState, useRef } from "react";
import type { DragEvent } from "react";
import { saveNavigationOrder } from "@/lib/communityAdmin";
import type { User as AuthUser } from "@supabase/supabase-js";

import {
  Trophy,
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
  Profile,
} from "@/lib/communities";

import { Ranking } from "@/components/characters/Equipment";
import DmRanking from "@/components/missions/DmRanking";
import Missions from "@/components/missions/Missions";
import Characters from "@/components/characters/Characters";
import Guide from "@/components/guide/Guide";
import Market from "@/components/market/Market";
import Treasury from "@/components/economy/Treasury";
import InviteModal from "@/components/InviteModal";
import ProfileModal from "@/components/ProfileModal";
import CommunitySettings, { type Section } from "@/components/settings/CommunitySettings";

// ==================================================
// ICONOS SEGÚN TIPO DE CANAL
// ==================================================

const channelIcons = {
  text: Hash,
  announcement: Megaphone,
  forum: MessageSquare,
  missions: ScrollText,
  mission_publish: Megaphone,
  calendar: CalendarDays,
  characters: Users,
  ranking: Trophy,
  dm_ranking: Trophy,
  shop: Store,
  general_shop: Store,
  inventory: Backpack,
  treasury: Coins,
  wiki: BookOpen,
  guide: BookOpen,
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
  mission_publish: "Crea y publica tus aventuras.",
  calendar: "Organiza tus próximas partidas.",
  characters: "Administra tus personajes.",
  ranking: "Clasificación por valor de equipamiento.",
  dm_ranking: "Misiones completadas y recompensas entregadas.",
  shop: "Compra objetos y equipamiento.",
  general_shop: "Explora los catálogos de la Tienda General.",
  inventory: "Consulta tus objetos adquiridos.",
  treasury: "Administra tu oro y transacciones.",
  guide: "Conoce cómo funciona la comunidad.",
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
  onCommunityUpdated: (community: Community) => void;
}

// ==================================================
// COMPONENTE PRINCIPAL
// ==================================================

export default function CommunityApp({
  user,
  community: initialCommunity,
  communities,
  onSelectCommunity,
  onBack,
  onCommunityUpdated,
}: CommunityAppProps) {

  const [community, setCommunity] = useState(initialCommunity);
  useEffect(() => { setCommunity(initialCommunity); }, [initialCommunity]);
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

  const [profileOpen, setProfileOpen] = useState(false);

  const [settingsSection, setSettingsSection] = useState<Section | null>(null);
  const [communityMenuOpen, setCommunityMenuOpen] = useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  type DragItem = {kind: "channel" | "category"; id: string};
  const drag = useRef<DragItem | null>(null);
  const savingOrder = useRef(false);
  const [dragging, setDragging] = useState<DragItem | null>(null);
  const [dropMark, setDropMark] = useState("");
  const [orderBusy, setOrderBusy] = useState(false);
  const [orderError, setOrderError] = useState("");

  const myProfile = members.find((member) => member.user_id === user.id)?.profile;

  const displayName =
    myProfile?.display_name ||
    myProfile?.username ||
    user.user_metadata.full_name ||
    user.user_metadata.name ||
    user.user_metadata.user_name ||
    "Aventurero";

  const avatarUrl =
    myProfile?.avatar_url || user.user_metadata.avatar_url;

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
      setProfileOpen(false);
      setSettingsSection(null);
      setCommunityMenuOpen(false);

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
          channelData.find(channel => channel.type === "guide") ||
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

  function backToSelector() { onBack(); }
  function openSettings(section: Section) { setCommunityMenuOpen(false); setSettingsSection(section); }
  async function refreshSettings() {
    const [cats, chans, people, currentRole] = await Promise.all([getCategories(community.id), getChannels(community.id), getCommunityMembers(community.id), getMyRole(community.id)]);
    setCategories(cats); setChannels(chans); setMembers(people); setRole(currentRole);
    setSelectedChannel(old => chans.find(c => c.id === old?.id) || chans.find(c => c.type === 'guide') || chans.find(c => c.type === 'text') || chans[0] || null);
  }
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

  function endDrag() { drag.current = null; setDragging(null); setDropMark(""); }
  function startDrag(event: DragEvent, item: DragItem) {
    if (!isAdmin || savingOrder.current) { event.preventDefault(); return; }
    drag.current = item; setDragging(item); setOrderError("");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", item.id);
  }
  function hoverDrop(event: DragEvent, mark: string) {
    event.preventDefault(); event.stopPropagation();
    event.dataTransfer.dropEffect = "move"; setDropMark(mark);
  }
  function afterHalf(event: DragEvent) {
    const rect = event.currentTarget.getBoundingClientRect();
    return event.clientY > rect.top + rect.height / 2;
  }
  async function commitOrder(nextCats: Category[], nextChannels: Channel[]) {
    if (savingOrder.current || !isAdmin) return;
    savingOrder.current = true; setOrderBusy(true); setOrderError("");
    try {
      await saveNavigationOrder(community.id, nextCats, nextChannels);
      setCategories(nextCats); setChannels(nextChannels);
      setSelectedChannel(old => nextChannels.find(c => c.id === old?.id) || null);
    } catch (err) {
      setOrderError(err && typeof err === "object" && "message" in err ? String(err.message) : "No se pudo guardar el orden.");
    } finally { savingOrder.current = false; setOrderBusy(false); }
  }
  function dropChannel(event: DragEvent, categoryId: string | null, targetId?: string) {
    if (drag.current?.kind !== "channel") return;
    event.preventDefault(); event.stopPropagation();
    const sourceId = drag.current.id; const after = afterHalf(event); endDrag();
    if (sourceId === targetId || !isAdmin || savingOrder.current) return;
    const source = channels.find(c => c.id === sourceId); if (!source) return;
    const remaining = channels.filter(c => c.id !== sourceId);
    const group = remaining.filter(c => c.category_id === categoryId);
    const index = targetId ? group.findIndex(c => c.id === targetId) : group.length;
    group.splice(index < 0 ? group.length : index + (targetId && after ? 1 : 0), 0, {...source, category_id: categoryId});
    const next = [null, ...categories.map(c => c.id)].flatMap(id =>
      (id === categoryId ? group : remaining.filter(c => c.category_id === id)).map((c, position) => ({...c, position})));
    if (categoryId) setCollapsedCategories(old => old.filter(id => id !== categoryId));
    void commitOrder(categories.map((c, position) => ({...c, position})), next);
  }
  function dropCategory(event: DragEvent, targetId: string) {
    if (drag.current?.kind !== "category") return;
    event.preventDefault(); event.stopPropagation();
    const sourceId = drag.current.id; const after = afterHalf(event); endDrag();
    if (sourceId === targetId || !isAdmin || savingOrder.current) return;
    const source = categories.find(c => c.id === sourceId); if (!source) return;
    const next = categories.filter(c => c.id !== sourceId);
    const index = next.findIndex(c => c.id === targetId); if (index < 0) return;
    next.splice(index + (after ? 1 : 0), 0, source);
    void commitOrder(next.map((c, position) => ({...c, position})), [null, ...next.map(c => c.id)].flatMap(id => channels.filter(c => c.category_id === id).map((c, position) => ({...c, position}))));
  }

  function renderChannel(channel: Channel) {
    const Icon = channelIcons[channel.type] || Hash;

    return (
      <button
        key={channel.id}
        draggable={isAdmin && !orderBusy}
        onDragStart={e => startDrag(e, {kind: "channel", id: channel.id})}
        onDragEnd={endDrag}
        onDragOver={e => { if (drag.current?.kind === "channel" && drag.current.id !== channel.id) hoverDrop(e, `ch-${channel.id}-${afterHalf(e) ? "after" : "before"}`); }}
        onDrop={e => dropChannel(e, channel.category_id, channel.id)}
        data-drop={dropMark === `ch-${channel.id}-before` ? "before" : dropMark === `ch-${channel.id}-after` ? "after" : undefined}
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

  function renderMember(member: CommunityMember) {
    const isStaff = member.role !== "player";
    const name = member.profile?.display_name || member.profile?.username ||
      (member.user_id === user.id ? displayName : "Usuario sin perfil");
    const photo = member.profile?.avatar_url || (member.user_id === user.id ? avatarUrl : null);
    const FallbackIcon = member.role === "owner" ? Crown : isStaff ? Shield : User;

    return (
      <div className="member" key={member.user_id}>
        <div className={`avatar${isStaff ? " dm-avatar" : ""}`} style={{ overflow: "hidden" }}>
          <FallbackIcon size={18} />
          {typeof photo === "string" && /^https?:\/\//i.test(photo) && (
            <img src={photo} alt={`Avatar de ${name}`} className="discord-avatar"
              style={{ position: "absolute", inset: 0 }}
              onError={(event) => { event.currentTarget.style.display = "none"; }} />
          )}
        </div>
        <div className="member-info">
          <span className={isStaff ? "dm-name" : undefined}>{name}</span>
          <small>{roleNames[member.role]}</small>
        </div>
      </div>
    );
  }

  // ==================================================
  // INTERFAZ PRINCIPAL
  // ==================================================

  return (
    <div className="exodo">

      {/* BARRA DE COMUNIDADES */}

      <aside className="communities">

        <button
          className="brand"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, flexShrink: 0 }}
          onClick={backToSelector}
          title="Mis comunidades"
        >
          <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: "0.12em", lineHeight: 1, whiteSpace: "nowrap" }}>ÉXODO</span>
          <Gem size={27} />
        </button>

        <div className="community-divider" />

        {communities.map((original) => { const item = original.id === community.id ? community : original; return (
          <button
            key={item.id}
            className={`server ${
              item.id === community.id
                ? "active-server"
                : ""
            }`}
            title={item.name}
            onClick={() => { if(item.id !== community.id) onSelectCommunity(item); }}
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
        ); })}

        <button
          className="server add-server"
          onClick={backToSelector}
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

          <button
            type="button"
            className="server-header"
            style={{ width: "100%", textAlign: "left" }}
            onClick={() => setCommunityMenuOpen((previous) => !previous)}
            aria-expanded={communityMenuOpen}
            aria-controls="community-actions"
          >
            <div>
              <h2>{community.name}</h2>
              <span>Comunidad de rol</span>
            </div>
            {communityMenuOpen ? <ChevronDown size={17} style={{ transform: "rotate(180deg)" }} /> : <ChevronDown size={17} />}
          </button>

          {community.banner_url && <img className="community-sidebar-banner" src={community.banner_url} alt="Portada de comunidad" />}
          {communityMenuOpen && (
            <div id="community-actions" className="community-admin-actions" style={{ paddingBottom: 12, borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
              onKeyDown={(event) => { if (event.key === "Escape") setCommunityMenuOpen(false); }}>
              {isAdmin && !loading && !error && (
                <>
                  <button className="invite-button" onClick={() => { setCommunityMenuOpen(false); setInviteOpen(true); }}>
                    <UserPlus size={17} /> Invitar jugadores
                  </button>
                  <button className="channel" onClick={() => openSettings("general")}><Settings size={16} /> Configuración de comunidad</button>
                  <button className="channel" onClick={() => openSettings("channels")}><Hash size={16} /> Crear canal</button>
                  <button className="channel" onClick={() => openSettings("channels")}><Plus size={16} /> Crear categoría</button>
                  <button className="channel" onClick={() => openSettings("members")}><Users size={16} /> Administrar miembros</button>
                  <button className="channel" onClick={() => openSettings("roles")}><Shield size={16} /> Roles y permisos</button>
                  <button className="channel" onClick={() => openSettings("invites")}><UserPlus size={16} /> Administrar invitaciones</button>
                </>
              )}
              {!loading && !error && role && role !== "owner" && (
                <button className="channel" onClick={() => openSettings("danger")}><ArrowLeft size={16} /> Abandonar comunidad</button>
              )}
              <button className="channel" onClick={backToSelector}><ArrowLeft size={16} /> Mis comunidades</button>
            </div>
          )}

          {isAdmin && !loading && !error && !communityMenuOpen && (
            <div className="community-admin-actions">
              <button className="invite-button" onClick={() => setInviteOpen(true)}>
                <UserPlus size={17} /> Invitar jugadores
              </button>
            </div>
          )}

          <nav className="navigation" aria-busy={orderBusy}>
            {orderBusy && <p className="navigation-order-status" role="status">Guardando orden...</p>}
            {orderError && <p className="exodo-form-error" role="alert">{orderError}</p>}

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

                {dragging?.kind === "channel" && <div className="navigation-drop-zone" data-drop={dropMark === "root" ? "inside" : undefined} onDragOver={e => hoverDrop(e, "root")} onDrop={e => dropChannel(e, null)}>Sin categoría</div>}
                {/* CANALES SIN CATEGORÍA */}

                {channels
                  .filter((channel) => !channel.category_id)
                  .map(renderChannel)}

                {/* CATEGORÍAS PERSONALIZADAS */}

                {categories.filter(category => role !== "player" || !["ADMINISTRACIÓN", "ADMINISTRACION"].includes(category.name.trim().toUpperCase()) || channels.some(ch => ch.category_id === category.id)).map((category) => {

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
                        draggable={isAdmin && !orderBusy}
                        onDragStart={e => startDrag(e, {kind: "category", id: category.id})}
                        onDragEnd={endDrag}
                        onDragOver={e => { if (drag.current?.kind === "channel") hoverDrop(e, `cat-${category.id}-inside`); else if (drag.current?.kind === "category" && drag.current.id !== category.id) hoverDrop(e, `cat-${category.id}-${afterHalf(e) ? "after" : "before"}`); }}
                        onDrop={e => { if (drag.current?.kind === "channel") dropChannel(e, category.id); else dropCategory(e, category.id); }}
                        data-drop={dropMark === `cat-${category.id}-before` ? "before" : dropMark === `cat-${category.id}-after` ? "after" : dropMark === `cat-${category.id}-inside` ? "inside" : undefined}
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
                      {dragging?.kind === "channel" && !collapsed && <div className="navigation-drop-zone" data-drop={dropMark === `end-${category.id}` ? "inside" : undefined} onDragOver={e => hoverDrop(e, `end-${category.id}`)} onDrop={e => dropChannel(e, category.id)}>Mover al final</div>}

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
              onClick={() => setProfileOpen(true)}
              disabled={loading || !!error}
              title="Configuración del perfil"
              aria-label="Configuración del perfil"
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
              onClick={backToSelector}
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

        ) : selectedChannel.type === "guide" && role ? (
          <Guide key={`${community.id}:${user.id}`} communityId={community.id} role={role} />
        ) : selectedChannel.type === "dm_ranking" && role && role !== "player" ? (
          <DmRanking key={community.id} communityId={community.id} />
        ) : selectedChannel.type === "ranking" && role ? (
          <Ranking key={`${community.id}:${user.id}`} communityId={community.id} userId={user.id} />
        ) : (selectedChannel.type === "missions" || selectedChannel.type === "mission_publish") && role ? (
          <Missions key={`${community.id}:${user.id}:${selectedChannel.type}`} mode={selectedChannel.type === "mission_publish" ? "publish" : "available"} communityId={community.id} userId={user.id} role={role} members={members} />
        ) : selectedChannel.type === "characters" && role ? (
          <Characters key={`${community.id}:${user.id}`} communityId={community.id} userId={user.id} role={role} members={members} />
        ) : (selectedChannel.type === "shop" || selectedChannel.type === "general_shop" || selectedChannel.type === "inventory") && role ? (
          <Market key={`${community.id}:${user.id}:${selectedChannel.type}`} communityId={community.id} userId={user.id} role={role} members={members} mode={selectedChannel.type} />
        ) : selectedChannel.type === "treasury" && role === "owner" ? (
          <Treasury key={`${community.id}:${user.id}`} communityId={community.id} userId={user.id} role={role} members={members} />
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
                  Utiliza Discord para conversar. El chat de Éxodo queda para una etapa posterior.
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

        {staff.map(renderMember)}

        <h3>AVENTUREROS — {players.length}</h3>

        {players.map(renderMember)}

      </aside>

      {settingsSection && role && <CommunitySettings community={community} categories={categories} channels={channels} members={members} role={role} userId={user.id} initial={settingsSection} onClose={() => setSettingsSection(null)} onRefresh={refreshSettings} onCommunity={c => { setCommunity(c); onCommunityUpdated(c); }} onExit={onBack} />}
      {/* VENTANA DEL PERFIL PERSONAL */}

      {profileOpen && (
        <ProfileModal
          onClose={() => setProfileOpen(false)}
          onSaved={(profile: Profile) => {
            setMembers((previous) =>
              previous.map((member) =>
                member.user_id === profile.id
                  ? { ...member, profile }
                  : member
              )
            );
          }}
        />
      )}

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
