'use client';

import {
    Button,
    Checkbox,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Select,
    SelectItem,
    Slider,
    Textarea,
} from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { FaBookOpen, FaStar } from 'react-icons/fa';
import { clsx } from 'clsx';
import { z } from 'zod';

import { submitReview } from '@/app/actions/reviews';

// Schema matching Server Action validation
const ReviewFormSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(100),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
    overallRating: z.number().int().min(1).max(5),
    difficultyScore: z.number().int().min(1).max(5),
    usefulnessScore: z.number().int().min(1).max(5),
    enjoymentScore: z.number().int().min(1).max(5),
    termTaken: z.string().min(1, 'Term Taken is required'),
    grade: z.string().optional(),
    isAnonymous: z.boolean().default(false),
    agreeToTerms: z.literal(true, {
        message: 'You must agree to the Terms and Conditions',
    }),
});

interface ReviewModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    courseCode: string;
    courseName: string;
}

export const ReviewModal = ({ isOpen, onOpenChange, courseCode, courseName }: ReviewModalProps) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Form States
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [overallRating, setOverallRating] = useState(5);
    const [difficultyScore, setDifficultyScore] = useState(3);
    const [usefulnessScore, setUsefulnessScore] = useState(3);
    const [enjoymentScore, setEnjoymentScore] = useState(3);
    const [termTaken, setTermTaken] = useState('');
    const [grade, setGrade] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [agreeToTerms, setAgreeToTerms] = useState(false);

    // Validation Errors State
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Star rating hover/click help state
    const [hoveredStar, setHoveredStar] = useState<number | null>(null);

    const handleSubmit = (onClose: () => void) => {
        setErrors({});

        const formData = {
            title,
            description,
            overallRating,
            difficultyScore,
            usefulnessScore,
            enjoymentScore,
            termTaken,
            grade: grade || undefined,
            isAnonymous,
            agreeToTerms,
        };

        const result = ReviewFormSchema.safeParse(formData);

        if (!result.success) {
            const newErrors: Record<string, string> = {};
            result.error.issues.forEach((issue) => {
                const path = issue.path[0] as string;
                newErrors[path] = issue.message;
            });
            setErrors(newErrors);
            return;
        }

        startTransition(async () => {
            try {
                await submitReview({
                    ...result.data,
                    courseCode,
                });
                
                // Clear state on success
                setTitle('');
                setDescription('');
                setOverallRating(5);
                setDifficultyScore(3);
                setUsefulnessScore(3);
                setEnjoymentScore(3);
                setTermTaken('');
                setGrade('');
                setIsAnonymous(false);
                setAgreeToTerms(false);
                
                onClose();
            } catch (err: any) {
                setErrors({ submit: err.message || 'Failed to submit review' });
            }
        });
    };

    // Populate dynamic semesters from 2023 to 2026
    const termsOptions = [
        'Semester 1, 2026',
        'Semester 2, 2026',
        'Summer School, 2026',
        'Winter School, 2026',
        'Semester 1, 2025',
        'Semester 2, 2025',
        'Summer School, 2025',
        'Winter School, 2025',
        'Semester 1, 2024',
        'Semester 2, 2024',
        'Semester 1, 2023',
        'Semester 2, 2023',
    ];

    const gradeOptions = [
        { label: 'High Distinction (HD)', value: 'HD' },
        { label: 'Distinction (D)', value: 'D' },
        { label: 'Credit (C)', value: 'C' },
        { label: 'Pass (P)', value: 'P' },
        { label: 'Fail (F)', value: 'F' },
        { label: 'Withdrawn (WDN)', value: 'WDN' },
    ];

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside" className="bg-background border border-divider">
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <span className="text-2xs font-extrabold text-primary uppercase tracking-widest">{courseCode}</span>
                            <h2 className="text-xl font-bold">Review this Course</h2>
                            <p className="text-2xs text-foreground/50 font-normal">
                                Help other Adelaide University students make informed choices by sharing your feedback.
                            </p>
                        </ModalHeader>

                        <ModalBody className="gap-6 py-4">
                            
                            {errors.submit && (
                                <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-xl font-semibold">
                                    {errors.submit}
                                </div>
                            )}

                            {/* Overall 5-star Selector */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-foreground/75">Overall Star Rating</label>
                                <div className="flex items-center gap-1.5 text-2xl">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <FaStar
                                            key={star}
                                            className={clsx(
                                                'cursor-pointer transition-colors duration-200',
                                                star <= (hoveredStar ?? overallRating) ? 'text-yellow-500' : 'text-default-200'
                                            )}
                                            onClick={() => setOverallRating(star)}
                                            onMouseEnter={() => setHoveredStar(star)}
                                            onMouseLeave={() => setHoveredStar(null)}
                                        />
                                    ))}
                                    <span className="text-xs font-bold text-foreground/50 ml-2">
                                        ({overallRating} of 5 stars)
                                    </span>
                                </div>
                                {errors.overallRating && <p className="text-3xs text-red-500 font-bold">{errors.overallRating}</p>}
                            </div>

                            {/* Range Rating Sliders Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-default-50 p-4 rounded-2xl border border-divider/40">
                                {/* Difficulty Slider */}
                                <div className="flex flex-col gap-1">
                                    <Slider
                                        label="Difficulty"
                                        size="sm"
                                        step={1}
                                        maxValue={5}
                                        minValue={1}
                                        value={difficultyScore}
                                        onChange={(val) => setDifficultyScore(val as number)}
                                        color="danger"
                                        aria-label="Difficulty slider score"
                                    />
                                    <span className="text-[10px] text-foreground/50 text-right font-semibold">
                                        {difficultyScore === 5 ? 'Extreme' : difficultyScore === 1 ? 'Trivial' : 'Medium'}
                                    </span>
                                </div>

                                {/* Usefulness Slider */}
                                <div className="flex flex-col gap-1">
                                    <Slider
                                        label="Usefulness"
                                        size="sm"
                                        step={1}
                                        maxValue={5}
                                        minValue={1}
                                        value={usefulnessScore}
                                        onChange={(val) => setUsefulnessScore(val as number)}
                                        color="secondary"
                                        aria-label="Usefulness slider score"
                                    />
                                    <span className="text-[10px] text-foreground/50 text-right font-semibold">
                                        {usefulnessScore === 5 ? 'Crucial' : usefulnessScore === 1 ? 'Useless' : 'Helpful'}
                                    </span>
                                </div>

                                {/* Enjoyment Slider */}
                                <div className="flex flex-col gap-1">
                                    <Slider
                                        label="Enjoyment"
                                        size="sm"
                                        step={1}
                                        maxValue={5}
                                        minValue={1}
                                        value={enjoymentScore}
                                        onChange={(val) => setEnjoymentScore(val as number)}
                                        color="primary"
                                        aria-label="Enjoyment slider score"
                                    />
                                    <span className="text-[10px] text-foreground/50 text-right font-semibold">
                                        {enjoymentScore === 5 ? 'Love it' : enjoymentScore === 1 ? 'Hated it' : 'Fun'}
                                    </span>
                                </div>
                            </div>

                            {/* Dropdown selectors: Terms and Grades */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Select
                                        label="Term Taken"
                                        placeholder="Select Semester"
                                        selectedKeys={termTaken ? [termTaken] : []}
                                        onSelectionChange={(keys) => setTermTaken(Array.from(keys)[0] as string)}
                                        errorMessage={errors.termTaken}
                                        isInvalid={!!errors.termTaken}
                                        aria-label="Select term taken"
                                    >
                                        {termsOptions.map((term) => (
                                            <SelectItem key={term} textValue={term}>{term}</SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                <div>
                                    <Select
                                        label="Grade Achieved (Optional)"
                                        placeholder="Select Grade"
                                        selectedKeys={grade ? [grade] : []}
                                        onSelectionChange={(keys) => setGrade(Array.from(keys)[0] as string)}
                                        aria-label="Select grade achieved"
                                    >
                                        {gradeOptions.map((g) => (
                                            <SelectItem key={g.value} textValue={g.label}>{g.label}</SelectItem>
                                        ))}
                                    </Select>
                                </div>
                            </div>

                            {/* Title text input */}
                            <div>
                                <Input
                                    label="Review Title"
                                    placeholder="Summarize your experience (e.g., 'Fantastic course with high practical values')"
                                    value={title}
                                    onValueChange={setTitle}
                                    isInvalid={!!errors.title}
                                    errorMessage={errors.title}
                                />
                            </div>

                            {/* Description text area */}
                            <div>
                                <Textarea
                                    label="Review Description"
                                    placeholder="Detail the course contents, lecturer styles, assignments difficulty, and study tips..."
                                    value={description}
                                    onValueChange={setDescription}
                                    isInvalid={!!errors.description}
                                    errorMessage={errors.description}
                                    minRows={4}
                                />
                            </div>

                            {/* Anonymity and Agreement Options Checkboxes */}
                            <div className="flex flex-col gap-3 mt-2 bg-default-50 p-4 rounded-2xl border border-divider/40 text-xs">
                                <Checkbox
                                    isSelected={isAnonymous}
                                    onValueChange={setIsAnonymous}
                                    size="sm"
                                >
                                    <div className="flex flex-col gap-0.5 ml-1">
                                        <span className="font-bold">Post Anonymously</span>
                                        <span className="text-[10px] text-foreground/50">
                                            Your name will be hidden from public view, but retained in the admin logs for safety checks.
                                        </span>
                                    </div>
                                </Checkbox>

                                <Checkbox
                                    isSelected={agreeToTerms}
                                    onValueChange={setAgreeToTerms}
                                    isInvalid={!!errors.agreeToTerms}
                                    size="sm"
                                >
                                    <div className="flex items-center gap-1 ml-1 text-foreground/75">
                                        I agree to the{' '}
                                        <Link href="/terms" target="_blank" className="text-primary font-bold hover:underline">
                                            Terms and Conditions
                                        </Link>{' '}
                                        policies.
                                    </div>
                                </Checkbox>
                                {errors.agreeToTerms && (
                                    <p className="text-3xs text-red-500 font-bold ml-6">{errors.agreeToTerms}</p>
                                )}
                            </div>

                        </ModalBody>

                        <ModalFooter className="border-t border-divider">
                            <Button variant="flat" color="default" onPress={onClose} isDisabled={isPending}>
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                isLoading={isPending}
                                onPress={() => handleSubmit(onClose)}
                                className="text-black font-bold"
                            >
                                Submit Review
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};
