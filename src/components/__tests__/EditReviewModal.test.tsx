import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EditReviewModal, ReviewToEdit } from '../EditReviewModal';

jest.mock('@heroui/react', () => ({
    Modal: ({ children, isOpen }: any) => isOpen ? <div data-testid="mock-modal">{children}</div> : null,
    ModalContent: ({ children }: any) => {
        return (
            <div data-testid="mock-modal-content">
                {typeof children === 'function' ? children(() => {}) : children}
            </div>
        );
    },
    ModalHeader: ({ children, className, ...props }: any) => <div {...props}>{children}</div>,
    ModalBody: ({ children, className, ...props }: any) => <div {...props}>{children}</div>,
    ModalFooter: ({ children, className, ...props }: any) => <div {...props}>{children}</div>,
    Button: ({ children, onClick, onPress, isDisabled, className, isLoading, variant, ...props }: any) => (
        <button 
            onClick={onClick || onPress} 
            disabled={isDisabled || isLoading} 
            {...props}
        >
            {isLoading ? 'Loading...' : children}
        </button>
    ),
    Input: ({ id, value, onValueChange, placeholder, isInvalid, errorMessage, classNames, radius, ...props }: any) => (
        <input
            id={id}
            type="text"
            value={value}
            onChange={(e) => onValueChange && onValueChange(e.target.value)}
            placeholder={placeholder}
            {...props}
        />
    ),
    Textarea: ({ id, value, onValueChange, placeholder, isInvalid, errorMessage, classNames, radius, minRows, ...props }: any) => (
        <textarea
            id={id}
            value={value}
            onChange={(e) => onValueChange && onValueChange(e.target.value)}
            placeholder={placeholder}
            {...props}
        />
    ),
    Select: ({ children, label, value, onChange, onSelectionChange, selectedKeys, errorMessage, isInvalid, classNames, popoverProps, listboxProps, radius, ...props }: any) => {
        const val = selectedKeys ? Array.from(selectedKeys)[0] : value;
        return (
            <label>
                <span>{label}</span>
                <select
                    value={val}
                    onChange={(e) => {
                        if (onChange) onChange(e);
                        if (onSelectionChange) onSelectionChange(new Set([e.target.value]));
                    }}
                    {...props}
                >
                    {children}
                </select>
            </label>
        );
    },
    SelectItem: ({ children, value, textValue, className, ...props }: any) => (
        <option value={value || textValue} {...props}>
            {children}
        </option>
    ),
    Slider: ({ label, value, onChange, size, radius, step, maxValue, minValue, classNames, className, ...props }: any) => (
        <label>
            <span>{label}</span>
            <input
                type="range"
                value={value}
                min={minValue}
                max={maxValue}
                step={step}
                onChange={(e) => onChange && onChange(Number(e.target.value))}
                {...props}
            />
        </label>
    ),
    Checkbox: ({ children, isSelected, onValueChange, className, size, radius, ...props }: any) => (
        <label>
            <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onValueChange && onValueChange(e.target.checked)}
                {...props}
            />
            {children}
        </label>
    ),
}));

const mockReviewToEdit: ReviewToEdit = {
    id: 'rev1',
    title: 'Awesome course',
    description: 'This course was an absolutely fantastic and highly detailed introduction to object-oriented programming models and design patterns. Highly recommended indeed!',
    overallRating: 5,
    difficultyScore: 3,
    usefulnessScore: 4,
    enjoymentScore: 5,
    termTaken: 'Semester 1, 2026',
    grade: 'HD',
    isAnonymous: false,
};

describe('EditReviewModal Component', () => {
    let mockOnSave: jest.Mock;
    let mockOnOpenChange: jest.Mock;

    beforeEach(() => {
        mockOnSave = jest.fn().mockResolvedValue(undefined);
        mockOnOpenChange = jest.fn();
    });

    it('renders and populates existing review values correctly', () => {
        render(
            <EditReviewModal
                isOpen={true}
                onOpenChange={mockOnOpenChange}
                review={mockReviewToEdit}
                onSave={mockOnSave}
            />
        );

        expect(screen.getByText('Edit Your Review')).toBeInTheDocument();
        expect(screen.getByLabelText('Review Headline')).toHaveValue('Awesome course');
        expect(screen.getByLabelText('Detailed Review Comments')).toHaveValue('This course was an absolutely fantastic and highly detailed introduction to object-oriented programming models and design patterns. Highly recommended indeed!');
    });

    it('triggers save callback with updated inputs when submitted successfully', async () => {
        render(
            <EditReviewModal
                isOpen={true}
                onOpenChange={mockOnOpenChange}
                review={mockReviewToEdit}
                onSave={mockOnSave}
            />
        );

        const titleInput = screen.getByLabelText('Review Headline');
        fireEvent.change(titleInput, { target: { value: 'New awesome title' } });

        const saveButton = screen.getByRole('button', { name: 'Save Changes' });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
                title: 'New awesome title',
                description: 'This course was an absolutely fantastic and highly detailed introduction to object-oriented programming models and design patterns. Highly recommended indeed!',
                overallRating: 5,
                difficultyScore: 3,
                usefulnessScore: 4,
                enjoymentScore: 5,
                termTaken: 'Semester 1, 2026',
                grade: 'HD',
                isAnonymous: false,
            }));
        });
    });

    it('renders courseCode if provided in the review data', () => {
        const reviewWithCode = {
            ...mockReviewToEdit,
            courseCode: 'COMP SCI 1102',
        };
        render(
            <EditReviewModal
                isOpen={true}
                onOpenChange={mockOnOpenChange}
                review={reviewWithCode}
                onSave={mockOnSave}
            />
        );
        expect(screen.getByText('COMP SCI 1102')).toBeInTheDocument();
    });

    it('prevents submission and displays validation errors for short inputs', async () => {
        render(
            <EditReviewModal
                isOpen={true}
                onOpenChange={mockOnOpenChange}
                review={mockReviewToEdit}
                onSave={mockOnSave}
            />
        );

        const titleInput = screen.getByLabelText('Review Headline');
        fireEvent.change(titleInput, { target: { value: 'ab' } }); // too short (zod min is 3)

        const saveButton = screen.getByRole('button', { name: 'Save Changes' });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockOnSave).not.toHaveBeenCalled();
        });
    });

    it('displays error message if save callback throws an error', async () => {
        mockOnSave.mockRejectedValue(new Error('Update request failed'));
        render(
            <EditReviewModal
                isOpen={true}
                onOpenChange={mockOnOpenChange}
                review={mockReviewToEdit}
                onSave={mockOnSave}
            />
        );

        const saveButton = screen.getByRole('button', { name: 'Save Changes' });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText('Update request failed')).toBeInTheDocument();
        });
    });
});
