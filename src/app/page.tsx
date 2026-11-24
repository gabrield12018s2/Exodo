"use client";

import { useState } from "react";
import AuthGate from "@/components/AuthGate";
import type { User as AuthUser } from "@supabase/supabase-js";
import {
  Hash, Plus, Bell, Settings, Send,
  ChevronDown, Users, ScrollText, CalendarDays,
  Store, Backpack, Coins, BookOpen, Map,
  Megaphone, Crown, User, Menu, Search,
  Gem, Swords
} from "lucide-react";

const sections = [
  {
    title: "COMUNIDAD",
    channels: [
      { name: "anuncios", icon: Megaphone },
      { name: "general", icon: Hash },
      { name: "consultas", icon: Hash },
      { name: "roleo", icon: Hash },
    ],
  },
  {
    title: "AVENTURAS",
    channels: [
      { name: "Misiones", icon: ScrollText },
      { name: "Calendario", icon: CalendarDays },
      { name: "Crónicas", icon: BookOpen },
    ],
  },
  {
    title: "PERSONAL",
    channels: [
      { name: "Personajes", icon: Users },
      { name: "Mercado", icon: Store },
      { name: "Inventario", icon: Backpack },
      { name: "Tesorería", icon: Coins },
    ],
  },
  {
    title: "MUNDO",
    channels: [
      { name: "Enciclopedia", icon: BookOpen },
      { name: "Mapas", icon: Map },
    ],
  },
];

const initialMessages = [
  {
    id: 1,
    author: "Dungeon Master",
    content: "¡Bienvenidos a Éxodo, aventureros!",
    time: "18:30",
    dm: true,
  },
  {
    id: 2,
    author: "Dungeon Master",
    content: "Este será nuestro nuevo punto de encuentro para organizar aventuras y explorar nuevos mundos.",
    time: "18:31",
    dm: true,
  },
  {
    id: 3,
    author: "Aventurero",
    content: "¿Hay alguna misión disponible?",
    time: "18:35",
    dm: false,
  },
];

const chatChannels = [
  "general", "anuncios", "consultas", "roleo"
];

export default function Home() {
  return (
    <AuthGate>
      {(user) => <ExodoApp user={user} />}
    </AuthGate>
  );
}

