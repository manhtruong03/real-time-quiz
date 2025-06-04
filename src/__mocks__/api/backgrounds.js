// Mock API response for GET /api/backgrounds
// Exports an array of background objects based on the 'theme' table schema.

const mockBackgrounds = [
    {
        background_id: 'bg-spring-uuid-3cd4',
        name: 'Spring',
        description: 'Spring',
        background_file_path: 'https://images-cdn.kahoot.it/a5e3658b-748d-43b9-8555-0f1d5f983372',
        background_color: '#e2223f',
        text_color: '#FFFFFF',
        is_active: true,
        created_at: new Date('2024-01-02T11:00:00Z').toISOString(),
        updated_at: new Date('2024-01-02T11:00:00Z').toISOString(),
        deleted_at: null,
    },
    {
        // Corresponds to 'theme_id' UUID, ensure it's a unique string
        background_id: 'bg-surfer-santa-uuid-1ab2',
        // Corresponds to 'name' VARCHAR(100) NOT NULL
        name: 'Surfer Santa',
        // Corresponds to 'description' TEXT
        description: 'Surfer Santa background.',
        // Corresponds to 'background_file_path' VARCHAR(512)
        background_file_path: 'https://images-cdn.kahoot.it/25dadfc9-075b-4a49-9192-b63009ca57b6', // Example path relative to /public
        // Corresponds to 'background_color' VARCHAR(30)
        background_color: '#247676',
        // Corresponds to 'text_color' VARCHAR(30)
        text_color: '#FFFFFF',
        // Corresponds to 'is_active' BOOLEAN NOT NULL DEFAULT TRUE
        is_active: true,
        // Corresponds to 'created_at' TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        created_at: new Date('2024-01-01T10:00:00Z').toISOString(),
        // Corresponds to 'updated_at' TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        updated_at: new Date('2024-01-01T10:00:00Z').toISOString(),
        // Corresponds to 'deleted_at' TIMESTAMP WITH TIME ZONE
        deleted_at: null,
    },
    {
        background_id: 'bg-summer-games-uuid-3cd4',
        name: 'Summer Games',
        description: 'Summer Games',
        background_file_path: 'https://images-cdn.kahoot.it/01b501f4-37bc-4c21-8d24-f668c10376f4',
        background_color: '#e2223f',
        text_color: '#FFFFFF',
        is_active: true,
        created_at: new Date('2024-01-02T11:00:00Z').toISOString(),
        updated_at: new Date('2024-01-02T11:00:00Z').toISOString(),
        deleted_at: null,
    },
    {
        background_id: 'bg-space-uuid-3cd4',
        name: 'Space',
        description: 'Space',
        background_file_path: 'https://images-cdn.kahoot.it/5231455b-3de7-4703-a4c5-cb9c44156e27',
        background_color: '#e2223f',
        text_color: '#FFFFFF',
        is_active: true,
        created_at: new Date('2024-01-02T11:00:00Z').toISOString(),
        updated_at: new Date('2024-01-02T11:00:00Z').toISOString(),
        deleted_at: null,
    },
    {
        background_id: 'bg-autumn-uuid-3cd4',
        name: 'Autumn',
        description: 'Autumn',
        background_file_path: 'https://images-cdn.kahoot.it/01015166-e2b7-4d09-ab1a-244f0958e8a1',
        background_color: '#e2223f',
        text_color: '#FFFFFF',
        is_active: true,
        created_at: new Date('2024-01-02T11:00:00Z').toISOString(),
        updated_at: new Date('2024-01-02T11:00:00Z').toISOString(),
        deleted_at: null,
    },
    {
        background_id: 'bg-summer-uuid-3cd4',
        name: 'Summer',
        description: 'Summer',
        background_file_path: 'https://images-cdn.kahoot.it/de259c10-95b6-401f-87cf-eb81d3f4dc3a',
        background_color: '#e2223f',
        text_color: '#FFFFFF',
        is_active: true,
        created_at: new Date('2024-01-02T11:00:00Z').toISOString(),
        updated_at: new Date('2024-01-02T11:00:00Z').toISOString(),
        deleted_at: null,
    },
    // Add more mock backgrounds as needed
];

export default mockBackgrounds;