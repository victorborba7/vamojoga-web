// ---- Auth ----
export interface UserCreate {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface UserLogin {
  identifier: string; // e-mail ou username
  password: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  email_verified: boolean;
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
  // BGG metadata
  bgg_id: number | null;
  rank: number | null;
  bayes_rating: number | null;
  avg_rating: number | null;
  users_rated: number | null;
  subtitle: string | null;
  year: number | null;
  best_players: string | null;
  min_play_time: number | null;
  max_play_time: number | null;
  min_age: number | null;
  weight: number | null;
  game_type: string | null;
  is_expansion: boolean;
  thumbnail_url: string | null;
  playing_time: number | null;
  last_bgg_sync_at: string | null;
  mechanics: string[];
  categories: string[];
  designers: string[];
  publishers: string[];
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
  template_scores?: TemplateScoreEntry[];
}

export interface MatchCreate {
  game_id: string;
  played_at?: string;
  notes?: string;
  scoring_template_id?: string;
  match_mode?: string;
  collaborative_scoring?: boolean;
  players: MatchPlayerCreate[];
}

export interface MatchTemplateScoreResponse {
  template_field_id: string;
  field_name: string | null;
  field_type: string | null;
  numeric_value: number | null;
  boolean_value: boolean | null;
  ranking_value: number | null;
}

export interface MatchPlayerResponse {
  id: string;
  user_id: string;
  username: string | null;
  position: number;
  score: number;
  is_winner: boolean;
  scores_submitted: boolean;
  scores_submitted_at: string | null;
  template_scores: MatchTemplateScoreResponse[];
}

export interface MatchResponse {
  id: string;
  game_id: string;
  game_name: string | null;
  game_image_url: string | null;
  created_by: string;
  played_at: string;
  notes: string | null;
  match_mode?: string;
  status: string;
  scoring_template_id: string | null;
  scoring_template_name: string | null;
  players: MatchPlayerResponse[];
  unlocked_achievements: NewlyUnlockedAchievement[];
  created_at: string;
}

export interface PlayerScoreSubmit {
  template_scores: TemplateScoreEntry[];
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

// ---- Collections ----
export interface MembroResponse {
  user_id: string;
  username: string;
  full_name: string | null;
  role: string;
  joined_at: string;
}

export interface CollectionJogoResponse {
  game_id: string;
  name: string;
  bgg_id: number | null;
  image_url: string | null;
  bayes_rating: number | null;
  year: number | null;
  added_by: string;
  added_by_username: string | null;
  added_at: string;
}

export interface CollectionResponse {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  member_count: number;
  game_count: number;
}

export interface CollectionDetailResponse extends CollectionResponse {
  members: MembroResponse[];
  games: CollectionJogoResponse[];
}

// ---- Scoring Templates ----
export type ScoringFieldType = "numeric" | "ranking" | "boolean";

export interface ScoringTemplateFieldCreate {
  name: string;
  field_type: ScoringFieldType;
  min_value?: number | null;
  max_value?: number | null;
  display_order: number;
  is_required: boolean;
  is_tiebreaker: boolean;
}

export interface ScoringTemplateCreate {
  game_id: string;
  name: string;
  description?: string;
  match_mode?: string;
  fields: ScoringTemplateFieldCreate[];
}

export interface ScoringTemplateUpdate {
  name?: string;
  description?: string;
  match_mode?: string;
  is_active?: boolean;
  fields?: ScoringTemplateFieldCreate[];
}

export interface TemplateScoreEntry {
  template_field_id: string;
  numeric_value?: number | null;
  boolean_value?: boolean | null;
  ranking_value?: number | null;
}

export interface ScoringTemplateFieldResponse {
  id: string;
  name: string;
  field_type: ScoringFieldType;
  min_value: number | null;
  max_value: number | null;
  display_order: number;
  is_required: boolean;
  is_tiebreaker: boolean;
}

export interface ScoringTemplateResponse {
  id: string;
  game_id: string;
  game_name: string | null;
  created_by: string;
  created_by_username: string | null;
  name: string;
  description: string | null;
  match_mode: string;
  is_active: boolean;
  fields: ScoringTemplateFieldResponse[];
  created_at: string;
  updated_at: string;
}

export interface ScoringTemplateListResponse {
  id: string;
  game_id: string;
  game_name: string | null;
  created_by: string;
  created_by_username: string | null;
  name: string;
  description: string | null;
  match_mode: string;
  is_active: boolean;
  field_count: number;
  created_at: string;
}

// ---- Achievements ----

export interface AchievementResponse {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  type: "global" | "game";
  game_id: string | null;
  criteria_key: string;
  criteria_value: number;
  points: number;
  is_active: boolean;
  created_at: string;
}

export interface UserAchievementResponse {
  id: string;
  user_id: string;
  username: string | null;
  achievement_id: string;
  achievement_name: string;
  achievement_description: string | null;
  achievement_icon_url: string | null;
  achievement_type: string;
  achievement_points: number;
  match_id: string | null;
  unlocked_at: string;
}

export interface NewlyUnlockedAchievement {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  points: number;
}

// ---- Prices ----

export interface GamePriceResponse {
  id: string;
  game_id: string;
  source_name: string;
  price: number;
  currency: string;
  url: string | null;
  scraped_at: string;
}

export interface PriceHistoryResponse {
  game_id: string;
  game_name: string;
  prices: GamePriceResponse[];
}
