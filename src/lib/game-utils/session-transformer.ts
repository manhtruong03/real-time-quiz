import {
  LiveGameState,
  QuizStructureHost,
  LivePlayerState,
  PlayerAnswerRecord, // +++ IMPORT PlayerAnswerRecord +++
  QuestionHost, // +++ IMPORT QuestionHost +++
  QuestionEventLogEntry, // +++ IMPORT QuestionEventLogEntry +++
} from "@/src/lib/types";
import {
  SessionFinalizationDto,
  SessionPlayerDto,
  SessionGameSlideDto, // +++ IMPORT SessionGameSlideDto +++
  SessionPlayerAnswerDto, // +++ IMPORT SessionPlayerAnswerDto +++
} from "@/src/lib/dto/session-finalization.dto";

/**
 * Transforms a single LivePlayerState object into a SessionPlayerDto object.
 * @param playerState - The live state of a single player.
 * @returns SessionPlayerDto - The DTO representation for the player.
 */
function transformPlayerStateToDto(
  playerState: LivePlayerState,
  finalSessionStatusFromServer: LiveGameState["status"]
): SessionPlayerDto {
  if (!playerState) {
    // This case should ideally not be reached if we iterate Object.values()
    // but as a safeguard:
    throw new Error(
      "transformPlayerStateToDto nhận được playerState là null hoặc không xác định"
    );
  }

  // Map LivePlayerState.playerStatus to SessionPlayerDto.status
  // The DTO expects: 'JOINING', 'PLAYING', 'FINISHED', 'KICKED', 'DISCONNECTED'
  // LivePlayerState has: "JOINING" | "PLAYING" | "FINISHED" | "DISCONNECTED" | "KICKED";
  // This is a direct mapping.
  let dtoPlayerStatus: string = playerState.playerStatus;
  if (
    (finalSessionStatusFromServer === "ENDED" ||
      finalSessionStatusFromServer === "PODIUM") &&
    playerState.playerStatus === "PLAYING"
  ) {
    dtoPlayerStatus = "FINISHED";
  }

  return {
    clientId: playerState.cid,
    nickname: playerState.nickname,
    userId: playerState.userId || null, // Ensure null if undefined
    status: dtoPlayerStatus,
    joinedAt: playerState.joinedAt,
    joinSlideIndex:
      playerState.joinSlideIndex === undefined
        ? null
        : playerState.joinSlideIndex, // Ensure null if undefined
    waitingSince:
      playerState.waitingSince === undefined ? null : playerState.waitingSince, // Ensure null if undefined
    rank: playerState.rank === undefined ? null : playerState.rank, // Ensure null if undefined
    totalScore: playerState.totalScore,
    correctAnswers: playerState.correctCount,
    streakCount: playerState.maxStreak, // DTO's 'streakCount' likely means the player's maximum streak achieved.
    // LivePlayerState.currentStreak is the active one.
    answerCount: playerState.answersCount,
    unansweredCount: playerState.unansweredCount,
    totalTime: playerState.totalReactionTimeMs, // Maps to 'total_time' (sum of reaction times)
    lastActivityAt: playerState.lastActivityAt,
    deviceInfoJson: playerState.deviceInfoJson || null, // Ensure null if undefined
    avatarId: playerState.avatarId || null, // Ensure null if undefined or empty string
  };
}

// +++ NEW HELPER FUNCTION for transforming a single player's answer record +++
/**
 * Transforms a PlayerAnswerRecord into a SessionPlayerAnswerDto.
 * @param answerRecord - The player's answer record from LivePlayerState.
 * @param playerCid - The client ID of the player.
 * @returns SessionPlayerAnswerDto - The DTO representation of the player's answer.
 */
function transformPlayerAnswerRecordToDto(
  answerRecord: PlayerAnswerRecord,
  playerCid: string
): SessionPlayerAnswerDto {
  return {
    clientId: playerCid,
    questionIndex: answerRecord.questionIndex,
    choice: answerRecord.choice === undefined ? null : answerRecord.choice,
    text: answerRecord.text === undefined ? null : answerRecord.text,
    reactionTimeMs: answerRecord.reactionTimeMs,
    answerTimestamp: answerRecord.answerTimestamp,
    status: answerRecord.status, // e.g., 'CORRECT', 'WRONG', 'TIMEOUT'
    basePoints: answerRecord.basePoints,
    finalPoints: answerRecord.finalPointsEarned,
    // usedPowerUpId: undefined, // Populate if/when power-ups are tracked in answerRecord
    // usedPowerUpContext: undefined, // Populate if/when power-ups are tracked
  };
}
// +++ END NEW HELPER FUNCTION for player answer +++

