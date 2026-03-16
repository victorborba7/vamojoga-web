import type { ComponentType } from "react";
import {
  Home,
  Gamepad2,
  Swords,
  Users,
  User,
  Library,
  Layers,
  Trophy,
  Medal,
  UserRoundPlus,
  Settings,
  LogOut,
} from "lucide-react";

export const routes = {
  home: "/",
  games: "/games",
  gameDetails: (id: string) => `/games/${id}`,
  library: "/library",
  collections: "/collections",
  collectionDetails: (id: string) => `/collections/${id}`,
  matches: "/matches",
  matchDetails: (id: string) => `/matches/${id}`,
  scoringTemplates: "/scoring-templates",
  social: "/social",
  friends: "/friends",
  guests: "/guests",
  leaderboard: "/leaderboard",
  achievements: "/achievements",
  profile: "/profile",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",
} as const;

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export const mainNavItems: NavItem[] = [
  { href: routes.home, label: "Home", icon: Home },
  { href: routes.games, label: "Jogos", icon: Gamepad2 },
  { href: routes.matches, label: "Partidas", icon: Swords },
  { href: routes.social, label: "Social", icon: Users },
  { href: routes.profile, label: "Perfil", icon: User },
];

export const authRoutesHiddenFromMainNav = [
  routes.login,
  routes.register,
  routes.forgotPassword,
  routes.resetPassword,
  routes.verifyEmail,
] as const;

export const gamesSubmenu: NavItem[] = [
  { href: routes.games, label: "Explorar jogos", icon: Gamepad2 },
  { href: routes.library, label: "Minha biblioteca", icon: Library },
  { href: routes.collections, label: "Colecoes", icon: Layers },
];

export const socialSubmenu: NavItem[] = [
  { href: routes.friends, label: "Amigos", icon: Users },
  { href: routes.guests, label: "Convidados", icon: UserRoundPlus },
  { href: routes.leaderboard, label: "Ranking", icon: Medal },
  { href: routes.achievements, label: "Conquistas", icon: Trophy },
];

export const profileSubmenu: NavItem[] = [
  { href: routes.profile, label: "Meu perfil", icon: User },
  { href: routes.profile, label: "Configuracoes", icon: Settings },
  { href: routes.profile, label: "Sair", icon: LogOut },
];