function ExodoApp({ user }: { user: AuthUser }) {
  const displayName =
    user.user_metadata.full_name ||
    user.user_metadata.name ||
    user.user_metadata.user_name ||
    "Aventurero";

  const avatarUrl = user.user_metadata.avatar_url;
  const [channel, setChannel] = useState("general");
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [messages, setMessages] = useState<
    Record<string, typeof initialMessages>
  >({
    general: initialMessages,
    anuncios: [],
    consultas: [],
    roleo: [],
  });

  const isChat = chatChannels.includes(channel);

  function sendMessage() {
    if (!input.trim() || !isChat) return;

    const message = {
      id: Date.now(),
      author: displayName,
      content: input.trim(),
      time: new Date().toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      dm: false,
    };

    setMessages((previous) => ({
      ...previous,
      [channel]: [...(previous[channel] || []), message],
    }));

    setInput("");
  }

  return (
    <div className="exodo">

      {/* Barra de comunidades */}
      <aside className="communities">
        <div className="brand">
          <Gem size={27} />
        </div>

        <div className="community-divider" />

        <button className="server active-server" title="Elden">
          E
        </button>

        <button className="server add-server" title="Crear comunidad" disabled>
          <Plus size={22} />
        </button>

        <div className="spacer" />

        <button className="icon-button" title="Configuración" disabled>
          <Settings size={20} />
        </button>
      </aside>

      {/* Menú lateral */}
      {sidebarOpen && (
        <aside className="sidebar">
          <div className="server-header">
            <div>
              <h2>Elden</h2>
              <span>Comunidad de rol</span>
            </div>
            <ChevronDown size={17} />
          </div>

          <nav className="navigation">
            {sections.map((section) => (
              <div className="channel-group" key={section.title}>
                <div className="group-title">
                  {section.title}
                </div>

                {section.channels.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.name}
                      className={`channel ${
                        channel === item.name ? "selected" : ""
                      }`}
                      onClick={() => {
                        setChannel(item.name);
                        setInput("");
                      }}
                    >
                      <Icon size={17} />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

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
              <span>Cuenta de Discord</span>
            </div>

            <button className="icon-button" disabled>
              <Settings size={17} />
            </button>
          </div>
        </aside>
      )}

      {/* Contenido principal */}
      <main className="main">
        <header className="topbar">
          <button
            className="icon-button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={20} />
          </button>

          {isChat ? <Hash size={20} /> : <Gem size={20} />}

          <h1>{channel}</h1>

          <div className="spacer" />

          <span className="header-brand">É X O D O</span>

          <button className="icon-button" title="Buscar" disabled>
            <Search size={19} />
          </button>

          <button className="icon-button" title="Notificaciones" disabled>
            <Bell size={19} />
          </button>
        </header>

        {isChat ? (
          <>
            <div className="chat">

              <div className="welcome">
                <div className="welcome-icon">
                  <Hash size={32} />
                </div>

                <h2>Bienvenido a #{channel}</h2>

                <p>
                  Este es el comienzo del canal #{channel}.
                </p>
              </div>

              <div className="date-divider">
                Inicio de la conversación
              </div>

              {(messages[channel] || []).map((message) => (
                <div className="message" key={message.id}>

                  <div className={`avatar ${message.dm ? "dm-avatar" : ""}`}>
                    {message.dm ? (
                      <Crown size={20} />
                    ) : (
                      <User size={20} />
                    )}
                  </div>

                  <div className="message-body">
                    <div className="message-header">
                      <strong className={message.dm ? "dm-name" : ""}>
                        {message.author}
                      </strong>

                      {message.dm && (
                        <span className="dm-tag">DM</span>
                      )}

                      <time>{message.time}</time>
                    </div>

                    <p>{message.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <form
              className="composer"
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
            >
              <button type="button" className="icon-button" disabled>
                <Plus size={21} />
              </button>

              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={`Enviar mensaje a #${channel}`}
              />

              <button type="submit" className="send-button">
                <Send size={19} />
              </button>
            </form>
          </>
        ) : (
          <div className="module">

            {channel === "Mercado" ? (
              <>
                <div className="module-heading">
                  <div>
                    <h2>Mercado de Elden</h2>
                    <p>Objetos y equipamiento para tus aventuras.</p>
                  </div>

                  <div className="balance">
                    <Coins size={20} /> 1.500 GP
                  </div>
                </div>

                <div className="items-grid">
                  {[
                    {
                      name: "Espada larga +1",
                      rarity: "Uncommon",
                      price: 500,
                      icon: Swords,
                    },
                    {
                      name: "Poción de curación",
                      rarity: "Common",
                      price: 50,
                      icon: Backpack,
                    },
                    {
                      name: "Iniciado en la Batalla",
                      rarity: "Uncommon",
                      price: 750,
                      icon: Gem,
                    },
                  ].map((item) => (
                    <div className="item-card" key={item.name}>
                      <div className="item-icon">
                        <item.icon size={36} />
                      </div>

                      <span className="rarity">{item.rarity}</span>
                      <h3>{item.name}</h3>

                      <div className="item-footer">
                        <strong>{item.price} GP</strong>
                        <button disabled>Comprar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-module">
                <Gem size={42} />
                <h2>{channel}</h2>
                <p>Este módulo estará disponible próximamente.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Panel de miembros */}
      <aside className="members">
        <h3>DIRECTORES DE JUEGO — 1</h3>

        <div className="member">
          <div className="avatar dm-avatar">
            <Crown size={18} />
          </div>
          <span className="dm-name">Dungeon Master</span>
        </div>

        <h3>AVENTUREROS — 1</h3>

        <div className="member">
          <div className="avatar">
            <User size={18} />
          </div>
          <span>Aventurero</span>
        </div>
      </aside>

    </div>
  );
}
