'use client';

import {
    Button,
    Card,
    CardBody,
    Checkbox,
    Chip,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    Slider,
    Textarea,
    useDisclosure,
} from '@heroui/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
    FaComments,
    FaEdit,
    FaExternalLinkAlt,
    FaGraduationCap,
    FaTrashAlt,
} from 'react-icons/fa';
import { MdStar } from 'react-icons/md';
import { clsx } from 'clsx';
import { z } from 'zod';

import { deleteComment, deleteReview, updateComment, updateReview } from '@/app/actions/reviews';
import { formatLocalDate } from '@/lib/date-utils';

// Schema for validation
const ReviewEditSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(100),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
    overallRating: z.number().int().min(1).max(5),
    difficultyScore: z.number().min(0.5).max(5),
    usefulnessScore: z.number().min(0.5).max(5),
    enjoymentScore: z.number().min(0.5).max(5),
    termTaken: z.string().min(1, 'Term Taken is required'),
    grade: z.string().optional(),
    isAnonymous: z.boolean().default(false),
});

interface CommentContribution {
    id: string;
    content: string;
    createdAt: Date;
    reviewId: string;
    courseCode: string;
    reviewTitle: string;
}

interface ReviewContribution {
    id: string;
    courseCode: string;
    title: string;
    description: string;
    overallRating: number;
    difficultyScore: number;
    usefulnessScore: number;
    enjoymentScore: number;
    termTaken: string;
    grade: string | null;
    isAnonymous: boolean;
    createdAt: Date;
}

interface MyReviewsClientProps {
    reviews: ReviewContribution[];
    comments: CommentContribution[];
    courseMap: Record<string, string>;
}

