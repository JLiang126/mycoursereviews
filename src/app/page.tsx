'use client';

import { Button, Card, CardBody } from '@heroui/react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import {
    FaArrowRight,
    FaComments,
    FaSearch,
    FaStar,
} from 'react-icons/fa';

const LogoSvg = ({ className }: { className?: string }) => (
    <svg 
        version="1.0" 
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid meet"
        className={className}
    >
        <g transform="translate(0.000000,400.000000) scale(0.100000,-0.100000)" stroke="none">
            <path d="M1045 3464 c-150 -27 -271 -105 -294 -191 -16 -55 -15 -1649 0 -1709 7 -28 23 -54 41 -69 38 -32 99 -33 275 -4 100 16 158 20 263 17 154 -5 177 -12 440 -131 183 -82 217 -91 272 -76 24 6 112 42 197 81 84 38 194 83 243 99 81 27 103 31 209 30 71 0 173 -9 251 -22 169 -27 242 -23 274 14 13 15 28 45 34 66 7 27 9 312 8 868 l-3 830 -30 49 c-21 32 -48 60 -83 81 -289 172 -986 51 -1113 -194 l-28 -52 -21 44 c-94 194 -579 333 -935 269z m1023 -535 c13 -11 54 -83 92 -159 41 -81 78 -144 91 -150 11 -7 91 -22 177 -35 150 -22 158 -25 184 -54 55 -62 37 -101 -105 -236 -68 -65 -108 -110 -113 -129 -4 -18 3 -86 19 -179 23 -133 25 -153 12 -182 -13 -33 -58 -65 -91 -65 -9 0 -82 34 -162 75 -80 41 -155 75 -167 75 -12 0 -87 -34 -167 -75 -80 -41 -153 -75 -162 -75 -33 0 -78 32 -91 65 -13 29 -11 49 12 182 16 93 23 161 19 179 -5 19 -45 64 -113 129 -142 135 -160 174 -105 236 26 29 34 32 184 54 86 13 166 28 177 35 13 6 50 69 91 150 38 76 79 148 92 159 15 14 35 21 63 21 28 0 48 -7 63 -21z" fill="#FFEAB8" />
            <path d="M1942 2929 c-13 -11 -54 -83 -92 -159 -41 -81 -78 -144 -91 -150 -11 -7 -91 -22 -177 -35 -150 -22 -158 -25 -184 -54 -55 -62 -37 -101 105 -236 68 -65 108 -110 113 -129 4 -18 -3 -86 -19 -179 -23 -133 -25 -153 -12 -182 13 -33 58 -65 91 -65 9 0 82 34 162 75 80 41 155 75 167 75 12 0 87 -34 167 -75 80 -41 153 -75 162 -75 33 0 78 32 91 65 13 29 11 49 -12 182 -16 93 -23 161 -19 179 5 19 45 64 113 129 142 135 160 174 105 236 -26 29 -34 32 -184 54 -86 13 -166 28 -177 35 -13 6 -50 69 -91 150 -38 76 -79 148 -92 159 -15 14 -35 21 -63 21 -28 0 -48 -7 -63 -21z" fill="#FAA307" />
            <path d="M655 3994 c-11 -2 -44 -9 -73 -15 -222 -45 -436 -226 -525 -445 -54 -133 -52 -95 -52 -1149 l0 -980 23 -75 c54 -171 152 -309 287 -405 81 -57 127 -80 232 -112 l88 -27 705 -6 c665 -5 708 -6 750 -24 85 -36 145 -83 503 -389 237 -203 366 -307 381 -307 42 0 46 16 46 171 0 80 5 170 10 200 40 208 218 357 430 359 85 1 183 25 260 66 85 44 186 147 224 227 58 124 57 91 53 1245 -2 933 -5 1063 -19 1107 -90 285 -258 452 -543 543 -45 15 -194 17 -1405 18 -745 1 -1364 0 -1375 -2z m761 -525 c200 -28 401 -104 496 -188 25 -23 57 -63 69 -89 18 -36 24 -42 27 -27 3 11 17 39 33 61 150 219 764 330 1058 193 76 -35 136 -93 150 -146 16 -55 15 -1649 0 -1709 -7 -28 -23 -54 -41 -69 -37 -32 -103 -33 -273 -5 -146 24 -326 26 -409 5 -60 -16 -144 -50 -361 -147 -166 -73 -171 -73 -400 30 -265 118 -288 125 -435 130 -94 3 -156 -1 -253 -17 -179 -29 -247 -28 -286 5 -17 14 -35 42 -41 62 -6 24 -10 332 -10 867 l0 831 23 44 c40 80 156 146 297 169 79 13 266 13 356 0z" fill="#9E2A2B" />
        </g>
    </svg>
);

