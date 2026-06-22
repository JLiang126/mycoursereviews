import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Comment } from '../../course/CommentThread';

// Mock @heroui/react before importing using modern Node 26 exports API
mock.module('@heroui/react', {
    exports: {
        Button: ({ children, onClick, onPress, isLoading, radius, size, variant, isIconOnly, startContent, ...props }: any) => (
            React.createElement('button', { onClick: onClick || onPress, disabled: isLoading, ...props }, children)
        ),
        Textarea: ({ value, onValueChange, placeholder, radius, minRows, classNames, size, isDisabled, ...props }: any) => (
            React.createElement('textarea', {
                value,
                onChange: (e: any) => onValueChange && onValueChange(e.target.value),
                placeholder,
                disabled: isDisabled,
                ...props
            })
        ),
    }
});

mock.module('../../course/ModerationWarningModal', {
    exports: {
        ModerationWarningModal: ({ isOpen, onClose, message }: any) => (
            isOpen ? (
                React.createElement('div', { 'data-testid': 'moderation-warning-modal' },
                    React.createElement('span', { 'data-testid': 'moderation-warning-message' }, message),
                    React.createElement('button', { onClick: onClose, 'data-testid': 'close-warning-btn' }, 'Close Warning')
                )
            ) : null
        )
    }
});

// Dynamically import component after registering mocks
const { CommentThread } = await import('../../course/CommentThread');

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
    let mockOnCommentSubmit: any;
    let mockOnCommentEdit: any;
    let mockOnCommentDelete: any;

    beforeEach(() => {
        mockOnCommentSubmit = mock.fn(async () => {});
        mockOnCommentEdit = mock.fn(async () => {});
        mockOnCommentDelete = mock.fn(async () => {});
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

        assert.ok(screen.getByText('This is the main comment'));
        assert.ok(screen.getByText('This is a nested reply'));
        assert.ok(screen.getByText('Alice'));
        assert.ok(screen.getByText('Bob'));
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
            assert.strictEqual(mockOnCommentSubmit.mock.callCount(), 1);
            const args = mockOnCommentSubmit.mock.calls[0].arguments;
            assert.strictEqual(args[0], 'rev1');
            assert.strictEqual(args[1], 'This is my reply text');
            assert.strictEqual(args[2], 'c1');
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
            assert.strictEqual(mockOnCommentEdit.mock.callCount(), 1);
            const args = mockOnCommentEdit.mock.calls[0].arguments;
            assert.strictEqual(args[0], 'c1');
            assert.strictEqual(args[1], 'Updated comment text');
        });
    });

    it('allows author or admin to delete a comment', async () => {
        const confirmMock = mock.fn((_msg?: string) => true);
        Object.defineProperty(window, 'confirm', { value: confirmMock, writable: true, configurable: true });
        Object.defineProperty(global, 'confirm', { value: confirmMock, writable: true, configurable: true });

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

        assert.strictEqual(confirmMock.mock.callCount(), 1);
        assert.strictEqual(confirmMock.mock.calls[0].arguments[0], 'Are you sure you want to delete this comment?');
        await waitFor(() => {
            assert.strictEqual(mockOnCommentDelete.mock.callCount(), 1);
            assert.strictEqual(mockOnCommentDelete.mock.calls[0].arguments[0], 'c1');
        });
    });

    it('alerts on reply submission error', async () => {
        mockOnCommentSubmit = mock.fn(async () => {
            throw new Error('Submit reply failed');
        });

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
            assert.ok(screen.getByTestId('moderation-warning-modal'));
            assert.ok(screen.getByTestId('moderation-warning-message').textContent?.includes('Submit reply failed'));
        });
    });

    it('alerts on edit submission error', async () => {
        mockOnCommentEdit = mock.fn(async () => {
            throw new Error('Edit comment failed');
        });

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
            assert.ok(screen.getByTestId('moderation-warning-modal'));
            assert.ok(screen.getByTestId('moderation-warning-message').textContent?.includes('Edit comment failed'));
        });
    });

    it('alerts on delete comment error', async () => {
        const confirmMock = mock.fn((_msg?: string) => true);
        Object.defineProperty(window, 'confirm', { value: confirmMock, writable: true, configurable: true });
        Object.defineProperty(global, 'confirm', { value: confirmMock, writable: true, configurable: true });
        mockOnCommentDelete = mock.fn(async () => {
            throw new Error('Delete comment failed');
        });

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
            assert.ok(screen.getByTestId('moderation-warning-modal'));
            assert.ok(screen.getByTestId('moderation-warning-message').textContent?.includes('Delete comment failed'));
        });
    });
});