export const MyReviewsClient = ({ reviews, comments, courseMap }: MyReviewsClientProps) => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'reviews' | 'comments'>('reviews');
    const [actionTransition, startActionTransition] = useTransition();

    // Comment Edit States
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentContent, setEditingCommentContent] = useState('');

    // Review Edit Modal States
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [selectedReview, setSelectedReview] = useState<ReviewContribution | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editOverallRating, setEditOverallRating] = useState(5);
    const [editDifficultyScore, setEditDifficultyScore] = useState(3);
    const [editUsefulnessScore, setEditUsefulnessScore] = useState(3);
    const [editEnjoymentScore, setEditEnjoymentScore] = useState(3);
    const [editTermTaken, setEditTermTaken] = useState('');
    const [editGrade, setEditGrade] = useState('');
    const [editIsAnonymous, setEditIsAnonymous] = useState(false);
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [hoveredStar, setHoveredStar] = useState<number | null>(null);

    // Comment CRUD triggers
    const handleCommentEditClick = (comment: CommentContribution) => {
        setEditingCommentId(comment.id);
        setEditingCommentContent(comment.content);
    };

    const handleCommentEditCancel = () => {
        setEditingCommentId(null);
        setEditingCommentContent('');
    };

    const handleCommentEditSubmit = (commentId: string) => {
        if (!editingCommentContent.trim()) return;
        startActionTransition(async () => {
            try {
                await updateComment(commentId, editingCommentContent);
                setEditingCommentId(null);
                setEditingCommentContent('');
            } catch (err: any) {
                alert(err.message || 'Failed to update comment');
            }
        });
    };

    const handleCommentDeleteClick = (commentId: string) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;
        startActionTransition(async () => {
            try {
                await deleteComment(commentId);
            } catch (err: any) {
                alert(err.message || 'Failed to delete comment');
            }
        });
    };

    // Review CRUD triggers
    const handleReviewDeleteClick = (reviewId: string) => {
        if (!confirm('Are you sure you want to delete this review? This will permanently remove all sub-scores, likes, and nested comments.')) return;
        startActionTransition(async () => {
            try {
                await deleteReview(reviewId);
            } catch (err: any) {
                alert(err.message || 'Failed to delete review');
            }
        });
    };

    const handleReviewEditClick = (review: ReviewContribution) => {
        setSelectedReview(review);
        setEditTitle(review.title);
        setEditDescription(review.description);
        setEditOverallRating(review.overallRating);
        setEditDifficultyScore(review.difficultyScore);
        setEditUsefulnessScore(review.usefulnessScore);
        setEditEnjoymentScore(review.enjoymentScore);
        setEditTermTaken(review.termTaken);
        setEditGrade(review.grade || '');
        setEditIsAnonymous(review.isAnonymous);
        setEditErrors({});
        onOpen();
    };

    const handleReviewEditSubmit = (onClose: () => void) => {
        if (!selectedReview) return;
        setEditErrors({});

        const formData = {
            title: editTitle,
            description: editDescription,
            overallRating: editOverallRating,
            difficultyScore: editDifficultyScore,
            usefulnessScore: editUsefulnessScore,
            enjoymentScore: editEnjoymentScore,
            termTaken: editTermTaken,
            grade: editGrade || undefined,
            isAnonymous: editIsAnonymous,
        };

        const result = ReviewEditSchema.safeParse(formData);

        if (!result.success) {
            const newErrors: Record<string, string> = {};
            result.error.issues.forEach((issue) => {
                const path = issue.path[0] as string;
                newErrors[path] = issue.message;
            });
            setEditErrors(newErrors);
            return;
        }

        startActionTransition(async () => {
            try {
                await updateReview(selectedReview.id, result.data);
                onClose();
            } catch (err: any) {
                setEditErrors({ submit: err.message || 'Failed to update review' });
            }
        });
    };

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
        { label: 'High Distinction (HD)', value: 'HD' },
        { label: 'Distinction (D)', value: 'D' },
        { label: 'Credit (C)', value: 'C' },
        { label: 'Pass (P)', value: 'P' },
        { label: 'Fail (F)', value: 'F' },
        { label: 'Withdrawn (WDN)', value: 'WDN' },
    ];

    return (
        <div className="flex flex-col gap-8 md:gap-12 bg-grid-sheet mx-[-1.5rem] sm:mx-[-2rem] mt-[-2rem] px-6 sm:px-8 py-8 w-[calc(100%+3rem)] sm:w-[calc(100%+4rem)] min-h-screen items-center">
            <div className="max-w-screen-xl w-full flex flex-col gap-8 md:gap-12">
                
                {/* Dashboard Title Banner */}
                <div className="flex flex-col gap-2 bg-background border-4 border-foreground p-6 sm:p-8 rounded-none shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff]">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <span className="font-mono text-2xs uppercase font-extrabold text-white bg-purple border-2 border-foreground px-3 py-1 shadow-[2px_2px_0px_0px_#000] rotate-[-1.5deg] inline-block mb-2 select-none">
                                Contributor Station
                            </span>
                            <h1 className="font-mixtape uppercase tracking-tighter text-3xl sm:text-5xl font-black leading-none mt-1">
                                My Reviews & Comments
                            </h1>
                            <p className="font-mono text-xs text-foreground/80 font-bold rotate-[0.5deg] mt-3">
                                Review, edit, and moderate your course guide contributions in one place.
                            </p>
                        </div>
                        
                        <Button
                            as={Link}
                            href="/courses"
                            size="sm"
                            className="font-mono uppercase font-black text-xs border-2 border-foreground bg-yellow text-black rounded-none shadow-[3px_3px_0px_0px_#000] rotate-[1.5deg] hover:scale-105 active:scale-95 transition-all duration-200"
                        >
                            Browse Courses &rarr;
                        </Button>
                    </div>
                </div>

                {/* Main Dashboard Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                    
                    {/* Tab Navigation Column (Left/Sidebar on desktop) */}
                    <div className="lg:col-span-1 flex flex-row lg:flex-col gap-3 w-full">
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={clsx(
                                "w-full font-mono text-xs uppercase font-black px-4 py-3.5 border-3 transition-all duration-200 rounded-none text-left flex items-center justify-between shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]",
                                activeTab === 'reviews'
                                    ? "bg-red text-white border-foreground translate-x-[2px] translate-y-[2px] shadow-none"
                                    : "bg-background text-foreground border-foreground hover:bg-secondary hover:text-white"
                            )}
                        >
                            <span>My Reviews</span>
                            <span className="bg-red text-white text-[10px] px-1.5 py-0.5 border border-foreground font-black font-mono leading-none">
                                {reviews.length}
                            </span>
                        </button>
                        
                        <button
                            onClick={() => setActiveTab('comments')}
                            className={clsx(
                                "w-full font-mono text-xs uppercase font-black px-4 py-3.5 border-3 transition-all duration-200 rounded-none text-left flex items-center justify-between shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]",
                                activeTab === 'comments'
                                    ? "bg-blue text-white border-foreground translate-x-[2px] translate-y-[2px] shadow-none"
                                    : "bg-background text-foreground border-foreground hover:bg-secondary hover:text-white"
                            )}
                        >
                            <span>My Comments</span>
                            <span className="bg-blue text-white text-[10px] px-1.5 py-0.5 border border-foreground font-black font-mono leading-none">
                                {comments.length}
                            </span>
                        </button>
                    </div>

                    {/* Contributions Feed Column (Right/Content) */}
                    <div className="lg:col-span-3 flex flex-col gap-6 w-full">
                        
                        {activeTab === 'reviews' && (
                            <div className="flex flex-col gap-6">
                                {reviews.length === 0 ? (
                                    <div className="text-center py-16 bg-background border-4 border-dashed border-foreground rounded-none shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] flex flex-col items-center justify-center p-6">
                                        <FaGraduationCap className="text-foreground text-5xl mb-4" />
                                        <h3 className="font-mixtape font-extrabold uppercase text-lg">No reviews written yet</h3>
                                        <p className="font-mono text-xs mt-2 text-foreground/60 max-w-sm leading-relaxed">
                                            You haven't posted any course ratings yet. Find a course you took and submit a review!
                                        </p>
                                        <Button
                                            as={Link}
                                            href="/courses"
                                            size="sm"
                                            className="mt-6 font-mono uppercase font-black text-xs border-2 border-foreground bg-yellow text-black rounded-none shadow-[3px_3px_0px_0px_#000]"
                                        >
                                            Find Courses
                                        </Button>
                                    </div>
                                ) : (
                                    reviews.map((review, idx) => {
                                        const courseName = courseMap[review.courseCode.toLowerCase()] || review.courseCode;
                                        return (
                                            <motion.div
                                                key={review.id}
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.3) }}
                                            >
                                                <Card className="bg-background border-3 border-foreground rounded-none shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:shadow-[6px_6px_0px_0px_#000] dark:hover:shadow-[6px_6px_0px_0px_#fff] transition-all duration-200">
                                                    <CardBody className="p-5 flex flex-col gap-4">
                                                        
                                                        {/* Header */}
                                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b-2 border-foreground pb-3">
                                                            <div className="flex flex-col gap-1.5">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="font-mono text-[10px] uppercase font-extrabold text-black bg-yellow border border-foreground px-2 py-0.5 shadow-[1.5px_1.5px_0px_0px_#000] rotate-[-1.5deg] leading-none">
                                                                        {review.courseCode}
                                                                    </span>
                                                                    <Link
                                                                        href={`/courses/${encodeURIComponent(review.courseCode)}`}
                                                                        className="font-mixtape text-xs font-black uppercase text-foreground/50 hover:text-primary underline flex items-center gap-1"
                                                                    >
                                                                        {courseName} <FaExternalLinkAlt className="text-[8px]" />
                                                                    </Link>
                                                                </div>
                                                                <h3 className="font-mixtape uppercase tracking-tight text-lg font-black text-foreground mt-1">{review.title}</h3>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-1.5 bg-yellow text-black border-2 border-foreground px-2.5 py-1 rounded-none font-mono font-black text-xs shadow-[2px_2px_0px_0px_#000] rotate-[1.5deg] self-start sm:self-center">
                                                                <MdStar
                                                                    className="w-4 h-4"
                                                                    fill="#FAA307"
                                                                    stroke="black"
                                                                    strokeWidth={1.2}
                                                                />
                                                                <span>{review.overallRating.toFixed(1)} / 5</span>
                                                            </div>
                                                        </div>

                                                        {/* Meta Details */}
                                                        <div className="flex flex-wrap items-center gap-2 text-3xs font-mono uppercase font-black text-foreground/60">
                                                            <span>Term: {review.termTaken}</span>
                                                            {review.grade && (
                                                                <>
                                                                    <span>&bull;</span>
                                                                    <span className="text-yellow bg-black px-1 border border-foreground font-bold">Grade: {review.grade}</span>
                                                                </>
                                                            )}
                                                            <span>&bull;</span>
                                                            <span>{formatLocalDate(review.createdAt)}</span>
                                                            <span>&bull;</span>
                                                            <span className={clsx(review.isAnonymous ? "text-purple" : "text-red")}>
                                                                {review.isAnonymous ? "Posted Anonymously" : "Publicly Visible"}
                                                            </span>
                                                        </div>

                                                        {/* Sub ratings equalizers */}
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-foreground/[0.02] p-3.5 border-2 border-dashed border-foreground/20 font-mono text-2xs">
                                                            
                                                            {/* Difficulty */}
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex justify-between font-black text-[10px]">
                                                                    <span>DIFFICULTY</span>
                                                                    <span>{review.difficultyScore.toFixed(1)} / 5</span>
                                                                </div>
                                                                <div className="flex gap-0.5 select-none">
                                                                    {Array.from({ length: 10 }).map((_, segIdx) => {
                                                                        const threshold = (segIdx + 1) / 2;
                                                                        const active = review.difficultyScore >= threshold;
                                                                        return (
                                                                            <div
                                                                                key={segIdx}
                                                                                className={clsx(
                                                                                    "h-4 w-full border border-foreground/60 rounded-none",
                                                                                    active
                                                                                        ? review.difficultyScore > 3.5 
                                                                                            ? "bg-red" 
                                                                                            : review.difficultyScore > 2.5 
                                                                                                ? "bg-orange"
                                                                                                : "bg-yellow"
                                                                                        : "bg-foreground/5"
                                                                                )}
                                                                            />
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>

                                                            {/* Usefulness */}
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex justify-between font-black text-[10px]">
                                                                    <span>USEFULNESS</span>
                                                                    <span>{review.usefulnessScore.toFixed(1)} / 5</span>
                                                                </div>
                                                                <div className="flex gap-0.5 select-none">
                                                                    {Array.from({ length: 10 }).map((_, segIdx) => {
                                                                        const threshold = (segIdx + 1) / 2;
                                                                        const active = review.usefulnessScore >= threshold;
                                                                        return (
                                                                            <div
                                                                                key={segIdx}
                                                                                className={clsx(
                                                                                    "h-4 w-full border border-foreground/60 rounded-none",
                                                                                    active ? "bg-blue" : "bg-foreground/5"
                                                                                )}
                                                                            />
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>

                                                            {/* Enjoyment */}
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex justify-between font-black text-[10px]">
                                                                    <span>ENJOYMENT</span>
                                                                    <span>{review.enjoymentScore.toFixed(1)} / 5</span>
                                                                </div>
                                                                <div className="flex gap-0.5 select-none">
                                                                    {Array.from({ length: 10 }).map((_, segIdx) => {
                                                                        const threshold = (segIdx + 1) / 2;
                                                                        const active = review.enjoymentScore >= threshold;
                                                                        return (
                                                                            <div
                                                                                key={segIdx}
                                                                                className={clsx(
                                                                                    "h-4 w-full border border-foreground/60 rounded-none",
                                                                                    active ? "bg-yellow" : "bg-foreground/5"
                                                                                )}
                                                                            />
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>

                                                        </div>

                                                        {/* Description */}
                                                        <p className="font-mono text-xs text-foreground/80 leading-relaxed whitespace-pre-line bg-background border border-foreground/20 p-3 rounded-none">
                                                            {review.description}
                                                        </p>

                                                        {/* Actions */}
                                                        <div className="flex gap-3 justify-end border-t border-foreground/10 pt-3">
                                                            <Button
                                                                size="sm"
                                                                variant="flat"
                                                                radius="none"
                                                                startContent={<FaEdit />}
                                                                onPress={() => handleReviewEditClick(review)}
                                                                className="font-mono text-xs uppercase font-black bg-background border-2 border-foreground shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] cursor-pointer"
                                                            >
                                                                Edit Review
                                                            </Button>
                                                            
                                                            <Button
                                                                size="sm"
                                                                color="danger"
                                                                variant="flat"
                                                                radius="none"
                                                                startContent={<FaTrashAlt />}
                                                                onPress={() => handleReviewDeleteClick(review.id)}
                                                                className="font-mono text-xs uppercase font-black bg-background text-red border-2 border-red hover:bg-red hover:text-white shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>

                                                    </CardBody>
                                                </Card>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {activeTab === 'comments' && (
                            <div className="flex flex-col gap-6">
                                {comments.length === 0 ? (
                                    <div className="text-center py-16 bg-background border-4 border-dashed border-foreground rounded-none shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] flex flex-col items-center justify-center p-6">
                                        <FaComments className="text-foreground text-5xl mb-4" />
                                        <h3 className="font-mixtape font-extrabold uppercase text-lg">No comments written yet</h3>
                                        <p className="font-mono text-xs mt-2 text-foreground/60 max-w-sm leading-relaxed">
                                            You haven't commented on any student reviews yet. Share your insights in threaded discussions!
                                        </p>
                                        <Button
                                            as={Link}
                                            href="/courses"
                                            size="sm"
                                            className="mt-6 font-mono uppercase font-black text-xs border-2 border-foreground bg-yellow text-black rounded-none shadow-[3px_3px_0px_0px_#000]"
                                        >
                                            Find Reviews to Reply
                                        </Button>
                                    </div>
                                ) : (
                                    comments.map((comment, idx) => {
                                        const courseName = courseMap[comment.courseCode.toLowerCase()] || comment.courseCode;
                                        const isEditing = editingCommentId === comment.id;

                                        return (
                                            <motion.div
                                                key={comment.id}
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.3) }}
                                            >
                                                <Card className="bg-background border-3 border-foreground rounded-none shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:shadow-[6px_6px_0px_0px_#000] dark:hover:shadow-[6px_6px_0px_0px_#fff] transition-all duration-200">
                                                    <CardBody className="p-5 flex flex-col gap-3">
                                                        
                                                        {/* Header Context */}
                                                        <div className="flex flex-wrap items-center gap-2 border-b-2 border-foreground pb-2 text-xs font-mono uppercase font-black">
                                                            <span className="text-[10px] text-black bg-blue border border-foreground px-2 py-0.5 shadow-[1.5px_1.5px_0px_0px_#000] rotate-[-1.5deg] leading-none">
                                                                {comment.courseCode}
                                                            </span>
                                                            <Link
                                                                href={`/courses/${encodeURIComponent(comment.courseCode)}`}
                                                                className="text-foreground/50 hover:text-primary underline flex items-center gap-1 text-[11px]"
                                                            >
                                                                {courseName} <FaExternalLinkAlt className="text-[8px]" />
                                                            </Link>
                                                            <span className="text-foreground/30 font-light">&bull;</span>
                                                            <span className="text-red normal-case font-extrabold tracking-tight truncate max-w-[180px] sm:max-w-[300px]">
                                                                On review: "{comment.reviewTitle}"
                                                            </span>
                                                        </div>

                                                        {/* Date */}
                                                        <div className="text-[9px] font-mono text-foreground/50 font-black uppercase">
                                                            Posted on: {formatLocalDate(comment.createdAt)}
                                                        </div>

                                                        {/* Content Editor Swap */}
                                                        {isEditing ? (
                                                            <div className="flex flex-col gap-3.5 mt-1">
                                                                <Textarea
                                                                    size="sm"
                                                                    radius="none"
                                                                    value={editingCommentContent}
                                                                    onValueChange={setEditingCommentContent}
                                                                    minRows={2}
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
                                                                        onPress={handleCommentEditCancel}
                                                                        className="font-mono text-2xs uppercase border border-foreground"
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        radius="none"
                                                                        isLoading={actionTransition}
                                                                        onPress={() => handleCommentEditSubmit(comment.id)}
                                                                        className="font-mono text-2xs uppercase font-black bg-yellow text-black border border-foreground shadow-[2px_2px_0px_0px_#000]"
                                                                    >
                                                                        Save Changes
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="font-mono text-sm font-bold text-foreground leading-relaxed whitespace-pre-line bg-background border border-foreground/20 p-3 rounded-none">
                                                                {comment.content}
                                                            </p>
                                                        )}

                                                        {/* Actions */}
                                                        {!isEditing && (
                                                            <div className="flex gap-3 justify-end border-t border-foreground/10 pt-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="flat"
                                                                    radius="none"
                                                                    startContent={<FaEdit />}
                                                                    onPress={() => handleCommentEditClick(comment)}
                                                                    className="font-mono text-xs uppercase font-black bg-background border-2 border-foreground shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] cursor-pointer"
                                                                >
                                                                    Edit Comment
                                                                </Button>
                                                                
                                                                <Button
                                                                    size="sm"
                                                                    color="danger"
                                                                    variant="flat"
                                                                    radius="none"
                                                                    startContent={<FaTrashAlt />}
                                                                    onPress={() => handleCommentDeleteClick(comment.id)}
                                                                    className="font-mono text-xs uppercase font-black bg-background text-red border-2 border-red hover:bg-red hover:text-white shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                                                                >
                                                                    Delete
                                                                </Button>
                                                            </div>
                                                        )}

                                                    </CardBody>
                                                </Card>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                    </div>

                </div>

            </div>

            {/* Custom Edit Review Modal */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside" className="bg-background border-4 border-foreground text-foreground rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
                <ModalContent className="rounded-none">
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 border-b-3 border-foreground px-6 py-4">
                                <span className="font-mixtape text-xs uppercase font-extrabold text-black bg-yellow border-2 border-foreground px-2 py-0.5 w-fit shadow-[2px_2px_0px_0px_#000] rotate-[-2deg] inline-block mb-1">
                                    {selectedReview?.courseCode}
                                </span>
                                <h2 className="font-mixtape uppercase text-xl font-extrabold tracking-tight">Edit Your Review</h2>
                                <p className="font-mono text-xs text-foreground/80 font-bold rotate-[0.5deg]">
                                    Modify your rating, score weights, or text comments.
                                </p>
                            </ModalHeader>

                            <ModalBody className="gap-6 py-4">
                                {editErrors.submit && (
                                    <div className="text-xs text-red-500 bg-red-500/10 border-2 border-red-500/20 p-3 rounded-none font-mono font-black">
                                        {editErrors.submit}
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
                                                    star <= (hoveredStar ?? editOverallRating) ? '' : 'opacity-25 text-foreground'
                                                )}
                                                fill={star <= (hoveredStar ?? editOverallRating) ? '#FAA307' : 'currentColor'}
                                                stroke="black"
                                                strokeWidth={1.2}
                                                onClick={() => setEditOverallRating(star)}
                                                onMouseEnter={() => setHoveredStar(star)}
                                                onMouseLeave={() => setHoveredStar(null)}
                                            />
                                        ))}
                                        <span className="text-xs font-black text-foreground/60 ml-2">
                                            ({editOverallRating} of 5)
                                        </span>
                                    </div>
                                    {editErrors.overallRating && <p className="text-3xs text-red-500 font-bold">{editErrors.overallRating}</p>}
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
                                            value={editDifficultyScore}
                                            onChange={(val) => setEditDifficultyScore(val as number)}
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
                                            {editDifficultyScore >= 4.5 ? 'Extreme' : editDifficultyScore >= 3.5 ? 'Hard' : editDifficultyScore >= 2.5 ? 'Medium' : editDifficultyScore >= 1.5 ? 'Easy' : 'Trivial'}
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
                                            value={editUsefulnessScore}
                                            onChange={(val) => setEditUsefulnessScore(val as number)}
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
                                            {editUsefulnessScore >= 4.5 ? 'Crucial' : editUsefulnessScore >= 3.5 ? 'Very Useful' : editUsefulnessScore >= 2.5 ? 'Useful' : editUsefulnessScore >= 1.5 ? 'Slightly Useful' : 'Useless'}
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
                                            value={editEnjoymentScore}
                                            onChange={(val) => setEditEnjoymentScore(val as number)}
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
                                            {editEnjoymentScore >= 4.5 ? 'Love it' : editEnjoymentScore >= 3.5 ? 'Great' : editEnjoymentScore >= 2.5 ? 'Fun' : editEnjoymentScore >= 1.5 ? 'Okay' : 'Hated it'}
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
                                            selectedKeys={editTermTaken ? [editTermTaken] : []}
                                            onSelectionChange={(keys) => setEditTermTaken(Array.from(keys)[0] as string)}
                                            errorMessage={editErrors.termTaken}
                                            isInvalid={!!editErrors.termTaken}
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
                                            label="Grade Achieved (Optional)"
                                            radius="none"
                                            placeholder="Select Grade"
                                            selectedKeys={editGrade ? [editGrade] : []}
                                            onSelectionChange={(keys) => setEditGrade(Array.from(keys)[0] as string)}
                                            aria-label="Select grade achieved"
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

                                {/* Title */}
                                <div>
                                    <Input
                                        label="Review Title"
                                        radius="none"
                                        placeholder="Summarize your experience..."
                                        value={editTitle}
                                        onValueChange={setEditTitle}
                                        isInvalid={!!editErrors.title}
                                        errorMessage={editErrors.title}
                                        className="font-mono"
                                        classNames={{
                                            inputWrapper: "border-2 border-foreground bg-background rounded-none shadow-none group-data-[focus=true]:border-foreground",
                                            input: "placeholder:text-grey dark:placeholder:text-grey text-foreground",
                                        }}
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <Textarea
                                        label="Review Description"
                                        radius="none"
                                        placeholder="Detail the course contents, lecturer styles, assignments difficulty, and study tips..."
                                        value={editDescription}
                                        onValueChange={setEditDescription}
                                        isInvalid={!!editErrors.description}
                                        errorMessage={editErrors.description}
                                        minRows={4}
                                        className="font-mono"
                                        classNames={{
                                            inputWrapper: "border-2 border-foreground bg-background rounded-none shadow-none group-data-[focus=true]:border-foreground",
                                            input: "placeholder:text-grey dark:placeholder:text-grey text-foreground",
                                        }}
                                    />
                                </div>

                                {/* Anonymity */}
                                <div className="flex flex-col gap-2 mt-2 bg-foreground/[0.03] p-4 border-2 border-dashed border-foreground/30 text-xs font-mono">
                                    <Checkbox
                                        isSelected={editIsAnonymous}
                                        onValueChange={setEditIsAnonymous}
                                        size="sm"
                                        radius="none"
                                        className="rounded-none"
                                    >
                                        <div className="flex flex-col gap-0.5 ml-1">
                                            <span className="font-black uppercase text-2xs">Post Anonymously</span>
                                            <span className="text-[9px] text-foreground/60 leading-none">
                                                Your name will be hidden from public view, but retained in the admin logs for safety checks.
                                            </span>
                                        </div>
                                    </Checkbox>
                                </div>
                            </ModalBody>

                            <ModalFooter className="border-t-3 border-foreground px-6 py-4">
                                <Button radius="none" variant="flat" color="default" onPress={onClose} isDisabled={actionTransition} className="font-mono text-xs border border-foreground">
                                    Cancel
                                </Button>
                                <Button
                                    radius="none"
                                    isLoading={actionTransition}
                                    onPress={() => handleReviewEditSubmit(onClose)}
                                    className="font-mono text-xs uppercase font-black bg-yellow text-black border-2 border-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000] dark:hover:shadow-[4px_4px_0px_0px_#fff] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#000] dark:active:shadow-[2px_2px_0px_0px_#fff]"
                                >
                                    Save Changes
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

        </div>
    );
};
