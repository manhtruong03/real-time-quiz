-- Kích hoạt extension UUID nếu chưa có
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bảng theme: Lưu trữ thông tin về giao diện hình ảnh
CREATE TABLE "theme" (
    "theme_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "background_file_path" VARCHAR(512),
    -- Đường dẫn đến file ảnh nền (nếu có)
    "background_color" VARCHAR(30),
    -- Mã màu nền (ví dụ: '#FFFFFF')
    "text_color" VARCHAR(30),
    -- Mã màu chữ (ví dụ: '#000000')
    "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "deleted_at" TIMESTAMP WITH TIME ZONE -- Dùng cho soft delete
);

-- Bảng user_account: Lưu trữ thông tin người dùng đăng ký
CREATE TABLE "user_account" (
    "user_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "username" VARCHAR(50) NOT NULL UNIQUE,
    "email" VARCHAR(200) UNIQUE,
    "account_password" VARCHAR(30) NOT NULL,
    -- Nên lưu trữ dưới dạng hash
    "role" VARCHAR(50) NOT NULL DEFAULT 'USER',
    -- Ví dụ: 'USER', 'ADMIN', 'TEACHER', 'STUDENT'
    "storage_used" BIGINT NOT NULL DEFAULT 0,
    -- Tổng dung lượng đã sử dụng (bytes)
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "deleted_at" TIMESTAMP WITH TIME ZONE -- Dùng cho soft delete
);

-- Index để tăng tốc độ truy vấn trên username và email
CREATE UNIQUE INDEX "AK_user_account_username_email" ON "user_account" ("username", "email");

-- Bảng avatar: Lưu trữ các avatar hệ thống hoặc do người dùng tải lên (tùy thiết kế)
CREATE TABLE "avatar" (
    "avatar_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "image_file_path" VARCHAR(512),
    -- Đường dẫn đến file ảnh avatar
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "deleted_at" TIMESTAMP WITH TIME ZONE -- Dùng cho soft delete
);

-- Bảng image_storage: Quản lý các file đã tải lên (chủ yếu là ảnh)
CREATE TABLE "image_storage" (
    "image_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "creator_id" UUID REFERENCES "user_account"("user_id") ON DELETE
    SET
        NULL,
        -- Ai đã tải lên? SET NULL nếu user bị xóa
        "file_name" VARCHAR(255) NOT NULL,
        -- Tên file trên server (có thể là duy nhất)
        "file_path" VARCHAR(512) NOT NULL UNIQUE,
        -- Đường dẫn đầy đủ đến file
        "content_type" VARCHAR(100) NOT NULL,
        -- Kiểu MIME (ví dụ: 'image/jpeg')
        "file_size" BIGINT NOT NULL,
        -- Kích thước file (bytes)
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMP WITH TIME ZONE -- Dùng cho soft delete
);

-- Bảng quiz: Lưu trữ thông tin về các bộ câu hỏi (quiz)
CREATE TABLE "quiz" (
    "quiz_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "lobby_video_json" JSONB,
    -- Thông tin video phòng chờ (ví dụ: link YouTube, cài đặt)
    "countdown_timer" INTEGER NOT NULL DEFAULT 5000,
    -- Thời gian đếm ngược trước mỗi câu hỏi (ms)
    "question_count" INTEGER NOT NULL DEFAULT 0,
    "play_count" INTEGER NOT NULL DEFAULT 0,
    -- Số lượt chơi
    "favorite_count" INTEGER NOT NULL DEFAULT 0,
    -- Số lượt yêu thích
    "status" VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    -- Trạng thái: 'DRAFT', 'PUBLISHED', 'ARCHIVED'
    "visibility" INTEGER NOT NULL DEFAULT 0,
    -- Chế độ hiển thị: 0 - 'PRIVATE', 1 - 'PUBLIC'
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "modified_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "deleted_at" TIMESTAMP WITH TIME ZONE,
    -- Dùng cho soft delete
    "cover_image_id" UUID REFERENCES "image_storage"("image_id") ON DELETE
    SET
        NULL,
        -- Ảnh bìa
        "creator_id" UUID NOT NULL REFERENCES "user_account"("user_id") ON DELETE CASCADE -- Người tạo quiz (CASCADE nếu user bị xóa thì quiz cũng bị xóa)
);

