'use client';

import {
    Button,
    Card,
    CardBody,
    Chip,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Progress,
    Select,
    SelectItem,
    Slider,
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
    FaThumbsDown,
    FaThumbsUp,
    FaUserShield,
    FaCheckSquare,
    FaEdit,
    FaTrashAlt,
} from 'react-icons/fa';
import { MdStar } from 'react-icons/md';

import { addComment, toggleLike, deleteReview, deleteComment, updateComment, updateReview } from '@/app/actions/reviews';
import { voteOnCourseUpdate } from '@/app/actions/courseUpdates';
import { UPDATE_TERM_OPTIONS, UpdateVoteData } from '@/lib/course-update-voting';
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
    userId: string;
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
    updateVoteData: UpdateVoteData;
    defaultLastUpdate?: string;
}

export const CourseDetailClient = ({ course, reviews, stats, updateVoteData, defaultLastUpdate = 'Semester 1, 2026' }: CourseDetailClientProps) => {
    const { data: session } = useSession();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { isOpen: isAuthOpen, onOpen: onAuthOpen, onOpenChange: onAuthOpenChange } = useDisclosure();
    const [sortBy, setSortBy] = useState('recent');
    const [likeTransition, startLikeTransition] = useTransition();
    const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
    const [mounted, setMounted] = useState(false);

    // Last Major Update voting state
    const [voteData, setVoteData] = useState(updateVoteData);
    const [showDisputeSelector, setShowDisputeSelector] = useState(false);
    const [selectedDisputeTerm, setSelectedDisputeTerm] = useState<string>('');
    const [voteLoading, setVoteLoading] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Comment State
    const [activeReplyId, setActiveReplyId] = useState<Record<string, string | null>>({}); // reviewId -> parentCommentId or 'root'
    const [commentContent, setCommentContent] = useState<Record<string, string>>({}); // targetId (reviewId or commentId) -> text
    const [commentTransition, startCommentTransition] = useTransition();

    // Last Major Update vote handler
    const handleVote = async (suggestedTerm: string) => {
        if (!session) { onAuthOpen(); return; }
        setVoteLoading(true);
        // Optimistic update
        const prev = voteData;
        const isToggleOff = voteData.currentUserVote === suggestedTerm;
        const isConfirm = suggestedTerm === voteData.consensusTerm;
        if (isToggleOff) {
            setVoteData(d => {
                const nextConfirmCount = isConfirm ? d.confirmCount - 1 : d.confirmCount;
                const nextDisputeCount = !isConfirm ? d.disputeCount - 1 : d.disputeCount;
                return {
                    ...d,
                    currentUserVote: null,
                    totalVotes: d.totalVotes - 1,
                    confirmCount: nextConfirmCount,
                    disputeCount: nextDisputeCount,
                };
            });
        } else {
            setVoteData(d => {
                const addConfirm = isConfirm ? 1 : 0;
                const addDispute = !isConfirm ? 1 : 0;
                const rmConfirm = d.currentUserVote === d.consensusTerm ? 1 : 0;
                const rmDispute = d.currentUserVote && d.currentUserVote !== d.consensusTerm ? 1 : 0;

                const nextConfirmCount = d.confirmCount + addConfirm - rmConfirm;
                const nextDisputeCount = d.disputeCount + addDispute - rmDispute;

                let nextConsensus = d.consensusTerm;
                let nextConfirm = nextConfirmCount;
                let nextDispute = nextDisputeCount;

                // Optimistic: if we suggest a different term and current consensus has 0 votes,
                // the new suggested term wins immediately with 1 vote!
                if (!isConfirm && nextConfirmCount === 0) {
                    nextConsensus = suggestedTerm;
                    nextConfirm = 1;
                    nextDispute = 0;
                }

                return {
                    ...d,
                    consensusTerm: nextConsensus,
                    currentUserVote: suggestedTerm,
                    totalVotes: d.currentUserVote ? d.totalVotes : d.totalVotes + 1,
                    confirmCount: nextConfirm,
                    disputeCount: nextDispute,
                };
            });
        }
        try {
            const res = await voteOnCourseUpdate(course.code, suggestedTerm, defaultLastUpdate);
            if (res && res.voteData) {
                setVoteData(res.voteData);
            }
            setShowDisputeSelector(false);
            setSelectedDisputeTerm('');
        } catch {
            setVoteData(prev); // rollback on error
        } finally {
            setVoteLoading(false);
        }
    };

    // Comment Edit/Delete States
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentContent, setEditingCommentContent] = useState('');
    const [commentUpdatePending, startCommentUpdateTransition] = useTransition();

    // Review Edit Modal States & Handlers
    const { isOpen: isReviewEditOpen, onOpen: onReviewEditOpen, onOpenChange: onReviewEditOpenChange } = useDisclosure();
    const [selectedReviewForEdit, setSelectedReviewForEdit] = useState<Review | null>(null);
    const [editReviewTitle, setEditReviewTitle] = useState('');
    const [editReviewDescription, setEditReviewDescription] = useState('');
    const [editReviewOverallRating, setEditReviewOverallRating] = useState(5);
    const [editReviewDifficultyScore, setEditReviewDifficultyScore] = useState(3);
    const [editReviewUsefulnessScore, setEditReviewUsefulnessScore] = useState(3);
    const [editReviewEnjoymentScore, setEditReviewEnjoymentScore] = useState(3);
    const [editReviewTermTaken, setEditReviewTermTaken] = useState('');
    const [editReviewGrade, setEditReviewGrade] = useState('');
    const [editReviewIsAnonymous, setEditReviewIsAnonymous] = useState(false);
    const [editReviewErrors, setEditReviewErrors] = useState<Record<string, string>>({});
    const [hoveredEditStar, setHoveredEditStar] = useState<number | null>(null);
    const [reviewEditPending, startReviewEditTransition] = useTransition();

    const termsOptions = [
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

    const gradeOptions = [
        { value: 'F', label: 'Fail (F)' },
        { value: 'P', label: 'Pass (P)' },
        { value: 'C', label: 'Credit (C)' },
        { value: 'D', label: 'Distinction (D)' },
        { value: 'HD', label: 'High Distinction (HD)' },
        { value: 'WNF', label: 'Withdraw No Fail (WNF)' },
        { value: 'INC', label: 'Incomplete (INC)' },
    ];

    const handleReviewEditClick = (review: Review) => {
        setSelectedReviewForEdit(review);
        setEditReviewTitle(review.title);
        setEditReviewDescription(review.description);
        setEditReviewOverallRating(review.overallRating);
        setEditReviewDifficultyScore(review.difficultyScore);
        setEditReviewUsefulnessScore(review.usefulnessScore);
        setEditReviewEnjoymentScore(review.enjoymentScore);
        setEditReviewTermTaken(review.termTaken);
        setEditReviewGrade(review.grade || '');
        setEditReviewIsAnonymous(review.isAnonymous);
        setEditReviewErrors({});
        onReviewEditOpen();
    };

    const handleReviewEditSubmit = (onClose: () => void) => {
        setEditReviewErrors({});
        
        const errors: Record<string, string> = {};
        if (!editReviewTitle.trim()) errors.title = 'Title is required';
        if (!editReviewDescription.trim()) errors.description = 'Description is required';
        if (editReviewDescription.trim().length < 10) errors.description = 'Description must be at least 10 characters';
        if (!editReviewTermTaken) errors.termTaken = 'Term taken is required';

        if (Object.keys(errors).length > 0) {
            setEditReviewErrors(errors);
            return;
        }

        startReviewEditTransition(async () => {
            try {
                if (!selectedReviewForEdit) return;
                await updateReview(selectedReviewForEdit.id, {
                    title: editReviewTitle,
                    description: editReviewDescription,
                    overallRating: editReviewOverallRating,
                    difficultyScore: editReviewDifficultyScore,
                    usefulnessScore: editReviewUsefulnessScore,
                    enjoymentScore: editReviewEnjoymentScore,
                    termTaken: editReviewTermTaken,
                    grade: editReviewGrade || undefined,
                    isAnonymous: editReviewIsAnonymous,
                });
                onClose();
            } catch (err: any) {
                setEditReviewErrors({ submit: err.message || 'Failed to update review' });
            }
        });
    };

    const handleCommentEditSubmit = (commentId: string) => {
        if (!editingCommentContent.trim()) return;
        startCommentUpdateTransition(async () => {
            try {
                await updateComment(commentId, editingCommentContent);
                setEditingCommentId(null);
            } catch (err: any) {
                alert(err.message || 'Failed to update comment');
            }
        });
    };

    const handleCommentDelete = (commentId: string) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;
        startCommentUpdateTransition(async () => {
            try {
                await deleteComment(commentId);
            } catch (err: any) {
                alert(err.message || 'Failed to delete comment');
            }
        });
    };

    const handleReviewDelete = (reviewId: string) => {
        if (!confirm('Are you sure you want to delete this review? All associated comments and likes will be permanently removed.')) return;
        startCommentUpdateTransition(async () => {
            try {
                await deleteReview(reviewId);
            } catch (err: any) {
                alert(err.message || 'Failed to delete review');
            }
        });
    };

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
                            <span className="text-red font-extrabold">{comment.userName}</span>
                            <span>{formatLocalDate(comment.createdAt)}</span>
                        </div>
                        
                        {editingCommentId === comment.id ? (
                            <div className="flex flex-col gap-2 mt-2">
                                <Textarea
                                    size="sm"
                                    radius="none"
                                    value={editingCommentContent}
                                    onValueChange={setEditingCommentContent}
                                    minRows={1}
                                    className="font-mono w-full text-xs"
                                    classNames={{
                                        inputWrapper: "border-2 border-foreground bg-background rounded-none shadow-none group-data-[focus=true]:border-foreground",
                                        input: "placeholder:text-grey text-foreground",
                                    }}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button
                                        size="sm"
                                        radius="none"
                                        variant="flat"
                                        onPress={() => setEditingCommentId(null)}
                                        className="font-mono text-2xs uppercase border border-foreground"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        radius="none"
                                        isLoading={commentUpdatePending}
                                        onPress={() => handleCommentEditSubmit(comment.id)}
                                        className="font-mono text-2xs uppercase font-black bg-yellow text-black border border-foreground shadow-[2px_2px_0px_0px_#000]"
                                    >
                                        Save
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="font-mono text-sm font-bold text-foreground leading-snug tracking-tight">{comment.content}</p>
                        )}
                        
                        {/* Reply & Moderate Actions */}
                        <div className="flex flex-wrap gap-2 justify-start mt-2">
                            {session && editingCommentId !== comment.id && (
                                <Button
                                    size="sm"
                                    variant="flat"
                                    radius="none"
                                    startContent={<FaReply className="text-2xs" />}
                                    onPress={() => setActiveReplyId((prev) => ({ ...prev, [reviewId]: comment.id }))}
                                    className="h-6 font-mono text-[9px] uppercase font-black bg-background border border-foreground shadow-[1px_1px_0px_0px_#000] py-0.5 px-1.5 text-foreground cursor-pointer"
                                >
                                    Reply
                                </Button>
                            )}

                            {session && session.user.id === comment.userId && editingCommentId !== comment.id && (
                                <Button
                                    size="sm"
                                    variant="flat"
                                    radius="none"
                                    isIconOnly
                                    onPress={() => {
                                        setEditingCommentId(comment.id);
                                        setEditingCommentContent(comment.content);
                                    }}
                                    className="h-6 w-6 min-w-6 font-mono text-[9px] uppercase font-black bg-background border border-foreground shadow-[1px_1px_0px_0px_#000] p-0 text-foreground cursor-pointer flex items-center justify-center"
                                    title="Edit Comment"
                                    aria-label="Edit Comment"
                                >
                                    <FaEdit className="w-3 h-3 text-black dark:text-yellow" />
                                </Button>
                            )}

                            {session && (session.user.id === comment.userId || session.user.role === 'admin') && editingCommentId !== comment.id && (
                                <Button
                                    size="sm"
                                    variant="flat"
                                    radius="none"
                                    color="danger"
                                    isIconOnly
                                    onPress={() => handleCommentDelete(comment.id)}
                                    className="h-6 w-6 min-w-6 font-mono text-[9px] uppercase font-black bg-background text-red border border-red hover:bg-red hover:text-white shadow-[1px_1px_0px_0px_#000] p-0 cursor-pointer flex items-center justify-center"
                                    title="Delete Comment"
                                    aria-label="Delete Comment"
                                >
                                    <FaTrashAlt className="w-3 h-3 text-red-500 hover:text-white" />
                                </Button>
                            )}
                        </div>

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
                                    className="font-mono w-full"
                                    classNames={{
                                        inputWrapper: "border-2 border-foreground bg-background rounded-none shadow-none group-data-[focus=true]:border-foreground",
                                        input: "placeholder:text-grey text-foreground",
                                    }}
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
                                        className="font-mono text-2xs uppercase font-black bg-blue text-black border border-foreground shadow-[2px_2px_0px_0px_#000]"
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
        <div className="flex flex-col gap-8 md:gap-12 bg-grid-sheet mx-[-1.5rem] sm:mx-[-2rem] mt-[-2rem] px-6 sm:px-8 py-8 w-[calc(100%+3rem)] sm:w-[calc(100%+4rem)] min-h-screen items-center">
            <div className="max-w-screen-xl w-full flex flex-col gap-6">

            {/* Back navigation — full width strip above both columns */}
            <div className="flex items-center">
                <Button
                    as={Link}
                    href="/courses"
                    size="sm"
                    variant="flat"
                    className="font-mono uppercase font-black text-xs border-2 border-foreground bg-yellow text-black rounded-none shadow-[3px_3px_0px_0px_#000] rotate-[-2deg] hover:rotate-0 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                    &larr; Back to Courses
                </Button>
            </div>

            {/* Split Page Layout — tops aligned by items-stretch */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start w-full">
                
                {/* Left Column (2/3 Width - lg:col-span-2) */}
                <div className="lg:col-span-2 flex flex-col w-full">

                    {/* Unified Course Details Card (Combined with Scorecard) */}
                    <div className="flex flex-col gap-6 bg-background border-4 border-foreground p-6 sm:p-8 rounded-none shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] w-full h-full">
                        <div>
                            <span className="font-mixtape text-xs uppercase font-extrabold text-black bg-yellow border-2 border-foreground px-3 py-1 w-fit shadow-[2px_2px_0px_0px_#000] rotate-[-2deg] inline-block">{course.code}</span>
                            <h1 className="font-mixtape uppercase tracking-tighter text-3xl sm:text-5xl font-black mt-3 leading-none">{course.name}</h1>
                            <div className="flex flex-wrap gap-1.5 mt-4">
                                {course.terms.map((term) => (
                                    <Chip
                                        key={term}
                                        size="sm"
                                        radius="none"
                                        className={clsx(
                                            "border-2 border-foreground font-mono text-3xs font-extrabold",
                                            term === 'No Longer Offered'
                                                ? "bg-red text-white animate-pulse-custom"
                                                : "bg-blue text-black"
                                        )}
                                    >
                                        {term}
                                    </Chip>
                                ))}
                            </div>
                        </div>

                        {/* No Longer Offered Warning Banner */}
                        {course.isNoLongerOffered && (
                            <div className="flex items-start gap-3 bg-red/10 border-3 border-red p-4 rounded-none shadow-[3px_3px_0px_0px_#d11149] font-mono">
                                <span className="text-red text-xl mt-0.5 shrink-0">⚠</span>
                                <div className="flex flex-col gap-1">
                                    <span className="text-red text-xs font-black uppercase tracking-wider">Course No Longer Offered</span>
                                    <p className="text-foreground/80 text-xs leading-relaxed">
                                        This course is no longer offered by Adelaide University. Historical student reviews are preserved below for reference only.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Course Scorecard Aggregates (Combined) */}
                        <div className="border-t-3 border-foreground pt-6 flex flex-col md:flex-row gap-6 items-center md:items-stretch font-mono">
                            {/* Overall Rating */}
                            <div className="flex flex-col items-center justify-center bg-foreground/5 border-2 border-foreground p-5 rounded-none min-w-[180px] text-center">
                                <h3 className="font-mixtape text-[10px] uppercase font-extrabold text-foreground/50 tracking-wider">Overall Score</h3>
                                <span className="text-4xl font-mixtape font-black uppercase text-foreground bg-yellow border-2 border-foreground px-4 py-1.5 shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] rotate-[-2deg] mt-3.5 select-none hover:rotate-[2deg] hover:scale-105 transition-all duration-200 cursor-pointer">
                                    {stats.totalReviews > 0 ? stats.avgOverall.toFixed(1) : 'N/A'}
                                </span>
                                <div className="flex items-center gap-0.5 text-yellow-500 text-sm mt-3.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <MdStar
                                            key={star}
                                            className={clsx(
                                                'w-4 h-4',
                                                stats.totalReviews > 0 && star <= Math.round(stats.avgOverall) ? '' : 'opacity-25 text-foreground'
                                            )}
                                            fill={stats.totalReviews > 0 && star <= Math.round(stats.avgOverall) ? '#FAA307' : 'currentColor'}
                                            stroke="black"
                                            strokeWidth={1.2}
                                        />
                                    ))}
                                </div>
                                <span className="text-[10px] text-foreground/50 mt-2 font-black uppercase leading-none">
                                    Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
                                </span>
                            </div>

                            {/* EQ Metrics */}
                            <div className="flex-1 flex flex-col gap-4 justify-center w-full">
                                {/* Difficulty Slider Equivalent */}
                                <div className={clsx("flex flex-col gap-1 text-xs", stats.totalReviews === 0 && "opacity-40 select-none")}>
                                    <div className="flex justify-between font-black uppercase text-foreground">
                                        <span>DIFFICULTY</span>
                                        <span>{stats.totalReviews > 0 ? `${stats.avgDifficulty.toFixed(1)} / 5` : 'N/A'}</span>
                                    </div>
                                    <div className="flex gap-0.5 select-none">
                                        {Array.from({ length: 10 }).map((_, segmentIdx) => {
                                            const threshold = (segmentIdx + 1) / 2;
                                            const active = stats.totalReviews > 0 && stats.avgDifficulty >= threshold;
                                            return (
                                                <div
                                                    key={segmentIdx}
                                                    className={clsx(
                                                        "h-5 w-full border border-foreground rounded-none transition-all",
                                                        active
                                                            ? stats.avgDifficulty > 3.5 
                                                                ? "bg-red shadow-[1px_1px_0px_0px_#000]" 
                                                                : stats.avgDifficulty > 2.5 
                                                                    ? "bg-orange shadow-[1px_1px_0px_0px_#000]"
                                                                    : "bg-yellow shadow-[1px_1px_0px_0px_#000]"
                                                            : "bg-foreground/5"
                                                    )}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Usefulness Slider Equivalent */}
                                <div className={clsx("flex flex-col gap-1 text-xs", stats.totalReviews === 0 && "opacity-40 select-none")}>
                                    <div className="flex justify-between font-black uppercase text-foreground">
                                        <span>USEFULNESS</span>
                                        <span>{stats.totalReviews > 0 ? `${stats.avgUsefulness.toFixed(1)} / 5` : 'N/A'}</span>
                                    </div>
                                    <div className="flex gap-0.5 select-none">
                                        {Array.from({ length: 10 }).map((_, segmentIdx) => {
                                            const threshold = (segmentIdx + 1) / 2;
                                            const active = stats.totalReviews > 0 && stats.avgUsefulness >= threshold;
                                            return (
                                                <div
                                                    key={segmentIdx}
                                                    className={clsx(
                                                        "h-5 w-full border border-foreground rounded-none transition-all",
                                                        active
                                                            ? "bg-blue shadow-[1px_1px_0px_0px_#000]"
                                                            : "bg-foreground/5"
                                                    )}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Enjoyment Slider Equivalent */}
                                <div className={clsx("flex flex-col gap-1 text-xs", stats.totalReviews === 0 && "opacity-40 select-none")}>
                                    <div className="flex justify-between font-black uppercase text-foreground">
                                        <span>ENJOYMENT</span>
                                        <span>{stats.totalReviews > 0 ? `${stats.avgEnjoyment.toFixed(1)} / 5` : 'N/A'}</span>
                                    </div>
                                    <div className="flex gap-0.5 select-none">
                                        {Array.from({ length: 10 }).map((_, segmentIdx) => {
                                            const threshold = (segmentIdx + 1) / 2;
                                            const active = stats.totalReviews > 0 && stats.avgEnjoyment >= threshold;
                                            return (
                                                <div
                                                    key={segmentIdx}
                                                    className={clsx(
                                                        "h-5 w-full border border-foreground rounded-none transition-all",
                                                        active
                                                            ? "bg-yellow shadow-[1px_1px_0px_0px_#000]"
                                                            : "bg-foreground/5"
                                                    )}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick-info pills: coordinator, campus, units, level, elective */}
                        {(course.coordinator || course.campus || course.units || course.levelOfStudy || course.universityWideElective) && (
                            <div className="flex flex-wrap gap-3 bg-foreground/5 border-2 border-dashed border-foreground/30 p-4 rounded-none font-mono text-xs mt-6">
                                {course.coordinator && (
                                    <div className="flex items-center gap-1.5 text-xs font-black bg-red text-white px-2.5 py-1 border-2 border-foreground shadow-[1.5px_1.5px_0px_0px_#000] rotate-[-0.5deg]">
                                        <FaChalkboardTeacher />
                                        COORDINATOR: {course.coordinator}
                                    </div>
                                )}
                                {course.campus && (
                                    <div className="flex items-center gap-1.5 text-xs font-black bg-blue text-white px-2.5 py-1 border-2 border-foreground shadow-[1.5px_1.5px_0px_0px_#000] rotate-[0.5deg]">
                                        <FaBuilding />
                                        CAMPUS: {course.campus}
                                    </div>
                                )}
                                {course.units && (
                                    <div className="flex items-center gap-1.5 text-xs font-black bg-purple text-white px-2.5 py-1 border-2 border-foreground shadow-[1.5px_1.5px_0px_0px_#000] rotate-[-0.5deg]">
                                        <FaInfoCircle />
                                        UNITS: {course.units}
                                    </div>
                                )}
                                {course.levelOfStudy && (
                                    <div className="flex items-center gap-1.5 text-xs font-black bg-orange text-white px-2.5 py-1 border-2 border-foreground shadow-[1.5px_1.5px_0px_0px_#000] rotate-[0.5deg]">
                                        <FaChalkboardTeacher />
                                        LEVEL: {course.levelOfStudy}
                                    </div>
                                )}
                                {course.universityWideElective && (
                                    <div className="flex items-center gap-1.5 text-xs font-black bg-yellow text-black px-2.5 py-1 border-2 border-foreground shadow-[1.5px_1.5px_0px_0px_#000] rotate-[-0.5deg]">
                                        <FaCheckSquare className="w-3.5 h-3.5 shrink-0" />
                                        ELECTIVE: YES
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Last Major Update ── */}
                        <div className="border-t-3 border-foreground pt-5 flex flex-col gap-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-col gap-0.5">
                                    <h2 className="font-mixtape text-xs uppercase font-extrabold text-foreground/50 tracking-wider">Last Major Update</h2>
                                    <p className="font-mono font-black text-sm text-foreground">{voteData.consensusTerm}</p>
                                </div>
                                <div className="flex items-center gap-1.5 font-mono text-[10px] text-foreground/50 font-black uppercase">
                                    {voteData.totalVotes > 0 && (
                                        <span>{voteData.totalVotes} {voteData.totalVotes === 1 ? 'vote' : 'votes'}</span>
                                    )}
                                </div>
                            </div>

                            {/* Thumbs voting row */}
                            <div className="flex items-center gap-2">
                                {/* Thumbs Up — confirms current consensus */}
                                <button
                                    onClick={() => handleVote(voteData.consensusTerm)}
                                    disabled={voteLoading}
                                    className={clsx(
                                        "flex items-center gap-1.5 px-3 py-1.5 border-2 border-foreground font-mono font-black text-xs uppercase rounded-none transition-all duration-150",
                                        "hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                                        voteData.currentUserVote === voteData.consensusTerm
                                            ? "bg-yellow text-black border-2 border-foreground shadow-[2px_2px_0px_0px_#000]"
                                            : "bg-background text-foreground shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] hover:bg-foreground/10"
                                    )}
                                    title="Confirm — this term looks correct"
                                >
                                    <FaThumbsUp className="text-[10px]" />
                                    <span>Correct</span>
                                    {voteData.confirmCount > 0 && (
                                        <span className="bg-foreground/15 px-1 rounded-none">{voteData.confirmCount}</span>
                                    )}
                                </button>

                                {/* Thumbs Down — opens dispute selector */}
                                <button
                                    onClick={() => {
                                        if (!session) { onAuthOpen(); return; }
                                        setShowDisputeSelector(s => !s);
                                        setSelectedDisputeTerm('');
                                    }}
                                    disabled={voteLoading}
                                    className={clsx(
                                        "flex items-center gap-1.5 px-3 py-1.5 border-2 border-foreground font-mono font-black text-xs uppercase rounded-none transition-all duration-150",
                                        "hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                                        voteData.currentUserVote && voteData.currentUserVote !== voteData.consensusTerm
                                            ? "bg-red text-white border-red shadow-[2px_2px_0px_0px_#d11149]"
                                            : "bg-background text-foreground shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] hover:bg-red/10"
                                    )}
                                    title="Dispute — suggest the correct term"
                                >
                                    <FaThumbsDown className="text-[10px]" />
                                    <span>Outdated</span>
                                    {voteData.disputeCount > 0 && (
                                        <span className="bg-foreground/15 px-1 rounded-none">{voteData.disputeCount}</span>
                                    )}
                                </button>

                                {/* User's current dispute shown as chip */}
                                {voteData.currentUserVote && voteData.currentUserVote !== voteData.consensusTerm && !showDisputeSelector && (
                                    <span className="font-mono text-[10px] font-black text-red uppercase tracking-wider">
                                        You suggested: {voteData.currentUserVote}
                                    </span>
                                )}
                            </div>

                            {/* Inline dispute term selector */}
                            {showDisputeSelector && (
                                <div className="flex flex-wrap items-center gap-2 p-3 bg-foreground/5 border-2 border-dashed border-foreground/40 rounded-none">
                                    <span className="font-mono text-[10px] font-black uppercase text-foreground/60 w-full">Select the correct last major update term:</span>
                                    {mounted && (
                                        <Select
                                            size="sm"
                                            radius="none"
                                            placeholder="Pick a term..."
                                            selectedKeys={selectedDisputeTerm ? [selectedDisputeTerm] : []}
                                            onSelectionChange={(keys) => setSelectedDisputeTerm(Array.from(keys)[0] as string)}
                                            className="font-mono flex-1 min-w-[180px] h-10"
                                            classNames={{
                                                trigger: "border-2 border-foreground bg-background rounded-none shadow-none h-10 min-h-10 text-foreground",
                                                value: "text-foreground font-mono text-[10px] data-[placeholder=true]:text-grey",
                                            }}
                                            popoverProps={{
                                                classNames: {
                                                    base: "rounded-none",
                                                    content: "rounded-none border-3 border-foreground bg-background text-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] p-1"
                                                }
                                            }}
                                            listboxProps={{
                                                itemClasses: {
                                                    base: "rounded-none data-[hover=true]:bg-secondary data-[hover=true]:text-white font-mono text-xs",
                                                }
                                            }}
                                            aria-label="Select correct term"
                                        >
                                            {UPDATE_TERM_OPTIONS.filter(t => t !== voteData.consensusTerm).map(term => (
                                                <SelectItem key={term} textValue={term} className="font-mono text-xs rounded-none">
                                                    {term}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    )}
                                    <button
                                        onClick={() => selectedDisputeTerm && handleVote(selectedDisputeTerm)}
                                        disabled={!selectedDisputeTerm || voteLoading}
                                        className="font-mono font-black text-xs uppercase px-4 py-2 bg-foreground text-background border-2 border-foreground rounded-none shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] hover:scale-105 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed h-10"
                                    >
                                        Submit
                                    </button>
                                    <button
                                        onClick={() => setShowDisputeSelector(false)}
                                        className="font-mono font-black text-xs uppercase px-3 py-2 bg-background text-foreground border-2 border-foreground/40 rounded-none hover:bg-foreground/10 transition-all duration-150 h-10"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

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
                </div>

                {/* Right Column (1/3 Width - lg:col-span-1) */}
                <div className="lg:col-span-1 flex flex-col gap-5 w-full relative">
                    {/* View Official Course Outline Button (Top Right, Rotated Right) */}
                    {!course.isNoLongerOffered && (
                        <div className="absolute -top-[52px] right-2 z-10">
                            <Button
                                as="a"
                                href={course.officialLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                size="sm"
                                className="font-mono uppercase font-black text-xs border-2 border-foreground bg-blue text-black rounded-none shadow-[3px_3px_0px_0px_#000] rotate-[2deg] hover:rotate-0 hover:scale-105 active:scale-95 transition-all duration-200 px-4 py-2 w-fit flex items-center gap-2"
                            >
                                View Official Course Outline &rarr;
                            </Button>
                        </div>
                    )}

                    {/* Student Reviews Box */}
                    <div className="flex flex-col gap-5 bg-background border-4 border-foreground p-5 rounded-none shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] w-full">
                    {/* Reviews Grid Header */}
                    <div className="flex flex-col gap-4 border-b-4 border-foreground pb-4">
                        <div>
                            <h1 className="font-mixtape uppercase tracking-tighter text-2xl sm:text-3xl font-extrabold bg-red text-white w-fit px-3 py-1 border-3 border-foreground shadow-[3px_3px_0px_0px_#000] rotate-[-1.5deg] select-none hover:rotate-[1deg] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer">Student Reviews</h1>
                            <p className="font-mono text-xs text-foreground/80 mt-3 font-bold leading-relaxed">Read about actual class experiences and sub-scores.</p>
                        </div>

                        <div className="flex items-center gap-3 w-full justify-between">
                            {mounted ? (
                                <Select
                                    size="sm"
                                    radius="none"
                                    label="Sort Feed"
                                    selectedKeys={[sortBy]}
                                    onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as string)}
                                    className="w-28 sm:w-32 font-mono h-10"
                                    classNames={{
                                        trigger: "border-2 border-foreground bg-background rounded-none shadow-none h-10 min-h-10 text-foreground",
                                        value: "text-foreground font-mono text-[10px] data-[placeholder=true]:text-grey dark:data-[placeholder=true]:text-grey",
                                    }}
                                    popoverProps={{
                                        classNames: {
                                            base: "rounded-none",
                                            content: "rounded-none border-3 border-foreground bg-background text-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] p-1"
                                        }
                                    }}
                                    listboxProps={{
                                        itemClasses: {
                                            base: "rounded-none data-[hover=true]:bg-secondary data-[hover=true]:text-white font-mono text-xs",
                                        }
                                    }}
                                    aria-label="Sort reviews"
                                >
                                    <SelectItem key="recent" textValue="Most Recent" className="font-mono text-[10px] rounded-none">Most Recent</SelectItem>
                                    <SelectItem key="rating-desc" textValue="Highest Rated" className="font-mono text-[10px] rounded-none">Highest Rated</SelectItem>
                                    <SelectItem key="rating-asc" textValue="Lowest Rated" className="font-mono text-[10px] rounded-none">Lowest Rated</SelectItem>
                                </Select>
                            ) : (
                                <div className="h-10 w-32 bg-background border-2 border-foreground animate-pulse" />
                            )}

                            <Button
                                color="primary"
                                size="sm"
                                radius="none"
                                className="h-10 min-h-10 font-mono text-xs uppercase font-black bg-yellow text-black border-2 border-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] hover:scale-105 active:scale-95 transition-all duration-200 animate-pulse-custom"
                                onPress={session ? onOpen : onAuthOpen}
                            >
                                Write Review
                            </Button>
                        </div>
                    </div>

                    {/* Scrollable Reviews Feed Container */}
                    <div className="flex flex-col gap-6 max-h-[850px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                        {sortedReviews.length === 0 ? (
                            <div className="text-center py-12 bg-background border-4 border-dashed border-foreground rounded-none">
                                <FaGraduationCap className="text-foreground text-4xl mx-auto mb-3" />
                                <p className="font-mixtape font-extrabold uppercase text-base">No reviews yet</p>
                                <p className="font-mono text-xs mt-2 text-foreground/60">Be the first student to review this course!</p>
                            </div>
                        ) : (
                            sortedReviews.map((review, idx) => {
                                const isExpanded = expandedReviews[review.id];
                                const shouldTruncate = review.description.length > 180;

                                return (
                                    <motion.div
                                        key={review.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.4) }}
                                    >
                                        <Card className="bg-background border-3 border-foreground rounded-none shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:shadow-[6px_6px_0px_0px_#000] dark:hover:shadow-[6px_6px_0px_0px_#fff] hover:-translate-y-0.5 transition-all duration-200">
                                            <CardBody className="p-4 flex flex-col gap-3">
                                                
                                                {/* Review Header */}
                                                <div className="flex flex-col gap-1.5 border-b-2 border-foreground pb-2">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h3 className="font-mixtape uppercase tracking-tight text-base font-extrabold text-foreground leading-tight">{review.title}</h3>
                                                                                        <div className="flex items-center gap-1 bg-yellow text-black border border-foreground px-1.5 py-0.5 rounded-none font-mono font-black text-[10px] shrink-0">
                                                            <MdStar
                                                                className="w-3 h-3"
                                                                fill="#FAA307"
                                                                stroke="black"
                                                                strokeWidth={1.2}
                                                            />
                                                            <span>{review.overallRating.toFixed(1)}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-mono uppercase font-black text-foreground/60 leading-none">
                                                        <span className="text-red">{review.isAnonymous ? 'Anonymous' : review.reviewerName}</span>
                                                        <span className="px-0.5 text-foreground/30">|</span>
                                                        <span>{formatLocalDate(review.createdAt)}</span>
                                                        {review.grade && (
                                                            <>
                                                                <span className="px-0.5 text-foreground/30">|</span>
                                                                <span className="text-yellow bg-black px-1 border border-foreground font-bold">Grade: {review.grade}</span>
                                                            </>
                                                        )}
                                                        <span className="px-0.5 text-foreground/30">|</span>
                                                        <span className="text-foreground/75 font-semibold">Term taken: {review.termTaken}</span>
                                                        
                                                        {(session?.user?.id === review.userId || session?.user?.role === 'admin') && (
                                                            <>
                                                                <span className="px-0.5 text-foreground/30">|</span>
                                                                <button
                                                                    onClick={() => handleReviewEditClick(review)}
                                                                    className="text-yellow hover:scale-105 font-extrabold cursor-pointer uppercase text-[9px] flex items-center gap-1 transition-all"
                                                                    title="Edit Review"
                                                                >
                                                                    <FaEdit className="w-3 h-3 text-black dark:text-yellow" />
                                                                    <span>Edit</span>
                                                                </button>
                                                                <span className="px-0.5 text-foreground/30">|</span>
                                                                <button
                                                                    onClick={() => handleReviewDelete(review.id)}
                                                                    className="text-red hover:scale-105 font-extrabold cursor-pointer uppercase text-[9px] flex items-center gap-1 transition-all"
                                                                    title="Delete Review"
                                                                >
                                                                    <FaTrashAlt className="w-3 h-3 text-red-500" />
                                                                    <span>Delete</span>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Review Content */}
                                                <div>
                                                    <p className={clsx(
                                                        'text-xs font-mono text-foreground/80 leading-relaxed whitespace-pre-line',
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
                                                            className="font-mono text-[9px] uppercase font-extrabold h-5 mt-1 p-0 hover:underline min-w-0"
                                                        >
                                                            {isExpanded ? 'See Less' : 'See More'}
                                                        </Button>
                                                    )}
                                                </div>

                                                {/* Sub-scores Metrics */}
                                                <div className="flex flex-wrap gap-2.5 bg-background border border-foreground p-2 rounded-none text-[9px] font-mono font-black text-foreground/75 w-fit">
                                                    <span>DIFFICULTY: <span className={review.difficultyScore > 3.5 ? 'text-red' : 'text-yellow'}>{review.difficultyScore}/5</span></span>
                                                    <span>USEFULNESS: <span className="text-blue">{review.usefulnessScore}/5</span></span>
                                                    <span>ENJOYMENT: <span className="text-yellow">{review.enjoymentScore}/5</span></span>
                                                </div>

                                                {/* Review Actions Panel: Like & Comments */}
                                                <div className="border-t border-dashed border-foreground/30 pt-2 flex flex-col gap-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            radius="none"
                                                            variant="flat"
                                                            isLoading={likeTransition}
                                                            onPress={() => handleLike(review.id)}
                                                            startContent={review.likedByCurrentUser ? <FaHeart className="text-black" /> : <FaRegHeart />}
                                                            className={clsx(
                                                                "font-mono text-[9px] h-6 px-2 uppercase font-black border border-foreground shadow-[1px_1px_0px_0px_#000] transition-all",
                                                                review.likedByCurrentUser ? "bg-red text-white" : "bg-background text-foreground"
                                                            )}
                                                        >
                                                            Like{review.likesCount > 0 && ` (${review.likesCount})`}
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            radius="none"
                                                            variant="flat"
                                                            startContent={<FaComments />}
                                                            onPress={() => setActiveReplyId((prev) => ({
                                                                ...prev,
                                                                [review.id]: activeReplyId[review.id] === 'root' ? null : 'root'
                                                            }))}
                                                            className="font-mono text-[9px] h-6 px-2 uppercase font-black bg-background border border-foreground shadow-[1px_1px_0px_0px_#000] text-foreground"
                                                        >
                                                            Comments ({review.comments.length})
                                                        </Button>
                                                    </div>

                                                    {/* Comments Feed Panel */}
                                                    <div className="bg-foreground/[0.03] p-3 rounded-none border border-dashed border-foreground/35 flex flex-col gap-2.5">
                                                        <h4 className="font-mixtape text-[9px] uppercase font-extrabold text-foreground/50 tracking-wider">Comments Feed</h4>

                                                        {/* Thread Root Input */}
                                                        {session && activeReplyId[review.id] === 'root' && (
                                                            <div className="flex flex-col gap-1.5 mt-1">
                                                                <Textarea
                                                                    size="sm"
                                                                    radius="none"
                                                                    placeholder="Write a comment..."
                                                                    value={commentContent[`${review.id}-root`] || ''}
                                                                    onValueChange={(val) => setCommentContent((prev) => ({ ...prev, [`${review.id}-root`]: val }))}
                                                                    minRows={2}
                                                                    className="font-mono w-full text-xs"
                                                                    classNames={{
                                                                        inputWrapper: "border border-foreground bg-background rounded-none shadow-none group-data-[focus=true]:border-foreground",
                                                                        input: "placeholder:text-grey text-foreground",
                                                                    }}
                                                                />
                                                                <div className="flex justify-end gap-1.5">
                                                                    <Button
                                                                        size="sm"
                                                                        radius="none"
                                                                        variant="flat"
                                                                        onPress={() => setActiveReplyId((prev) => ({ ...prev, [review.id]: null }))}
                                                                        className="font-mono text-[9px] h-5 border border-foreground py-0.5 px-1.5"
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        radius="none"
                                                                        isLoading={commentTransition}
                                                                        onPress={() => handleCommentSubmit(review.id)}
                                                                        className="font-mono text-[9px] h-5 uppercase font-black bg-yellow text-black border border-foreground shadow-[1px_1px_0px_0px_#000] py-0.5 px-1.5"
                                                                    >
                                                                        Add a Comment
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {review.comments.length === 0 ? (
                                                            <p className="font-mono text-[9px] text-foreground/50 font-semibold italic py-1">No comments yet.</p>
                                                        ) : (
                                                            renderCommentThread(review.id, review.comments)
                                                        )}
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>

            {/* Submission review Modal */}
            <ReviewModal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                courseCode={course.code}
                courseName={course.name}
            />

            {/* Authentication Required Modal */}
            <Modal
                isOpen={isAuthOpen}
                onOpenChange={onAuthOpenChange}
                backdrop="blur"
                classNames={{
                    base: "border-4 border-foreground rounded-none bg-background shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] p-4 font-mono",
                    closeButton: "rounded-none border border-foreground/30 hover:bg-foreground/10"
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 items-center pt-8">
                                <div className="w-12 h-12 bg-grey text-black border-2 border-foreground rounded-full flex items-center justify-center mb-2 shadow-[2px_2px_0px_0px_#000] select-none">
                                    <FaLock className="text-lg" />
                                </div>
                                <span className="text-xl font-extrabold text-foreground tracking-tight">Authentication Required</span>
                            </ModalHeader>
                            <ModalBody className="text-center px-6 py-4 flex flex-col gap-3">
                                <p className="text-xs text-foreground/80 font-black uppercase tracking-wider">
                                    By students, for students — Adelaide University's course guide.
                                </p>
                                <p className="text-xs text-foreground/80 leading-relaxed bg-background p-4 rounded-none border-2 border-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] text-left">
                                    You need to be logged into your <span className="font-extrabold text-red">CS Club account</span> to write a review. This helps us ensure reviews are written by genuine students and maintain high academic standards.
                                </p>
                                <div className="flex items-center justify-center gap-2 text-2xs text-foreground/75 font-black uppercase bg-yellow/10 p-2.5 rounded-none border-2 border-dashed border-foreground/30">
                                    <FaUserShield className="text-yellow text-xs shrink-0" />
                                    <span>Posting anonymously is fully supported if checked on submission.</span>
                                </div>
                            </ModalBody>
                            <ModalFooter className="flex justify-end gap-3 pt-4 px-6 pb-2">
                                <Button
                                    variant="flat"
                                    onPress={onClose}
                                    className="font-mono text-xs uppercase font-black bg-grey dark:bg-grey/25 text-foreground hover:bg-grey/80 border-2 border-foreground rounded-none h-9 px-4"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onPress={() => {
                                        onClose();
                                        signIn('keycloak');
                                    }}
                                    className="font-mono text-xs uppercase font-black bg-yellow text-black border-2 border-foreground rounded-none shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000] dark:hover:shadow-[4px_4px_0px_0px_#fff] active:translate-x-[1px] active:translate-y-[1px] transition-all h-9 px-4"
                                >
                                    Log In with Keycloak
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Custom Edit Review Modal */}
            <Modal isOpen={isReviewEditOpen} onOpenChange={onReviewEditOpenChange} size="2xl" scrollBehavior="inside" className="bg-background border-4 border-foreground text-foreground rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] font-mono">
                <ModalContent className="rounded-none">
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 border-b-3 border-foreground px-6 py-4">
                                <span className="font-mixtape text-xs uppercase font-extrabold text-black bg-yellow border-2 border-foreground px-2 py-0.5 w-fit shadow-[2px_2px_0px_0px_#000] rotate-[-2deg] inline-block mb-1">
                                    {course.code}
                                </span>
                                <h2 className="font-mixtape uppercase text-xl font-extrabold tracking-tight">Edit Your Review</h2>
                                <p className="font-mono text-xs text-foreground/80 font-bold rotate-[0.5deg]">
                                    Modify your rating, score weights, or text comments.
                                </p>
                            </ModalHeader>

                            <ModalBody className="gap-6 py-4">
                                {editReviewErrors.submit && (
                                    <div className="text-xs text-red bg-red/10 border-2 border-red p-3 rounded-none font-mono font-black">
                                        {editReviewErrors.submit}
                                    </div>
                                )}

                                {/* Star Selector */}
                                <div className="flex flex-col gap-2 font-mono">
                                    <label className="text-xs font-black uppercase text-foreground">Overall Star Rating</label>
                                    <div className="flex items-center gap-1.5 text-2xl">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <MdStar
                                                key={star}
                                                className={clsx(
                                                    'w-6 h-6 cursor-pointer transition-colors duration-200',
                                                    star <= (hoveredEditStar ?? editReviewOverallRating) ? '' : 'opacity-25 text-foreground'
                                                )}
                                                fill={star <= (hoveredEditStar ?? editReviewOverallRating) ? '#FAA307' : 'currentColor'}
                                                stroke="black"
                                                strokeWidth={1.2}
                                                onClick={() => setEditReviewOverallRating(star)}
                                                onMouseEnter={() => setHoveredEditStar(star)}
                                                onMouseLeave={() => setHoveredEditStar(null)}
                                            />
                                        ))}
                                        <span className="text-xs font-black text-foreground/60 ml-2">
                                            ({editReviewOverallRating} of 5)
                                        </span>
                                    </div>
                                    {editReviewErrors.overallRating && <p className="text-3xs text-red font-bold">{editReviewErrors.overallRating}</p>}
                                </div>

                                {/* EQ Sliders Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-foreground/[0.03] p-4 border-2 border-dashed border-foreground/30">
                                    
                                    {/* Difficulty */}
                                    <div className="flex flex-col gap-1 font-mono">
                                        <Slider
                                            label="Difficulty"
                                            size="md"
                                            radius="none"
                                            step={0.5}
                                            maxValue={5}
                                            minValue={0.5}
                                            value={editReviewDifficultyScore}
                                            onChange={(val) => setEditReviewDifficultyScore(val as number)}
                                            aria-label="Difficulty slider score"
                                            className="w-full"
                                            classNames={{
                                                track: "border-2 border-foreground h-3 rounded-none bg-foreground/5 dark:bg-foreground/15",
                                                filler: "bg-red border-r-2 border-foreground rounded-none",
                                                thumb: "rounded-none w-4 h-6 bg-white dark:bg-black border-2 border-foreground shadow-[2px_2px_0px_0px_#000] after:hidden group-data-[dragging=true]:scale-105 transition-all cursor-grab active:cursor-grabbing",
                                                label: "text-foreground font-mixtape font-bold text-xs uppercase",
                                                value: "text-foreground font-mono font-black text-xs",
                                            }}
                                        />
                                        <span className="text-[10px] text-foreground/60 text-right font-mono font-black uppercase tracking-wider mt-1">
                                            {editReviewDifficultyScore >= 4.5 ? 'Extreme' : editReviewDifficultyScore >= 3.5 ? 'Hard' : editReviewDifficultyScore >= 2.5 ? 'Medium' : editReviewDifficultyScore >= 1.5 ? 'Easy' : 'Trivial'}
                                        </span>
                                    </div>

                                    {/* Usefulness */}
                                    <div className="flex flex-col gap-1 font-mono">
                                        <Slider
                                            label="Usefulness"
                                            size="md"
                                            radius="none"
                                            step={0.5}
                                            maxValue={5}
                                            minValue={0.5}
                                            value={editReviewUsefulnessScore}
                                            onChange={(val) => setEditReviewUsefulnessScore(val as number)}
                                            aria-label="Usefulness slider score"
                                            className="w-full"
                                            classNames={{
                                                track: "border-2 border-foreground h-3 rounded-none bg-foreground/5 dark:bg-foreground/15",
                                                filler: "bg-blue border-r-2 border-foreground rounded-none",
                                                thumb: "rounded-none w-4 h-6 bg-white dark:bg-black border-2 border-foreground shadow-[2px_2px_0px_0px_#000] after:hidden group-data-[dragging=true]:scale-105 transition-all cursor-grab active:cursor-grabbing",
                                                label: "text-foreground font-mixtape font-bold text-xs uppercase",
                                                value: "text-foreground font-mono font-black text-xs",
                                            }}
                                        />
                                        <span className="text-[10px] text-foreground/60 text-right font-mono font-black uppercase tracking-wider mt-1">
                                            {editReviewUsefulnessScore >= 4.5 ? 'Crucial' : editReviewUsefulnessScore >= 3.5 ? 'Very Useful' : editReviewUsefulnessScore >= 2.5 ? 'Useful' : editReviewUsefulnessScore >= 1.5 ? 'Slightly Useful' : 'Useless'}
                                        </span>
                                    </div>

                                    {/* Enjoyment */}
                                    <div className="flex flex-col gap-1 font-mono">
                                        <Slider
                                            label="Enjoyment"
                                            size="md"
                                            radius="none"
                                            step={0.5}
                                            maxValue={5}
                                            minValue={0.5}
                                            value={editReviewEnjoymentScore}
                                            onChange={(val) => setEditReviewEnjoymentScore(val as number)}
                                            aria-label="Enjoyment slider score"
                                            className="w-full"
                                            classNames={{
                                                track: "border-2 border-foreground h-3 rounded-none bg-foreground/5 dark:bg-foreground/15",
                                                filler: "bg-yellow border-r-2 border-foreground rounded-none",
                                                thumb: "rounded-none w-4 h-6 bg-white dark:bg-black border-2 border-foreground shadow-[2px_2px_0px_0px_#000] after:hidden group-data-[dragging=true]:scale-105 transition-all cursor-grab active:cursor-grabbing",
                                                label: "text-foreground font-mixtape font-bold text-xs uppercase",
                                                value: "text-foreground font-mono font-black text-xs",
                                            }}
                                        />
                                        <span className="text-[10px] text-foreground/60 text-right font-mono font-black uppercase tracking-wider mt-1">
                                            {editReviewEnjoymentScore >= 4.5 ? 'Love it' : editReviewEnjoymentScore >= 3.5 ? 'Great' : editReviewEnjoymentScore >= 2.5 ? 'Fun' : editReviewEnjoymentScore >= 1.5 ? 'Okay' : 'Hated it'}
                                        </span>
                                    </div>

                                </div>

                                {/* Terms & Grades selectors */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Select
                                            label="Term Taken"
                                            radius="none"
                                            placeholder="Select Semester"
                                            selectedKeys={editReviewTermTaken ? [editReviewTermTaken] : []}
                                            onSelectionChange={(keys) => setEditReviewTermTaken(Array.from(keys)[0] as string)}
                                            errorMessage={editReviewErrors.termTaken}
                                            isInvalid={!!editReviewErrors.termTaken}
                                            aria-label="Select term taken"
                                            className="font-mono"
                                            classNames={{
                                                trigger: "border-2 border-foreground bg-background rounded-none shadow-none text-foreground",
                                                value: "text-foreground font-mono data-[placeholder=true]:text-grey dark:data-[placeholder=true]:text-grey",
                                            }}
                                            popoverProps={{
                                                classNames: {
                                                    base: "rounded-none",
                                                    content: "rounded-none border-3 border-foreground bg-background text-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] p-1"
                                                }
                                            }}
                                            listboxProps={{
                                                itemClasses: {
                                                    base: "rounded-none data-[hover=true]:bg-secondary data-[hover=true]:text-white font-mono text-xs",
                                                }
                                            }}
                                        >
                                            {termsOptions.map((term) => (
                                                <SelectItem key={term} textValue={term} className="font-mono text-xs rounded-none">{term}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>

                                    <div>
                                        <Select
                                            label="Grade Received (Optional)"
                                            radius="none"
                                            placeholder="Select Grade"
                                            selectedKeys={editReviewGrade ? [editReviewGrade] : []}
                                            onSelectionChange={(keys) => setEditReviewGrade(Array.from(keys)[0] as string)}
                                            errorMessage={editReviewErrors.grade}
                                            isInvalid={!!editReviewErrors.grade}
                                            aria-label="Select grade received"
                                            className="font-mono"
                                            classNames={{
                                                trigger: "border-2 border-foreground bg-background rounded-none shadow-none text-foreground",
                                                value: "text-foreground font-mono data-[placeholder=true]:text-grey dark:data-[placeholder=true]:text-grey",
                                            }}
                                            popoverProps={{
                                                classNames: {
                                                    base: "rounded-none",
                                                    content: "rounded-none border-3 border-foreground bg-background text-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] p-1"
                                                }
                                            }}
                                            listboxProps={{
                                                itemClasses: {
                                                    base: "rounded-none data-[hover=true]:bg-secondary data-[hover=true]:text-white font-mono text-xs",
                                                }
                                            }}
                                        >
                                            {gradeOptions.map((g) => (
                                                <SelectItem key={g.value} textValue={g.label} className="font-mono text-xs rounded-none">{g.label}</SelectItem>
                                            ))}
                                        </Select>
                                    </div>
                                </div>

                                {/* Review Title Input */}
                                <div className="flex flex-col gap-2 font-mono">
                                    <label className="text-xs font-black uppercase text-foreground">Review Headline</label>
                                    <Input
                                        placeholder="e.g. Great lectures, tough exam!"
                                        radius="none"
                                        value={editReviewTitle}
                                        onValueChange={setEditReviewTitle}
                                        errorMessage={editReviewErrors.title}
                                        isInvalid={!!editReviewErrors.title}
                                        classNames={{
                                            inputWrapper: "border-2 border-foreground bg-background rounded-none shadow-none group-data-[focus=true]:border-foreground",
                                            input: "placeholder:text-grey text-foreground",
                                        }}
                                    />
                                </div>

                                {/* Review Description Textarea */}
                                <div className="flex flex-col gap-2 font-mono">
                                    <label className="text-xs font-black uppercase text-foreground">Detailed Review Comments</label>
                                    <Textarea
                                        placeholder="Write your review here... Be as specific as possible to help future students!"
                                        radius="none"
                                        minRows={4}
                                        value={editReviewDescription}
                                        onValueChange={setEditReviewDescription}
                                        errorMessage={editReviewErrors.description}
                                        isInvalid={!!editReviewErrors.description}
                                        classNames={{
                                            inputWrapper: "border-2 border-foreground bg-background rounded-none shadow-none group-data-[focus=true]:border-foreground",
                                            input: "placeholder:text-grey text-foreground",
                                        }}
                                    />
                                </div>

                                {/* Anonymous Checkbox */}
                                <div className="flex items-center gap-2 font-mono">
                                    <input
                                        type="checkbox"
                                        id="editReviewAnonymous"
                                        checked={editReviewIsAnonymous}
                                        onChange={(e) => setEditReviewIsAnonymous(e.target.checked)}
                                        className="h-4 w-4 border-2 border-foreground accent-foreground cursor-pointer rounded-none"
                                    />
                                    <label htmlFor="editReviewAnonymous" className="text-xs font-black uppercase text-foreground/80 cursor-pointer select-none">
                                        Post anonymously (Hide my real name)
                                    </label>
                                </div>
                            </ModalBody>

                            <ModalFooter className="flex justify-end gap-3 pt-4 px-6 pb-4 border-t-2 border-dashed border-foreground/30">
                                <Button
                                    variant="flat"
                                    onPress={onClose}
                                    className="font-mono text-xs uppercase font-black bg-grey dark:bg-grey/25 text-foreground hover:bg-grey/80 border-2 border-foreground rounded-none h-10 px-6"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    isLoading={reviewEditPending}
                                    onPress={() => handleReviewEditSubmit(onClose)}
                                    className="font-mono text-xs uppercase font-black bg-yellow text-black border-2 border-foreground rounded-none shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000] dark:hover:shadow-[4px_4px_0px_0px_#fff] active:translate-x-[1px] active:translate-y-[1px] transition-all h-10 px-6"
                                >
                                    Save Changes
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
            </div>
        </div>
    );
};
