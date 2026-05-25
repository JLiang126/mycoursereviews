'use client';

import {
    Button,
    Card,
    CardBody,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    useDisclosure,
} from '@heroui/react';
import { useState, useTransition } from 'react';
import {
    FaChartBar,
    FaComments,
    FaGraduationCap,
    FaHeart,
    FaSearch,
    FaTrashAlt,
} from 'react-icons/fa';

import { deleteReview } from '@/app/actions/reviews';
import { formatLocalDate } from '@/lib/date-utils';

interface ReviewItem {
    id: string;
    courseCode: string;
    title: string;
    description: string;
    overallRating: number;
    isAnonymous: boolean;
    reviewerName: string;
    reviewerEmail: string;
    createdAt: Date;
}

interface AdminDashboardClientProps {
    reviews: ReviewItem[];
    stats: {
        totalReviews: number;
        totalComments: number;
        totalLikes: number;
        totalCourses: number;
    };
}

export const AdminDashboardClient = ({ reviews, stats }: AdminDashboardClientProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [isPending, startTransition] = useTransition();

    // Filter reviews based on search keyword
    const filteredReviews = reviews.filter((r) => {
        const query = searchQuery.toLowerCase().trim();
        return (
            r.courseCode.toLowerCase().includes(query) ||
            r.title.toLowerCase().includes(query) ||
            r.reviewerName.toLowerCase().includes(query) ||
            r.reviewerEmail.toLowerCase().includes(query)
        );
    });

    const triggerDeleteConfirm = (review: ReviewItem) => {
        setSelectedReview(review);
        onOpen();
    };

    const handleDelete = (onClose: () => void) => {
        if (!selectedReview) return;

        startTransition(async () => {
            try {
                await deleteReview(selectedReview.id);
                setSelectedReview(null);
                onClose();
            } catch (err: any) {
                alert(err.message || 'Failed to remove review');
            }
        });
    };

    return (
        <div className="flex flex-col gap-8">
            
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Admin Moderation Dashboard</h1>
                <p className="text-sm text-foreground/60 mt-1">
                    Manage Adelaide University course reviews, analyze platform statistics, and moderate reports.
                </p>
            </div>

            {/* Statistics Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Total Reviews Card */}
                <Card className="bg-background/40 backdrop-blur-md border border-divider shadow-sm">
                    <CardBody className="p-5 flex items-center justify-between flex-row gap-4">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider">Total Reviews</span>
                            <span className="text-3xl font-extrabold">{stats.totalReviews}</span>
                        </div>
                        <div className="p-3 bg-primary/10 text-primary rounded-xl">
                            <FaGraduationCap className="text-xl" />
                        </div>
                    </CardBody>
                </Card>

                {/* Total Comments Card */}
                <Card className="bg-background/40 backdrop-blur-md border border-divider shadow-sm">
                    <CardBody className="p-5 flex items-center justify-between flex-row gap-4">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider">Comments Feed</span>
                            <span className="text-3xl font-extrabold">{stats.totalComments}</span>
                        </div>
                        <div className="p-3 bg-secondary/10 text-secondary rounded-xl">
                            <FaComments className="text-xl" />
                        </div>
                    </CardBody>
                </Card>

                {/* Total Likes Card */}
                <Card className="bg-background/40 backdrop-blur-md border border-divider shadow-sm">
                    <CardBody className="p-5 flex items-center justify-between flex-row gap-4">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider">Review Likes</span>
                            <span className="text-3xl font-extrabold">{stats.totalLikes}</span>
                        </div>
                        <div className="p-3 bg-primary/10 text-primary rounded-xl">
                            <FaHeart className="text-xl" />
                        </div>
                    </CardBody>
                </Card>

                {/* Total Active Courses Reviewed Card */}
                <Card className="bg-background/40 backdrop-blur-md border border-divider shadow-sm">
                    <CardBody className="p-5 flex items-center justify-between flex-row gap-4">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider">Active Courses</span>
                            <span className="text-3xl font-extrabold">{stats.totalCourses}</span>
                        </div>
                        <div className="p-3 bg-secondary/10 text-secondary rounded-xl">
                            <FaChartBar className="text-xl" />
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Moderation Search & Listing Panel */}
            <div className="flex flex-col gap-4 bg-background/40 backdrop-blur-md border border-divider p-6 rounded-2xl shadow-sm">
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-divider/40 pb-4">
                    <h2 className="text-xl font-bold">Submitted Course Reviews Feed</h2>
                    
                    <Input
                        isClearable
                        placeholder="Search by course, reviewer, title..."
                        startContent={<FaSearch className="text-foreground/45" />}
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                        className="w-full sm:w-72"
                    />
                </div>

                {filteredReviews.length === 0 ? (
                    <p className="text-sm text-foreground/50 font-semibold py-8 text-center">
                        No reviews found matching the filter query.
                    </p>
                ) : (
                    <Table aria-label="Course reviews table for moderation" className="text-left">
                        <TableHeader>
                            <TableColumn>COURSE</TableColumn>
                            <TableColumn>DATE</TableColumn>
                            <TableColumn>REVIEWER (ACCOUNTABILITY)</TableColumn>
                            <TableColumn>TITLE & SNIPPET</TableColumn>
                            <TableColumn>PUBLIC FLAG</TableColumn>
                            <TableColumn className="text-center">ACTIONS</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {filteredReviews.map((review) => (
                                <TableRow key={review.id} className="border-b border-divider/25 hover:bg-default-50/50 transition-colors">
                                    <TableCell className="font-extrabold text-primary text-xs tracking-wider">
                                        {review.courseCode}
                                    </TableCell>
                                    <TableCell className="text-2xs text-foreground/60">
                                        {formatLocalDate(review.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-2xs">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-bold">{review.reviewerName}</span>
                                            <span className="text-foreground/40">{review.reviewerEmail}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs max-w-sm">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-bold line-clamp-1">{review.title}</span>
                                            <span className="text-foreground/50 line-clamp-1 italic">{review.description}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-3xs font-extrabold">
                                        {review.isAnonymous ? (
                                            <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                                ANONYMOUS
                                            </span>
                                        ) : (
                                            <span className="text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                                                PUBLIC
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            color="danger"
                                            variant="flat"
                                            onPress={() => triggerDeleteConfirm(review)}
                                            title="Delete review"
                                        >
                                            <FaTrashAlt />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Confirm Moderation Delete dialog */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} className="bg-background border border-divider">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex items-center gap-2">
                                <FaTrashAlt className="text-danger" />
                                <h3>Confirm Deletion</h3>
                            </ModalHeader>
                            <ModalBody>
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                    Are you sure you want to permanently delete the review{' '}
                                    <strong className="text-primary">&ldquo;{selectedReview?.title}&rdquo;</strong> for{' '}
                                    <strong>{selectedReview?.courseCode}</strong>?
                                </p>
                                <p className="text-2xs text-danger font-semibold mt-2">
                                    Warning: Deleting this review is permanent. It will automatically cascade-delete all of its child comment threads and likes as well.
                                </p>
                            </ModalBody>
                            <ModalFooter>
                                <Button variant="flat" color="default" onPress={onClose} isDisabled={isPending}>
                                    Cancel
                                </Button>
                                <Button
                                    color="danger"
                                    isLoading={isPending}
                                    onPress={() => handleDelete(onClose)}
                                    className="font-semibold"
                                >
                                    Delete Review
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
};