-- Bảng game_session: Theo dõi các phiên chơi quiz
CREATE TABLE "game_session" (
    "session_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- ID duy nhất cho mỗi phiên chơi
    "game_pin" VARCHAR(20) NOT NULL UNIQUE,
    -- Mã PIN để người chơi tham gia (cần UNIQUE khi active)
    "host_id" UUID NOT NULL REFERENCES "user_account"("user_id") ON DELETE CASCADE,
    -- Người tổ chức phiên chơi
    "quiz_id" UUID NOT NULL REFERENCES "quiz"("quiz_id") ON DELETE CASCADE,
    -- Quiz đang được chơi
    "started_at" TIMESTAMP WITH TIME ZONE,
    -- Thời điểm bắt đầu phiên chơi
    "ended_at" TIMESTAMP WITH TIME ZONE,
    -- Thời điểm kết thúc
    "game_type" VARCHAR(50) NOT NULL DEFAULT 'LIVE',
    -- Kiểu chơi: 'LIVE', 'ASSIGNMENT', etc.
    "player_count" INTEGER NOT NULL DEFAULT 0,
    -- Số người chơi hiện tại/tối đa (tùy logic)
    "status" VARCHAR(50) NOT NULL DEFAULT 'LOBBY',
    -- Trạng thái: 'LOBBY', 'RUNNING', 'ENDED', 'ABORTED'
    "allow_late_join" BOOLEAN NOT NULL DEFAULT TRUE,
    -- Cho phép người chơi vào muộn không?
    "power_ups_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
    -- Power-ups có được bật không?
    "termination_reason" TEXT,
    -- Lý do kết thúc sớm (nếu có)
    "termination_slide_index" INTEGER,
    -- Index của slide khi kết thúc sớm
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Bảng player: Theo dõi người chơi trong một game_session
CREATE TABLE "player" (
    "player_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "nickname" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'JOINING',
    -- Trạng thái: 'JOINING', 'PLAYING', 'FINISHED', 'KICKED'
    "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "join_slide_index" INTEGER,
    -- Slide index lúc người chơi tham gia (nếu vào muộn)
    "waiting_since" TIMESTAMP WITH TIME ZONE,
    -- Thời điểm bắt đầu chờ (nếu có)
    "rank" INTEGER,
    -- Thứ hạng cuối cùng
    "total_score" INTEGER NOT NULL DEFAULT 0,
    "correct_answers" INTEGER NOT NULL DEFAULT 0,
    -- Số câu trả lời đúng
    "streak_count" INTEGER NOT NULL DEFAULT 0,
    -- Chuỗi trả lời đúng hiện tại
    "answer_count" INTEGER NOT NULL DEFAULT 0,
    -- Tổng số câu đã trả lời
    "unanswered_count" INTEGER NOT NULL DEFAULT 0,
    -- Số câu không trả lời
    "avatar_id" UUID REFERENCES "avatar"("avatar_id") ON DELETE
    SET
        NULL,
        -- Avatar người chơi chọn
        "total_time" BIGINT NOT NULL DEFAULT 0,
        -- Tổng thời gian trả lời (ms)
        "average_time" INTEGER,
        -- Thời gian trả lời trung bình (ms)
        "device_info_json" JSONB,
        -- Thông tin thiết bị (user agent, etc.)
        "last_activity_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        -- Hoạt động cuối cùng
        "client_id" VARCHAR(255) NOT NULL,
        -- ID định danh client trong phiên (ví dụ: socket ID)
        "user_id" UUID REFERENCES "user_account"("user_id") ON DELETE
    SET
        NULL,
        -- Liên kết với tài khoản người dùng (nếu đăng nhập)
        "session_id" UUID NOT NULL REFERENCES "game_session"("session_id") ON DELETE CASCADE -- Phiên chơi mà người chơi tham gia (CASCADE nếu session bị xóa)
        -- Đảm bảo mỗi client_id là duy nhất trong một session
        -- UNIQUE ("session_id", "client_id"),
        -- Đảm bảo nickname là duy nhất trong một session (tùy chọn, có thể cần logic kiểm tra phức tạp hơn)
        -- UNIQUE ("session_id", "nickname")
);

-- Index để tăng tốc độ tìm kiếm player theo client_id và session_id
-- CREATE INDEX "idx_player_client_session" ON "player" ("client_id", "session_id");
-- Bảng power_up: Định nghĩa các loại power-up
CREATE TABLE "power_up" (
    "power_up_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "icon_file_path" VARCHAR(512),
    -- Đường dẫn đến file icon
    "name" VARCHAR(100) NOT NULL UNIQUE,
    "description" TEXT NOT NULL,
    "power_up_type" VARCHAR(50) NOT NULL,
    -- Loại power-up: 'DOUBLE_POINTS', 'REMOVE_OPTION', 'IMMUNITY', etc.
    "effect_value_json" JSONB NOT NULL,
    -- Mô tả hiệu ứng (ví dụ: {"multiplier": 2}, {"options_to_remove": 1})
    "achievement_condition" TEXT,
    -- Điều kiện để nhận được (ví dụ: '3 correct answers in a row')
    "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "deleted_at" TIMESTAMP WITH TIME ZONE -- Dùng cho soft delete
);

-- Bảng tag: Lưu trữ các thẻ (tag) để phân loại quiz
CREATE TABLE "tag" (
    "tag_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL UNIQUE,
    -- Tên tag phải là duy nhất
    "description" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "deleted_at" TIMESTAMP WITH TIME ZONE -- Dùng cho soft delete
);

-- Bảng quiz_tag: Bảng liên kết giữa quiz và tag (quan hệ nhiều-nhiều)
CREATE TABLE "quiz_tag" (
    "quiz_tag_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "quiz_id" UUID NOT NULL REFERENCES "quiz"("quiz_id") ON DELETE CASCADE,
    "tag_id" UUID NOT NULL REFERENCES "tag"("tag_id") ON DELETE CASCADE,
    -- Đảm bảo một quiz không bị gắn cùng một tag nhiều lần
    UNIQUE ("quiz_id", "tag_id")
);

-- Index để tăng tốc độ truy vấn liên kết quiz-tag
-- CREATE INDEX "idx_quiz_tag_quiz" ON "quiz_tag" ("quiz_id");
-- CREATE INDEX "idx_quiz_tag_tag" ON "quiz_tag" ("tag_id");
-- Bảng question: Lưu trữ chi tiết từng câu hỏi trong một quiz
CREATE TABLE "question" (
    "question_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "question_text" TEXT NOT NULL,
    "quiz_id" UUID NOT NULL REFERENCES "quiz"("quiz_id") ON DELETE CASCADE,
    -- Thuộc quiz nào
    "question_type" VARCHAR(50) NOT NULL,
    -- Loại câu hỏi: 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'TEXT_INPUT', 'SLIDER', etc.
    "answer_data_json" JSONB NOT NULL,
    -- Dữ liệu câu trả lời (các lựa chọn, đáp án đúng, khoảng giá trị, etc.)
    "explanation" TEXT,
    -- Giải thích đáp án đúng
    "fun_fact" TEXT,
    -- Thông tin thú vị liên quan
    "video_content_json" JSONB,
    -- Thông tin video nhúng (nếu có)
    "points_multiplier" INTEGER NOT NULL DEFAULT 1,
    -- Hệ số nhân điểm (ví dụ: 0, 1, 2)
    "time_limit" INTEGER NOT NULL DEFAULT 20000,
    -- Thời gian trả lời (ms)
    "position" INTEGER NOT NULL,
    -- Vị trí câu hỏi trong quiz (thứ tự)
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "deleted_at" TIMESTAMP WITH TIME ZONE,
    -- Dùng cho soft delete
    "image_id" UUID REFERENCES "image_storage"("image_id") ON DELETE
    SET
        NULL -- Ảnh minh họa cho câu hỏi
);

-- Index để tăng tốc độ truy vấn câu hỏi theo quiz_id và position
-- CREATE INDEX "idx_question_quiz_position" ON "question" ("quiz_id", "position");
-- Bảng game_slide: Đại diện cho một "màn hình" trong phiên chơi (có thể là câu hỏi, bảng xếp hạng,...)
CREATE TABLE "game_slide" (
    "slide_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "session_id" UUID NOT NULL REFERENCES "game_session"("session_id") ON DELETE CASCADE,
    -- Thuộc phiên chơi nào
    "slide_index" INTEGER NOT NULL,
    -- Thứ tự của slide trong phiên chơi
    "slide_type" VARCHAR(50) NOT NULL,
    -- Loại slide: 'QUESTION', 'LEADERBOARD', 'INTRODUCTION', 'RESULTS'
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    -- Trạng thái: 'PENDING', 'ACTIVE', 'ENDED', 'SKIPPED'
    "started_at" TIMESTAMP WITH TIME ZONE,
    -- Thời điểm bắt đầu hiển thị slide
    "ended_at" TIMESTAMP WITH TIME ZONE,
    -- Thời điểm kết thúc hiển thị slide
    "question_distribution_json" JSONB,
    -- Dữ liệu gốc về câu hỏi được chơi trong hiên này (nếu là slide câu hỏi)
    "original_question_id" UUID REFERENCES "question"("question_id") ON DELETE
    SET
        NULL,
        -- Liên kết đến câu hỏi gốc (nếu là slide câu hỏi)
        -- Đảm bảo thứ tự slide là duy nhất trong một session
        UNIQUE ("session_id", "slide_index")
);

-- Index để tăng tốc độ truy vấn slide theo session_id và slide_index
-- CREATE INDEX "idx_game_slide_session_index" ON "game_slide" ("session_id", "slide_index");
-- Bảng sound: Lưu trữ thông tin về các file âm thanh (nhạc nền, hiệu ứng)
CREATE TABLE "sound" (
    "sound_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(100) NOT NULL UNIQUE,
    "description" TEXT,
    "sound_type" VARCHAR(50) NOT NULL,
    "file_path" VARCHAR(512) NOT NULL UNIQUE,
    -- Đường dẫn đến file âm thanh
    "duration" INTEGER NOT NULL,
    -- Thời lượng (giây)
    "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "deleted_at" TIMESTAMP WITH TIME ZONE -- Dùng cho soft delete
);

-- Bảng player_answer: Lưu trữ câu trả lời của từng người chơi cho mỗi slide câu hỏi
CREATE TABLE "player_answer" (
    "answer_id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "slide_id" UUID NOT NULL REFERENCES "game_slide"("slide_id") ON DELETE CASCADE,
    -- Trả lời cho slide nào
    "choice" VARCHAR(255),
    -- Lựa chọn của người chơi (ví dụ: index '0', '1' hoặc text)
    "text" TEXT,
    -- Nội dung text nếu là câu trả lời dạng text input
    "reaction_time_ms" INTEGER NOT NULL,
    -- Thời gian phản hồi (ms)
    "answer_timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    -- Thời điểm trả lời
    "status" VARCHAR(20) NOT NULL,
    -- Trạng thái: 'CORRECT', 'WRONG', 'TIMEOUT', 'PARTIAL'
    "base_points" INTEGER NOT NULL DEFAULT 0,
    -- Điểm gốc (trước khi nhân hệ số, power-up)
    "final_points" INTEGER NOT NULL DEFAULT 0,
    -- Điểm cuối cùng nhận được
    "used_power_up_id" UUID REFERENCES "power_up"("power_up_id") ON DELETE
    SET
        NULL,
        -- Power-up đã sử dụng (nếu có)
        "used_power_up_context_json" JSONB,
        -- Chi tiết về cách power-up ảnh hưởng đến câu trả lời này
        "player_id" UUID NOT NULL REFERENCES "player"("player_id") ON DELETE CASCADE,
        -- Người chơi nào đã trả lời
        -- Đảm bảo một người chơi chỉ trả lời một lần cho mỗi slide
        UNIQUE ("player_id", "slide_id")
);

-- Index để tăng tốc độ truy vấn câu trả lời theo player và slide
-- CREATE INDEX "idx_player_answer_player_slide" ON "player_answer" ("player_id", "slide_id");
-- Index để tăng tốc độ truy vấn câu trả lời theo slide (để tổng hợp kết quả)
-- CREATE INDEX "idx_player_answer_slide" ON "player_answer" ("slide_id");