export default function WelcomePage() {
    const { data: session, status } = useSession();
    const [mounted, setMounted] = useState(false);
    const [bubbles, setBubbles] = useState<any[]>([]);
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
        const comments = [
            "Loved ACCT1000! Great lectures.",
            "COMP SCI 1102 is highly recommended!",
            "ARTI2001 (Machine Learning) is awesome ⭐",
            "Awesome coordinators!",
            "Difficulty: 2/5, Enjoyment: 5/5!",
            "Super useful for internship prep!",
            "Tough exams but very rewarding.",
            "Great intro to databases!",
            "Enjoyment: 5/5, Usefulness: 5/5",
            "The final project was so fun!",
            "The tutor support was incredible!",
            "Fascinating lecture content!",
            "Best course I've taken at Uni!",
            "Highly interactive workshops!",
            "Tough but rewarding!",
            "Literally my favourite class",
            "Excellent practical assignments!",
            "Loved ACCT1001! Great intro.",
            "Enjoyment: 5/5 ⭐",
        ];

        const generated = Array.from({ length: 28 }).map((_, i) => {
            const comment = comments[i % comments.length];
            
            const angle = (i * (360 / 28) * Math.PI) / 180;
            
            const tx = `${Math.cos(angle) * (15 + Math.random() * 33)}vw`;
            const ty = `${Math.sin(angle) * (70 + Math.random() * 160)}px`;
            
            const scale = 0.55 + Math.random() * 0.4;
            const rotation = -12 + Math.random() * 24;
            const maxOp = 1.0;
            const blur = "blur-none";

            return {
                id: i,
                text: comment,
                tx,
                ty,
                scale,
                rotation,
                maxOp,
                blur,
                delay: `${i * 0.07}s`,
            };
        });

        setBubbles(generated);
    }, []);

    return (
        <div className="flex flex-col gap-16">
            
            {/*  Hero Section */}
            <section className="relative flex flex-col items-center justify-center text-center mx-[-1.5rem] sm:mx-[-2rem] px-4 pb-16 pt-8 min-h-[550px] isolate w-[calc(100%+3rem)] sm:w-[calc(100%+4rem)]">
                
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-30 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] rounded-full bg-[#335C67]/20 blur-3xl opacity-60"></div>
                <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 -z-30 w-[200px] h-[200px] sm:w-[350px] sm:h-[350px] rounded-full bg-[#FFEAB8]/15 blur-3xl opacity-50"></div>

                {/* Review Echo Effect Container */}
                {mounted && (
                    <div className="absolute inset-0 -z-20 pointer-events-none flex items-center justify-center overflow-hidden">
                        <style dangerouslySetInnerHTML={{ __html: `
                            @keyframes echoExpand {
                                0% {
                                    transform: translate(-50%, -50%) scale(0.05) rotate(0deg);
                                    opacity: 0;
                                }
                                20% {
                                    opacity: var(--max-op);
                                }
                                100% {
                                    transform: translate(var(--tx), var(--ty)) scale(var(--sc)) rotate(var(--rot));
                                    opacity: var(--max-op);
                                }
                            }
                            @keyframes bubbleDrift {
                                0%, 100% {
                                    transform: translate(var(--tx), var(--ty)) scale(var(--sc)) rotate(var(--rot));
                                }
                                50% {
                                    transform: translate(var(--tx), calc(var(--ty) - 12px)) scale(calc(var(--sc) * 1.03)) rotate(calc(var(--rot) + 2deg));
                                }
                            }
                            .echo-bubble {
                                position: absolute;
                                left: 50%;
                                top: 50%;
                                transform: translate(-50%, -50%) scale(0.05);
                                opacity: 0;
                                animation: echoExpand 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards,
                                           bubbleDrift 8s ease-in-out infinite 1.6s;
                            }
                        ` }} />

                        {bubbles.map((b, idx) => {
                            const isDark = resolvedTheme === 'dark';
                            const paletteColors = isDark ? [
                                { bgClass: "bg-[#9E2A2B] text-[#FAF9F5]", hex: "#9E2A2B" }, // Crimson
                                { bgClass: "bg-[#FAA307] text-[#1A1A1A]", hex: "#FAA307" }, // Orange
                                { bgClass: "bg-[#FFEAB8] text-[#335C67]", hex: "#FFEAB8" }, // Cream
                                { bgClass: "bg-[#223F47] text-[#FAF9F5]", hex: "#223F47" }, // Slate Teal (contrasting dark)
                            ] : [
                                { bgClass: "bg-[#335C67] text-[#FAF9F5]", hex: "#335C67" }, // Deep Teal
                                { bgClass: "bg-[#9E2A2B] text-[#FAF9F5]", hex: "#9E2A2B" }, // Crimson
                                { bgClass: "bg-[#FAA307] text-[#1A1A1A]", hex: "#FAA307" }, // Orange
                                { bgClass: "bg-[#FFEAB8] text-[#335C67]", hex: "#FFEAB8" }, // Cream
                            ];
                            const colorOption = paletteColors[idx % paletteColors.length];

                            // Dynamic horizontal reflection: alternate left/right pointing stems
                            const isLeft = idx % 2 === 0;
                            const borderRadiusClass = isLeft 
                                ? "rounded-[28px] rounded-bl-[4px]" 
                                : "rounded-[28px] rounded-br-[4px]";

                            return (
                                <div
                                    key={b.id}
                                    className={`echo-bubble px-5 py-3 text-2xs sm:text-xs font-extrabold max-w-[200px] sm:max-w-[280px] break-words text-left ${borderRadiusClass} relative drop-shadow-[0_2px_5px_rgba(0,0,0,0.15)] ${colorOption.bgClass} ${b.blur}`}
                                    style={{
                                        '--tx': b.tx,
                                        '--ty': b.ty,
                                        '--sc': b.scale,
                                        '--rot': `${b.rotation}deg`,
                                        '--max-op': b.maxOp,
                                        animationDelay: `${b.delay}, calc(${b.delay} + 1.6s)`,
                                    } as React.CSSProperties}
                                >
                                    <svg 
                                        className={`absolute bottom-[-8px] ${isLeft ? 'left-[-14px] scale-x-[-1]' : 'right-[-14px]'} w-[20px] h-[20px] pointer-events-none`} 
                                        viewBox="0 0 20 20"
                                    >
                                        <path 
                                            d="M0 12 L6 12 C12 12 18 15 20 20 C17 12 10 4 6 0 L0 0 Z" 
                                            fill={colorOption.hex} 
                                        />
                                    </svg>
                                    <span className="relative z-10">{b.text}</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                <LogoSvg className="w-16 h-16 sm:w-20 sm:h-20 mb-4 hover:scale-110 hover:rotate-6 transition-transform duration-300 transform relative z-10" />

                <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[130%] max-w-[950px] h-[350px] sm:h-[420px] rounded-full bg-background/25 backdrop-blur-[16px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)] pointer-events-none" />

                <h1 className="text-5xl sm:text-7xl font-black tracking-tight max-w-4xl leading-tight sm:leading-none relative z-10 drop-shadow-[0_2px_8px_rgba(250,249,245,0.75)] dark:drop-shadow-[0_2px_8px_rgba(15,25,27,0.85)]">
                    <span className="relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-1 after:bg-primary/30 after:rounded-full">
                        MyCourseReviews
                    </span>
                </h1>

                <p className="mt-8 text-base sm:text-xl text-foreground/75 max-w-2xl font-medium leading-relaxed relative z-10 drop-shadow-[0_1px_4px_rgba(250,249,245,0.8)] dark:drop-shadow-[0_1px_4px_rgba(15,25,27,0.9)]">
                    By students, for students — the premier course guide created and maintained by the 
                    <span className="text-primary font-bold"> Adelaide University Computer Science Club</span>.
                </p>

                {/* Main CTAs */}
                <div className="mt-12 flex flex-wrap gap-5 justify-center items-center relative z-10">
                    <Button
                        as={Link}
                        href="/courses"
                        color="primary"
                        size="lg"
                        className="font-black text-[#FAF9F5] px-10 py-7 text-lg rounded-2xl shadow-xl shadow-primary/35 hover:scale-110 hover:shadow-primary/50 active:scale-95 transition-all duration-300 transform hover:!opacity-100 data-[hover=true]:!opacity-100"
                        endContent={<FaArrowRight className="animate-[pulse_1.2s_infinite] text-xl" />}
                    >
                        Browse Courses
                    </Button>
                </div>
            </section>

            <div className="max-w-7xl mx-auto w-full flex flex-col gap-16 pb-8 relative z-10">
                {/* Feature Overview Section */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <Card className="bg-background/40 backdrop-blur-md border border-divider hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-primary/5">
                    <CardBody className="p-6 flex flex-col gap-4">
                        <div className="p-3 bg-primary/10 text-primary w-fit rounded-2xl">
                            <FaSearch className="text-xl" />
                        </div>
                        <h2 className="text-xl font-bold">Smart Search</h2>
                        <p className="text-sm text-foreground/60 leading-relaxed">
                            Search to filter Adelaide University subjects by subject areas, terms offered, and ratings.
                        </p>
                    </CardBody>
                </Card>

                <Card className="bg-background/40 backdrop-blur-md border border-divider hover:border-secondary/30 transition-all duration-300 shadow-sm hover:shadow-secondary/5">
                    <CardBody className="p-6 flex flex-col gap-4">
                        <div className="p-3 bg-secondary/10 text-secondary w-fit rounded-2xl">
                            <FaStar className="text-xl" />
                        </div>
                        <h2 className="text-xl font-bold">Sub-score Ratings</h2>
                        <p className="text-sm text-foreground/60 leading-relaxed">
                            Rate and compare courses based on dynamic metrics: Difficulty, Usefulness, and Enjoyment with graphical scorecards.
                        </p>
                    </CardBody>
                </Card>

                <Card className="bg-background/40 backdrop-blur-md border border-divider hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-primary/5">
                    <CardBody className="p-6 flex flex-col gap-4">
                        <div className="p-3 bg-primary/10 text-primary w-fit rounded-2xl">
                            <FaComments className="text-xl" />
                        </div>
                        <h2 className="text-xl font-bold">Threaded Debates</h2>
                        <p className="text-sm text-foreground/60 leading-relaxed">
                            Logged in students can leave threaded comments and reply to reviews to ask questions or discuss assignments.
                        </p>
                    </CardBody>
                </Card>
            </section>

            {/* Guide */}
            <section className="bg-background/30 backdrop-blur-md border border-divider rounded-3xl p-8 md:p-12">
                <div className="text-center mb-12">
                    <h2 className="text-2xl sm:text-3xl font-extrabold">How MyCourseReviews Works</h2>
                    <p className="text-sm sm:text-base text-foreground/60 mt-2">
                        Get from choosing courses to submitting ratings in 4 simple steps
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                    
                    {/* Step 1 */}
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-extrabold text-primary text-lg">
                            1
                        </div>
                        <h3 className="font-bold text-lg">Browse</h3>
                        <p className="text-xs text-foreground/60 px-4 leading-relaxed">
                            Filter through levels and semesters to discover course details and star ratings.
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-secondary/10 border border-secondary/30 flex items-center justify-center font-extrabold text-secondary text-lg">
                            2
                        </div>
                        <h3 className="font-bold text-lg">Login</h3>
                        <p className="text-xs text-foreground/60 px-4 leading-relaxed">
                            Sign in securely via your CS Club account to authenticate your reviews.
                        </p>
                    </div>

                    {/* Stepper Card 3 */}
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-extrabold text-primary text-lg">
                            3
                        </div>
                        <h3 className="font-bold text-lg">Review</h3>
                        <p className="text-xs text-foreground/60 px-4 leading-relaxed">
                            Submit rating sliders on difficulty, usefulness, and enjoyment based on your experience.
                        </p>
                    </div>

                    {/* Step 4 */}
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-secondary/10 border border-secondary/30 flex items-center justify-center font-extrabold text-secondary text-lg">
                            4
                        </div>
                        <h3 className="font-bold text-lg">Discuss</h3>
                        <p className="text-xs text-foreground/60 px-4 leading-relaxed">
                            Join threaded comments to reply, verify, and like reviews submitted by other peers.
                        </p>
                    </div>

                </div>
            </section>

            </div>
       </div>
    );
}
