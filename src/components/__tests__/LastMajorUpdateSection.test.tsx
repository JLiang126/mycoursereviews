import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock @heroui/react before importing the component using modern Node 26 exports API
mock.module('@heroui/react', {
    exports: {
        Select: ({ children, label, value, onChange, selectedKeys, onSelectionChange, classNames, popoverProps, listboxProps, radius, errorMessage, isInvalid, size, placeholder, ...props }: any) => {
            const val = selectedKeys ? Array.from(selectedKeys)[0] : value;
            return React.createElement('div', { 'data-testid': 'mock-select', ...props },
                React.createElement('label', null, label),
                React.createElement('select', {
                    value: val || '',
                    onChange: (e: any) => {
                        if (onChange) onChange(e);
                        if (onSelectionChange) onSelectionChange(new Set([e.target.value]));
                    }
                }, children)
            );
        },
        SelectItem: ({ children, value, textValue, className, ...props }: any) => (
            React.createElement('option', { value: value || textValue, ...props }, children)
        ),
    }
});

mock.module('@/lib/course-update-voting', {
    exports: {
        UPDATE_TERM_OPTIONS: ['Semester 1, 2026', 'Semester 2, 2026', 'Summer School, 2026'],
    }
});

// Dynamically import component after registering mocks
const { LastMajorUpdateSection } = await import('../LastMajorUpdateSection');

const mockVoteData = {
    consensusTerm: 'Semester 1, 2026',
    confirmCount: 3,
    disputeCount: 1,
    currentUserVote: null,
    totalVotes: 4,
};

describe('LastMajorUpdateSection Component', () => {
    let mockOnVote: any;
    let mockOnAuthOpen: any;

    beforeEach(() => {
        mockOnVote = mock.fn(async () => {});
        mockOnAuthOpen = mock.fn();
    });

    it('renders current consensus and counts successfully', () => {
        render(
            <LastMajorUpdateSection
                courseCode="COMP1102"
                voteData={mockVoteData}
                onVote={mockOnVote}
                voteLoading={false}
                onAuthOpen={mockOnAuthOpen}
                session={{ user: { id: 'u1' } }}
            />
        );

        assert.ok(screen.getByText('Last Major Update'));
        assert.ok(screen.getByText('Semester 1, 2026'));
        assert.ok(screen.getByText('4 votes'));
        assert.ok(screen.getByText('Correct'));
        assert.ok(screen.getByText('Outdated'));
    });

    it('calls onVote with consensus term when Correct is clicked', async () => {
        render(
            <LastMajorUpdateSection
                courseCode="COMP1102"
                voteData={mockVoteData}
                onVote={mockOnVote}
                voteLoading={false}
                onAuthOpen={mockOnAuthOpen}
                session={{ user: { id: 'u1' } }}
            />
        );

        const correctBtn = screen.getByRole('button', { name: /correct/i });
        fireEvent.click(correctBtn);

        await waitFor(() => {
            assert.strictEqual(mockOnVote.mock.callCount(), 1);
            assert.strictEqual(mockOnVote.mock.calls[0].arguments[0], 'Semester 1, 2026');
        });
    });

    it('triggers auth modal on Outdated click if user is unauthenticated', () => {
        render(
            <LastMajorUpdateSection
                courseCode="COMP1102"
                voteData={mockVoteData}
                onVote={mockOnVote}
                voteLoading={false}
                onAuthOpen={mockOnAuthOpen}
                session={null}
            />
        );

        const outdatedBtn = screen.getByRole('button', { name: /outdated/i });
        fireEvent.click(outdatedBtn);

        assert.strictEqual(mockOnAuthOpen.mock.callCount(), 1);
        assert.strictEqual(screen.queryByTestId('mock-select'), null);
    });

    it('opens dispute term selector on Outdated click if user is logged in', () => {
        render(
            <LastMajorUpdateSection
                courseCode="COMP1102"
                voteData={mockVoteData}
                onVote={mockOnVote}
                voteLoading={false}
                onAuthOpen={mockOnAuthOpen}
                session={{ user: { id: 'u1' } }}
            />
        );

        const outdatedBtn = screen.getByRole('button', { name: /outdated/i });
        fireEvent.click(outdatedBtn);

        assert.ok(screen.getByTestId('mock-select'));
    });

    it('renders user suggested vote chip when currentUserVote is different from consensusTerm', () => {
        const voteDataWithDispute = {
            ...mockVoteData,
            currentUserVote: 'Semester 2, 2026',
        };
        render(
            <LastMajorUpdateSection
                courseCode="COMP1102"
                voteData={voteDataWithDispute}
                onVote={mockOnVote}
                voteLoading={false}
                onAuthOpen={mockOnAuthOpen}
                session={{ user: { id: 'u1' } }}
            />
        );
        assert.ok(screen.getByText('You suggested: Semester 2, 2026'));
    });
});
