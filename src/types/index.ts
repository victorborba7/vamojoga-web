// ---- Auth ----
export interface UserCreate {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// ---- Game ----
export interface GameResponse {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  min_players: number;
  max_players: number;
  is_active: boolean;
  created_at: string;
}

export interface GameCreate {
  name: string;
  description?: string;
  image_url?: string;
  min_players?: number;
  max_players?: number;
}

// ---- Match ----
export interface MatchPlayerCreate {
  user_id: string;
  position: number;
  score: number;
  is_winner: boolean;
}

export interface MatchCreate {
  game_id: string;
  played_at?: string;
  notes?: string;
  players: MatchPlayerCreate[];
}

export interface MatchPlayerResponse {
  id: string;
  user_id: string;
  username: string | null;
  position: number;
  score: number;
  is_winner: boolean;
}

export interface MatchResponse {
  id: string;
  game_id: string;
  game_name: string | null;
  created_by: string;
  played_at: string;
  notes: string | null;
  players: MatchPlayerResponse[];
  created_at: string;
}

// ---- Ranking ----
export interface RankingEntry {
  user_id: string;
  username: string;
  total_matches: number;
  total_wins: number;
  win_rate: number;
}

export interface GameStats {
  game_id: string;
  game_name: string;
  total_matches: number;
  total_wins: number;
  win_rate: number;
}

export interface UserStats {
  user_id: string;
  username: string;
  total_matches: number;
  total_wins: number;
  win_rate: number;
  matches_by_game: GameStats[];
}

// ---- Friends ----
export interface FriendshipResponse {
  id: string;
  requester_id: string;
  requester_username: string | null;
  addressee_id: string;
  addressee_username: string | null;
  status: string;
  created_at: string;
}

export interface FriendResponse {
  friendship_id: string;
  user_id: string;
  username: string;
  full_name: string | null;
  since: string;
}

// ---- Library ----
export interface LibraryEntryResponse {
  id: string;
  game: GameResponse;
  match_count: number;
  added_at: string;
}

// ---- Wishlist ----
export interface WishlistEntryResponse {
  id: string;
  game: GameResponse;
  is_public: boolean;
  added_at: string;
  friends_who_own: string[];
}
