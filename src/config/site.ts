export type SiteConfig = typeof siteConfig;

export const siteConfig = {
    name: 'MyCourseReviews',
    description: 'Student-run course rating and reviews platform for Adelaide University, built by the CS Club.',
    navItems: [
        {
            label: 'Admin',
            href: '/admin',
        },
    ],
    navMenuItems: [
        {
            label: 'Admin',
            href: '/admin',
        },
    ],
    links: {
        github: 'https://github.com/compsci-adl/mycoursereviews',
        website: 'https://csclub.org.au',
        discord: 'https://discord.gg/UjvVxHA',
        email: 'mailto:dev@csclub.org.au',
    },
};

export const TERMS_OPTIONS = [
    'Semester 1, 2026',
    'Semester 2, 2026',
    'Summer School, 2026',
    'Winter School, 2026',
    'Semester 1, 2025',
    'Semester 2, 2025',
    'Summer School, 2025',
    'Winter School, 2025',
    'Semester 1, 2024',
    'Semester 2, 2024',
    'Semester 1, 2023',
    'Semester 2, 2023',
];

export const GRADE_OPTIONS = [
    { value: 'HD', label: 'High Distinction (HD)' },
    { value: 'D', label: 'Distinction (D)' },
    { value: 'C', label: 'Credit (C)' },
    { value: 'P', label: 'Pass (P)' },
    { value: 'F', label: 'Fail (F)' },
    { value: 'WNF', label: 'Withdraw No Fail (WNF)' },
    { value: 'INC', label: 'Incomplete (INC)' },
    { value: 'WDN', label: 'Withdrawn (WDN)' },
];
