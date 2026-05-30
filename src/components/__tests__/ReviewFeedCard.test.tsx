import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReviewFeedCard, Review } from '../ReviewFeedCard';

// Mock framer-motion to render clean elements without webgl/transform animation wrappers in jsdom
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
}));

// Mock heroui components to swallow custom styling props and prevent console warnings
jest.mock('@heroui/react', () => ({
    Button: ({ children, onClick, onPress, isLoading, radius, size, variant, color, startContent, ...props }: any) => (
        <button onClick={onClick || onPress} disabled={isLoading} {...props}>
            {children}
        </button>
    ),
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardBody: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Textarea: ({ value, onValueChange, placeholder, radius, size, classNames, minRows, ...props }: any) => (
        <textarea
            value={value}
            onChange={(e) => onValueChange && onValueChange(e.target.value)}
            placeholder={placeholder}
            {...props}
        />
    ),
}));

// Mock CommentThread component
jest.mock('../CommentThread', () => ({
    CommentThread: ({ reviewId }: any) => <div data-testid="mock-comment-thread">{reviewId}</div>,
}));

const mockReview: Review = {
    id: 'rev123',
    userId: 'user1',
    title: 'Highly Recommended Course',
    description: 'This is a long description designed to test truncation and expansion. It needs to be sufficiently long to exceed one hundred and eighty characters in total length so that the truncation mechanism gets triggered correctly by our conditional check inside the component itself.',
    overallRating: 4.5,
    difficultyScore: 3,
    usefulnessScore: 4.5,
    enjoymentScore: 5,
    termTaken: 'Semester 1, 2026',
    grade: 'HD',
    isAnonymous: false,
    reviewerName: 'John Doe',
    createdAt: new Date('2026-05-24T12:00:00Z'),
    likesCount: 5,
    likedByCurrentUser: false,
    comments: [
        {
            id: 'c1',
            userId: 'u1',
            userName: 'Alice',
            content: 'Nice review!',
            parentId: null,
            createdAt: new Date('2026-05-24T12:05:00Z'),
        }
    ],
};

