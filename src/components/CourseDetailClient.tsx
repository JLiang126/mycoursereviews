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
            <div className={clsx('flex flex-col gap-3 mt-3', depth > 0 && 'border-l-2 border-divider pl-4 sm:pl-6')}>
                {filtered.map((comment) => (
                    <div key={comment.id} className="text-xs flex flex-col gap-1.5 bg-default-50/50 p-2.5 rounded-xl border border-divider/30">
                        <div className="flex justify-between items-center text-foreground/50 font-semibold">
                            <span className="text-primary">{comment.userName}</span>
                            <span>{formatLocalDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-foreground/80 leading-relaxed">{comment.content}</p>
                        
                        {/* Reply Action */}
                        {session && (
                            <div className="flex justify-start">
                                <Button
                                    size="sm"
                                    variant="light"
                                    color="secondary"
                                    startContent={<FaReply className="text-xs" />}
                                    onPress={() => setActiveReplyId((prev) => ({ ...prev, [reviewId]: comment.id }))}
                                    className="h-fit py-0.5 px-1 font-semibold"
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
                                    placeholder={`Reply to ${comment.userName}...`}
                                    value={commentContent[`${reviewId}-${comment.id}`] || ''}
                                    onValueChange={(val) => setCommentContent((prev) => ({ ...prev, [`${reviewId}-${comment.id}`]: val }))}
                                    minRows={1}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="default"
                                        onPress={() => setActiveReplyId((prev) => ({ ...prev, [reviewId]: null }))}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        color="secondary"
                                        isLoading={commentTransition}
                                        onPress={() => handleCommentSubmit(reviewId, comment.id)}
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
        <div className="flex flex-col gap-8 md:gap-12">
            
            {/* Top Navigation Back pointer */}
            <div className="flex items-center justify-between">
                <Button
                    as={Link}
                    href="/courses"
                    size="sm"
                    variant="flat"
                    className="font-bold border border-divider bg-background/20"
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
                    className="font-bold"
                >
                    Official Outline Link &rarr;
                </Button>
            </div>

            {/* Course Information & Scorecard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                
                {/* Course Metadata Details Card */}
                <div className="lg:col-span-2 flex flex-col gap-6 bg-background/40 backdrop-blur-sm border border-divider p-6 sm:p-8 rounded-3xl shadow-sm">
                    <div>
                        <span className="text-xs font-extrabold text-primary uppercase tracking-widest">{course.code}</span>
                        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-1">{course.name}</h1>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {course.terms.map((term) => (
                                <Chip key={term} size="sm" color="primary" variant="flat" className="text-3xs font-bold">
                                    {term}
                                </Chip>
                            ))}
                        </div>
                    </div>

                    {/* Quick-info pills: coordinator, campus, units, level, elective */}
                    {(course.coordinator || course.campus || course.units || course.levelOfStudy || course.universityWideElective) && (
                        <div className="flex flex-wrap gap-2">
                            {course.coordinator && (
                                <div className="flex items-center gap-1.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full">
                                    <FaChalkboardTeacher className="text-xs" />
                                    {course.coordinator}
                                </div>
                            )}
                            {course.campus && (
                                <div className="flex items-center gap-1.5 text-xs font-semibold bg-default-100 text-foreground/70 border border-divider px-3 py-1 rounded-full">
                                    <FaBuilding className="text-xs" />
                                    {course.campus}
                                </div>
                            )}
                            {course.units && (
                                <div className="flex items-center gap-1.5 text-xs font-semibold bg-default-100 text-foreground/70 border border-divider px-3 py-1 rounded-full">
                                    <FaInfoCircle className="text-xs" />
                                    {course.units} units
                                </div>
                            )}
                            {course.levelOfStudy && (
                                <div className="flex items-center gap-1.5 text-xs font-semibold bg-secondary/10 text-secondary border border-secondary/20 px-3 py-1 rounded-full">
                                    <FaGraduationCap className="text-xs" />
                                    {course.levelOfStudy}
                                </div>
                            )}
                            {course.universityWideElective && (
                                <div className="flex items-center gap-1.5 text-xs font-semibold bg-success/10 text-success border border-success/20 px-3 py-1 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                    University-Wide Elective
                                </div>
                            )}
                        </div>
                    )}

                    {/* Description / Course Overview */}
                    <div className="border-t border-divider pt-6">
                        <h2 className="text-sm font-extrabold uppercase text-foreground/50 tracking-wider">Course Overview</h2>
                        <p className="text-sm text-foreground/80 mt-2 leading-relaxed">
                            {course.description || 'No overview available. Please refer to the official Adelaide University website.'}
                        </p>
                    </div>

                    {/* Prerequisites / Corequisites / Antirequisites */}
                    {(course.prerequisites || course.corequisites || course.antirequisites) && (
                        <div className="border-t border-divider pt-5 flex flex-col gap-3">
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
                <div className="bg-background/40 backdrop-blur-sm border border-divider p-6 rounded-3xl shadow-sm flex flex-col gap-6 justify-center">
                    <div className="text-center">
                        <h2 className="text-sm font-extrabold uppercase text-foreground/50 tracking-wider">Course Scorecard</h2>
                        
                        <div className="flex flex-col items-center justify-center mt-4">
                            <span className="text-5xl font-extrabold text-foreground">{stats.avgOverall.toFixed(1)}</span>
                            <div className="flex items-center gap-1 text-yellow-500 text-lg mt-1.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <FaStar
                                        key={star}
                                        className={clsx(
                                            star <= Math.round(stats.avgOverall) ? 'text-yellow-500' : 'text-default-200'
                                        )}
                                    />
                                ))}
                            </div>
                            <span className="text-2xs text-foreground/40 mt-1 font-semibold">
                                Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
                            </span>
                        </div>
                    </div>

                    <div className="border-t border-divider pt-5 flex flex-col gap-4">
                        {/* Difficulty rating (gradient bar: lower is better/greener, higher is redder/harder) */}
                        <div className="flex flex-col gap-1 text-xs">
                            <div className="flex justify-between font-semibold text-foreground/75">
                                <span>Difficulty</span>
                                <span>{stats.avgDifficulty.toFixed(1)}/5.0</span>
                            </div>
                            <Progress
                                value={(stats.avgDifficulty / 5) * 100}
                                color={stats.avgDifficulty > 3.5 ? 'danger' : stats.avgDifficulty > 2.5 ? 'warning' : 'success'}
                                className="h-2"
                                aria-label="Difficulty average score"
                            />
                        </div>

                        {/* Usefulness rating */}
                        <div className="flex flex-col gap-1 text-xs">
                            <div className="flex justify-between font-semibold text-foreground/75">
                                <span>Usefulness</span>
                                <span>{stats.avgUsefulness.toFixed(1)}/5.0</span>
                            </div>
                            <Progress
                                value={(stats.avgUsefulness / 5) * 100}
                                color="secondary"
                                className="h-2"
                                aria-label="Usefulness average score"
                            />
                        </div>

                        {/* Enjoyment rating */}
                        <div className="flex flex-col gap-1 text-xs">
                            <div className="flex justify-between font-semibold text-foreground/75">
                                <span>Enjoyment</span>
                                <span>{stats.avgEnjoyment.toFixed(1)}/5.0</span>
                            </div>
                            <Progress
                                value={(stats.avgEnjoyment / 5) * 100}
                                color="primary"
                                className="h-2"
                                aria-label="Enjoyment average score"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews Grid Header */}
            <div className="border-t border-divider pt-8 md:pt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold">Student Reviews</h2>
                    <p className="text-xs text-foreground/60 mt-0.5">Read about actual class experiences and sub-scores.</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {mounted ? (
                        <Select
                            size="sm"
                            label="Sort Feed"
                            selectedKeys={[sortBy]}
                            onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as string)}
                            className="w-40"
                            aria-label="Sort reviews"
                        >
                            <SelectItem key="recent" textValue="Most Recent">Most Recent</SelectItem>
                            <SelectItem key="rating-desc" textValue="Highest Rated">Highest Rated</SelectItem>
                            <SelectItem key="rating-asc" textValue="Lowest Rated">Lowest Rated</SelectItem>
                        </Select>
                    ) : (
                        <div className="h-8 w-40 bg-default-100/50 animate-pulse rounded-xl border border-divider/20" />
                    )}

                    <Button
                        color="primary"
                        size="sm"
                        className="font-bold text-[#FAF9F5]"
                        onPress={session ? onOpen : onAuthOpen}
                    >
                        Write Review
                    </Button>
                </div>
            </div>

            {/* Reviews Feed List */}
            {sortedReviews.length === 0 ? (
                <div className="text-center py-16 bg-background/10 border border-dashed border-divider rounded-2xl">
                    <FaGraduationCap className="text-foreground/20 text-5xl mx-auto mb-4" />
                    <p className="font-bold text-lg">No reviews yet</p>
                    <p className="text-sm text-foreground/50 mt-1">Be the first student to review this course!</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {sortedReviews.map((review) => {
                        const isExpanded = expandedReviews[review.id];
                        const shouldTruncate = review.description.length > 250;

                        return (
                            <Card key={review.id} className="bg-background/40 backdrop-blur-sm border border-divider shadow-sm">
                                <CardBody className="p-5 sm:p-6 flex flex-col gap-4">
                                    
                                    {/* Review Card Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-divider/40 pb-4">
                                        
                                        <div className="flex flex-col gap-1">
                                            <h3 className="font-extrabold text-lg sm:text-xl text-foreground/90">{review.title}</h3>
                                            <div className="flex flex-wrap items-center gap-2 text-2xs text-foreground/50 font-semibold">
                                                <span className="text-primary">{review.isAnonymous ? 'Anonymous Student' : review.reviewerName}</span>
                                                <span>&bull;</span>
                                                <span className="flex items-center gap-1">
                                                    <FaCalendarAlt />
                                                    {formatLocalDate(review.createdAt)}
                                                </span>
                                                {review.grade && (
                                                    <>
                                                        <span>&bull;</span>
                                                        <span className="text-secondary font-bold">Grade: {review.grade}</span>
                                                    </>
                                                )}
                                                <span>&bull;</span>
                                                <Chip size="sm" variant="flat" className="h-4 text-[9px] font-bold">
                                                    Took {review.termTaken}
                                                </Chip>
                                            </div>
                                        </div>

                                        {/* Visual Rating score stars */}
                                        <div className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1 rounded-2xl h-fit w-fit">
                                            <FaStar className="text-xs" />
                                            <span className="text-sm font-extrabold">{review.overallRating.toFixed(1)}</span>
                                        </div>
                                    </div>

                                    {/* Review Description & See More Trigger */}
                                    <div>
                                        <p className={clsx(
                                            'text-sm text-foreground/80 leading-relaxed whitespace-pre-line',
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
                                                className="h-fit px-0.5 mt-2 font-bold hover:underline"
                                            >
                                                {isExpanded ? 'See Less' : 'See More'}
                                            </Button>
                                        )}
                                    </div>

                                    {/* Sub-scores Metrics Badges */}
                                    <div className="flex flex-wrap gap-4 bg-default-50/50 border border-divider/40 p-3 rounded-2xl text-2xs font-bold text-foreground/60 w-fit">
                                        <span className="flex items-center gap-1.5">
                                            Difficulty:{' '}
                                            <span className={clsx(
                                                'font-extrabold text-foreground',
                                                review.difficultyScore > 3.5 ? 'text-red-500' : 'text-green-500'
                                            )}>
                                                {review.difficultyScore}/5
                                            </span>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            Usefulness:{' '}
                                            <span className="text-secondary font-extrabold">{review.usefulnessScore}/5</span>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            Enjoyment:{' '}
                                            <span className="text-primary font-extrabold">{review.enjoymentScore}/5</span>
                                        </span>
                                    </div>

                                    {/* Review Actions Panel: Like & Comments toggle */}
                                    <div className="border-t border-divider/30 pt-4 flex flex-col gap-4">
                                        <div className="flex items-center gap-3">
                                            {/* Likes Button */}
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                color={review.likedByCurrentUser ? 'primary' : 'default'}
                                                isLoading={likeTransition}
                                                onPress={() => handleLike(review.id)}
                                                startContent={review.likedByCurrentUser ? <FaHeart className="text-black" /> : <FaRegHeart />}
                                                className="font-bold text-xs"
                                            >
                                                Like{review.likesCount > 0 && ` (${review.likesCount})`}
                                            </Button>

                                            {/* Comments Toggle Input */}
                                            <Button
                                                size="sm"
                                                variant="light"
                                                startContent={<FaComments />}
                                                onPress={() => setActiveReplyId((prev) => ({
                                                    ...prev,
                                                    [review.id]: activeReplyId[review.id] === 'root' ? null : 'root'
                                                }))}
                                                className="font-bold text-xs"
                                            >
                                                Comments ({review.comments.length})
                                            </Button>
                                        </div>

                                        {/* Dynamic Comments List & Threading reply inputs */}
                                        {activeReplyId[review.id] !== undefined && (
                                            <div className="bg-default-100/30 p-4 rounded-2xl border border-divider/40 flex flex-col gap-3">
                                                <h4 className="text-xs font-extrabold uppercase text-foreground/50 tracking-wider">
                                                    Comments Feed
                                                </h4>

                                                {/* Thread Root Input Box */}
                                                {session && activeReplyId[review.id] === 'root' && (
                                                    <div className="flex flex-col gap-2 mt-2">
                                                        <Textarea
                                                            size="sm"
                                                            placeholder="Write a comment about this review..."
                                                            value={commentContent[`${review.id}-root`] || ''}
                                                            onValueChange={(val) => setCommentContent((prev) => ({ ...prev, [`${review.id}-root`]: val }))}
                                                            minRows={2}
                                                        />
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="flat"
                                                                onPress={() => setActiveReplyId((prev) => ({ ...prev, [review.id]: null }))}
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                color="primary"
                                                                isLoading={commentTransition}
                                                                onPress={() => handleCommentSubmit(review.id)}
                                                                className="text-[#FAF9F5] font-semibold"
                                                            >
                                                                Submit Comment
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Recursive rendering of comments thread tree */}
                                                {review.comments.length === 0 ? (
                                                    <p className="text-2xs text-foreground/40 font-semibold italic py-2">
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
