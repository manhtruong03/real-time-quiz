// DTO for Phase 5: Session Finalization (Host Client -> Backend REST POST)
// Fully detailed based on db_init_query.sql schema

/**
 * Represents a specific answer by a player for a specific game slide.
 * Maps to the 'player_answer' table.
 * (Backend generates 'answer_id', links 'slide_id' and 'player_id').
 */
interface SessionPlayerAnswerDto {
  clientId: string; // Player's 'cid', used by backend to link to the correct player_id.
  questionIndex: number; // 0-based index, used by backend to link to the correct slide_id.

  // --- Data matching player_answer columns ---
  choice?: string | null; // Raw choice index(es) as string, or null. Maps to 'choice'.
  text?: string | null; // Raw text input, if applicable. Maps to 'text'.
  reactionTimeMs: number; // Maps to 'reaction_time_ms'. (NOT NULL in DB)
  answerTimestamp: number; // Timestamp (ms). Maps to 'answer_timestamp'. (NOT NULL in DB)
  status: string; // 'CORRECT', 'WRONG', 'TIMEOUT', 'PARTIAL'. Maps to 'status'. (NOT NULL in DB)
  basePoints: number; // Maps to 'base_points'. (NOT NULL in DB, defaults to 0)
  finalPoints: number; // Maps to 'final_points'. (NOT NULL in DB, defaults to 0)
  usedPowerUpId?: string | null; // Optional UUID. Maps to 'used_power_up_id'.
  usedPowerUpContext?: any | null; // Optional JSON. Maps to 'used_power_up_context_json'.
}

/**
 * Represents the state and data of a single slide shown during the game session.
 * Maps closely to the 'game_slide' table.
 * (Backend generates 'slide_id', links 'session_id').
 */
interface SessionGameSlideDto {
  // --- Data matching game_slide columns ---
  slideIndex: number; // Maps to 'slide_index'. (NOT NULL in DB)
  slideType: string; // 'QUESTION', 'LEADERBOARD', etc. Maps to 'slide_type'. (NOT NULL in DB)
  status: string; // 'PENDING', 'ACTIVE', 'ENDED', 'SKIPPED'. Maps to 'status'. (NOT NULL in DB)
  startedAt?: number | null; // Timestamp (ms). Maps to 'started_at'.
  endedAt?: number | null; // Timestamp (ms). Maps to 'ended_at'.
  originalQuestionId?: string | null; // Optional: UUID of the source question. Maps to 'original_question_id'.
  questionDistributionJson?: any | null; // Optional: Snapshot of question data shown. Maps to 'question_distribution_json'.

  // --- Nested Answers for this Slide ---
  playerAnswers: SessionPlayerAnswerDto[]; // Array of answers submitted for THIS slide.
}

/**
 * Represents the final aggregated results for a single player in the session.
 * Maps closely to the 'player' table.
 * (Backend generates 'player_id', links 'session_id', calculates 'average_time', maps 'avatar').
 */
interface SessionPlayerDto {
  // --- Data matching player columns ---
  clientId: string; // The 'cid' used during WS session. Maps to 'client_id'. (NOT NULL in DB)
  nickname: string; // Maps to 'nickname'. (NOT NULL in DB)
  userId?: string | null; // Optional UUID if logged in. Maps to 'user_id'.
  status: string; // 'JOINING', 'PLAYING', 'FINISHED', 'KICKED'. Maps to 'status'. (NOT NULL in DB)
  joinedAt: number; // Timestamp (ms). Maps to 'joined_at'. (NOT NULL in DB)
  joinSlideIndex?: number | null; // Optional. Maps to 'join_slide_index'.
  waitingSince?: number | null; // Optional Timestamp (ms). Maps to 'waiting_since'.
  rank?: number | null; // Final rank. Maps to 'rank'.
  totalScore: number; // Final score. Maps to 'total_score'. (NOT NULL in DB)
  correctAnswers: number; // Maps to 'correct_answers'. (NOT NULL in DB)
  streakCount: number; // Max streak achieved. Maps to 'streak_count'. (NOT NULL in DB)
  answerCount: number; // Total answered (correct + incorrect). Maps to 'answer_count'. (NOT NULL in DB)
  unansweredCount: number; // Total not answered (timeout/skipped). Maps to 'unanswered_count'. (NOT NULL in DB)
  totalTime: number; // Sum of reaction times (ms). Maps to 'total_time'. (NOT NULL in DB)
  lastActivityAt: number; // Timestamp (ms). Maps to 'last_activity_at'. (NOT NULL in DB)
  deviceInfoJson?: any | null; // Optional JSON. Maps to 'device_info_json'.
  finalAvatar: { type: number; item: number } | null; // Live avatar info. Backend maps to 'avatar_id'.

  // Note: 'average_time' is calculated by the backend.
  // The 'answers' for this player are nested under each 'SessionGameSlideDto'.
}

/**
 * The main DTO sent from the Host Client to the Backend via REST API
 * upon completion of a game session. Contains all necessary info.
 */
export interface SessionFinalizationDto {
  // --- Data for 'game_session' table ---
  // Backend generates 'session_id', handles 'created_at'.
  gamePin: string; // Maps to 'game_pin'. (NOT NULL in DB)
  quizId: string; // Maps to 'quiz_id'. (NOT NULL in DB)
  hostUserId: string; // Maps to 'host_id'. (NOT NULL in DB)
  sessionStartTime?: number | null; // Maps to 'started_at'.
  sessionEndTime?: number | null; // Maps to 'ended_at'.
  gameType: string; // Maps to 'game_type'. (NOT NULL in DB)
  finalPlayerCount: number; // Maps to 'player_count'. (NOT NULL in DB)
  finalSessionStatus: string; // 'LOBBY', 'RUNNING', 'ENDED', 'ABORTED'. Maps to 'status'. (NOT NULL in DB)
  allowLateJoin: boolean; // Maps to 'allow_late_join'. (NOT NULL in DB)
  powerUpsEnabled: boolean; // Maps to 'power_ups_enabled'. (NOT NULL in DB)
  terminationReason?: string | null; // Maps to 'termination_reason'.
  terminationSlideIndex?: number | null; // Maps to 'termination_slide_index'.

  // --- Data for 'player' table ---
  players: SessionPlayerDto[]; // Array containing final results for each player.

  // --- Data for 'game_slide' and 'player_answer' tables ---
  gameSlides: SessionGameSlideDto[]; // Array containing info and all player answers for each slide presented.
}
