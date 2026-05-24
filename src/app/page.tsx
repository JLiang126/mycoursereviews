'use client';

import { Button, Card, CardBody } from '@heroui/react';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import {
    FaArrowRight,
    FaBookOpen,
    FaComments,
    FaGraduationCap,
    FaSearch,
    FaSignInAlt,
    FaStar,
} from 'react-icons/fa';

export default function WelcomePage() {
    const { data: session, status } = useSession();

    return (
        <div className="flex flex-col gap-16 py-8 md:py-16">
            
            {/* High-Impact Hero Section */}
            <section className="relative flex flex-col items-center justify-center text-center px-4 overflow-hidden">
                
                {/* Decorative background glow blobs */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] rounded-full bg-primary/20 blur-3xl opacity-60"></div>
                <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 -z-10 w-[200px] h-[200px] sm:w-[350px] sm:h-[350px] rounded-full bg-secondary/20 blur-3xl opacity-50"></div>

                <div className="flex items-center justify-center bg-primary/10 border border-primary/20 p-4 rounded-3xl mb-6 shadow-inner animate-pulse">
                    <FaBookOpen className="text-primary text-4xl sm:text-5xl" />
                </div>

                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl leading-none">
                    Adelaide University <br />
                    <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Course Reviews
                    </span>
                </h1>

                <p className="mt-6 text-base sm:text-xl text-foreground/70 max-w-xl font-medium">
                    By students, for students — the official course guide created and maintained by the 
                    <span className="text-primary"> Adelaide University Computer Science Club</span>.
                </p>

                {/* Main CTAs */}
                <div className="mt-10 flex flex-wrap gap-4 justify-center items-center">
                    <Button
                        as={Link}
                        href="/courses"
                        color="primary"
                        size="lg"
                        className="font-bold text-white px-8 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                        endContent={<FaArrowRight />}
                    >
                        Browse Courses
                    </Button>

                    {!session && status !== 'loading' && (
                        <Button
                            color="default"
                            variant="bordered"
                            size="lg"
                            className="font-semibold border-foreground/20 hover:bg-default-100 hover:scale-105 transition-transform"
                            onPress={() => signIn('keycloak')}
                            startContent={<FaSignInAlt />}
                        >
                            Login to Review
                        </Button>
                    )}
                </div>
            </section>

            {/* Feature Overview Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-2">
                
                <Card className="bg-background/40 backdrop-blur-md border border-divider hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-primary/5">
                    <CardBody className="p-6 flex flex-col gap-4">
                        <div className="p-3 bg-primary/10 text-primary w-fit rounded-2xl">
                            <FaSearch className="text-xl" />
                        </div>
                        <h2 className="text-xl font-bold">Smart Search</h2>
                        <p className="text-sm text-foreground/60 leading-relaxed">
                            Debounced search bar to filter Adelaide University subjects by levels, terms offered, faculty and ratings.
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

            {/* Visual Step-by-Step Stepper */}
            <section className="bg-background/30 backdrop-blur-md border border-divider rounded-3xl p-8 md:p-12">
                <div className="text-center mb-12">
                    <h2 className="text-2xl sm:text-3xl font-extrabold">How MyCourseReviews Works</h2>
                    <p className="text-sm sm:text-base text-foreground/60 mt-2">
                        Get from choosing courses to submitting ratings in 4 simple steps
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                    
                    {/* Stepper Card 1 */}
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-extrabold text-primary text-lg">
                            1
                        </div>
                        <h3 className="font-bold text-lg">Browse</h3>
                        <p className="text-xs text-foreground/60 px-4 leading-relaxed">
                            Filter through levels and semesters to discover course details and star ratings.
                        </p>
                    </div>

                    {/* Stepper Card 2 */}
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-secondary/10 border border-secondary/30 flex items-center justify-center font-extrabold text-secondary text-lg">
                            2
                        </div>
                        <h3 className="font-bold text-lg">Login</h3>
                        <p className="text-xs text-foreground/60 px-4 leading-relaxed">
                            Sign in securely via your CS Club Keycloak account to authenticate your reviews.
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

                    {/* Stepper Card 4 */}
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

            {/* Active Membership / Stepper Bottom Banner */}
            <section className="flex flex-col items-center text-center gap-4 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/25 rounded-3xl p-6 sm:p-10">
                <FaGraduationCap className="text-primary text-4xl" />
                <h2 className="text-xl sm:text-2xl font-bold">Empowering Adelaide Students</h2>
                <p className="text-xs sm:text-sm text-foreground/75 max-w-xl leading-relaxed">
                    Course outlines and links are fetched dynamically from the Courses API. Cache policies protect API rates and keep the web server extremely responsive.
                </p>
                <Button
                    as={Link}
                    href="/courses"
                    color="primary"
                    variant="flat"
                    className="font-bold border border-primary/20 rounded-xl"
                >
                    Start Exploring Courses
                </Button>
            </section>
        </div>
    );
}
