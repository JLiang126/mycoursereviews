import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LastMajorUpdateSection } from '../LastMajorUpdateSection';

jest.mock('@heroui/react', () => ({
    Select: ({ children, label, value, onChange, selectedKeys, onSelectionChange, classNames, popoverProps, listboxProps, radius, errorMessage, isInvalid, size, placeholder, ...props }: any) => {
        const val = selectedKeys ? Array.from(selectedKeys)[0] : value;
        return (
            <div data-testid="mock-select" {...props}>
                <label>{label}</label>
                <select
                    value={val || ''}
                    onChange={(e) => {
                        if (onChange) onChange(e);
                        if (onSelectionChange) onSelectionChange(new Set([e.target.value]));
                    }}
                >
                    {children}
                </select>
            </div>
        );
    },
    SelectItem: ({ children, value, textValue, className, ...props }: any) => (
        <option value={value || textValue} {...props}>
            {children}
        </option>
    ),
}));

jest.mock('@/lib/course-update-voting', () => ({
    UPDATE_TERM_OPTIONS: ['Semester 1, 2026', 'Semester 2, 2026', 'Summer School, 2026'],
}));

const mockVoteData = {
    consensusTerm: 'Semester 1, 2026',
    confirmCount: 3,
    disputeCount: 1,
    currentUserVote: null,
    totalVotes: 4,
};

describe('LastMajorUpdateSection Component', () => {
    let mockOnVote: jest.Mock;
    let mockOnAuthOpen: jest.Mock;

    beforeEach(() => {
        mockOnVote = jest.fn().mockResolvedValue(undefined);
        mockOnAuthOpen = jest.fn();
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

        expect(screen.getByText('Last Major Update')).toBeInTheDocument();
        expect(screen.getByText('Semester 1, 2026')).toBeInTheDocument();
        expect(screen.getByText('4 votes')).toBeInTheDocument();
        expect(screen.getByText('Correct')).toBeInTheDocument();
        expect(screen.getByText('Outdated')).toBeInTheDocument();
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
            expect(mockOnVote).toHaveBeenCalledWith('Semester 1, 2026');
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

        expect(mockOnAuthOpen).toHaveBeenCalled();
        expect(screen.queryByTestId('mock-select')).not.toBeInTheDocument();
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

        expect(screen.getByTestId('mock-select')).toBeInTheDocument();
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
        expect(screen.getByText('You suggested: Semester 2, 2026')).toBeInTheDocument();
    });
});