// +++ NEW HELPER FUNCTION for transforming a QuestionHost to SessionGameSlideDto +++
/**
 * Transforms a QuestionHost (from original quiz data) into a SessionGameSlideDto.
 * This includes finding all player answers related to this specific slide.
 * @param hostQuestion - The original host question data.
 * @param slideActualIndex - The 0-based index of this slide in the game flow.
 * @param liveGameState - The full current LiveGameState for accessing player answers and event logs.
 * @returns SessionGameSlideDto | null - The DTO for the game slide, or null if it shouldn't be included.
 */
function transformHostQuestionToGameSlideDto(
  hostQuestion: QuestionHost,
  slideActualIndex: number,
  liveGameState: LiveGameState
): SessionGameSlideDto | null {
  const questionEvent = liveGameState.questionEventsLog.find(
    (event) => event.questionIndex === slideActualIndex
  );

  // Determine the DTO status for the slide.
  // If no event log, and slide was theoretically reached or game ended, assume 'ENDED'.
  // If event log exists, use its status. Otherwise, 'PENDING' if not reached.
  let slideDtoStatus: string;
  if (questionEvent) {
    // Map internal log status to DTO status
    switch (questionEvent.status) {
      case "ACTIVE":
      case "STATS_SHOWN":
      case "SCOREBOARD_SHOWN":
        slideDtoStatus = "ENDED"; // If we are finalizing, these prior states imply the slide itself has ended its active phase
        break;
      case "ENDED":
      case "SKIPPED":
      case "PENDING":
        slideDtoStatus = questionEvent.status;
        break;
      default:
        slideDtoStatus = "PENDING"; // Fallback for unhandled statuses
    }
  } else {
    // If no specific event log entry, infer status
    if (
      slideActualIndex <= liveGameState.currentQuestionIndex ||
      liveGameState.status === "ENDED" ||
      liveGameState.status === "PODIUM"
    ) {
      // If the slide was passed, or the game is over, mark as ENDED
      // unless a more specific status like SKIPPED would be known from another source.
      slideDtoStatus = "ENDED";
    } else {
      slideDtoStatus = "PENDING"; // Slide was not reached
    }
  }

  // Per your requirement: only include slides that were at least started or the game has concluded
  // If a slide is still 'PENDING' and the game hasn't reached its end states,
  // it means it wasn't shown, so we might not want to include it.
  // However, the DTO schema for game_slide has status NOT NULL, implying all defined slides
  // in a session might need an entry. "PENDING" or "SKIPPED" would be appropriate.
  // For now, we will create DTOs for all questions in originalQuizData.

  const playerAnswersForThisSlide: SessionPlayerAnswerDto[] = [];
  Object.values(liveGameState.players).forEach((playerState) => {
    const answerForThisSlide = playerState.answers.find(
      (ans) => ans.questionIndex === slideActualIndex
    );
    if (answerForThisSlide) {
      playerAnswersForThisSlide.push(
        transformPlayerAnswerRecordToDto(answerForThisSlide, playerState.cid)
      );
    }
  });

  // Map QuestionHost.type to SessionGameSlideDto.slideType
  let dtoSlideType: string;
  switch (hostQuestion.type) {
    case "content":
      dtoSlideType = "CONTENT_SLIDE"; // Example mapping
      break;
    case "quiz":
    case "jumble":
    case "open_ended":
    case "survey":
      dtoSlideType = "QUESTION_SLIDE"; // Example mapping
      break;
    default:
      dtoSlideType = "UNKNOWN_SLIDE_TYPE"; // Fallback
      console.warn(
        `Loại hostQuestion.type không xác định đã gặp: ${hostQuestion.type}`
      );
  }
  //   dtoSlideType = hostQuestion.type;

  return {
    slideIndex: slideActualIndex,
    slideType: dtoSlideType,
    status: slideDtoStatus,
    startedAt: questionEvent?.startedAt || null,
    endedAt: questionEvent?.endedAt || null,
    originalQuestionId: hostQuestion.id || null, // Ensure QuestionHost has an 'id' (UUID)
    questionDistributionJson: hostQuestion, // As per requirement: full QuestionHost object
    playerAnswers: playerAnswersForThisSlide,
  };
}
// +++ END NEW HELPER FUNCTION for game slide +++

