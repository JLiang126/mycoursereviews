'use client';

import {
    Button,
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    NavbarMenu,
    NavbarMenuItem,
    NavbarMenuToggle,
    Tooltip,
} from '@heroui/react';
import { clsx } from 'clsx';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { FaMoon, FaSignInAlt, FaSignOutAlt, FaSun } from 'react-icons/fa';

import { siteConfig } from '@/config/site';

export const Header = () => {
    const { theme, setTheme } = useTheme();
    const { data: session, status } = useSession();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, []);

    const isActive = (path: string) => pathname === path;

    // Decodes Keycloak JWT accessToken client-side to verify committee role (exact CS Club standard)
    const isAdmin = () => {
        if (!session?.accessToken) return false;
        try {
            const decodedToken = JSON.parse(atob(session.accessToken.split('.')[1]));
            // Check roles mapped either in realm_access or the global roles claim
            const realmAccessRoles = decodedToken?.realm_access?.roles || [];
            const tokenRoles = decodedToken?.roles || [];
            return realmAccessRoles.includes('committee') || tokenRoles.includes('committee');
        } catch {
            return false;
        }
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <Navbar
            isBordered
            isMenuOpen={isMenuOpen}
            onMenuOpenChange={setIsMenuOpen}
            maxWidth="xl"
            className="bg-background/70 backdrop-blur-md sticky top-0 z-50"
        >
            {/* Mobile Toggle Button */}
            <NavbarContent className="sm:hidden" justify="start">
                <NavbarMenuToggle aria-label={isMenuOpen ? 'Close menu' : 'Open menu'} />
            </NavbarContent>

            {/* Logo and Brand */}
            <NavbarContent justify="start">
                <NavbarBrand as={Link} href="/" className="flex items-center gap-2.5 cursor-pointer">
                    <img
                        src="/favicon.svg"
                        alt="CS Club Logo"
                        className="w-7 h-7 hover:rotate-12 transition-transform duration-300"
                    />
                    <h1 className="font-extrabold text-inherit tracking-tight text-lg">MyCourseReviews</h1>
                </NavbarBrand>
            </NavbarContent>

            {/* Desktop Navigation Links */}
            <NavbarContent className="hidden sm:flex gap-6" justify="center">
                {siteConfig.navItems.map((item) => {
                    // Hide admin links fully from standard users
                    if (item.href === '/admin' && !isAdmin()) return null;

                    return (
                        <NavbarItem key={item.href}>
                            <Link
                                href={item.href}
                                className={clsx(
                                    'transition-colors duration-200 font-medium text-sm hover:text-primary',
                                    isActive(item.href) ? 'text-primary border-b-2 border-primary pb-1' : 'text-foreground/80'
                                )}
                            >
                                {item.label}
                            </Link>
                        </NavbarItem>
                    );
                })}
            </NavbarContent>

            {/* Authentication and Styling Toggles */}
            <NavbarContent justify="end" className="flex items-center gap-3">
                {/* Theme Toggle Button */}
                <NavbarItem>
                    <Tooltip content={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'} size="sm">
                        <Button
                            isIconOnly
                            variant="flat"
                            color="default"
                            size="sm"
                            onPress={toggleTheme}
                            className="bg-default-100 hover:bg-default-200 text-lg rounded-full"
                        >
                            <span>
                                {mounted && theme === 'dark' ? <FaSun className="text-yellow-400" /> : <FaMoon className="text-primary" />}
                            </span>
                        </Button>
                    </Tooltip>
                </NavbarItem>

                {/* NextAuth Login/Logout Buttons */}
                <NavbarItem>
                    {mounted && status !== 'loading' ? (
                        session ? (
                            <Tooltip content={`Logged in as ${session.user.name}`} size="sm">
                                <Button
                                    size="sm"
                                    color="primary"
                                    variant="flat"
                                    onPress={() => signOut({ callbackUrl: '/' })}
                                    startContent={<FaSignOutAlt />}
                                    className="font-semibold text-white"
                                >
                                    Logout
                                </Button>
                            </Tooltip>
                        ) : (
                            <Button
                                size="sm"
                                color="primary"
                                onPress={() => signIn('keycloak')}
                                startContent={<FaSignInAlt />}
                                className="font-semibold text-white"
                            >
                                Login
                            </Button>
                        )
                    ) : (
                        <div className="h-8 w-20 bg-default-100/50 animate-pulse rounded-xl border border-divider/20" />
                    )}
                </NavbarItem>
            </NavbarContent>

            {/* Mobile Navigation Drawer */}
            <NavbarMenu className="bg-background/90 backdrop-blur-md pt-6 gap-4">
                {siteConfig.navMenuItems.map((item) => {
                    if (item.href === '/admin' && !isAdmin()) return null;
                    if (item.href === '/logout') {
                        if (!session) return null;
                        return (
                            <NavbarMenuItem key={item.href}>
                                <Button
                                    fullWidth
                                    color="danger"
                                    variant="flat"
                                    onPress={() => {
                                        setIsMenuOpen(false);
                                        signOut({ callbackUrl: '/' });
                                    }}
                                    startContent={<FaSignOutAlt />}
                                >
                                    Logout
                                </Button>
                            </NavbarMenuItem>
                        );
                    }

                    return (
                        <NavbarMenuItem key={item.href}>
                            <Link
                                href={item.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={clsx(
                                    'w-full block py-2 text-base font-semibold transition-colors',
                                    isActive(item.href) ? 'text-primary' : 'text-foreground hover:text-primary'
                                )}
                            >
                                {item.label}
                            </Link>
                        </NavbarMenuItem>
                    );
                })}
            </NavbarMenu>
        </Navbar>
    );
};
