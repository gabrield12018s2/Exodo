
import { createClient } from "@/lib/supabase/client";

// ==================================================
// TIPOS DE DATOS
// ==================================================

export type CommunityRole =
  | "owner"
  | "admin"
  | "dm"
  | "player";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
  banner_url: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  community_id: string;
  name: string;
  position: number;
  created_at: string;
}

export type ChannelType =
  | "text"
  | "announcement"
  | "forum"
  | "missions"
  | "calendar"
  | "characters"
  | "shop"
  | "inventory"
  | "treasury"
  | "wiki"
  | "maps"
  | "chronicles"
  | "voice_link";

export interface Channel {
  id: string;
  community_id: string;
  category_id: string | null;
  name: string;
  description: string;
  type: ChannelType;
  position: number;
  external_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommunityMember {
  community_id: string;
  user_id: string;
  role: CommunityRole;
  joined_at: string;
  profile: Profile | null;
}

// ==================================================
// OBTENER COMUNIDADES
// ==================================================

export async function getCommunities(): Promise<Community[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

// ==================================================
// CREAR COMUNIDAD
// ==================================================

export async function createCommunity(
  name: string,
  description: string = ""
): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc(
    "create_community",
    {
      p_name: name,
      p_description: description,
    }
  );

  if (error) throw error;

  return data as string;
}

// ==================================================
// OBTENER CATEGORÍAS
// ==================================================

export async function getCategories(
  communityId: string
): Promise<Category[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("community_id", communityId)
    .order("position", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

// ==================================================
// OBTENER CANALES
// ==================================================

export async function getChannels(
  communityId: string
): Promise<Channel[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .eq("community_id", communityId)
    .order("position", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

// ==================================================
// OBTENER MIEMBROS Y SUS PERFILES REALES
// ==================================================

export async function getCommunityMembers(
  communityId: string
): Promise<CommunityMember[]> {
  const supabase = createClient();

  const { data: members, error: membersError } =
    await supabase
      .from("community_members")
      .select("*")
      .eq("community_id", communityId)
      .order("joined_at", { ascending: true });

  if (membersError) throw membersError;

  if (!members || members.length === 0) {
    return [];
  }

  const userIds = members.map(
    (member) => member.user_id
  );

  const { data: profiles, error: profilesError } =
    await supabase
      .from("profiles")
      .select(
        "id, username, display_name, avatar_url, bio"
      )
      .in("id", userIds);

  if (profilesError) throw profilesError;

  const profilesMap = new Map<string, Profile>();

  for (const profile of profiles ?? []) {
    profilesMap.set(profile.id, profile);
  }

  return members.map((member) => ({
    ...member,
    role: member.role as CommunityRole,
    profile:
      profilesMap.get(member.user_id) ?? null,
  }));
}

// ==================================================
// OBTENER ROL DEL USUARIO
// ==================================================

export async function getMyRole(
  communityId: string
): Promise<CommunityRole> {
  const supabase = createClient();

  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError) throw authError;

  if (!authData.user) {
    throw new Error("Usuario no autenticado");
  }

  const { data, error } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", authData.user.id)
    .single();

  if (error) throw error;

  return data.role as CommunityRole;
}

// ==================================================
// OBTENER MI PERFIL
// ==================================================

export async function getMyProfile(): Promise<Profile> {
  const supabase = createClient();

  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError) throw authError;

  if (!authData.user) {
    throw new Error("Usuario no autenticado");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, avatar_url, bio"
    )
    .eq("id", authData.user.id)
    .single();

  if (error) throw error;

  return data;
}

// ==================================================
// ACTUALIZAR MI PERFIL
// ==================================================

export async function updateMyProfile(
  displayName: string,
  bio: string
): Promise<void> {
  const supabase = createClient();

  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError) throw authError;

  if (!authData.user) {
    throw new Error("Usuario no autenticado");
  }

  const name = displayName.trim();

  if (name.length === 0 || name.length > 80) {
    throw new Error("Nombre de usuario no válido");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: name,
      bio: bio.trim(),
    })
    .eq("id", authData.user.id);

  if (error) throw error;
}

// ==================================================
// CREAR INVITACIÓN
// ==================================================

export async function createInvitation(
  communityId: string,
  maxUses: number | null = null,
  expiresAt: string | null = null
): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc(
    "create_invitation",
    {
      p_community_id: communityId,
      p_max_uses: maxUses,
      p_expires_at: expiresAt,
    }
  );

  if (error) throw error;

  return data as string;
}

// ==================================================
// UNIRSE A UNA COMUNIDAD
// ==================================================

export async function joinCommunity(
  code: string
): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc(
    "join_community",
    {
      p_code: code.trim(),
    }
  );

  if (error) throw error;

  return data as string;
}