export function transformLiveStateToFinalizationDto(
  liveGameState: LiveGameState,
  originalQuizData: QuizStructureHost
): SessionFinalizationDto {
  if (!liveGameState) {
    throw new Error("LiveGameState không được rỗng để chuyển đổi.");
  }
  if (!originalQuizData) {
    throw new Error("OriginalQuizData không được rỗng để chuyển đổi.");
  }
  if (!originalQuizData.questions.every((q) => q.id)) {
    console.error(
      "[SessionTransformer] Không phải tất cả câu hỏi trong originalQuizData đều có ID. Điều này là bắt buộc đối với originalQuestionId.",
      originalQuizData.questions
    );
    // Depending on strictness, you might throw an error here or proceed with null originalQuestionId
  }

  const finalPlayerCount = Object.values(liveGameState.players).filter(
    (player) => player.cid !== liveGameState.hostUserId
  ).length;

  let finalSessionStatus: string;
  switch (liveGameState.status) {
    case "PODIUM":
    case "ENDED":
      finalSessionStatus = "ENDED";
      break;
    default:
      finalSessionStatus = "ABORTED";
      console.warn(
        `[SessionTransformer] Trạng thái LiveGameState ("${liveGameState.status}") ngụ ý phiên đã bị hủy hoặc chưa hoàn tất. Đang ánh xạ trạng thái DTO thành "ABORTED".`
      );
      break;
  }
  if (liveGameState.status === "PODIUM" || liveGameState.status === "ENDED") {
    finalSessionStatus = "ENDED";
  }

  const gameFinalStatus = liveGameState.status; // Capture the overall game status

  const sessionPlayers: SessionPlayerDto[] = Object.values(
    liveGameState.players
  ).map((playerState) =>
    transformPlayerStateToDto(playerState, gameFinalStatus)
  );

  // +++ MAP gameSlides array using the new helper function +++
  const gameSlidesDto: SessionGameSlideDto[] = originalQuizData.questions
    .map((hostQuestion, index) => {
      // Ensure hostQuestion has an ID, otherwise originalQuestionId will be problematic
      if (!hostQuestion.id) {
        console.warn(
          `[SessionTransformer] Câu hỏi tại chỉ mục ${index} bị thiếu ID. OriginalQuestionId sẽ là null cho trang chiếu này.`
        );
      }
      return transformHostQuestionToGameSlideDto(
        hostQuestion,
        index, // This is the slideActualIndex
        liveGameState
      );
    })
    .filter((slide) => slide !== null) as SessionGameSlideDto[]; // Filter out any nulls if decided by helper
  // +++ END MAP gameSlides +++

  const dto: SessionFinalizationDto = {
    gamePin: liveGameState.gamePin,
    quizId: liveGameState.quizId,
    hostUserId: liveGameState.hostUserId,
    sessionStartTime: liveGameState.sessionStartTime,
    sessionEndTime: Date.now(), // Default, will be refined
    gameType: "LIVE",
    finalPlayerCount: finalPlayerCount,
    finalSessionStatus: finalSessionStatus,
    allowLateJoin: liveGameState.allowLateJoin,
    powerUpsEnabled: liveGameState.powerUpsEnabled,
    terminationReason: null,
    terminationSlideIndex: null,
    players: sessionPlayers,
    gameSlides: gameSlidesDto, // +++ ASSIGN MAPPED SLIDES +++
  };

  if (liveGameState.quizId !== originalQuizData.uuid) {
    console.warn(
      `[SessionTransformer] Không khớp: liveGameState.quizId (${liveGameState.quizId}) so với originalQuizData.uuid (${originalQuizData.uuid}). Đang sử dụng liveGameState.quizId.`
    );
  }
  if (liveGameState.status === "ENDED" || liveGameState.status === "PODIUM") {
    dto.sessionEndTime = liveGameState.currentQuestionEndTime ?? Date.now();
  }

  console.log(
    `[SessionTransformer] Giai đoạn 3: GameSlides đã được ánh xạ. Số lượng trang chiếu: ${gameSlidesDto.length}`
  );
  return dto;
}
