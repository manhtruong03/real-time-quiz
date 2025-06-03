// Mock API response for GET /api/sounds
// Exports an array of sound objects based on the 'sound' table schema.

const mockSounds = [
    {
        // Corresponds to 'sound_id' UUID
        sound_id: 'sound-lobby-8bit-uuid-a1b2',
        // Corresponds to 'name' VARCHAR(100) NOT NULL UNIQUE
        name: '8-bit',
        // Corresponds to 'description' TEXT
        description: 'Relaxing music for the game lobby.',
        // Corresponds to 'sound_type' VARCHAR(50) NOT NULL
        sound_type: 'LOBBY', // Distinguishes lobby sounds
        // Corresponds to 'file_path' VARCHAR(512) NOT NULL UNIQUE
        file_path: 'https://assets-cdn.kahoot.it/player/v2/assets/lobby-8bit-DdRVkA1s.webm', // Example path relative to /public
        // Corresponds to 'duration' INTEGER NOT NULL (seconds)
        duration: 64,
        // Corresponds to 'is_active' BOOLEAN NOT NULL DEFAULT TRUE
        is_active: true,
        // Corresponds to 'created_at' TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        created_at: new Date('2024-01-10T10:00:00Z').toISOString(),
        // Corresponds to 'updated_at' TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        updated_at: new Date('2024-01-10T10:00:00Z').toISOString(),
        // Corresponds to 'deleted_at' TIMESTAMP WITH TIME ZONE
        deleted_at: null,
    },
    {
        // Corresponds to 'sound_id' UUID
        sound_id: 'sound-lobby-80svibe-uuid-a1b2',
        // Corresponds to 'name' VARCHAR(100) NOT NULL UNIQUE
        name: '80s vibe',
        // Corresponds to 'description' TEXT
        description: 'Relaxing music for the game lobby.',
        // Corresponds to 'sound_type' VARCHAR(50) NOT NULL
        sound_type: 'LOBBY', // Distinguishes lobby sounds
        // Corresponds to 'file_path' VARCHAR(512) NOT NULL UNIQUE
        file_path: 'https://assets-cdn.kahoot.it/player/v2/assets/lobby-80svibe-Dw0kzWWM.webm', // Example path relative to /public
        // Corresponds to 'duration' INTEGER NOT NULL (seconds)
        duration: 94,
        // Corresponds to 'is_active' BOOLEAN NOT NULL DEFAULT TRUE
        is_active: true,
        // Corresponds to 'created_at' TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        created_at: new Date('2024-01-10T10:00:00Z').toISOString(),
        // Corresponds to 'updated_at' TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        updated_at: new Date('2024-01-10T10:00:00Z').toISOString(),
        // Corresponds to 'deleted_at' TIMESTAMP WITH TIME ZONE
        deleted_at: null,
    },

    {
        // Corresponds to 'sound_id' UUID
        sound_id: 'sound-lobby-indiepop-uuid-a1b2',
        // Corresponds to 'name' VARCHAR(100) NOT NULL UNIQUE
        name: 'Indie pop',
        // Corresponds to 'description' TEXT
        description: 'Relaxing music for the game lobby.',
        // Corresponds to 'sound_type' VARCHAR(50) NOT NULL
        sound_type: 'LOBBY', // Distinguishes lobby sounds
        // Corresponds to 'file_path' VARCHAR(512) NOT NULL UNIQUE
        file_path: 'https://assets-cdn.kahoot.it/player/v2/assets/lobby-indiepop-Cgxa6yth.webm', // Example path relative to /public
        // Corresponds to 'duration' INTEGER NOT NULL (seconds)
        duration: 65,
        // Corresponds to 'is_active' BOOLEAN NOT NULL DEFAULT TRUE
        is_active: true,
        // Corresponds to 'created_at' TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        created_at: new Date('2024-01-10T10:00:00Z').toISOString(),
        // Corresponds to 'updated_at' TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        updated_at: new Date('2024-01-10T10:00:00Z').toISOString(),
        // Corresponds to 'deleted_at' TIMESTAMP WITH TIME ZONE
        deleted_at: null,
    },
    {
        sound_id: 'alt02-answer_020sec-uuid-e5f6',
        name: 'Question Timer 02',
        description: 'Question Timer.',
        sound_type: 'QUESTION_TIMER', // Distinguishes result sounds
        file_path: 'https://assets-cdn.kahoot.it/player/v2/assets/alt02-answer_020sec-BWxIpQoj.webm',
        duration: 22,
        is_active: true,
        created_at: new Date('2024-01-12T12:00:00Z').toISOString(),
        updated_at: new Date('2024-01-12T12:00:00Z').toISOString(),
        deleted_at: null,
    },
    {
        sound_id: 'alt03-answer_020sec-uuid-g7h8',
        name: 'Question Timer 03',
        description: 'Question Timer.',
        sound_type: 'QUESTION_TIMER',
        file_path: 'https://assets-cdn.kahoot.it/player/v2/assets/alt03-answer_020sec-DuzNGihB.webm',
        duration: 21,
        is_active: true,
        created_at: new Date('2024-01-13T13:00:00Z').toISOString(),
        updated_at: new Date('2024-01-13T13:00:00Z').toISOString(),
        deleted_at: null,
    },
    // Add more mock sounds (different lobby tracks, other timer sounds, etc.)
];

export default mockSounds;