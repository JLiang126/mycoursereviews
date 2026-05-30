import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CourseHeaderSection } from '../CourseHeaderSection';
import { CourseData } from '@/lib/courses-api';

jest.mock('@heroui/react', () => ({
    Button: ({ children, as: Component = 'button', href, ...props }: any) => (
        <Component href={href} {...props}>
            {children}
        </Component>
    ),
    Chip: ({ children, className, ...props }: any) => (
        <div data-testid="mock-chip" className={className} {...props}>
            {children}
        </div>
    ),
}));

const mockCourse: CourseData = {
    code: 'COMP SCI 1102',
    name: 'Object Oriented Programming',
    description: 'OOP details...',
    terms: ['Semester 1', 'Semester 2'],
    officialLink: 'https://example.com/outline',
    coordinator: 'Dr. John Doe',
    campus: 'North Terrace',
    units: 3,
    levelOfStudy: 'Undergraduate',
    universityWideElective: true,
};

describe('CourseHeaderSection Component', () => {
    it('renders basic course info successfully', () => {
        render(<CourseHeaderSection course={mockCourse} />);

        expect(screen.getByText('COMP SCI 1102')).toBeInTheDocument();
        expect(screen.getByText('Object Oriented Programming')).toBeInTheDocument();
        expect(screen.getByText('Semester 1')).toBeInTheDocument();
        expect(screen.getByText('Semester 2')).toBeInTheDocument();
    });

    it('renders full metadata pills successfully', () => {
        render(<CourseHeaderSection course={mockCourse} />);

        expect(screen.getByText(/COORDINATOR: Dr. John Doe/i)).toBeInTheDocument();
        expect(screen.getByText(/CAMPUS: North Terrace/i)).toBeInTheDocument();
        expect(screen.getByText(/UNITS: 3/i)).toBeInTheDocument();
        expect(screen.getByText(/LEVEL: Undergraduate/i)).toBeInTheDocument();
        expect(screen.getByText(/ELECTIVE: YES/i)).toBeInTheDocument();
    });

    it('renders no longer offered warnings when appropriate', () => {
        const inactiveCourse = {
            ...mockCourse,
            terms: ['No Longer Offered'],
            isNoLongerOffered: true,
        };
        render(<CourseHeaderSection course={inactiveCourse} />);

        expect(screen.getByText('Course No Longer Offered')).toBeInTheDocument();
        expect(screen.getByText(/This course is no longer offered by Adelaide University/i)).toBeInTheDocument();
    });
});
