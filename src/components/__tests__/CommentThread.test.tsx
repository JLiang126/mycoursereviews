import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CommentThread, Comment } from '../CommentThread';

// Mock heroui components to be simple HTML blocks
jest.mock('@heroui/react', () => ({
    Button: ({ children, onClick, onPress, isLoading, radius, size, variant, isIconOnly, startContent, ...props }: any) => (
        <button onClick={onClick || onPress} disabled={isLoading} {...props}>
            {children}
        </button>
    ),
    Textarea: ({ value, onValueChange, placeholder, radius, minRows, classNames, size, isDisabled, ...props }: any) => (
        <textarea
            value={value}
            onChange={(e) => onValueChange && onValueChange(e.target.value)}
            placeholder={placeholder}
            disabled={isDisabled}
            {...props}
        />
    ),
}));

jest.mock('../ModerationWarningModal', () => ({
    ModerationWarningModal: ({ isOpen, onClose, message }: any) => (
        isOpen ? (
            <div data-testid="moderation-warning-modal">
                <span data-testid="moderation-warning-message">{message}</span>
                <button onClick={onClose} data-testid="close-warning-btn">Close Warning</button>
            </div>
        ) : null
    )
}));

const mockComments: Comment[] = [
    {
        id: 'c1',
        userId: 'u1',
        userName: 'Alice',
        content: 'This is the main comment',
        parentId: null,
        createdAt: new Date('2026-05-24T12:00:00Z'),
    },
    {
        id: 'c2',
        userId: 'u2',
        userName: 'Bob',
        content: 'This is a nested reply',
        parentId: 'c1',
        createdAt: new Date('2026-05-24T12:30:00Z'),
    },
];

