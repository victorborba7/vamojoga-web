import type {
  TokenResponse,
  UserCreate,
  UserLogin,
  UserResponse,
  GameResponse,
  GameCreate,
  MatchResponse,
  MatchCreate,
  PlayerScoreSubmit,
  RankingEntry,
  UserStats,
  FriendshipResponse,
  FriendResponse,
  LibraryEntryResponse,
  WishlistEntryResponse,
  CollectionResponse,
  CollectionDetailResponse,
  CollectionJogoResponse,
  MembroResponse,
  ScoringTemplateResponse,
  ScoringTemplateListResponse,
  ScoringTemplateCreate,
  ScoringTemplateUpdate,
  AchievementResponse,
  UserAchievementResponse,
  PriceHistoryResponse,
  GamePriceResponse,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_URL = `${API_BASE}/api/v1`;

// ---- helpers ----

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    if (res.status === 401 && token) {
      // Token expired mid-session — clear it and redirect to login
      localStorage.removeItem("token");
      if (typeof window !== "undefined") {
        window.location.href = "/login?expired=1";
      }
    }
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail || res.statusText);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ---- Auth ----

export async function register(data: UserCreate): Promise<UserResponse> {
  return request<UserResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function login(data: UserLogin): Promise<TokenResponse> {
  return request<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return request<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, new_password: string): Promise<{ message: string }> {
  return request<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, new_password }),
  });
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  return request<{ message: string }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function resendVerification(): Promise<{ message: string }> {
  return request<{ message: string }>("/auth/resend-verification", {
    method: "POST",
  });
}

// ---- Users ----

export async function getMe(): Promise<UserResponse> {
  return request<UserResponse>("/users/me");
}

export async function listUsers(): Promise<UserResponse[]> {
  return request<UserResponse[]>("/users/");
}

export async function searchUsers(query: string, limit = 10): Promise<UserResponse[]> {
  return request<UserResponse[]>(
    `/users/search/?q=${encodeURIComponent(query)}&limit=${limit}`
  );
}

export async function getUser(userId: string): Promise<UserResponse> {
  return request<UserResponse>(`/users/${userId}`);
}

// ---- Games ----

export async function listGames(): Promise<GameResponse[]> {
  return request<GameResponse[]>("/games/");
}

export async function getGame(gameId: string): Promise<GameResponse> {
  return request<GameResponse>(`/games/${gameId}`);
}

export async function searchGames(query: string, limit = 20, excludeExpansions = false): Promise<GameResponse[]> {
  return request<GameResponse[]>(
    `/games/search/?q=${encodeURIComponent(query)}&limit=${limit}&exclude_expansions=${excludeExpansions}`
  );
}

