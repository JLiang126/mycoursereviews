'use client';

import {
    Button,
    Modal,
    ModalBody,
    ModalContent,
    ModalHeader,
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    NavbarMenu,
    NavbarMenuItem,
    NavbarMenuToggle,
    Tooltip,
} from '@heroui/react';
import { env } from '@/env.mjs';
import { clsx } from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { FaMoon, FaSignInAlt, FaSignOutAlt, FaSun, FaQuestion, FaCommentAlt, FaBookOpen, FaClipboardList } from 'react-icons/fa';

import { siteConfig } from '@/config/site';

export const Header = () => {
    const { theme, setTheme } = useTheme();
    const { data: session, status } = useSession();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [guideStep, setGuideStep] = useState(0);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
        // Auto-show guide on first visit
        const hasSeen = localStorage.getItem('hasSeenGuide');
        if (!hasSeen) {
            setIsGuideOpen(true);
        }
    }, []);

    const closeGuide = () => {
        setIsGuideOpen(false);
        localStorage.setItem('hasSeenGuide', 'true');
    };

    const feedbackUrl = env.NEXT_PUBLIC_FEEDBACK_FORM_URL || 'https://forms.gle/4k5Y413Z';

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
            maxWidth="xl"
            className="bg-background border-b-4 border-foreground sticky top-0 z-50 py-1"
            isMenuOpen={isMenuOpen}
            onMenuOpenChange={setIsMenuOpen}
        >
            {/* Logo and Brand */}
            <NavbarContent justify="start">
                <NavbarBrand as={Link} href="/" className="flex items-center gap-2.5 cursor-pointer select-none">
                    <Image src="/favicon.png" alt="MyCourseReviews Logo" width={32} height={32} priority unoptimized className="hover:rotate-12 transition-transform duration-300 select-none" />
                    <h1 className="font-mixtape tracking-tighter text-base sm:text-xl font-black text-foreground select-none">
                        MyCourseReviews
                    </h1>
                </NavbarBrand>
            </NavbarContent>

            {/* Desktop Navigation Links */}
            <NavbarContent className="hidden sm:flex gap-4" justify="center">
                {siteConfig.navItems.map((item) => {
                    if (item.href === '/admin' && !isAdmin()) return null;

                    const active = isActive(item.href);
                    return (
                        <NavbarItem key={item.href}>
                            <Link
                                href={item.href}
                                className={clsx(
                                    'font-mono tracking-wide text-xs uppercase font-extrabold px-3 py-1.5 border-2 border-foreground transition-all duration-200 rounded-none flex items-center gap-2',
                                    active 
                                        ? item.href === '/courses'
                                            ? 'bg-yellow text-black shadow-[3px_3px_0px_0px_#000]'
                                            : item.href === '/'
                                                ? 'bg-blue text-white shadow-[3px_3px_0px_0px_#000]'
                                                : 'bg-foreground text-background shadow-[3px_3px_0px_0px_#000]'
                                        : 'bg-background text-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] hover:bg-yellow hover:text-black hover:shadow-[4px_4px_0px_0px_#000] dark:hover:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                                )}
                            >
                                {item.href === '/courses' && <FaBookOpen className="text-sm shrink-0" />}
                                <span>{item.label}</span>
                            </Link>
                        </NavbarItem>
                    );
                })}
                {mounted && session && (
                    <NavbarItem key="/my-reviews">
                        <Link
                            href="/my-reviews"
                            className={clsx(
                                'font-mono tracking-wide text-xs uppercase font-extrabold px-3 py-1.5 border-2 border-foreground transition-all duration-200 rounded-none flex items-center gap-2',
                                isActive('/my-reviews')
                                    ? 'bg-red text-white shadow-[3px_3px_0px_0px_#000]' 
                                    : 'bg-background text-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] hover:bg-yellow hover:text-black hover:shadow-[4px_4px_0px_0px_#000] dark:hover:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                            )}
                        >
                            <FaClipboardList className="text-sm shrink-0" />
                            <span>My Reviews</span>
                        </Link>
                    </NavbarItem>
                )}
            </NavbarContent>

            {/* Action Toolbar (Toggles, Guides, Auth) */}
            <NavbarContent justify="end" className="flex items-center gap-2.5 sm:gap-3">
                {/* How to Use Icon Button (Desktop-only) */}
                <NavbarItem className="hidden sm:block">
                    <Tooltip 
                        content="How to Use Guide" 
                        size="sm"
                        radius="none"
                        classNames={{
                            content: "rounded-none border-2 border-foreground bg-background text-foreground font-mono text-2xs font-extrabold uppercase shadow-[2px_2px_0px_0px_#000] px-2 py-1"
                        }}
                    >
                        <Button
                            isIconOnly
                            variant="flat"
                            color="default"
                            aria-label="How to Use Guide"
                            onPress={() => {
                                setGuideStep(0);
                                setIsGuideOpen(true);
                            }}
                            className="bg-background border-2 border-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] text-sm rounded-none transition-all duration-200 h-9 w-9 min-w-9 p-0 flex items-center justify-center cursor-pointer text-foreground shrink-0"
                        >
                            <FaQuestion />
                        </Button>
                    </Tooltip>
                </NavbarItem>

                {/* Feedback Icon Button (Desktop-only) */}
                <NavbarItem className="hidden sm:block">
                    <Tooltip 
                        content="Give Feedback" 
                        size="sm"
                        radius="none"
                        classNames={{
                            content: "rounded-none border-2 border-foreground bg-background text-foreground font-mono text-2xs font-extrabold uppercase shadow-[2px_2px_0px_0px_#000] px-2 py-1"
                        }}
                    >
                        <a
                            href={feedbackUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Give Feedback"
                            className="bg-background border-2 border-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] text-sm rounded-none transition-all duration-200 h-9 w-9 min-w-9 p-0 flex items-center justify-center text-foreground hover:bg-secondary cursor-pointer shrink-0"
                        >
                            <FaCommentAlt />
                        </a>
                    </Tooltip>
                </NavbarItem>

                {/* Theme Toggle Button (Desktop-only) */}
                <NavbarItem className="hidden sm:block">
                    <Tooltip 
                        content={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'} 
                        size="sm"
                        radius="none"
                        classNames={{
                            content: "rounded-none border-2 border-foreground bg-background text-foreground font-mono text-2xs font-extrabold uppercase shadow-[2px_2px_0px_0px_#000] px-2 py-1"
                        }}
                    >
                        <Button
                            isIconOnly
                            variant="flat"
                            color="default"
                            onPress={toggleTheme}
                            className="bg-background border-2 border-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] text-lg rounded-none transition-all duration-200 h-9 w-9 min-w-9 p-0 flex items-center justify-center shrink-0"
                        >
                            <span>
                                {mounted && theme === 'dark' ? <FaSun className="text-white" /> : <FaMoon className="text-foreground" />}
                            </span>
                        </Button>
                    </Tooltip>
                </NavbarItem>

                {/* NextAuth Login/Logout Buttons (Desktop-only) */}
                <NavbarItem className="hidden sm:block">
                    {mounted && status !== 'loading' ? (
                        session ? (
                            <Tooltip 
                                content={`Logged in as ${session.user.name}`} 
                                size="sm"
                                radius="none"
                                classNames={{
                                    content: "rounded-none border-2 border-foreground bg-background text-foreground font-mono text-2xs font-extrabold uppercase shadow-[2px_2px_0px_0px_#000] px-2 py-1"
                                }}
                            >
                                <Button
                                    size="sm"
                                    color="primary"
                                    variant="flat"
                                    onPress={() => signOut({ callbackUrl: '/' })}
                                    startContent={<FaSignOutAlt />}
                                    className="font-mono text-xs uppercase font-black bg-red text-white rounded-none border-2 border-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] hover:scale-105 active:scale-95 transition-all duration-200 h-9"
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
                                className="font-mono text-xs uppercase font-black bg-yellow text-black rounded-none border-2 border-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] hover:scale-105 active:scale-95 transition-all duration-200 h-9"
                            >
                                Login
                            </Button>
                        )
                    ) : (
                        <div className="h-9 w-20 bg-foreground/10 border-2 border-foreground/30 animate-pulse rounded-none" />
                    )}
                </NavbarItem>

                {/* Mobile Hamburger Toggle (Mobile-only) */}
                <NavbarItem className="sm:hidden flex items-center">
                    <NavbarMenuToggle 
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"} 
                        className="text-foreground border-2 border-foreground rounded-none hover:bg-secondary shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] transition-all h-10 w-10 min-w-10 p-2.5 flex items-center justify-center cursor-pointer bg-background shrink-0"
                    />
                </NavbarItem>
            </NavbarContent>

            {/* Mobile Drawer (Menu) */}
            <NavbarMenu className="bg-background border-t-4 border-foreground p-6 flex flex-col gap-6 rounded-none z-50">
                {/* Regular Mobile Nav Links */}
                <div className="flex flex-col gap-3">
                    {/* How to Use (Mobile) */}
                    <NavbarMenuItem>
                        <button
                            onClick={() => {
                                setIsMenuOpen(false);
                                setGuideStep(0);
                                setIsGuideOpen(true);
                            }}
                            className="w-full font-mono tracking-wide text-xs uppercase font-black px-4 py-3 border-2 border-foreground bg-background text-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] hover:bg-yellow hover:text-black hover:shadow-[4px_4px_0px_0px_#000] dark:hover:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-200 rounded-none flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <FaQuestion className="text-sm shrink-0" />
                            <span>How to Use</span>
                        </button>
                    </NavbarMenuItem>

                    {/* Feedback (Mobile) */}
                    <NavbarMenuItem>
                        <a
                            href={feedbackUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setIsMenuOpen(false)}
                            className="w-full font-mono tracking-wide text-xs uppercase font-black px-4 py-3 border-2 border-foreground bg-background text-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] hover:bg-yellow hover:text-black hover:shadow-[4px_4px_0px_0px_#000] dark:hover:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-200 rounded-none flex items-center justify-center gap-2"
                        >
                            <FaCommentAlt className="text-sm shrink-0" />
                            <span>Feedback</span>
                        </a>
                    </NavbarMenuItem>

                    {siteConfig.navItems.map((item) => {
                        if (item.href === '/admin' && !isAdmin()) return null;
                        const active = isActive(item.href);
                        return (
                            <NavbarMenuItem key={item.href}>
                                <Link
                                    href={item.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={clsx(
                                        'font-mono tracking-wide text-xs uppercase font-black px-4 py-3 border-2 border-foreground transition-all duration-200 rounded-none block text-center',
                                        active
                                            ? 'bg-foreground text-background shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]'
                                            : 'bg-background text-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] hover:bg-yellow hover:text-black hover:shadow-[4px_4px_0px_0px_#000] dark:hover:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                                    )}
                                >
                                    {item.label}
                                </Link>
                            </NavbarMenuItem>
                        );
                    })}
                    {mounted && session && (
                        <NavbarMenuItem key="/my-reviews">
                            <Link
                                href="/my-reviews"
                                onClick={() => setIsMenuOpen(false)}
                                className={clsx(
                                    'font-mono tracking-wide text-xs uppercase font-black px-4 py-3 border-2 border-foreground transition-all duration-200 rounded-none block text-center',
                                    isActive('/my-reviews')
                                        ? 'bg-foreground text-background shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]'
                                        : 'bg-background text-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] hover:bg-yellow hover:text-black hover:shadow-[4px_4px_0px_0px_#000] dark:hover:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                                )}
                            >
                                My Reviews
                            </Link>
                        </NavbarMenuItem>
                    )}
                </div>

                <div className="border-t-2 border-dashed border-foreground/30 my-1" />

                {/* Mobile Drawer Theme & Auth Actions */}
                <div className="flex flex-col gap-3">
                    {/* Theme Toggle Button (Mobile) */}
                    <NavbarMenuItem>
                        <Button
                            onPress={() => {
                                toggleTheme();
                            }}
                            className="w-full font-mono text-xs uppercase font-extrabold bg-background text-foreground border-2 border-foreground rounded-none shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] hover:bg-warning transition-all duration-200 h-10 flex items-center justify-center gap-2"
                        >
                            {mounted && theme === 'dark' ? (
                                <>
                                    <FaSun className="text-white" />
                                    <span>Switch to Light Mode</span>
                                </>
                            ) : (
                                <>
                                    <FaMoon className="text-foreground" />
                                    <span>Switch to Dark Mode</span>
                                </>
                            )}
                        </Button>
                    </NavbarMenuItem>

                    {/* Auth Button (Mobile) */}
                    <NavbarMenuItem>
                        {mounted && status !== 'loading' ? (
                            session ? (
                                <Button
                                    onPress={() => {
                                        setIsMenuOpen(false);
                                        signOut({ callbackUrl: '/' });
                                    }}
                                    startContent={<FaSignOutAlt />}
                                    className="w-full font-mono text-xs uppercase font-black bg-red text-white rounded-none border-2 border-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] hover:scale-102 transition-all duration-200 h-10"
                                >
                                    Logout
                                </Button>
                            ) : (
                                <Button
                                    onPress={() => {
                                        setIsMenuOpen(false);
                                        signIn('keycloak');
                                    }}
                                    startContent={<FaSignInAlt />}
                                    className="w-full font-mono text-xs uppercase font-black bg-yellow text-black rounded-none border-2 border-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] hover:scale-102 transition-all duration-200 h-10"
                                >
                                    Login
                                </Button>
                            )
                        ) : (
                            <div className="h-10 w-full bg-foreground/10 border-2 border-foreground/30 animate-pulse rounded-none" />
                        )}
                    </NavbarMenuItem>
                </div>
            </NavbarMenu>

            {/* "How to Use" Carousel Modal */}
            <Modal 
                isOpen={isGuideOpen} 
                onClose={closeGuide}
                size="md"
                hideCloseButton
                className="bg-background border-4 border-foreground text-foreground rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] z-[100]"
            >
                <ModalContent className="rounded-none">
                    {(onClose) => (
                        <>
                            <ModalHeader className="font-mixtape uppercase tracking-tighter border-b-3 border-foreground px-4 sm:px-6 py-3 flex justify-between items-center bg-purple text-white rounded-none gap-4">
                                <div className="flex flex-col gap-0.5 select-none">
                                    <span className="text-sm sm:text-base font-extrabold leading-none">HOW TO USE GUIDE</span>
                                    <span className="text-3xs font-mono font-normal tracking-wide opacity-80">STEP {guideStep + 1} OF 3</span>
                                </div>
                                <button
                                    onClick={closeGuide}
                                    className="cursor-pointer h-7 w-7 border-2 border-foreground bg-background text-foreground hover:bg-secondary hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] flex items-center justify-center font-mono font-black text-sm rounded-none transition-all duration-200"
                                >
                                    ✕
                                </button>
                            </ModalHeader>
                            <ModalBody className="p-6 flex flex-col gap-4 font-mono">
                                {/* Step illustration/image placeholder */}
                                <div className="h-44 w-full bg-lightgrey dark:bg-grey border-2 border-foreground rounded-none flex flex-col items-center justify-center p-4 text-center select-none shadow-[inset_3px_3px_0px_0px_rgba(0,0,0,0.15)] relative overflow-hidden">
                                    <div className="absolute top-2 left-2 text-3xs opacity-40 font-bold">PREVIEW_DECK</div>
                                    {guideStep === 0 && (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="bg-yellow text-black border-2 border-foreground font-black px-3 py-1 text-sm shadow-[2px_2px_0px_0px_#000] rotate-[-2deg]">
                                                MYCOURSEREVIEWS
                                            </div>
                                            <p className="text-[10px] uppercase font-bold text-foreground/60 max-w-[200px] mt-1 leading-tight">
                                                BY STUDENTS, FOR STUDENTS AT ADELAIDE UNI
                                            </p>
                                        </div>
                                    )}
                                    {guideStep === 1 && (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="bg-red text-white border-2 border-foreground font-black px-3 py-1 text-sm shadow-[2px_2px_0px_0px_#000] rotate-[3deg]">
                                                RATE COURSE
                                            </div>
                                            <p className="text-[10px] uppercase font-bold text-foreground/60 max-w-[200px] mt-1 leading-tight">
                                                DIFFICULTY, USEFULNESS, & ENJOYMENT EQ BARS
                                            </p>
                                        </div>
                                    )}
                                    {guideStep === 2 && (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="bg-blue text-white border-2 border-foreground font-black px-3 py-1 text-sm shadow-[2px_2px_0px_0px_#000] rotate-[-3deg]">
                                                DISCUSS
                                            </div>
                                            <p className="text-[10px] uppercase font-bold text-foreground/60 max-w-[200px] mt-1 leading-tight">
                                                LEAVE REVIEWS & THREADED DEBATES IN-PLACE
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Step text content */}
                                <div className="text-center mt-2 min-h-[64px]">
                                    {guideStep === 0 && (
                                        <>
                                            <h3 className="font-extrabold text-sm uppercase mb-1">1. Explore Outline Ratings</h3>
                                            <p className="text-2xs text-foreground/75 leading-relaxed">
                                                Explore course ratings on overall scoring, difficulty, usefulness, and enjoyment metrics submitted by fellow university peers.
                                            </p>
                                        </>
                                    )}
                                    {guideStep === 1 && (
                                        <>
                                            <h3 className="font-extrabold text-sm uppercase mb-1">2. Cast Your Rating</h3>
                                            <p className="text-2xs text-foreground/75 leading-relaxed">
                                                Log in securely via your CS Club account, choose a course, and rate difficulty, usefulness, and enjoyment.
                                            </p>
                                        </>
                                    )}
                                    {guideStep === 2 && (
                                        <>
                                            <h3 className="font-extrabold text-sm uppercase mb-1">3. Threaded Zine Discussions</h3>
                                            <p className="text-2xs text-foreground/75 leading-relaxed">
                                                Share anonymous insights, reply to student queries, or start in-place threaded debates on course ratings.
                                            </p>
                                        </>
                                    )}
                                </div>

                                {/* Carousel navigation indicators */}
                                <div className="flex justify-center gap-2 my-2">
                                    {[0, 1, 2].map((stepIdx) => (
                                        <div 
                                            key={stepIdx} 
                                            className={clsx(
                                                "h-2.5 w-2.5 border border-foreground transition-all duration-200 rounded-none",
                                                guideStep === stepIdx ? "bg-foreground scale-110 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)]" : "bg-foreground/15"
                                            )}
                                        />
                                    ))}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-between items-center gap-4 mt-2">
                                    <Button
                                        size="sm"
                                        radius="none"
                                        variant="flat"
                                        isDisabled={guideStep === 0}
                                        onPress={() => setGuideStep(prev => prev - 1)}
                                        className="font-mono text-2xs uppercase border-2 border-foreground"
                                    >
                                        Back
                                    </Button>
                                    {guideStep < 2 ? (
                                        <Button
                                            size="sm"
                                            radius="none"
                                            onPress={() => setGuideStep(prev => prev + 1)}
                                            className="font-mono text-2xs uppercase font-black bg-blue text-white border-2 border-foreground shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]"
                                        >
                                            Next
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            radius="none"
                                            onPress={closeGuide}
                                            className="font-mono text-2xs uppercase font-black bg-yellow text-black border-2 border-foreground shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]"
                                        >
                                            Let's Go!
                                        </Button>
                                    )}
                                </div>
                            </ModalBody>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </Navbar>
    );
};