describe('CommentThread Component', () => {
    let mockOnCommentSubmit: jest.Mock;
    let mockOnCommentEdit: jest.Mock;
    let mockOnCommentDelete: jest.Mock;

    beforeEach(() => {
        mockOnCommentSubmit = jest.fn().mockResolvedValue(undefined);
        mockOnCommentEdit = jest.fn().mockResolvedValue(undefined);
        mockOnCommentDelete = jest.fn().mockResolvedValue(undefined);
    });

    it('renders comments and nested threads successfully', () => {
        render(
            <CommentThread
                reviewId="rev1"
                commentsList={mockComments}
                session={{ user: { id: 'u1', role: 'user' } }}
                onCommentSubmit={mockOnCommentSubmit}
                onCommentEdit={mockOnCommentEdit}
                onCommentDelete={mockOnCommentDelete}
            />
        );

        expect(screen.getByText('This is the main comment')).toBeInTheDocument();
        expect(screen.getByText('This is a nested reply')).toBeInTheDocument();
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('allows users to click reply and submit a nested comment', async () => {
        render(
            <CommentThread
                reviewId="rev1"
                commentsList={mockComments}
                session={{ user: { id: 'u1', role: 'user' } }}
                onCommentSubmit={mockOnCommentSubmit}
                onCommentEdit={mockOnCommentEdit}
                onCommentDelete={mockOnCommentDelete}
            />
        );

        // Click "Reply" on the main comment
        const replyButtons = screen.getAllByRole('button', { name: /reply/i });
        fireEvent.click(replyButtons[0]);

        const replyInput = screen.getByPlaceholderText(/reply to Alice/i);
        fireEvent.change(replyInput, { target: { value: 'This is my reply text' } });

        const submitButton = screen.getAllByRole('button', { name: 'Reply' }).find(btn => btn.className.includes('bg-blue'))!;
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockOnCommentSubmit).toHaveBeenCalledWith('rev1', 'This is my reply text', 'c1');
        });
    });

    it('allows comment authors to click edit and save updates', async () => {
        render(
            <CommentThread
                reviewId="rev1"
                commentsList={mockComments}
                session={{ user: { id: 'u1', role: 'user' } }}
                onCommentSubmit={mockOnCommentSubmit}
                onCommentEdit={mockOnCommentEdit}
                onCommentDelete={mockOnCommentDelete}
            />
        );

        // Edit button should be present for Alice's comment (user u1 matches session)
        const editBtn = screen.getByRole('button', { name: 'Edit Comment' });
        fireEvent.click(editBtn);

        const editTextarea = screen.getByDisplayValue('This is the main comment');
        fireEvent.change(editTextarea, { target: { value: 'Updated comment text' } });

        const saveBtn = screen.getByRole('button', { name: 'Save' });
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(mockOnCommentEdit).toHaveBeenCalledWith('c1', 'Updated comment text');
        });
    });

    it('allows author or admin to delete a comment', async () => {
        window.confirm = jest.fn(() => true);

        render(
            <CommentThread
                reviewId="rev1"
                commentsList={mockComments}
                session={{ user: { id: 'u1', role: 'user' } }}
                onCommentSubmit={mockOnCommentSubmit}
                onCommentEdit={mockOnCommentEdit}
                onCommentDelete={mockOnCommentDelete}
            />
        );

        const deleteBtn = screen.getByRole('button', { name: 'Delete Comment' });
        fireEvent.click(deleteBtn);

        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this comment?');
        await waitFor(() => {
            expect(mockOnCommentDelete).toHaveBeenCalledWith('c1');
        });
    });

    it('alerts on reply submission error', async () => {
        mockOnCommentSubmit.mockRejectedValue(new Error('Submit reply failed'));

        render(
            <CommentThread
                reviewId="rev1"
                commentsList={mockComments}
                session={{ user: { id: 'u1', role: 'user' } }}
                onCommentSubmit={mockOnCommentSubmit}
                onCommentEdit={mockOnCommentEdit}
                onCommentDelete={mockOnCommentDelete}
            />
        );

        const replyButtons = screen.getAllByRole('button', { name: /reply/i });
        fireEvent.click(replyButtons[0]);

        const replyInput = screen.getByPlaceholderText(/reply to Alice/i);
        fireEvent.change(replyInput, { target: { value: 'This reply is going to fail' } });

        const submitButton = screen.getAllByRole('button', { name: 'Reply' }).find(btn => btn.className.includes('bg-blue'))!;
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByTestId('moderation-warning-modal')).toBeInTheDocument();
            expect(screen.getByTestId('moderation-warning-message')).toHaveTextContent('Submit reply failed');
        });
    });

    it('alerts on edit submission error', async () => {
        mockOnCommentEdit.mockRejectedValue(new Error('Edit comment failed'));

        render(
            <CommentThread
                reviewId="rev1"
                commentsList={mockComments}
                session={{ user: { id: 'u1', role: 'user' } }}
                onCommentSubmit={mockOnCommentSubmit}
                onCommentEdit={mockOnCommentEdit}
                onCommentDelete={mockOnCommentDelete}
            />
        );

        const editBtn = screen.getByRole('button', { name: 'Edit Comment' });
        fireEvent.click(editBtn);

        const editTextarea = screen.getByDisplayValue('This is the main comment');
        fireEvent.change(editTextarea, { target: { value: 'This edit is going to fail' } });

        const saveBtn = screen.getByRole('button', { name: 'Save' });
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(screen.getByTestId('moderation-warning-modal')).toBeInTheDocument();
            expect(screen.getByTestId('moderation-warning-message')).toHaveTextContent('Edit comment failed');
        });
    });

    it('alerts on delete comment error', async () => {
        window.confirm = jest.fn(() => true);
        mockOnCommentDelete.mockRejectedValue(new Error('Delete comment failed'));

        render(
            <CommentThread
                reviewId="rev1"
                commentsList={mockComments}
                session={{ user: { id: 'u1', role: 'user' } }}
                onCommentSubmit={mockOnCommentSubmit}
                onCommentEdit={mockOnCommentEdit}
                onCommentDelete={mockOnCommentDelete}
            />
        );

        const deleteBtn = screen.getByRole('button', { name: 'Delete Comment' });
        fireEvent.click(deleteBtn);

        await waitFor(() => {
            expect(screen.getByTestId('moderation-warning-modal')).toBeInTheDocument();
            expect(screen.getByTestId('moderation-warning-message')).toHaveTextContent('Delete comment failed');
        });
    });
});
