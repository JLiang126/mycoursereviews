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
        {
            label: 'Logout',
            href: '/logout',
        },
    ],
    links: {
        github: 'https://github.com/compsci-adl/mycoursereviews',
        website: 'https://csclub.org.au',
        discord: 'https://discord.gg/UjvVxHA',
        email: 'mailto:dev@csclub.org.au',
    },
};
