// Mock API response for GET /api/power-ups
// Exports an array of power-up objects based on the 'power_up' table schema.

const mockPowerUps = [
    {
        // Corresponds to 'power_up_id' UUID
        power_up_id: 'powerup-2x-uuid-p1o2',
        // Corresponds to 'name' VARCHAR(100) NOT NULL UNIQUE
        name: 'Double Points',
        // Corresponds to 'description' TEXT NOT NULL
        description: 'Earn twice the points for the next correct answer!',
        // Corresponds to 'icon_file_path' VARCHAR(512)
        icon_file_path: 'https://cf.quizizz.com/game/img/powerups/icons/2x.svg', // Example path relative to /public
        // Corresponds to 'power_up_type' VARCHAR(50) NOT NULL
        power_up_type: 'DOUBLE_POINTS',
        // Corresponds to 'effect_value_json' JSONB NOT NULL
        effect_value_json: { multiplier: 2 },
        // Corresponds to 'achievement_condition' TEXT
        achievement_condition: 'Answer 3 questions correctly in a row.',
        // Corresponds to 'is_active' BOOLEAN NOT NULL DEFAULT TRUE
        is_active: true,
        // Corresponds to 'created_at' TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        created_at: new Date('2024-03-01T10:00:00Z').toISOString(),
        // Corresponds to 'updated_at' TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        updated_at: new Date('2024-03-01T10:00:00Z').toISOString(),
        // Corresponds to 'deleted_at' TIMESTAMP WITH TIME ZONE
        deleted_at: null,
    },
    {
        power_up_id: 'powerup-5050-uuid-i3u4',
        name: '50/50',
        description: 'Remove two incorrect options from the next multiple-choice question.',
        icon_file_path: 'https://cf.quizizz.com/game/img/powerups/icons/50-50.svg',
        power_up_type: 'REMOVE_OPTION',
        effect_value_json: { options_to_remove: 2 },
        achievement_condition: null, // Maybe available by default or purchased
        is_active: true,
        created_at: new Date('2024-03-02T11:00:00Z').toISOString(),
        updated_at: new Date('2024-03-02T11:00:00Z').toISOString(),
        deleted_at: null,
    },
    {
        power_up_id: 'powerup-streak-bonus-uuid-y5t6',
        name: 'Streak Saver',
        description: 'Your answer streak won\'t reset if you get the next question wrong.',
        icon_file_path: 'https://cf.quizizz.com/game/img/powerups/icons/streak-saver.svg',
        power_up_type: 'STREAK_PROTECTION',
        effect_value_json: {}, // No specific value needed, type implies effect
        achievement_condition: 'Reach a 5-answer streak.',
        is_active: true,
        created_at: new Date('2024-03-03T12:00:00Z').toISOString(),
        updated_at: new Date('2024-03-03T12:00:00Z').toISOString(),
        deleted_at: null,
    },
    // Add more mock power-ups
];

export default mockPowerUps;