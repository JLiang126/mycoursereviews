'use client';

import {
    Button,
    Card,
    CardBody,
    Chip,
    Input,
    Select,
    SelectItem,
    Spinner,
} from '@heroui/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FaFilter, FaSearch, FaStar, FaTimes } from 'react-icons/fa';

import { CourseData } from '@/lib/courses-api';

const PAGE_SIZE = 24;

interface CourseWithStats extends CourseData {
    subject: string;
    avgRating: number;
    avgDifficulty: number;
    avgUsefulness: number;
    avgEnjoyment: number;
    reviewCount: number;
    mostRecentReview: string | null;
}

interface BrowseCoursesClientProps {
    courses: CourseWithStats[];
}

const SORT_OPTIONS = [
    { key: 'recent',      label: 'Most Recent Reviews' },
    { key: 'name-asc',    label: 'A → Z' },
    { key: 'name-desc',   label: 'Z → A' },
    { key: 'rating-desc', label: 'Overall Rating' },
    { key: 'difficulty',  label: 'Difficulty' },
    { key: 'usefulness',  label: 'Usefulness' },
    { key: 'enjoyment',   label: 'Enjoyment' },
] as const;

const ALL_TERMS = ['Semester 1', 'Semester 2', 'Summer', 'Winter'];

export const BrowseCoursesClient = ({ courses }: BrowseCoursesClientProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
    const [selectedTerms, setSelectedTerms] = useState<Set<string>>(new Set());
    const [sortBy, setSortBy] = useState<string>('recent');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [mounted, setMounted] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setMounted(true); }, []);

    // Derive sorted unique subject list — prefer subjectName (full name from API) over code abbreviation
    const allSubjects = useMemo(() => {
        const subjects = new Set(
            courses.map((c) => (c.subjectName && c.subjectName.trim()) ? c.subjectName : c.subject)
        );
        return Array.from(subjects).sort();
    }, [courses]);

    // Filter logic
    const filteredCourses = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        return courses.filter((course) => {
            if (query && !(
                course.code.toLowerCase().includes(query) ||
                course.name.toLowerCase().includes(query) ||
                (course.description || '').toLowerCase().includes(query)
            )) return false;

            // Subject multi-filter — match against full subject name or abbreviation
            if (selectedSubjects.size > 0) {
                const courseSubjectName = (course.subjectName && course.subjectName.trim()) ? course.subjectName : course.subject;
                if (!selectedSubjects.has(courseSubjectName)) return false;
            }

            // Term multi-filter
            if (selectedTerms.size > 0) {
                const courseTermsLower = course.terms.map((t) => t.toLowerCase());
                const hasMatchingTerm = Array.from(selectedTerms).some((sel) =>
                    courseTermsLower.some((ct) => ct.includes(sel.toLowerCase()))
                );
                if (!hasMatchingTerm) return false;
            }

            return true;
        });
    }, [courses, searchQuery, selectedSubjects, selectedTerms]);

    // Sort logic
    const sortedCourses = useMemo(() => {
        return [...filteredCourses].sort((a, b) => {
            switch (sortBy) {
                case 'recent': {
                    if (!a.mostRecentReview && !b.mostRecentReview) return a.name.localeCompare(b.name);
                    if (!a.mostRecentReview) return 1;
                    if (!b.mostRecentReview) return -1;
                    return new Date(b.mostRecentReview).getTime() - new Date(a.mostRecentReview).getTime();
                }
                case 'name-asc':    return a.name.localeCompare(b.name);
                case 'name-desc':   return b.name.localeCompare(a.name);
                case 'rating-desc': return b.avgRating - a.avgRating;
                case 'difficulty':  return b.avgDifficulty - a.avgDifficulty;
                case 'usefulness':  return b.avgUsefulness - a.avgUsefulness;
                case 'enjoyment':   return b.avgEnjoyment - a.avgEnjoyment;
                default:            return 0;
            }
        });
    }, [filteredCourses, sortBy]);

    // Reset visible count when filters/sort change
    useEffect(() => { setVisibleCount(PAGE_SIZE); }, [searchQuery, selectedSubjects, selectedTerms, sortBy]);

    // Infinite scroll — observe sentinel div at the bottom
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, sortedCourses.length));
                }
            },
            { rootMargin: '200px' }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [sortedCourses.length]);

    const visibleCourses = sortedCourses.slice(0, visibleCount);
    const hasMore = visibleCount < sortedCourses.length;
    const hasActiveFilters = selectedSubjects.size > 0 || selectedTerms.size > 0 || searchQuery.trim().length > 0;

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedSubjects(new Set());
        setSelectedTerms(new Set());
        setSortBy('recent');
    };

    return (
        <div className="flex flex-col gap-8">

            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Browse Courses</h1>
                <p className="text-sm text-foreground/60 mt-1">
                    Explore student reviews, sub-scores, and outlines for Adelaide University courses.
                </p>
            </div>

            {/* Filter and Search Controls */}
            {mounted ? (
                <div className="flex flex-col gap-3 bg-background/40 backdrop-blur-md border border-divider p-4 rounded-2xl shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Search */}
                        <div className="md:col-span-1">
                            <Input
                                isClearable
                                placeholder="Search by code or title..."
                                startContent={<FaSearch className="text-foreground/45" />}
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                                className="w-full"
                            />
                        </div>

                        {/* Subject Multi-Select */}
                        <Select
                            labelPlacement="outside"
                            placeholder="Filter by Subject Area"
                            selectionMode="multiple"
                            selectedKeys={selectedSubjects}
                            onSelectionChange={(keys) => setSelectedSubjects(new Set(keys as unknown as string[]))}
                            aria-label="Filter by subject area"
                        >
                            {allSubjects.map((subject) => (
                                <SelectItem key={subject} textValue={subject}>
                                    {subject}
                                </SelectItem>
                            ))}
                        </Select>

                        {/* Term Multi-Select */}
                        <Select
                            labelPlacement="outside"
                            placeholder="Filter by Term"
                            selectionMode="multiple"
                            selectedKeys={selectedTerms}
                            onSelectionChange={(keys) => setSelectedTerms(new Set(keys as unknown as string[]))}
                            aria-label="Filter by term"
                        >
                            {ALL_TERMS.map((term) => (
                                <SelectItem key={term} textValue={term}>
                                    {term}
                                </SelectItem>
                            ))}
                        </Select>
                    </div>

                    {/* Active filter chips */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap gap-2 items-center pt-1">
                            {Array.from(selectedSubjects).map((s) => (
                                <Chip
                                    key={s}
                                    size="sm"
                                    variant="flat"
                                    color="primary"
                                    onClose={() => {
                                        const next = new Set(selectedSubjects);
                                        next.delete(s);
                                        setSelectedSubjects(next);
                                    }}
                                >
                                    {s}
                                </Chip>
                            ))}
                            {Array.from(selectedTerms).map((t) => (
                                <Chip
                                    key={t}
                                    size="sm"
                                    variant="flat"
                                    color="secondary"
                                    onClose={() => {
                                        const next = new Set(selectedTerms);
                                        next.delete(t);
                                        setSelectedTerms(next);
                                    }}
                                >
                                    {t}
                                </Chip>
                            ))}
                            <Button
                                size="sm"
                                variant="light"
                                color="danger"
                                startContent={<FaTimes />}
                                onPress={clearFilters}
                                className="text-xs h-6 px-2"
                            >
                                Clear all
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="h-20 w-full bg-background/40 border border-divider rounded-2xl animate-pulse" />
            )}

            {/* Sort & Count Row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <p className="text-xs text-foreground/50 font-semibold uppercase tracking-wider">
                    Showing {visibleCourses.length} of {sortedCourses.length} courses
                    {sortedCourses.length !== courses.length && ` (${courses.length} total)`}
                </p>

                {mounted ? (
                    <Select
                        size="sm"
                        label="Sort By"
                        selectedKeys={[sortBy]}
                        onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as string)}
                        className="w-52"
                        aria-label="Sort courses"
                    >
                        {SORT_OPTIONS.map((opt) => (
                            <SelectItem key={opt.key} textValue={opt.label}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </Select>
                ) : (
                    <div className="h-8 w-52 bg-default-100 animate-pulse rounded-xl" />
                )}
            </div>

            {/* Courses Grid */}
            {sortedCourses.length === 0 ? (
                <div className="text-center py-16 bg-background/20 border border-dashed border-divider rounded-2xl">
                    <FaFilter className="text-foreground/20 text-5xl mx-auto mb-4" />
                    <p className="font-bold text-lg">No courses found</p>
                    <p className="text-sm text-foreground/50 mt-1">Try updating your filters or search keywords.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {visibleCourses.map((course, idx) => (
                            <motion.div
                                key={course.code}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: Math.min((idx % PAGE_SIZE) * 0.03, 0.35) }}
                            >
                                <Card
                                    as={Link}
                                    href={`/courses/${encodeURIComponent(course.code)}`}
                                    isPressable
                                    isHoverable
                                    className="bg-background/40 backdrop-blur-sm border border-divider hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 w-full text-left shadow-sm"
                                >
                                    <CardBody className="p-5 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <span className="font-extrabold text-sm text-primary tracking-wide">
                                                {course.code}
                                            </span>
                                            {course.reviewCount > 0 ? (
                                                <div className="flex items-center gap-1 text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                                                    <FaStar className="text-2xs" />
                                                    <span>{course.avgRating.toFixed(1)}</span>
                                                </div>
                                            ) : (
                                                <span className="text-2xs font-semibold text-foreground/40 bg-default-100 px-2 py-0.5 rounded-full">
                                                    No ratings
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-lg line-clamp-1">
                                                {course.name}
                                            </h3>
                                            <p className="text-xs text-foreground/50 line-clamp-2 mt-1 leading-relaxed">
                                                {course.description || 'No description provided.'}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {course.terms.map((term) => (
                                                <Chip
                                                    key={term}
                                                    size="sm"
                                                    variant="flat"
                                                    color="secondary"
                                                    className="text-3xs font-semibold"
                                                >
                                                    {term}
                                                </Chip>
                                            ))}
                                        </div>

                                        <div className="border-t border-divider mt-2 pt-3 flex items-center justify-between text-2xs text-foreground/50 font-semibold">
                                            <span>
                                                {course.reviewCount} {course.reviewCount === 1 ? 'review' : 'reviews'}
                                            </span>
                                            <span className="text-primary flex items-center gap-1">
                                                View Reviews &rarr;
                                            </span>
                                        </div>
                                    </CardBody>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Infinite scroll sentinel */}
                    <div ref={sentinelRef} className="flex justify-center py-6">
                        {hasMore && (
                            <div className="flex items-center gap-2 text-foreground/40 text-sm font-semibold">
                                <Spinner size="sm" color="current" />
                                <span>Loading more courses...</span>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
