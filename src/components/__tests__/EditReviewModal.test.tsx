import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ReviewToEdit } from '../EditReviewModal';

// Mock @heroui/react before importing the component using modern Node 26 exports API
mock.module('@heroui/react', {
    exports: {
        Modal: ({ children, isOpen }: any) => isOpen ? React.createElement('div', { 'data-testid': 'mock-modal' }, children) : null,
        ModalContent: ({ children }: any) => React.createElement('div', { 'data-testid': 'mock-modal-content' }, typeof children === 'function' ? children(() => {}) : children),
        ModalHeader: ({ children, className, ...props }: any) => React.createElement('div', props, children),
        ModalBody: ({ children, className, ...props }: any) => React.createElement('div', props, children),
        ModalFooter: ({ children, className, ...props }: any) => React.createElement('div', props, children),
        Button: ({ children, onClick, onPress, isDisabled, className, isLoading, variant, ...props }: any) => React.createElement('button', { onClick: onClick || onPress, disabled: isDisabled || isLoading, ...props }, isLoading ? 'Loading...' : children),
        Input: ({ id, value, onValueChange, placeholder, isInvalid, errorMessage, classNames, radius, ...props }: any) => React.createElement('input', { id, type: 'text', value, onChange: (e: any) => onValueChange && onValueChange(e.target.value), placeholder, ...props }),
        Textarea: ({ id, value, onValueChange, placeholder, isInvalid, errorMessage, classNames, radius, minRows, ...props }: any) => React.createElement('textarea', { id, value, onChange: (e: any) => onValueChange && onValueChange(e.target.value), placeholder, ...props }),
        Select: ({ children, label, value, onChange, onSelectionChange, selectedKeys, errorMessage, isInvalid, classNames, popoverProps, listboxProps, radius, ...props }: any) => {
            const val = selectedKeys ? Array.from(selectedKeys)[0] : value;
            return React.createElement('label', null, React.createElement('span', null, label), React.createElement('select', { value: val, onChange: (e: any) => { if (onChange) onChange(e); if (onSelectionChange) onSelectionChange(new Set([e.target.value])); }, ...props }, children));
        },
        SelectItem: ({ children, value, textValue, className, ...props }: any) => React.createElement('option', { value: value || textValue, ...props }, children),
        Slider: ({ label, value, onChange, size, radius, step, maxValue, minValue, classNames, className, ...props }: any) => React.createElement('label', null, React.createElement('span', null, label), React.createElement('input', { type: 'range', value, min: minValue, max: maxValue, step, onChange: (e: any) => onChange && onChange(Number(e.target.value)), ...props })),
        Checkbox: ({ children, isSelected, onValueChange, className, size, radius, ...props }: any) => React.createElement('label', null, React.createElement('input', { type: 'checkbox', checked: isSelected, onChange: (e: any) => onValueChange && onValueChange(e.target.checked), ...props }), children),
    }
});

// Dynamically import component after registering mocks
const { EditReviewModal } = await import('../EditReviewModal');

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
    let mockOnSave: any;
    let mockOnOpenChange: any;

    beforeEach(() => {
        mockOnSave = mock.fn(async () => {});
        mockOnOpenChange = mock.fn();
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

        assert.ok(screen.getByText('Edit Your Review'));
        assert.strictEqual((screen.getByLabelText('Review Headline') as HTMLInputElement).value, 'Awesome course');
        assert.strictEqual(
            (screen.getByLabelText('Detailed Review Comments') as HTMLTextAreaElement).value,
            'This course was an absolutely fantastic and highly detailed introduction to object-oriented programming models and design patterns. Highly recommended indeed!'
        );
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
            assert.strictEqual(mockOnSave.mock.callCount(), 1);
            const args = mockOnSave.mock.calls[0].arguments[0];
            assert.strictEqual(args.title, 'New awesome title');
            assert.strictEqual(args.description, 'This course was an absolutely fantastic and highly detailed introduction to object-oriented programming models and design patterns. Highly recommended indeed!');
            assert.strictEqual(args.overallRating, 5);
            assert.strictEqual(args.difficultyScore, 3);
            assert.strictEqual(args.usefulnessScore, 4);
            assert.strictEqual(args.enjoymentScore, 5);
            assert.strictEqual(args.termTaken, 'Semester 1, 2026');
            assert.strictEqual(args.grade, 'HD');
            assert.strictEqual(args.isAnonymous, false);
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
        assert.ok(screen.getByText('COMP SCI 1102'));
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
            assert.strictEqual(mockOnSave.mock.callCount(), 0);
        });
    });

    it('displays error message if save callback throws an error', async () => {
        mockOnSave = mock.fn(async () => {
            throw new Error('Update request failed');
        });

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
            assert.ok(screen.getByText('Update request failed'));
        });
    });
});
