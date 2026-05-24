import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CourseDetailClient } from '../CourseDetailClient';
import { useSession, signIn } from 'next-auth/react';

jest.mock('next-auth/react', () => ({
    useSession: jest.fn(),
    signIn: jest.fn(),
}));

jest.mock('@/app/actions/reviews', () => ({
    addComment: jest.fn(),
    toggleLike: jest.fn(),
}));

// Mock @heroui/react Modal components to render as standard divs, avoiding complex framer-motion overlays in Jest jsdom
jest.mock('@heroui/react', () => {
    const original = jest.requireActual('@heroui/react');
    const React = require('react');
    return {
        ...original,
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
};

const mockStats = {
    avgOverall: 4.5,
    avgDifficulty: 2.5,
    avgUsefulness: 4.8,
    avgEnjoyment: 4.2,
    totalReviews: 1,
};

const mockReviews = [
    {
        id: 'rev-1',
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
    });

    it('renders the course headers and statistics successfully', () => {
        (useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' });

        render(
            <CourseDetailClient
                course={mockCourse}
                reviews={mockReviews}
                stats={mockStats}
            />
        );

        // Course info renders
        expect(screen.getByText(/COMP SCI 1102/i)).toBeInTheDocument();
        expect(screen.getByText(/Intro to Programming/i)).toBeInTheDocument();
        expect(screen.getByText(/Learn programming fundamentals/i)).toBeInTheDocument();
        
        // Write Review button renders
        expect(screen.getByRole('button', { name: /Write Review/i })).toBeInTheDocument();
    });

    it('opens the AuthRequired warning modal when an unauthenticated user clicks Write Review', async () => {
        (useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' });

        render(
            <CourseDetailClient
                course={mockCourse}
                reviews={mockReviews}
                stats={mockStats}
            />
        );

        const writeButton = screen.getByRole('button', { name: /Write Review/i });
        fireEvent.click(writeButton);

        // Warning modal text should be visible
        expect(screen.getByText('Authentication Required')).toBeInTheDocument();
        expect(screen.getByText(/You need to be logged into your verified/i)).toBeInTheDocument();

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
            />
        );

        const writeButton = screen.getByRole('button', { name: /Write Review/i });
        fireEvent.click(writeButton);

        // Should NOT show warning modal
        expect(screen.queryByText('Authentication Required')).not.toBeInTheDocument();

        // Review modal mock should be rendered
        expect(screen.getByTestId('mock-review-modal')).toBeInTheDocument();
    });
});
