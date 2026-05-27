'use client';

import {
    Button,
    Card,
    CardBody,
    Chip,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Progress,
    Select,
    SelectItem,
    Textarea,
    Tooltip,
    useDisclosure,
} from '@heroui/react';
import { motion } from 'framer-motion';
import { signIn, useSession } from 'next-auth/react';
import { useEffect, useState, useTransition } from 'react';
import { clsx } from 'clsx';
import Link from 'next/link';
import {
    FaBookOpen,
    FaBuilding,
    FaCalendarAlt,
    FaChalkboardTeacher,
    FaClipboardList,
    FaComments,
    FaGraduationCap,
    FaHeart,
    FaInfoCircle,
    FaLock,
    FaRegHeart,
    FaReply,
    FaStar,
    FaUserShield,
} from 'react-icons/fa';

import { addComment, toggleLike } from '@/app/actions/reviews';
import { CourseData } from '@/lib/courses-api';
import { ReviewModal } from './ReviewModal';
import { formatLocalDate } from '@/lib/date-utils';

interface Comment {
    id: string;
    userId: string;
    userName: string;
    content: string;
    parentId: string | null;
    createdAt: Date;
}

interface Review {
    id: string;
    title: string;
    description: string;
    overallRating: number;
    difficultyScore: number;
    usefulnessScore: number;
    enjoymentScore: number;
    termTaken: string;
    grade: string | null;
    isAnonymous: boolean;
    reviewerName: string;
    createdAt: Date;
    likesCount: number;
    likedByCurrentUser: boolean;
    comments: Comment[];
}

interface CourseDetailClientProps {
    course: CourseData;
    reviews: Review[];
    stats: {
        avgOverall: number;
        avgDifficulty: number;
        avgUsefulness: number;
        avgEnjoyment: number;
        totalReviews: number;
    };
}

