import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CourseDetailClient } from '../CourseDetailClient';
import { useSession, signIn } from 'next-auth/react';
import { addComment, toggleLike, deleteReview, deleteComment, updateComment, updateReview } from '@/app/actions/reviews';
import { voteOnCourseUpdate } from '@/app/actions/courseUpdates';

jest.mock('next-auth/react', () => ({
    useSession: jest.fn(),
    signIn: jest.fn(),
}));

jest.mock('@/app/actions/reviews', () => ({
    addComment: jest.fn(),
    toggleLike: jest.fn(),
    deleteReview: jest.fn(),
    deleteComment: jest.fn(),
    updateComment: jest.fn(),
    updateReview: jest.fn(),
}));

jest.mock('@/app/actions/courseUpdates', () => ({
    voteOnCourseUpdate: jest.fn(),
}));

jest.mock('@/lib/course-update-voting', () => ({
    UPDATE_TERM_OPTIONS: ['Semester 1, 2026', 'Semester 2, 2026'],
    DEFAULT_LAST_UPDATE: 'Semester 1, 2026',
}));

// Mock @heroui/react components to avoid complex framer-motion overlays and dynamic imports in Jest jsdom
jest.mock('@heroui/react', () => {
    const React = require('react');
    return {
        Button: ({ children, onClick, onPress, className, as: Component = 'button', isLoading, startContent, radius, size, variant, isIconOnly, color, isDisabled, ...props }: any) => (
            <Component 
                onClick={onClick || onPress} 
                className={className} 
                disabled={isDisabled || isLoading} 
                {...props}
            >
                {children}
            </Component>
        ),
        Chip: ({ children, className, radius, size, variant, color, startContent, endContent, ...props }: any) => (
            <div data-testid="mock-chip" className={className} {...props}>
                {children}
            </div>
        ),
        Card: ({ children, className, radius, shadow, isPressable, onPress, ...props }: any) => (
            <div data-testid="mock-card" className={className} {...props}>
                {children}
            </div>
        ),
        CardBody: ({ children, className, ...props }: any) => (
            <div data-testid="mock-card-body" className={className} {...props}>
                {children}
            </div>
        ),
        Textarea: ({ value, onValueChange, placeholder, className, radius, minRows, classNames, size, isInvalid, errorMessage, onChange, ...props }: any) => (
            <textarea
                value={value}
                onChange={onChange || ((e: any) => onValueChange && onValueChange(e.target.value))}
                placeholder={placeholder}
                className={className}
                {...props}
            />
        ),
        Modal: ({ children, isOpen }: any) => isOpen ? <div data-testid="mock-modal">{children}</div> : null,
        ModalContent: ({ children }: any) => {
            return (
                <div data-testid="mock-modal-content">
                    {typeof children === 'function' ? children(() => {}) : children}
                </div>
            );
        },
        ModalHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        ModalBody: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        ModalFooter: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        Select: ({ children, label, value, onChange, selectedKeys, onSelectionChange, classNames, popoverProps, listboxProps, radius, errorMessage, isInvalid, size, placeholder, ...props }: any) => {
            const val = selectedKeys ? Array.from(selectedKeys)[0] : value;
            const handleChange = (e: any) => {
                if (onChange) onChange(e);
                if (onSelectionChange) onSelectionChange(new Set([e.target.value]));
            };
            return (
                <div data-testid="mock-select" {...props}>
                    <label>{label}</label>
                    <select aria-label={label} value={val || ''} onChange={handleChange}>
                        {React.Children.map(children, (child: any) => {
                            if (!child) return null;
                            const childKey = child.key || child.props?.value || child.props?.textValue;
                            return (
                                <option key={childKey} value={childKey}>
                                    {child.props?.children || child.props?.textValue}
                                </option>
                            );
                        })}
                    </select>
                </div>
            );
        },
        SelectItem: ({ children, value, textValue, className, ...props }: any) => (
            <option value={value} {...props}>
                {children}
            </option>
        ),
        useDisclosure: () => {
            const [isOpen, setIsOpen] = React.useState(false);
            return {
                isOpen,
                onOpen: () => setIsOpen(true),
                onClose: () => setIsOpen(false),
                onOpenChange: (val?: boolean) => setIsOpen((prev: boolean) => val !== undefined ? val : !prev),
            };
        },
    };
});

// Mock the ReviewModal so we don't trigger its internal state hook dependencies
jest.mock('../ReviewModal', () => ({
    ReviewModal: () => <div data-testid="mock-review-modal" />,
}));

