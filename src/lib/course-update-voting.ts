// Shared constants and types for course update voting — importable from both server and client code

export const DEFAULT_LAST_UPDATE = 'Semester 1, 2026';

export const UPDATE_TERM_OPTIONS = [
    'Semester 1, 2026',
    'Semester 2, 2026',
    'Summer School, 2026',
    'Winter School, 2026',
    'Semester 2, 2025',
    'Semester 1, 2025',
    'Summer School, 2025',
    'Winter School, 2025',
    'Semester 2, 2024',
    'Semester 1, 2024',
    'Semester 2, 2023',
    'Semester 1, 2023',
    'Semester 2, 2022',
    'Semester 1, 2022',
];

export interface UpdateVoteData {
    consensusTerm: string;
    confirmCount: number;
    disputeCount: number;
    currentUserVote: string | null;
    totalVotes: number;
}