export const CourseDetailClient = ({ course, reviews, stats }: CourseDetailClientProps) => {
    const { data: session } = useSession();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { isOpen: isAuthOpen, onOpen: onAuthOpen, onOpenChange: onAuthOpenChange } = useDisclosure();
    const [sortBy, setSortBy] = useState('recent');
    const [likeTransition, startLikeTransition] = useTransition();
    const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Comment State
    const [activeReplyId, setActiveReplyId] = useState<Record<string, string | null>>({}); // reviewId -> parentCommentId or 'root'
    const [commentContent, setCommentContent] = useState<Record<string, string>>({}); // targetId (reviewId or commentId) -> text
    const [commentTransition, startCommentTransition] = useTransition();

    // Toggle description truncation
    const toggleExpand = (id: string) => {
        setExpandedReviews((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // Sort Reviews Feed
    const sortedReviews = [...reviews].sort((a, b) => {
        if (sortBy === 'recent') {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'rating-desc') {
            return b.overallRating - a.overallRating;
        }
        if (sortBy === 'rating-asc') {
            return a.overallRating - b.overallRating;
        }
        return 0;
    });

    const handleLike = (reviewId: string) => {
        if (!session) {
            alert('Please login to like reviews.');
            return;
        }
        startLikeTransition(async () => {
            try {
                await toggleLike(reviewId);
            } catch (err: any) {
                alert(err.message || 'Failed to toggle like.');
            }
        });
    };

    const handleCommentSubmit = (reviewId: string, parentId?: string) => {
        if (!session) {
            alert('Please login to write comments.');
            return;
        }

        const inputKey = parentId ? `${reviewId}-${parentId}` : `${reviewId}-root`;
        const content = commentContent[inputKey];

        if (!content || content.trim().length === 0) {
            alert('Comment cannot be empty.');
            return;
        }

        startCommentTransition(async () => {
            try {
                await addComment(reviewId, content, parentId);
                setCommentContent((prev) => ({ ...prev, [inputKey]: '' }));
                setActiveReplyId((prev) => ({ ...prev, [reviewId]: null }));
            } catch (err: any) {
                alert(err.message || 'Failed to add comment.');
            }
        });
    };

    // Recursive helper to render threaded comments
    const renderCommentThread = (reviewId: string, commentsList: Comment[], parentId: string | null = null, depth = 0) => {
        const filtered = commentsList.filter((c) => c.parentId === parentId);

        if (filtered.length === 0) return null;

        return (
            <div className={clsx('flex flex-col gap-3 mt-3', depth > 0 && 'border-l-3 border-foreground pl-4 sm:pl-6')}>
                {filtered.map((comment) => (
                    <div key={comment.id} className="text-xs flex flex-col gap-1.5 bg-background p-3 rounded-none border-2 border-foreground shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]">
                        <div className="flex justify-between items-center text-foreground/60 font-mono text-[10px] uppercase font-black">
                            <span className="text-hotpink font-extrabold">{comment.userName}</span>
                            <span>{formatLocalDate(comment.createdAt)}</span>
                        </div>
                        <p className="font-scribble text-sm font-bold text-foreground leading-snug tracking-tight">{comment.content}</p>
                        
                        {/* Reply Action */}
                        {session && (
                            <div className="flex justify-start">
                                <Button
                                    size="sm"
                                    variant="flat"
                                    radius="none"
                                    startContent={<FaReply className="text-2xs" />}
                                    onPress={() => setActiveReplyId((prev) => ({ ...prev, [reviewId]: comment.id }))}
                                    className="h-6 font-mono text-[9px] uppercase font-black bg-background border border-foreground shadow-[1px_1px_0px_0px_#000] py-0.5 px-1.5"
                                >
                                    Reply
                                </Button>
                            </div>
                        )}

                        {/* Inline Reply Input Box */}
                        {activeReplyId[reviewId] === comment.id && (
                            <div className="flex flex-col gap-2 mt-2">
                                <Textarea
                                    size="sm"
                                    radius="none"
                                    placeholder={`Reply to ${comment.userName}...`}
                                    value={commentContent[`${reviewId}-${comment.id}`] || ''}
                                    onValueChange={(val) => setCommentContent((prev) => ({ ...prev, [`${reviewId}-${comment.id}`]: val }))}
                                    minRows={1}
                                    className="font-mono border-2 border-foreground"
                                />
                                <div className="flex justify-end gap-2">
                                    <Button
                                        size="sm"
                                        radius="none"
                                        variant="flat"
                                        onPress={() => setActiveReplyId((prev) => ({ ...prev, [reviewId]: null }))}
                                        className="font-mono text-2xs uppercase border border-foreground"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        radius="none"
                                        isLoading={commentTransition}
                                        onPress={() => handleCommentSubmit(reviewId, comment.id)}
                                        className="font-mono text-2xs uppercase font-black bg-cyanaccent text-mixtapeblack border border-foreground shadow-[2px_2px_0px_0px_#000]"
                                    >
                                        Reply
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Render Nested Children */}
                        {renderCommentThread(reviewId, commentsList, comment.id, depth + 1)}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-8 md:gap-12 bg-grid-sheet p-2">
            
            {/* Top Navigation Back pointer */}
            <div className="flex items-center justify-between">
                <Button
                    as={Link}
                    href="/courses"
                    size="sm"
                    variant="flat"
                    className="font-mono uppercase font-black text-xs border-2 border-foreground bg-neonyellow text-mixtapeblack rounded-none shadow-[3px_3px_0px_0px_#000] rotate-[-2deg]"
                >
                    &larr; Back to Courses
                </Button>

                <Button
                    as="a"
                    href={course.officialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="sm"
                    color="secondary"
                    variant="bordered"
                    className="font-mono uppercase font-black text-xs border-2 border-foreground bg-cyanaccent text-mixtapeblack rounded-none shadow-[3px_3px_0px_0px_#000] rotate-[2deg]"
                >
                    Official Outline &rarr;
                </Button>
            </div>

            {/* Course Information & Scorecard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                
                {/* Course Metadata Details Card */}
                <div className="lg:col-span-2 flex flex-col gap-6 bg-background border-4 border-foreground p-6 sm:p-8 rounded-none shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff]">
                    <div>
                        <span className="font-mixtape text-xs uppercase font-extrabold text-mixtapeblack bg-neongreen border-2 border-foreground px-3 py-1 w-fit shadow-[2px_2px_0px_0px_#000] rotate-[-2deg] inline-block">{course.code}</span>
                        <h1 className="font-mixtape uppercase tracking-tighter text-3xl sm:text-5xl font-black mt-3 leading-none">{course.name}</h1>
                        <div className="flex flex-wrap gap-1.5 mt-4">
                            {course.terms.map((term) => (
                                <Chip key={term} size="sm" radius="none" className="border-2 border-foreground font-mono bg-cyanaccent text-mixtapeblack text-3xs font-extrabold rotate-[1deg]">
                                    {term}
                                </Chip>
                            ))}
                        </div>
                    </div>

                    {/* Quick-info pills: coordinator, campus, units, level, elective */}
                    {(course.coordinator || course.campus || course.units || course.levelOfStudy || course.universityWideElective) && (
                        <div className="flex flex-wrap gap-3 bg-foreground/5 border-2 border-dashed border-foreground/30 p-4 rounded-none font-mono text-xs mt-1">
                            {course.coordinator && (
                                <div className="flex items-center gap-1.5 text-xs font-black text-foreground/80 bg-background px-2.5 py-1 border border-foreground">
                                    <FaChalkboardTeacher />
                                    COORD: {course.coordinator}
                                </div>
                            )}
                            {course.campus && (
                                <div className="flex items-center gap-1.5 text-xs font-black text-foreground/80 bg-background px-2.5 py-1 border border-foreground">
                                    <FaBuilding />
                                    CAMPUS: {course.campus}
                                </div>
                            )}
                            {course.units && (
                                <div className="flex items-center gap-1.5 text-xs font-black text-foreground/80 bg-background px-2.5 py-1 border border-foreground">
                                    <FaInfoCircle />
                                    UNITS: {course.units}
                                </div>
                            )}
                            {course.levelOfStudy && (
                                <div className="flex items-center gap-1.5 text-xs font-black text-foreground/80 bg-background px-2.5 py-1 border border-foreground">
                                    <FaGraduationCap />
                                    LEVEL: {course.levelOfStudy}
                                </div>
                            )}
                            {course.universityWideElective && (
                                <div className="flex items-center gap-1.5 text-xs font-black bg-neongreen text-mixtapeblack px-2.5 py-1 border border-foreground rotate-[2deg]">
                                    ELECTIVE: YES
                                </div>
                            )}
                        </div>
                    )}

                    {/* Description / Course Overview */}
                    <div className="border-t-3 border-foreground pt-6">
                        <h2 className="font-mixtape text-xs uppercase font-extrabold text-foreground/50 tracking-wider">Course Overview</h2>
                        <p className="font-mono text-xs text-foreground/80 mt-3 leading-relaxed whitespace-pre-line">
                            {course.description || 'No overview available. Please refer to the official Adelaide University website.'}
                        </p>
                    </div>

                    {/* Prerequisites / Corequisites / Antirequisites */}
                    {(course.prerequisites || course.corequisites || course.antirequisites) && (
                        <div className="border-t-3 border-foreground pt-5 flex flex-col gap-3">
                            <h2 className="text-sm font-extrabold uppercase text-foreground/50 tracking-wider">Requirements</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {course.prerequisites && (
                                    <div className="bg-warning-50/10 border border-warning-200/30 rounded-xl p-3">
                                        <p className="text-2xs font-extrabold uppercase text-warning-600 tracking-wider mb-1">Prerequisites</p>
                                        <p className="text-xs text-foreground/75 leading-relaxed">{course.prerequisites}</p>
                                    </div>
                                )}
                                {course.corequisites && (
                                    <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-3">
                                        <p className="text-2xs font-extrabold uppercase text-secondary tracking-wider mb-1">Corequisites</p>
                                        <p className="text-xs text-foreground/75 leading-relaxed">{course.corequisites}</p>
                                    </div>
                                )}
                                {course.antirequisites && (
                                    <div className="bg-danger-50/10 border border-danger-200/30 rounded-xl p-3">
                                        <p className="text-2xs font-extrabold uppercase text-danger tracking-wider mb-1">Antirequisites</p>
                                        <p className="text-xs text-foreground/75 leading-relaxed">{course.antirequisites}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Assessments */}
                    {course.assessments && course.assessments.length > 0 && (
                        <div className="border-t border-divider pt-5">
                            <h2 className="text-sm font-extrabold uppercase text-foreground/50 tracking-wider mb-3 flex items-center gap-2">
                                <FaClipboardList className="text-primary" /> Assessments
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-divider text-foreground/50 font-extrabold uppercase tracking-wider">
                                            <th className="text-left pb-2 pr-4">Task</th>
                                            <th className="text-right pb-2 pr-4">Weighting</th>
                                            {course.assessments.some(a => a.hurdle) && (
                                                <th className="text-left pb-2">Hurdle</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-divider/40">
                                        {course.assessments.map((a, i) => (
                                            <tr key={i} className="text-foreground/75">
                                                <td className="py-2 pr-4 font-semibold">{a.title}</td>
                                                <td className="py-2 pr-4 text-right font-bold text-primary">{a.weighting}</td>
                                                {course.assessments!.some(x => x.hurdle) && (
                                                    <td className="py-2 text-foreground/50">{a.hurdle || '—'}</td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Learning Outcomes */}
                    {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                        <div className="border-t border-divider pt-5">
                            <h2 className="text-sm font-extrabold uppercase text-foreground/50 tracking-wider mb-3 flex items-center gap-2">
                                <FaBookOpen className="text-primary" /> Learning Outcomes
                            </h2>
                            <ol className="flex flex-col gap-2">
                                {course.learningOutcomes.map((lo) => (
                                    <li key={lo.outcomeIndex} className="flex gap-3 text-xs text-foreground/75 leading-relaxed">
                                        <span className="font-extrabold text-primary shrink-0 w-5 text-right">{lo.outcomeIndex}.</span>
                                        <span>{lo.description}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}

                    {/* Textbooks */}
                    {course.textbooks && course.textbooks.trim() && course.textbooks.toLowerCase() !== 'no learning resources are required.' && (
                        <div className="border-t border-divider pt-5">
                            <h2 className="text-sm font-extrabold uppercase text-foreground/50 tracking-wider mb-2">Textbooks &amp; Resources</h2>
                            <p className="text-xs text-foreground/70 leading-relaxed">{course.textbooks}</p>
                        </div>
                    )}
                </div>

                {/* Scorecard Aggregates Card */}
                <div className="bg-background border-4 border-foreground p-6 rounded-none shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] flex flex-col gap-6 justify-center">
                    <div className="text-center">
                        <h2 className="font-mixtape text-xs uppercase font-extrabold text-foreground/50 tracking-wider">Course Scorecard</h2>
                        
                        <div className="flex flex-col items-center justify-center mt-4">
                            <span className="text-5xl font-mixtape font-black uppercase text-foreground bg-neonyellow border-3 border-foreground px-4 py-1.5 shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] rotate-[-2deg] select-none">
                                {stats.totalReviews > 0 ? stats.avgOverall.toFixed(1) : 'N/A'}
                            </span>
                            <div className="flex items-center gap-1 text-yellow-500 text-lg mt-3">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <FaStar
                                        key={star}
                                        className={clsx(
                                            stats.totalReviews > 0 && star <= Math.round(stats.avgOverall) ? 'text-[#FAA307]' : 'text-foreground/20'
                                        )}
                                    />
                                ))}
                            </div>
                            <span className="font-mono text-2xs text-foreground/50 mt-1 font-semibold uppercase">
                                Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
                            </span>
                        </div>
                    </div>
 
                    <div className="border-t-3 border-foreground pt-5 flex flex-col gap-5">
                        {/* Difficulty rating (Synthesizer equalizer style) */}
                        <div className={clsx("flex flex-col gap-1.5 text-xs font-mono", stats.totalReviews === 0 && "opacity-40 select-none")}>
                            <div className="flex justify-between font-black uppercase text-foreground">
                                <span>DIFFICULTY</span>
                                <span>{stats.totalReviews > 0 ? `${stats.avgDifficulty.toFixed(1)} / 5.0` : 'N/A'}</span>
                            </div>
                            <div className="flex gap-1 select-none">
                                {Array.from({ length: 10 }).map((_, segmentIdx) => {
                                    const threshold = (segmentIdx + 1) / 2;
                                    const active = stats.totalReviews > 0 && stats.avgDifficulty >= threshold;
                                    return (
                                        <div
                                            key={segmentIdx}
                                            className={clsx(
                                                "h-6 w-full border-2 border-foreground rounded-none transition-all",
                                                active
                                                    ? stats.avgDifficulty > 3.5 
                                                        ? "bg-hotpink shadow-[1px_1px_0px_0px_#000]" 
                                                        : stats.avgDifficulty > 2.5 
                                                            ? "bg-neonorange shadow-[1px_1px_0px_0px_#000]"
                                                            : "bg-neongreen shadow-[1px_1px_0px_0px_#000]"
                                                    : "bg-foreground/5"
                                            )}
                                        />
                                    );
                                })}
                            </div>
                        </div>
 
                        {/* Usefulness rating (Synthesizer equalizer style) */}
                        <div className={clsx("flex flex-col gap-1.5 text-xs font-mono", stats.totalReviews === 0 && "opacity-40 select-none")}>
                            <div className="flex justify-between font-black uppercase text-foreground">
                                <span>USEFULNESS</span>
                                <span>{stats.totalReviews > 0 ? `${stats.avgUsefulness.toFixed(1)} / 5.0` : 'N/A'}</span>
                            </div>
                            <div className="flex gap-1 select-none">
                                {Array.from({ length: 10 }).map((_, segmentIdx) => {
                                    const threshold = (segmentIdx + 1) / 2;
                                    const active = stats.totalReviews > 0 && stats.avgUsefulness >= threshold;
                                    return (
                                        <div
                                            key={segmentIdx}
                                            className={clsx(
                                                "h-6 w-full border-2 border-foreground rounded-none transition-all",
                                                active
                                                    ? "bg-cyanaccent shadow-[1px_1px_0px_0px_#000]"
                                                    : "bg-foreground/5"
                                            )}
                                        />
                                    );
                                })}
                            </div>
                        </div>
 
                        {/* Enjoyment rating (Synthesizer equalizer style) */}
                        <div className={clsx("flex flex-col gap-1.5 text-xs font-mono", stats.totalReviews === 0 && "opacity-40 select-none")}>
                            <div className="flex justify-between font-black uppercase text-foreground">
                                <span>ENJOYMENT</span>
                                <span>{stats.totalReviews > 0 ? `${stats.avgEnjoyment.toFixed(1)} / 5.0` : 'N/A'}</span>
                            </div>
                            <div className="flex gap-1 select-none">
                                {Array.from({ length: 10 }).map((_, segmentIdx) => {
                                    const threshold = (segmentIdx + 1) / 2;
                                    const active = stats.totalReviews > 0 && stats.avgEnjoyment >= threshold;
                                    return (
                                        <div
                                            key={segmentIdx}
                                            className={clsx(
                                                "h-6 w-full border-2 border-foreground rounded-none transition-all",
                                                active
                                                    ? "bg-neongreen shadow-[1px_1px_0px_0px_#000]"
                                                    : "bg-foreground/5"
                                            )}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews Grid Header */}
            <div className="border-t-4 border-foreground pt-8 md:pt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-mixtape uppercase tracking-tighter text-2xl sm:text-3xl font-extrabold bg-hotpink text-white w-fit px-3 py-1 border-3 border-foreground shadow-[3px_3px_0px_0px_#000] rotate-[-1.5deg] select-none">Student Reviews</h1>
                    <p className="font-scribble text-sm text-foreground/80 mt-2 font-bold rotate-[1deg]">Read about actual class experiences and sub-scores.</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {mounted ? (
                        <Select
                            size="sm"
                            radius="none"
                            label="Sort Feed"
                            selectedKeys={[sortBy]}
                            onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as string)}
                            className="w-44 font-mono border-2 border-foreground bg-background"
                            aria-label="Sort reviews"
                        >
                            <SelectItem key="recent" textValue="Most Recent" className="font-mono text-xs">Most Recent</SelectItem>
                            <SelectItem key="rating-desc" textValue="Highest Rated" className="font-mono text-xs">Highest Rated</SelectItem>
                            <SelectItem key="rating-asc" textValue="Lowest Rated" className="font-mono text-xs">Lowest Rated</SelectItem>
                        </Select>
                    ) : (
                        <div className="h-10 w-44 bg-background border-2 border-foreground animate-pulse" />
                    )}

                    <Button
                        color="primary"
                        size="md"
                        radius="none"
                        className="font-mono text-xs uppercase font-black bg-neongreen text-mixtapeblack border-2 border-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] hover:scale-105 active:scale-95 transition-all duration-200"
                        onPress={session ? onOpen : onAuthOpen}
                    >
                        Write Review
                    </Button>
                </div>
            </div>            {/* Reviews Feed List */}
            {sortedReviews.length === 0 ? (
                <div className="text-center py-20 bg-background border-4 border-dashed border-foreground rounded-none shadow-[4px_4px_0px_0px_#000]">
                    <FaGraduationCap className="text-foreground text-5xl mx-auto mb-4 animate-bounce" />
                    <p className="font-mixtape font-extrabold uppercase text-lg">No reviews yet</p>
                    <p className="font-scribble text-base mt-2">Be the first student to review this course!</p>
                </div>
            ) : (
                <div className="flex flex-col gap-8">
                    {sortedReviews.map((review) => {
                        const isExpanded = expandedReviews[review.id];
                        const shouldTruncate = review.description.length > 250;

                        return (
                            <Card key={review.id} className="bg-background border-4 border-foreground rounded-none shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff]">
                                <CardBody className="p-5 sm:p-6 flex flex-col gap-4">
                                    
                                    {/* Review Card Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-3 border-foreground pb-4">
                                        
                                        <div className="flex flex-col gap-1">
                                            <h3 className="font-mixtape uppercase tracking-tight text-xl font-extrabold text-foreground">{review.title}</h3>
                                            <div className="flex flex-wrap items-center gap-2 text-2xs font-mono uppercase font-black">
                                                <span className="text-hotpink">{review.isAnonymous ? 'Anonymous Student' : review.reviewerName}</span>
                                                <span>&bull;</span>
                                                <span className="flex items-center gap-1">
                                                    <FaCalendarAlt />
                                                    {formatLocalDate(review.createdAt)}
                                                </span>
                                                {review.grade && (
                                                    <>
                                                        <span>&bull;</span>
                                                        <span className="text-neongreen bg-mixtapeblack px-1.5 py-0.5 border border-foreground">Grade: {review.grade}</span>
                                                    </>
                                                )}
                                                <span>&bull;</span>
                                                <Chip size="sm" radius="none" className="border border-foreground font-mono bg-cyanaccent text-mixtapeblack text-3xs font-extrabold h-5">
                                                    Took {review.termTaken}
                                                </Chip>
                                            </div>
                                        </div>

                                        {/* Visual Rating score stars */}
                                        <div className="flex items-center gap-1.5 bg-neonyellow text-mixtapeblack border-2 border-foreground px-3 py-1 rounded-none h-fit w-fit shadow-[2px_2px_0px_0px_#000] rotate-[3deg] font-mono font-black text-xs">
                                            <FaStar />
                                            <span>{review.overallRating.toFixed(1)}</span>
                                        </div>
                                    </div>

                                    {/* Review Description & See More Trigger */}
                                    <div>
                                        <p className={clsx(
                                            'text-sm font-mono text-foreground/80 leading-relaxed whitespace-pre-line',
                                            !isExpanded && shouldTruncate && 'line-clamp-3'
                                        )}>
                                            {review.description}
                                        </p>
                                        
                                        {shouldTruncate && (
                                            <Button
                                                size="sm"
                                                variant="light"
                                                color="primary"
                                                onPress={() => toggleExpand(review.id)}
                                                className="font-mono text-2xs uppercase font-extrabold h-7 mt-2 hover:underline"
                                            >
                                                {isExpanded ? 'See Less' : 'See More'}
                                            </Button>
                                        )}
                                    </div>

                                    {/* Sub-scores Metrics Badges */}
                                    <div className="flex flex-wrap gap-4 bg-background border-2 border-foreground p-3 rounded-none text-2xs font-mono font-black text-foreground/75 w-fit shadow-[2px_2px_0px_0px_#000] rotate-[-1deg]">
                                        <span className="flex items-center gap-1.5">
                                            DIFFICULTY:{' '}
                                            <span className={clsx(
                                                'font-extrabold',
                                                review.difficultyScore > 3.5 ? 'text-hotpink' : 'text-neongreen'
                                            )}>
                                                {review.difficultyScore}/5
                                            </span>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            USEFULNESS:{' '}
                                            <span className="text-cyanaccent font-extrabold">{review.usefulnessScore}/5</span>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            ENJOYMENT:{' '}
                                            <span className="text-neongreen font-extrabold">{review.enjoymentScore}/5</span>
                                        </span>
                                    </div>

                                    {/* Review Actions Panel: Like & Comments toggle */}
                                    <div className="border-t-3 border-foreground pt-4 flex flex-col gap-4">
                                        <div className="flex items-center gap-3">
                                            {/* Likes Button */}
                                            <Button
                                                size="sm"
                                                radius="none"
                                                variant="flat"
                                                isLoading={likeTransition}
                                                onPress={() => handleLike(review.id)}
                                                startContent={review.likedByCurrentUser ? <FaHeart className="text-mixtapeblack" /> : <FaRegHeart />}
                                                className={clsx(
                                                    "font-mono text-2xs uppercase font-black border-2 border-foreground shadow-[2px_2px_0px_0px_#000] transition-all",
                                                    review.likedByCurrentUser ? "bg-hotpink text-white" : "bg-background text-foreground"
                                                )}
                                            >
                                                Like{review.likesCount > 0 && ` (${review.likesCount})`}
                                            </Button>

                                            {/* Comments Toggle Input */}
                                            <Button
                                                size="sm"
                                                radius="none"
                                                variant="flat"
                                                startContent={<FaComments />}
                                                onPress={() => setActiveReplyId((prev) => ({
                                                    ...prev,
                                                    [review.id]: activeReplyId[review.id] === 'root' ? null : 'root'
                                                }))}
                                                className="font-mono text-2xs uppercase font-black bg-background border-2 border-foreground shadow-[2px_2px_0px_0px_#000] text-foreground"
                                            >
                                                Comments ({review.comments.length})
                                            </Button>
                                        </div>

                                        {/* Dynamic Comments List & Threading reply inputs */}
                                        {true && (
                                            <div className="bg-foreground/[0.03] p-4 rounded-none border-2 border-dashed border-foreground/45 flex flex-col gap-3">
                                                <h4 className="font-mixtape text-[10px] uppercase font-extrabold text-foreground/50 tracking-wider">
                                                    Comments Feed
                                                </h4>

                                                {/* Thread Root Input Box */}
                                                {session && activeReplyId[review.id] === 'root' && (
                                                    <div className="flex flex-col gap-2 mt-2">
                                                        <Textarea
                                                            size="sm"
                                                            radius="none"
                                                            placeholder="Write a comment about this review..."
                                                            value={commentContent[`${review.id}-root`] || ''}
                                                            onValueChange={(val) => setCommentContent((prev) => ({ ...prev, [`${review.id}-root`]: val }))}
                                                            minRows={2}
                                                            className="font-mono border-2 border-foreground"
                                                        />
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                radius="none"
                                                                variant="flat"
                                                                onPress={() => setActiveReplyId((prev) => ({ ...prev, [review.id]: null }))}
                                                                className="font-mono text-2xs border border-foreground"
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                radius="none"
                                                                isLoading={commentTransition}
                                                                onPress={() => handleCommentSubmit(review.id)}
                                                                className="font-mono text-2xs uppercase font-black bg-neongreen text-mixtapeblack border border-foreground shadow-[2px_2px_0px_0px_#000]"
                                                            >
                                                                Submit Comment
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Recursive rendering of comments thread tree */}
                                                {review.comments.length === 0 ? (
                                                    <p className="font-mono text-[10px] text-foreground/50 font-semibold italic py-2">
                                                        No comments yet. Log in to start the discussion!
                                                    </p>
                                                ) : (
                                                    renderCommentThread(review.id, review.comments)
                                                )}
                                            </div>
                                        )}
                                    </div>

                                </CardBody>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Submission review Modal */}
            <ReviewModal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                courseCode={course.code}
                courseName={course.name}
            />

            {/* Authentication Required Modal */}
            <Modal isOpen={isAuthOpen} onOpenChange={onAuthOpenChange} backdrop="blur" className="bg-background/80 border border-divider">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 items-center pt-8">
                                <div className="p-3 bg-primary/10 rounded-full text-primary mb-2">
                                    <FaLock className="text-2xl" />
                                </div>
                                <span className="text-xl font-extrabold text-foreground">Authentication Required</span>
                            </ModalHeader>
                            <ModalBody className="text-center px-6 py-4 flex flex-col gap-3">
                                <p className="text-sm text-foreground/80 font-medium">
                                    By students, for students — Adelaide University's course guide.
                                </p>
                                <p className="text-xs text-foreground/60 leading-relaxed bg-default-100/40 p-4 rounded-xl border border-divider/50">
                                    You need to be logged into your <span className="text-primary font-bold">CS Club account</span> to write a review. This helps us ensure reviews are written by genuine students and maintain high academic standards.
                                </p>
                                <div className="flex items-center justify-center gap-2 text-2xs text-foreground/40 font-semibold bg-warning-50/10 p-2.5 rounded-lg border border-warning-200/20">
                                    <FaUserShield className="text-warning-500 text-xs shrink-0" />
                                    <span>Posting anonymously is fully supported if checked on submission.</span>
                                </div>
                            </ModalBody>
                            <ModalFooter className="flex flex-col sm:flex-row gap-2 pb-8 px-6">
                                <Button
                                    variant="flat"
                                    onPress={onClose}
                                    className="w-full sm:w-auto font-bold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    color="primary"
                                    onPress={() => {
                                        onClose();
                                        signIn('keycloak');
                                    }}
                                    className="w-full sm:w-auto font-bold text-[#FAF9F5]"
                                >
                                    Log In with Keycloak
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

        </div>
    );
};