export async function createGame(data: GameCreate): Promise<GameResponse> {
  return request<GameResponse>("/games/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ---- Matches ----

export async function createMatch(data: MatchCreate): Promise<MatchResponse> {
  return request<MatchResponse>("/matches/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getUserMatches(
  userId: string,
  skip = 0,
  limit = 50
): Promise<MatchResponse[]> {
  return request<MatchResponse[]>(
    `/matches/user/${userId}?skip=${skip}&limit=${limit}`
  );
}

export async function getMatch(matchId: string): Promise<MatchResponse> {
  return request<MatchResponse>(`/matches/${matchId}`);
}

export async function submitOwnScores(
  matchId: string,
  data: PlayerScoreSubmit
): Promise<MatchResponse> {
  return request<MatchResponse>(`/matches/${matchId}/submit-scores`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function submitPlayerScores(
  matchId: string,
  userId: string,
  data: PlayerScoreSubmit
): Promise<MatchResponse> {
  return request<MatchResponse>(`/matches/${matchId}/submit-scores/${userId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function finalizeMatch(matchId: string): Promise<MatchResponse> {
  return request<MatchResponse>(`/matches/${matchId}/finalize`, {
    method: "POST",
  });
}

// ---- Ranking ----

export async function getGlobalRanking(limit = 50): Promise<RankingEntry[]> {
  return request<RankingEntry[]>(`/ranking/global?limit=${limit}`);
}

export async function getRankingByGame(
  gameId: string,
  limit = 50
): Promise<RankingEntry[]> {
  return request<RankingEntry[]>(`/ranking/game/${gameId}?limit=${limit}`);
}

export async function getUserStats(userId: string): Promise<UserStats> {
  return request<UserStats>(`/ranking/user/${userId}`);
}

// ---- Friends ----

export async function getFriends(): Promise<FriendResponse[]> {
  return request<FriendResponse[]>("/friends/");
}

export async function getPendingReceived(): Promise<FriendshipResponse[]> {
  return request<FriendshipResponse[]>("/friends/pending/received");
}

export async function getPendingSent(): Promise<FriendshipResponse[]> {
  return request<FriendshipResponse[]>("/friends/pending/sent");
}

export async function sendFriendRequest(addresseeId: string): Promise<FriendshipResponse> {
  return request<FriendshipResponse>(`/friends/request/${addresseeId}`, {
    method: "POST",
  });
}

export async function acceptFriendRequest(friendshipId: string): Promise<FriendshipResponse> {
  return request<FriendshipResponse>(`/friends/${friendshipId}/accept`, {
    method: "POST",
  });
}

export async function rejectFriendRequest(friendshipId: string): Promise<FriendshipResponse> {
  return request<FriendshipResponse>(`/friends/${friendshipId}/reject`, {
    method: "POST",
  });
}

export async function removeFriend(friendshipId: string): Promise<void> {
  await request(`/friends/${friendshipId}`, {
    method: "DELETE",
  });
}

// ---- Library ----

export async function getMyLibrary(): Promise<LibraryEntryResponse[]> {
  return request<LibraryEntryResponse[]>("/library/");
}

export async function getUserLibrary(userId: string): Promise<LibraryEntryResponse[]> {
  return request<LibraryEntryResponse[]>(`/library/${userId}`);
}

export async function addToLibrary(gameId: string): Promise<LibraryEntryResponse> {
  return request<LibraryEntryResponse>("/library/", {
    method: "POST",
    body: JSON.stringify({ game_id: gameId }),
  });
}

export async function removeFromLibrary(gameId: string): Promise<void> {
  await request(`/library/${gameId}`, { method: "DELETE" });
}

// ---- Wishlist ----

export async function getMyWishlist(): Promise<WishlistEntryResponse[]> {
  return request<WishlistEntryResponse[]>("/wishlist/");
}

export async function getUserWishlist(userId: string): Promise<WishlistEntryResponse[]> {
  return request<WishlistEntryResponse[]>(`/wishlist/${userId}`);
}

export async function addToWishlist(
  gameId: string,
  isPublic = true
): Promise<WishlistEntryResponse> {
  return request<WishlistEntryResponse>("/wishlist/", {
    method: "POST",
    body: JSON.stringify({ game_id: gameId, is_public: isPublic }),
  });
}

export async function removeFromWishlist(gameId: string): Promise<void> {
  await request(`/wishlist/${gameId}`, { method: "DELETE" });
}

export async function updateWishlistVisibility(
  gameId: string,
  isPublic: boolean
): Promise<WishlistEntryResponse> {
  return request<WishlistEntryResponse>(`/wishlist/${gameId}/visibility`, {
    method: "PATCH",
    body: JSON.stringify({ is_public: isPublic }),
  });
}

// ---- Collections ----

export async function getMyCollections(): Promise<CollectionResponse[]> {
  return request<CollectionResponse[]>("/collections/");
}

export async function createCollection(
  name: string,
  description?: string
): Promise<CollectionDetailResponse> {
  return request<CollectionDetailResponse>("/collections/", {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });
}

export async function getCollection(id: string): Promise<CollectionDetailResponse> {
  return request<CollectionDetailResponse>(`/collections/${id}`);
}

export async function updateCollection(
  id: string,
  data: { name?: string; description?: string }
): Promise<CollectionDetailResponse> {
  return request<CollectionDetailResponse>(`/collections/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteCollection(id: string): Promise<void> {
  await request(`/collections/${id}`, { method: "DELETE" });
}

export async function inviteMember(
  collectionId: string,
  userId: string
): Promise<MembroResponse> {
  return request<MembroResponse>(`/collections/${collectionId}/membros`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
}

export async function removeMember(
  collectionId: string,
  userId: string
): Promise<void> {
  await request(`/collections/${collectionId}/membros/${userId}`, { method: "DELETE" });
}

export async function getAvailableGames(collectionId: string): Promise<CollectionJogoResponse[]> {
  return request<CollectionJogoResponse[]>(`/collections/${collectionId}/jogos-disponiveis`);
}

export async function addGameToCollection(
  collectionId: string,
  gameId: string
): Promise<CollectionJogoResponse> {
  return request<CollectionJogoResponse>(`/collections/${collectionId}/jogos`, {
    method: "POST",
    body: JSON.stringify({ game_id: gameId }),
  });
}

export async function removeGameFromCollection(
  collectionId: string,
  gameId: string
): Promise<void> {
  await request(`/collections/${collectionId}/jogos/${gameId}`, { method: "DELETE" });
}

// ---- Scoring Templates ----

export async function createScoringTemplate(
  data: ScoringTemplateCreate
): Promise<ScoringTemplateResponse> {
  return request<ScoringTemplateResponse>("/scoring-templates/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getScoringTemplate(
  templateId: string
): Promise<ScoringTemplateResponse> {
  return request<ScoringTemplateResponse>(`/scoring-templates/${templateId}`);
}

export async function searchScoringTemplates(
  query: string,
  limit = 20
): Promise<ScoringTemplateListResponse[]> {
  return request<ScoringTemplateListResponse[]>(
    `/scoring-templates/search/?q=${encodeURIComponent(query)}&limit=${limit}`
  );
}

export async function getScoringTemplatesByGame(
  gameId: string
): Promise<ScoringTemplateListResponse[]> {
  return request<ScoringTemplateListResponse[]>(
    `/scoring-templates/game/${gameId}`
  );
}

export async function updateScoringTemplate(
  templateId: string,
  data: ScoringTemplateUpdate
): Promise<ScoringTemplateResponse> {
  return request<ScoringTemplateResponse>(`/scoring-templates/${templateId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteScoringTemplate(
  templateId: string
): Promise<void> {
  await request(`/scoring-templates/${templateId}`, { method: "DELETE" });
}

// ---- Achievements ----

export async function getGlobalAchievements(): Promise<AchievementResponse[]> {
  return request<AchievementResponse[]>("/achievements/global");
}

export async function getGameAchievements(gameId: string): Promise<AchievementResponse[]> {
  return request<AchievementResponse[]>(`/achievements/game/${gameId}`);
}

export async function getMyAchievements(): Promise<UserAchievementResponse[]> {
  return request<UserAchievementResponse[]>("/achievements/me");
}

export async function getUserAchievements(userId: string): Promise<UserAchievementResponse[]> {
  return request<UserAchievementResponse[]>(`/achievements/user/${userId}`);
}

// ---- Prices ----

export async function getGamePriceHistory(
  gameId: string,
  source?: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<PriceHistoryResponse> {
  const params = new URLSearchParams();
  if (source) params.set("source", source);
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const qs = params.toString();
  return request<PriceHistoryResponse>(`/games/${gameId}/prices${qs ? `?${qs}` : ""}`);
}

export async function getGameLatestPrices(gameId: string): Promise<GamePriceResponse[]> {
  return request<GamePriceResponse[]>(`/games/${gameId}/prices/latest`);
}
