// src/config/mockAuth.js
// ─────────────────────────────────────────────────────────────────────────
// MOCK AUTHENTICATION
// Used because Member 4 owns the real OAuth 2.0 / JWT implementation.
// The UUIDs below match the fixed UUIDs in seed_data_fixed.sql exactly.
//
// After running seed_data_fixed.sql, verify with:
//   SELECT user_id, email, role FROM users ORDER BY role;
//
// Override in .env.local if needed:
//   VITE_STUDENT_ID=<uuid>
//   VITE_ADMIN_ID=<uuid>
// ─────────────────────────────────────────────────────────────────────────

export const MOCK_USERS = [
    {
        id: import.meta.env.VITE_STUDENT_ID || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        email: 'student@campus.edu',
        name: 'Test Student',
        role: 'USER',
        department: 'Computing',
    },
    {
        id: import.meta.env.VITE_ADMIN_ID || 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        email: 'admin@campus.edu',
        name: 'Admin User',
        role: 'ADMIN',
        department: 'Administration',
    },
    {
        id: import.meta.env.VITE_ALICE_ID || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab',
        email: 'alice@campus.edu',
        name: 'Alice Chen',
        role: 'USER',
        department: 'Engineering',
    },
    {
        id: import.meta.env.VITE_TECH_ID || 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        email: 'tech@campus.edu',
        name: 'Tech Person',
        role: 'TECHNICIAN',
        department: 'Facilities',
    },
]