const mockCourse = {
    code: 'COMP SCI 1102',
    name: 'Intro to Programming',
    description: 'Learn programming fundamentals.',
    terms: ['Semester 1', 'Semester 2'],
    officialLink: 'https://example.com',
    prerequisites: 'COMP SCI 1101',
    corequisites: 'MATHS 1011',
    antirequisites: 'COMP SCI 1103',
    assessments: [
        { title: 'Exam', weighting: '50%', hurdle: 'Yes' },
        { title: 'Project', weighting: '50%', hurdle: '' },
    ],
    learningOutcomes: [
        { outcomeIndex: 1, description: 'Write basic programs' },
    ],
    textbooks: 'Programming in Python 3',
};

const mockStats = {
    avgOverall: 4.5,
    avgDifficulty: 2.5,
    avgUsefulness: 4.8,
    avgEnjoyment: 4.2,
    totalReviews: 1,
};

const mockUpdateVoteData = {
    consensusTerm: 'Semester 1, 2026',
    confirmCount: 0,
    disputeCount: 0,
    currentUserVote: null,
    totalVotes: 0,
};

const mockReviews = [
    {
        id: 'rev-1',
        userId: 'usr-1',
        title: 'Great Introductory Course',
        description: 'Loved learning python and building projects.',
        overallRating: 5,
        difficultyScore: 2,
        usefulnessScore: 5,
        enjoymentScore: 5,
        termTaken: 'Semester 1, 2026',
        grade: 'HD',
        isAnonymous: false,
        reviewerName: 'John Student',
        createdAt: new Date('2026-05-24T12:00:00Z'),
        likesCount: 2,
        likedByCurrentUser: false,
        comments: [],
    },
];

