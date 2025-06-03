// Mock API response for GET /api/avatars
// Exports an array of avatar objects based on the 'avatar' table schema.

const mockAvatars = [
    {
        // Corresponds to 'avatar_id' UUID
        avatar_id: 'avatar-cat-uuid-9i8j',
        // Corresponds to 'name' VARCHAR(100) NOT NULL
        name: 'Cool Cat',
        // Corresponds to 'description' TEXT
        description: 'A cat wearing sunglasses.',
        // Corresponds to 'image_file_path' VARCHAR(512)
        image_file_path: 'https://cdn.quiz.com/avatar/cache/1719171b887e6afb618276d49f8ea4ba7e142251.svg', // Example path relative to /public
        // Corresponds to 'is_active' BOOLEAN NOT NULL DEFAULT TRUE
        is_active: true,
        // Corresponds to 'created_at' TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        created_at: new Date('2024-02-01T10:00:00Z').toISOString(),
        // Corresponds to 'updated_at' TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        updated_at: new Date('2024-02-01T10:00:00Z').toISOString(),
        // Corresponds to 'deleted_at' TIMESTAMP WITH TIME ZONE
        deleted_at: null,
    },
    {
        avatar_id: 'avatar-robot-uuid-7k6l',
        name: 'Retro Robot',
        description: 'A friendly retro robot.',
        image_file_path: 'https://cdn.quiz.com/avatar/cache/8bfd517fb8b26f3362e3266e34efc576c8fcd1e6.svg',
        is_active: true,
        created_at: new Date('2024-02-02T11:00:00Z').toISOString(),
        updated_at: new Date('2024-02-02T11:00:00Z').toISOString(),
        deleted_at: null,
    },
    {
        avatar_id: 'avatar-dog-uuid-5m4n',
        name: 'Happy Dog',
        description: 'A smiling golden retriever.',
        image_file_path: 'https://cdn.quiz.com/avatar/cache/8db72dd1ded143c6e3064fcee7c78a474fda60ef.svg',
        is_active: true,
        created_at: new Date('2024-02-03T12:00:00Z').toISOString(),
        updated_at: new Date('2024-02-03T12:00:00Z').toISOString(),
        deleted_at: null,
    },
    {
        avatar_id: 'avatar-dog-2-uuid-5m4n',
        name: 'Happy Dog',
        description: 'A smiling golden retriever.',
        image_file_path: 'https://cdn.quiz.com/avatar/cache/3d621a14236d3691ce06d03b3abee8e26bf0d616.svg',
        is_active: true,
        created_at: new Date('2024-02-03T12:00:00Z').toISOString(),
        updated_at: new Date('2024-02-03T12:00:00Z').toISOString(),
        deleted_at: null,
    },
    {
        avatar_id: 'avatar-dog-3-uuid-5m4n',
        name: 'Avatar 04',
        description: 'A smiling golden retriever.',
        image_file_path: 'https://cdn.quiz.com/avatar/cache/addb79d8a2fa77284ecef5f44915c94f680a50e6.svg',
        is_active: true,
        created_at: new Date('2024-02-03T12:00:00Z').toISOString(),
        updated_at: new Date('2024-02-03T12:00:00Z').toISOString(),
        deleted_at: null,
    },
    // Add more mock avatars
];

export default mockAvatars;