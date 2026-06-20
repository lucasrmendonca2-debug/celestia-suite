/**
 * Server functions de autenticação do dashboard.
 * Tudo que toca cookie/Discord roda dentro do .handler() (server-only).
 */
import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";

export interface CurrentUser {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
}

export interface ManageableGuild {
  id: string;
  name: string;
  icon: string | null;
  iconUrl: string | null;
  owner: boolean;
  permissions: string;
}

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<CurrentUser | null> => {
    const { getSession } = await import("./session.server");
    const session = await getSession();
    if (!session.data.userId || !session.data.username) return null;
    return {
      id: session.data.userId,
      username: session.data.username,
      globalName: session.data.globalName ?? null,
      avatar: session.data.avatar ?? null,
    };
  },
);

export const requireUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<CurrentUser> => {
    const { getSession } = await import("./session.server");
    const session = await getSession();
    if (!session.data.userId) {
      throw redirect({ to: "/entrar" });
    }
    return {
      id: session.data.userId,
      username: session.data.username!,
      globalName: session.data.globalName ?? null,
      avatar: session.data.avatar ?? null,
    };
  },
);

export const listMyGuilds = createServerFn({ method: "GET" }).handler(
  async (): Promise<ManageableGuild[]> => {
    const { getSession } = await import("./session.server");
    const { fetchUserGuilds, filterManageableGuilds, guildIconUrl } = await import(
      "./discord.server"
    );
    const session = await getSession();
    if (!session.data.accessToken) throw redirect({ to: "/entrar" });

    const guilds = await fetchUserGuilds(session.data.accessToken);
    const manageable = filterManageableGuilds(guilds);
    return manageable.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
      iconUrl: guildIconUrl(g),
      owner: g.owner,
      permissions: g.permissions,
    }));
  },
);

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const { getSession } = await import("./session.server");
  const session = await getSession();
  await session.clear();
  return { ok: true };
});