describe('CourseDetailClient Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (toggleLike as jest.Mock).mockResolvedValue(undefined);
        (deleteReview as jest.Mock).mockResolvedValue(undefined);
        (addComment as jest.Mock).mockResolvedValue(undefined);
        (updateComment as jest.Mock).mockResolvedValue(undefined);
        (deleteComment as jest.Mock).mockResolvedValue(undefined);
        (updateReview as jest.Mock).mockResolvedValue(undefined);
        (voteOnCourseUpdate as jest.Mock).mockResolvedValue({ success: true, voteData: mockUpdateVoteData });
    });

    it('renders the course headers, statistics and enriched adelaide metadata successfully', () => {
        (useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' });

        render(
            <CourseDetailClient
                course={mockCourse}
                reviews={mockReviews}
                stats={mockStats}
                updateVoteData={mockUpdateVoteData}
            />
        );

        // Course info renders
        expect(screen.getByText(/COMP SCI 1102/i)).toBeInTheDocument();
        expect(screen.getByText(/Intro to Programming/i)).toBeInTheDocument();
        expect(screen.getByText(/Learn programming fundamentals/i)).toBeInTheDocument();

        // Enriched metadata blocks render
        expect(screen.getByText('Prerequisites')).toBeInTheDocument();
        expect(screen.getByText('COMP SCI 1101')).toBeInTheDocument();
        expect(screen.getByText('Corequisites')).toBeInTheDocument();
        expect(screen.getByText('MATHS 1011')).toBeInTheDocument();
        expect(screen.getByText('Antirequisites')).toBeInTheDocument();
        expect(screen.getByText('COMP SCI 1103')).toBeInTheDocument();
        expect(screen.getByText('Exam')).toBeInTheDocument();
        expect(screen.getByText('Project')).toBeInTheDocument();
        expect(screen.getByText('Learning Outcomes')).toBeInTheDocument();
        expect(screen.getByText('Write basic programs')).toBeInTheDocument();
        expect(screen.getByText('Textbooks & Resources')).toBeInTheDocument();
        expect(screen.getByText('Programming in Python 3')).toBeInTheDocument();
        
        // Write Review button renders
        expect(screen.getByRole('button', { name: /Write Review/i })).toBeInTheDocument();
    });

    it('renders placeholder string when description is missing', () => {
        (useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' });
        render(
            <CourseDetailClient
                course={{ ...mockCourse, description: '' }}
                reviews={[]}
                stats={mockStats}
                updateVoteData={mockUpdateVoteData}
            />
        );
        expect(screen.getByText(/No overview available/i)).toBeInTheDocument();
        expect(screen.getByText(/No reviews yet/i)).toBeInTheDocument();
    });

    it('opens the AuthRequired warning modal when an unauthenticated user clicks Write Review', async () => {
        (useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' });

        render(
            <CourseDetailClient
                course={mockCourse}
                reviews={mockReviews}
                stats={mockStats}
                updateVoteData={mockUpdateVoteData}
            />
        );

        const writeButton = screen.getByRole('button', { name: /Write Review/i });
        fireEvent.click(writeButton);

        // Warning modal text should be visible
        expect(screen.getByText('Authentication Required')).toBeInTheDocument();
        expect(screen.getByText(/You need to be logged into your/i)).toBeInTheDocument();

        // Clicking the sign in option triggers NextAuth OIDC flow
        const loginBtn = screen.getByRole('button', { name: /Log In with Keycloak/i });
        fireEvent.click(loginBtn);
        expect(signIn).toHaveBeenCalledWith('keycloak');
    });

    it('opens the review submission modal directly if user is logged in', () => {
        (useSession as jest.Mock).mockReturnValue({
            data: { user: { id: 'usr-1', name: 'John Student', email: 'john@student.adelaide.edu.au', role: 'user' } },
            status: 'authenticated',
        });

        render(
            <CourseDetailClient
                course={mockCourse}
                reviews={mockReviews}
                stats={mockStats}
                updateVoteData={mockUpdateVoteData}
            />
        );

        const writeButton = screen.getByRole('button', { name: /Write Review/i });
        fireEvent.click(writeButton);

        // Should NOT show warning modal
        expect(screen.queryByText('Authentication Required')).not.toBeInTheDocument();

        // Review modal mock should be rendered
        expect(screen.getByTestId('mock-review-modal')).toBeInTheDocument();
    });

    it('allows sorting reviews feed', () => {
        (useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' });
        render(
            <CourseDetailClient
                course={mockCourse}
                reviews={mockReviews}
                stats={mockStats}
                updateVoteData={mockUpdateVoteData}
            />
        );

        const selectEl = screen.getByRole('combobox', { name: 'Sort Feed' });
        fireEvent.change(selectEl, { target: { value: 'rating-desc' } });
        expect(selectEl).toHaveValue('rating-desc');

        fireEvent.change(selectEl, { target: { value: 'rating-asc' } });
        expect(selectEl).toHaveValue('rating-asc');
    });

    it('handles review actions when authenticated', async () => {
        (useSession as jest.Mock).mockReturnValue({
            data: { user: { id: 'usr-1', name: 'John Student', role: 'user' } },
            status: 'authenticated',
        });

        render(
            <CourseDetailClient
                course={mockCourse}
                reviews={mockReviews}
                stats={mockStats}
                updateVoteData={mockUpdateVoteData}
            />
        );

        // Like review callback triggered on card
        const likeBtn = screen.getByRole('button', { name: /Like/i });
        fireEvent.click(likeBtn);
        await waitFor(() => {
            expect(toggleLike).toHaveBeenCalledWith('rev-1');
        });

        // Delete review callback triggered on card
        window.confirm = jest.fn(() => true);
        const deleteBtn = screen.getByRole('button', { name: /Delete/i });
        fireEvent.click(deleteBtn);
        await waitFor(() => {
            expect(deleteReview).toHaveBeenCalledWith('rev-1');
        });
    });

    it('handles comment submission when authenticated', async () => {
        (useSession as jest.Mock).mockReturnValue({
            data: { user: { id: 'usr-1', name: 'John Student', role: 'user' } },
            status: 'authenticated',
        });

        render(
            <CourseDetailClient
                course={mockCourse}
                reviews={mockReviews}
                stats={mockStats}
                updateVoteData={mockUpdateVoteData}
            />
        );

        // Click Comments button to expand
        const commentBtn = screen.getByRole('button', { name: /Comments/i });
        fireEvent.click(commentBtn);

        // Write a root comment
        const commentTextarea = screen.getByPlaceholderText('Write a comment...');
        fireEvent.change(commentTextarea, { target: { value: 'This is my integration comment' } });

        const submitBtn = screen.getByRole('button', { name: 'Add a Comment' });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(addComment).toHaveBeenCalledWith('rev-1', 'This is my integration comment', undefined);
        });
    });

    it('handles consensus update voting triggers', async () => {
        (useSession as jest.Mock).mockReturnValue({
            data: { user: { id: 'usr-1', name: 'John Student', role: 'user' } },
            status: 'authenticated',
        });

        render(
            <CourseDetailClient
                course={mockCourse}
                reviews={mockReviews}
                stats={mockStats}
                updateVoteData={mockUpdateVoteData}
            />
        );

        const correctBtn = screen.getByRole('button', { name: /Correct/i });
        fireEvent.click(correctBtn);

        await waitFor(() => {
            expect(voteOnCourseUpdate).toHaveBeenCalledWith('COMP SCI 1102', 'Semester 1, 2026', 'Semester 1, 2026');
        });
    });
});
