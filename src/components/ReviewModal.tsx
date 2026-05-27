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
    const [isTermsOpen, setIsTermsOpen] = useState(false);

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
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside" className="bg-background border-4 border-foreground text-foreground rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
            <ModalContent className="rounded-none">
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1 border-b-3 border-foreground px-6 py-4">
                            <span className="font-mixtape text-xs uppercase font-extrabold text-mixtapeblack bg-neongreen border-2 border-foreground px-2 py-0.5 w-fit shadow-[2px_2px_0px_0px_#000] rotate-[-2deg] inline-block mb-1">{courseCode}</span>
                            <h2 className="font-mixtape uppercase text-xl font-extrabold tracking-tight">Review this Course</h2>
                            <p className="font-scribble text-xs text-foreground/80 font-bold rotate-[0.5deg]">
                                Help other Adelaide University students make informed choices by sharing your feedback.
                            </p>
                        </ModalHeader>

                        <ModalBody className="gap-6 py-4">
                            
                            {errors.submit && (
                                <div className="text-xs text-red-500 bg-red-500/10 border-2 border-red-500/20 p-3 rounded-none font-mono font-black">
                                    {errors.submit}
                                </div>
                            )}

                            {/* Overall 5-star Selector */}
                            <div className="flex flex-col gap-2 font-mono">
                                <label className="text-xs font-black uppercase text-foreground">Overall Star Rating</label>
                                <div className="flex items-center gap-1.5 text-2xl">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <FaStar
                                            key={star}
                                            className={clsx(
                                                'cursor-pointer transition-colors duration-200',
                                                star <= (hoveredStar ?? overallRating) ? 'text-[#FAA307]' : 'text-foreground/20'
                                            )}
                                            onClick={() => setOverallRating(star)}
                                            onMouseEnter={() => setHoveredStar(star)}
                                            onMouseLeave={() => setHoveredStar(null)}
                                        />
                                    ))}
                                    <span className="text-xs font-black text-foreground/60 ml-2">
                                        ({overallRating} of 5)
                                    </span>
                                </div>
                                {errors.overallRating && <p className="text-3xs text-red-500 font-bold">{errors.overallRating}</p>}
                            </div>

                            {/* Range Rating Sliders Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-foreground/[0.03] p-4 border-2 border-dashed border-foreground/30">
                                {/* Difficulty Slider */}
                                <div className="flex flex-col gap-1 font-mono">
                                    <Slider
                                        label="Difficulty"
                                        size="sm"
                                        radius="none"
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
                                <div className="flex flex-col gap-1 font-mono">
                                    <Slider
                                        label="Usefulness"
                                        size="sm"
                                        radius="none"
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
                                <div className="flex flex-col gap-1 font-mono">
                                    <Slider
                                        label="Enjoyment"
                                        size="sm"
                                        radius="none"
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
                                        radius="none"
                                        placeholder="Select Semester"
                                        selectedKeys={termTaken ? [termTaken] : []}
                                        onSelectionChange={(keys) => setTermTaken(Array.from(keys)[0] as string)}
                                        errorMessage={errors.termTaken}
                                        isInvalid={!!errors.termTaken}
                                        aria-label="Select term taken"
                                        className="font-mono border-2 border-foreground bg-background"
                                    >
                                        {termsOptions.map((term) => (
                                            <SelectItem key={term} textValue={term} className="font-mono text-xs">{term}</SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                <div>
                                    <Select
                                        label="Grade Achieved (Optional)"
                                        radius="none"
                                        placeholder="Select Grade"
                                        selectedKeys={grade ? [grade] : []}
                                        onSelectionChange={(keys) => setGrade(Array.from(keys)[0] as string)}
                                        aria-label="Select grade achieved"
                                        className="font-mono border-2 border-foreground bg-background"
                                    >
                                        {gradeOptions.map((g) => (
                                            <SelectItem key={g.value} textValue={g.label} className="font-mono text-xs">{g.label}</SelectItem>
                                        ))}
                                    </Select>
                                </div>
                            </div>

                            {/* Title text input */}
                            <div>
                                <Input
                                    label="Review Title"
                                    radius="none"
                                    placeholder="Summarize your experience (e.g., 'Fantastic course with high practical values')"
                                    value={title}
                                    onValueChange={setTitle}
                                    isInvalid={!!errors.title}
                                    errorMessage={errors.title}
                                    className="font-mono border-2 border-foreground"
                                />
                            </div>

                            {/* Description text area */}
                            <div>
                                <Textarea
                                    label="Review Description"
                                    radius="none"
                                    placeholder="Detail the course contents, lecturer styles, assignments difficulty, and study tips..."
                                    value={description}
                                    onValueChange={setDescription}
                                    isInvalid={!!errors.description}
                                    errorMessage={errors.description}
                                    minRows={4}
                                    className="font-mono border-2 border-foreground"
                                />
                            </div>

                            {/* Anonymity and Agreement Options Checkboxes */}
                            <div className="flex flex-col gap-3 mt-2 bg-foreground/[0.03] p-4 border-2 border-dashed border-foreground/30 text-xs font-mono">
                                <Checkbox
                                    isSelected={isAnonymous}
                                    onValueChange={setIsAnonymous}
                                    size="sm"
                                    radius="none"
                                    className="rounded-none"
                                >
                                    <div className="flex flex-col gap-0.5 ml-1">
                                        <span className="font-black uppercase text-2xs">Post Anonymously</span>
                                        <span className="text-[9px] text-foreground/60 leading-none">
                                            Your name will be hidden from public view, but retained in the admin logs for safety checks.
                                        </span>
                                    </div>
                                </Checkbox>

                                <Checkbox
                                    isSelected={agreeToTerms}
                                    onValueChange={setAgreeToTerms}
                                    isInvalid={!!errors.agreeToTerms}
                                    size="sm"
                                    radius="none"
                                    className="rounded-none font-bold text-2xs uppercase"
                                >
                                    <div className="flex items-center gap-1 ml-1 text-foreground/75">
                                        I agree to the{' '}
                                        <span 
                                            onClick={() => setIsTermsOpen(true)} 
                                            className="text-hotpink font-extrabold hover:underline cursor-pointer select-none"
                                        >
                                            Terms
                                        </span>{' '}
                                        policies.
                                    </div>
                                </Checkbox>
                                {errors.agreeToTerms && (
                                    <p className="text-3xs text-red-500 font-bold ml-6">{errors.agreeToTerms}</p>
                                )}
                            </div>

                        </ModalBody>

                        <ModalFooter className="border-t-3 border-foreground px-6 py-4">
                            <Button radius="none" variant="flat" color="default" onPress={onClose} isDisabled={isPending} className="font-mono text-xs border border-foreground">
                                Cancel
                            </Button>
                            <Button
                                radius="none"
                                isLoading={isPending}
                                onPress={() => handleSubmit(onClose)}
                                className="font-mono text-xs uppercase font-black bg-neongreen text-mixtapeblack border-2 border-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]"
                            >
                                Submit Review
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
            {/* Terms sub-modal inside ReviewModal */}
            <Modal 
                isOpen={isTermsOpen} 
                onClose={() => setIsTermsOpen(false)} 
                className="bg-background border-4 border-foreground text-foreground rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] z-[100]"
            >
                <ModalContent className="rounded-none">
                    <ModalHeader className="font-mixtape uppercase tracking-tighter text-xl border-b-3 border-foreground px-6 py-4">Terms</ModalHeader>
                    <ModalBody className="p-6 font-mono text-sm leading-relaxed max-h-[400px] overflow-y-auto">
                        <p className="font-bold border-l-3 border-primary pl-3 text-foreground py-0.5 mb-3">
                            By using our services, submitting ratings, or registering, you agree to the following terms of use:
                        </p>
                        <div className="flex flex-col gap-4">
                            <div>
                                <h4 className="font-bold text-foreground">1. Code of Conduct Compliance</h4>
                                <p className="text-xs text-foreground/75 mt-1">Reviews must comply with the Adelaide University Student Charter. Be respectful, fair, and constructive.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground">2. Spam and Fake Content</h4>
                                <p className="text-xs text-foreground/75 mt-1">Reviews must reflect genuine student enrollment experiences. Duplicate or rating-manipulation reviews will be removed.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground">3. Offensive & Malicious Content</h4>
                                <p className="text-xs text-foreground/75 mt-1">Profanity, obscene language, personal harassment, and dangerous or malicious code are strictly prohibited.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground">4. Conflict of Interest</h4>
                                <p className="text-xs text-foreground/75 mt-1">Tutors and course coordinators must not write reviews for semesters in which they were teaching or managing the course.</p>
                            </div>
                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Modal>
    );
};