describe('ReviewFeedCard Component', () => {
    let mockOnLike: jest.Mock;
    let mockOnReviewEdit: jest.Mock;
    let mockOnReviewDelete: jest.Mock;
    let mockOnCommentSubmit: jest.Mock;
    let mockOnCommentEdit: jest.Mock;
    let mockOnCommentDelete: jest.Mock;
    let originalAlert: any;

    beforeEach(() => {
        mockOnLike = jest.fn().mockResolvedValue(undefined);
        mockOnReviewEdit = jest.fn();
        mockOnReviewDelete = jest.fn().mockResolvedValue(undefined);
        mockOnCommentSubmit = jest.fn().mockResolvedValue(undefined);
        mockOnCommentEdit = jest.fn().mockResolvedValue(undefined);
        mockOnCommentDelete = jest.fn().mockResolvedValue(undefined);
        originalAlert = window.alert;
        window.alert = jest.fn();
    });

    afterEach(() => {
        window.alert = originalAlert;
    });

    it('renders review details successfully', () => {
        render(
            <ReviewFeedCard
                review={mockReview}
                idx={0}
                session={{ user: { id: 'user1', role: 'user' } }}
                onLike={mockOnLike}
                onReviewEdit={mockOnReviewEdit}
                onReviewDelete={mockOnReviewDelete}
                onCommentSubmit={mockOnCommentSubmit}
                onCommentEdit={mockOnCommentEdit}
                onCommentDelete={mockOnCommentDelete}
            />
        );

        expect(screen.getByText('Highly Recommended Course')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Grade: HD')).toBeInTheDocument();
        expect(screen.getByText('Term taken: Semester 1, 2026')).toBeInTheDocument();
        expect(screen.getByText('Comments (1)')).toBeInTheDocument();
    });

    it('renders anonymous reviewer correctly', () => {
        render(
            <ReviewFeedCard
                review={{ ...mockReview, isAnonymous: true }}
                idx={0}
                session={null}
                onLike={mockOnLike}
                onReviewEdit={mockOnReviewEdit}
                onReviewDelete={mockOnReviewDelete}
                onCommentSubmit={mockOnCommentSubmit}
                onCommentEdit={mockOnCommentEdit}
                onCommentDelete={mockOnCommentDelete}
            />
        );

        expect(screen.getByText('Anonymous')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('allows toggling description truncation/expansion', () => {
        render(
            <ReviewFeedCard
                review={mockReview}
                idx={0}
                session={null}
                onLike={mockOnLike}
                onReviewEdit={mockOnReviewEdit}
                onReviewDelete={mockOnReviewDelete}
                onCommentSubmit={mockOnCommentSubmit}
                onCommentEdit={mockOnCommentEdit}
                onCommentDelete={mockOnCommentDelete}
            />
        );

        const toggleBtn = screen.getByRole('button', { name: 'See More' });
        fireEvent.click(toggleBtn);
        expect(screen.getByRole('button', { name: 'See Less' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'See Less' }));
        expect(screen.getByRole('button', { name: 'See More' })).toBeInTheDocument();
    });

    it('alerts unauthenticated user trying to like', () => {
        render(
            <ReviewFeedCard
                review={mockReview}
                idx={0}
                session={null}
                onLike={mockOnLike}
                onReviewEdit={mockOnReviewEdit}
                onReviewDelete={mockOnReviewDelete}
                onCommentSubmit={mockOnCommentSubmit}
                onCommentEdit={mockOnCommentEdit}
                onCommentDelete={mockOnCommentDelete}
            />
        );

        const likeBtn = screen.getByRole('button', { name: /Like/i });
        fireEvent.click(likeBtn);

        expect(window.alert).toHaveBeenCalledWith('Please login to like reviews.');
        expect(mockOnLike).not.toHaveBeenCalled();
    });

    it('calls onLike when authenticated user likes', async () => {
        render(
            <ReviewFeedCard
                review={mockReview}
                idx={0}
                session={{ user: { id: 'user2', role: 'user' } }}
                onLike={mockOnLike}
                onReviewEdit={mockOnReviewEdit}
                onReviewDelete={mockOnReviewDelete}
                onCommentSubmit={mockOnCommentSubmit}
                onCommentEdit={mockOnCommentEdit}
                onCommentDelete={mockOnCommentDelete}
            />
        );

        const likeBtn = screen.getByRole('button', { name: /Like/i });
        fireEvent.click(likeBtn);

        await waitFor(() => {
            expect(mockOnLike).toHaveBeenCalledWith('rev123');
        });
    });

    it('handles like errors cleanly', async () => {
        mockOnLike.mockRejectedValue(new Error('Network failure'));
        render(
            <ReviewFeedCard
                review={mockReview}
                idx={0}
                session={{ user: { id: 'user2', role: 'user' } }}
                onLike={mockOnLike}
                onReviewEdit={mockOnReviewEdit}
                onReviewDelete={mockOnReviewDelete}
                onCommentSubmit={mockOnCommentSubmit}
                onCommentEdit={mockOnCommentEdit}
                onCommentDelete={mockOnCommentDelete}
            />
        );

        const likeBtn = screen.getByRole('button', { name: /Like/i });
        fireEvent.click(likeBtn);

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Network failure');
        });
    });

    it('allows edit of review for owner/admin', () => {
        render(
            <ReviewFeedCard
                review={mockReview}
                idx={0}
                session={{ user: { id: 'user1', role: 'user' } }}
                onLike={mockOnLike}
                onReviewEdit={mockOnReviewEdit}
                onReviewDelete={mockOnReviewDelete}
                onCommentSubmit={mockOnCommentSubmit}
                onCommentEdit={mockOnCommentEdit}
                onCommentDelete={mockOnCommentDelete}
            />
        );

        const editBtn = screen.getByRole('button', { name: /edit/i });
        fireEvent.click(editBtn);
        expect(mockOnReviewEdit).toHaveBeenCalledWith(mockReview);
    });

    it('allows deletion of review with confirmation', async () => {
        window.confirm = jest.fn(() => true);
        render(
            <ReviewFeedCard
                review={mockReview}
                idx={0}
                session={{ user: { id: 'user1', role: 'user' } }}
                onLike={mockOnLike}
                onReviewEdit={mockOnReviewEdit}
                onReviewDelete={mockOnReviewDelete}
                onCommentSubmit={mockOnCommentSubmit}
                onCommentEdit={mockOnCommentEdit}
                onCommentDelete={mockOnCommentDelete}
            />
        );

        const deleteBtn = screen.getByRole('button', { name: /delete/i });
        fireEvent.click(deleteBtn);

        expect(window.confirm).toHaveBeenCalled();
        await waitFor(() => {
            expect(mockOnReviewDelete).toHaveBeenCalledWith('rev123');
        });
    });

    it('aborts deletion if cancel confirmation selected', () => {
        window.confirm = jest.fn(() => false);
        render(
            <ReviewFeedCard
                review={mockReview}
                idx={0}
                session={{ user: { id: 'user1', role: 'user' } }}
                onLike={mockOnLike}
                onReviewEdit={mockOnReviewEdit}
                onReviewDelete={mockOnReviewDelete}
                onCommentSubmit={mockOnCommentSubmit}
                onCommentEdit={mockOnCommentEdit}
                onCommentDelete={mockOnCommentDelete}
            />
        );

        const deleteBtn = screen.getByRole('button', { name: /delete/i });
        fireEvent.click(deleteBtn);

        expect(window.confirm).toHaveBeenCalled();
        expect(mockOnReviewDelete).not.toHaveBeenCalled();
    });

    it('renders empty comments placeholder', () => {
        render(
            <ReviewFeedCard
                review={{ ...mockReview, comments: [] }}
                idx={0}
                session={null}
                onLike={mockOnLike}
                onReviewEdit={mockOnReviewEdit}
                onReviewDelete={mockOnReviewDelete}
                onCommentSubmit={mockOnCommentSubmit}
                onCommentEdit={mockOnCommentEdit}
                onCommentDelete={mockOnCommentDelete}
            />
        );

        expect(screen.getByText('No comments yet.')).toBeInTheDocument();
    });

    it('allows authenticated comment writing', async () => {
        render(
            <ReviewFeedCard
                review={mockReview}
                idx={0}
                session={{ user: { id: 'user2', role: 'user' } }}
                onLike={mockOnLike}
                onReviewEdit={mockOnReviewEdit}
                onReviewDelete={mockOnReviewDelete}
                onCommentSubmit={mockOnCommentSubmit}
                onCommentEdit={mockOnCommentEdit}
                onCommentDelete={mockOnCommentDelete}
            />
        );

        // Click comment feed button to expand comment box if hidden
        const commentFeedBtn = screen.getByRole('button', { name: /Comments \(1\)/i });
        fireEvent.click(commentFeedBtn);

        const commentTextarea = screen.getByPlaceholderText('Write a comment...');
        fireEvent.change(commentTextarea, { target: { value: 'This is my root comment' } });

        const submitBtn = screen.getByRole('button', { name: 'Add a Comment' });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockOnCommentSubmit).toHaveBeenCalledWith('rev123', 'This is my root comment');
        });
    });

    it('prevents comment submission if content empty', () => {
        render(
            <ReviewFeedCard
                review={mockReview}
                idx={0}
                session={{ user: { id: 'user2', role: 'user' } }}
                onLike={mockOnLike}
                onReviewEdit={mockOnReviewEdit}
                onReviewDelete={mockOnReviewDelete}
                onCommentSubmit={mockOnCommentSubmit}
                onCommentEdit={mockOnCommentEdit}
                onCommentDelete={mockOnCommentDelete}
            />
        );

        const commentFeedBtn = screen.getByRole('button', { name: /Comments \(1\)/i });
        fireEvent.click(commentFeedBtn);

        const submitBtn = screen.getByRole('button', { name: 'Add a Comment' });
        fireEvent.click(submitBtn);

        expect(window.alert).toHaveBeenCalledWith('Comment cannot be empty.');
        expect(mockOnCommentSubmit).not.toHaveBeenCalled();
    });

    it('alerts on review deletion failure', async () => {
        window.confirm = jest.fn(() => true);
        mockOnReviewDelete.mockRejectedValue(new Error('Deletion failed'));
        render(
            <ReviewFeedCard
                review={mockReview}
                idx={0}
                session={{ user: { id: 'user1', role: 'user' } }}
                onLike={mockOnLike}
                onReviewEdit={mockOnReviewEdit}
                onReviewDelete={mockOnReviewDelete}
                onCommentSubmit={mockOnCommentSubmit}
                onCommentEdit={mockOnCommentEdit}
                onCommentDelete={mockOnCommentDelete}
            />
        );

        const deleteBtn = screen.getByRole('button', { name: /delete/i });
        fireEvent.click(deleteBtn);

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Deletion failed');
        });
    });

    it('alerts on comment submission failure', async () => {
        mockOnCommentSubmit.mockRejectedValue(new Error('Comment submission failed'));
        render(
            <ReviewFeedCard
                review={mockReview}
                idx={0}
                session={{ user: { id: 'user2', role: 'user' } }}
                onLike={mockOnLike}
                onReviewEdit={mockOnReviewEdit}
                onReviewDelete={mockOnReviewDelete}
                onCommentSubmit={mockOnCommentSubmit}
                onCommentEdit={mockOnCommentEdit}
                onCommentDelete={mockOnCommentDelete}
            />
        );

        const commentFeedBtn = screen.getByRole('button', { name: /Comments \(1\)/i });
        fireEvent.click(commentFeedBtn);

        const commentTextarea = screen.getByPlaceholderText('Write a comment...');
        fireEvent.change(commentTextarea, { target: { value: 'This comment will fail' } });

        const submitBtn = screen.getByRole('button', { name: 'Add a Comment' });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Comment submission failed');
        });
    });
});
