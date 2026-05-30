'use client';

import {
    Autocomplete,
    AutocompleteItem,
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
import { clsx } from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FaFilter, FaSearch, FaTimes } from 'react-icons/fa';
import { MdStar } from 'react-icons/md';

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
    isNoLongerOffered?: boolean;
}

interface BrowseCoursesClientProps {
    courses: CourseWithStats[];
}

const SORT_OPTIONS = [
    { key: 'recent',      label: 'Sort by Most Recent Reviews' },
    { key: 'name-asc',    label: 'Sort by A → Z' },
    { key: 'name-desc',   label: 'Sort by Z → A' },
    { key: 'rating-desc', label: 'Sort by Overall Rating' },
    { key: 'difficulty',  label: 'Sort by Difficulty' },
    { key: 'usefulness',  label: 'Sort by Usefulness' },
    { key: 'enjoyment',   label: 'Sort by Enjoyment' },
] as const;

const ALL_TERMS = ['Semester 1', 'Semester 2', 'Summer', 'Winter', 'No Longer Offered'];

export const BrowseCoursesClient = ({ courses }: BrowseCoursesClientProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
    const [selectedTerms, setSelectedTerms] = useState<Set<string>>(new Set());
    const [sortBy, setSortBy] = useState<string>('recent');
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [mounted, setMounted] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        // Trigger background prefetch if we are showing fallback courses (cache miss)
        const isShowingFallbacks = courses.length === 5 && courses.every(c => ['COMP SCI 1102', 'COMP SCI 2000', 'COMP SCI 2207', 'COMP SCI 3006', 'COMP SCI 3310'].includes(c.code));
        
        if (isShowingFallbacks) {
            console.log('Client: Fallback courses detected. Triggering background prefetch via API...');
            fetch('/api/courses/prefetch')
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.count > 0) {
                        console.log(`Client: Prefetch complete. Loaded ${data.count} courses. Refreshing page data...`);
                        // Refresh page so server renders the actual cached courses
                        window.location.reload();
                    }
                })
                .catch(err => console.error('Client prefetch error:', err));
        }
    }, [courses]);

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
            // Push no longer offered courses to the bottom
            if (a.isNoLongerOffered && !b.isNoLongerOffered) return 1;
            if (!a.isNoLongerOffered && b.isNoLongerOffered) return -1;

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
        <div className="flex flex-col gap-8 bg-grid-sheet mx-[-1.5rem] sm:mx-[-2rem] mt-[-2rem] px-6 sm:px-8 py-8 w-[calc(100%+3rem)] sm:w-[calc(100%+4rem)] min-h-[calc(100vh-200px)] items-center">
            <div className="max-w-screen-xl w-full flex flex-col gap-8">

            {/* Page Header */}
            <div>
                <h1 className="font-mixtape uppercase tracking-tighter text-3xl sm:text-4xl font-extrabold bg-red text-white w-fit px-4 py-1.5 border-3 border-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] rotate-[-1deg] select-none hover:rotate-[1deg] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer">
                    Browse Courses
                </h1>
                <p className="font-mono text-base text-foreground/80 mt-3 font-black rotate-[0.5deg]">
                    Explore student reviews for Adelaide University courses.
                </p>
            </div>

            {/* Filter and Search Controls */}
            {mounted ? (
                <div className="flex flex-col gap-4 bg-background border-4 border-foreground p-5 rounded-none shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div>
                            <Input
                                isClearable
                                radius="none"
                                placeholder="Search courses (code/title)"
                                startContent={<FaSearch className="text-foreground" />}
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                                className="w-full font-mono h-10"
                                classNames={{
                                    inputWrapper: "border-2 border-foreground bg-background rounded-none shadow-none h-10 group-data-[focus=true]:border-foreground",
                                    input: "placeholder:text-grey dark:placeholder:text-grey text-foreground",
                                }}
                            />
                        </div>

                        {/* Subject Autocomplete Search & Select */}
                        <Autocomplete
                            labelPlacement="outside"
                            radius="none"
                            placeholder="Filter Subject Area"
                            selectedKey={null}
                            onSelectionChange={(key) => {
                                if (key) {
                                    const next = new Set(selectedSubjects);
                                    next.add(key as string);
                                    setSelectedSubjects(next);
                                }
                            }}
                            aria-label="Filter by subject area"
                            className="font-mono h-10"
                            classNames={{
                                base: "text-foreground h-10",
                            }}
                            inputProps={{
                                classNames: {
                                    inputWrapper: "border-2 border-foreground bg-background rounded-none shadow-none h-10 group-data-[focus=true]:border-foreground",
                                    input: "placeholder:text-grey text-foreground",
                                }
                            }}
                            popoverProps={{
                                classNames: {
                                    base: "rounded-none",
                                    content: "rounded-none border-3 border-foreground bg-background text-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] p-1"
                                }
                            }}
                            listboxProps={{
                                itemClasses: {
                                    base: "rounded-none data-[hover=true]:bg-secondary data-[hover=true]:text-white font-mono text-xs",
                                }
                            }}
                        >
                            {allSubjects.map((subject) => (
                                <AutocompleteItem key={subject} textValue={subject} className="font-mono text-xs text-foreground rounded-none">
                                    {subject}
                                </AutocompleteItem>
                            ))}
                        </Autocomplete>
 
                        {/* Term Multi-Select */}
                        <Select
                            labelPlacement="outside"
                            radius="none"
                            placeholder="Filter Term"
                            selectionMode="multiple"
                            selectedKeys={selectedTerms}
                            onSelectionChange={(keys) => setSelectedTerms(new Set(keys as unknown as string[]))}
                            aria-label="Filter by term"
                            className="font-mono h-10"
                            classNames={{
                                trigger: "border-2 border-foreground bg-background rounded-none shadow-none h-10 min-h-10 text-foreground",
                                value: "text-foreground font-mono data-[placeholder=true]:text-grey dark:data-[placeholder=true]:text-grey",
                            }}
                            popoverProps={{
                                classNames: {
                                    base: "rounded-none",
                                    content: "rounded-none border-3 border-foreground bg-background text-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] p-1"
                                }
                            }}
                            listboxProps={{
                                itemClasses: {
                                    base: "rounded-none data-[hover=true]:bg-secondary data-[hover=true]:text-white font-mono text-xs",
                                }
                            }}
                        >
                            {ALL_TERMS.map((term) => (
                                <SelectItem key={term} textValue={term} className="font-mono text-xs rounded-none">
                                    {term}
                                </SelectItem>
                            ))}
                        </Select>
 
                        {/* Sort By Select */}
                        <Select
                            radius="none"
                            placeholder="Sort By"
                            selectedKeys={[sortBy]}
                            onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as string)}
                            className="font-mono h-10"
                            aria-label="Sort courses"
                            classNames={{
                                trigger: "border-2 border-foreground bg-background rounded-none shadow-none h-10 min-h-10 text-foreground",
                                value: "text-foreground font-mono data-[placeholder=true]:text-grey dark:data-[placeholder=true]:text-grey",
                            }}
                            popoverProps={{
                                classNames: {
                                    base: "rounded-none",
                                    content: "rounded-none border-3 border-foreground bg-background text-foreground shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] p-1"
                                }
                            }}
                            listboxProps={{
                                itemClasses: {
                                    base: "rounded-none data-[hover=true]:bg-secondary data-[hover=true]:text-white font-mono text-xs",
                                }
                            }}
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <SelectItem key={opt.key} textValue={opt.label} className="font-mono text-xs rounded-none">
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </Select>
                    </div>

                    {/* Active filter chips */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap gap-2 items-center pt-2 border-t-2 border-dashed border-foreground/30">
                            {Array.from(selectedSubjects).map((s) => (
                                <div
                                    key={s}
                                    className="border-2 border-foreground font-mono bg-yellow text-black text-3xs font-extrabold px-2.5 h-8 flex items-center gap-2 select-none hover:scale-105 hover:rotate-[1deg] transition-all"
                                >
                                    <span>{s}</span>
                                    <button
                                        onClick={() => {
                                            const next = new Set(selectedSubjects);
                                            next.delete(s);
                                            setSelectedSubjects(next);
                                        }}
                                        className="cursor-pointer font-black text-[9px] hover:bg-foreground hover:text-background w-3.5 h-3.5 flex items-center justify-center border border-foreground rounded-none transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            {Array.from(selectedTerms).map((t) => (
                                <div
                                    key={t}
                                    className="border-2 border-foreground font-mono bg-red text-white text-3xs font-extrabold px-2.5 h-8 flex items-center gap-2 select-none hover:scale-105 hover:rotate-[-1deg] transition-all"
                                >
                                    <span>{t}</span>
                                    <button
                                        onClick={() => {
                                            const next = new Set(selectedTerms);
                                            next.delete(t);
                                            setSelectedTerms(next);
                                        }}
                                        className="cursor-pointer font-black text-[9px] hover:bg-white hover:text-red w-3.5 h-3.5 flex items-center justify-center border border-white rounded-none transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            <Button
                                size="sm"
                                variant="flat"
                                color="danger"
                                startContent={<FaTimes className="text-[10px]" />}
                                onPress={clearFilters}
                                className="font-mono text-2xs uppercase font-extrabold h-8 border-2 border-foreground rounded-none bg-background shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]"
                            >
                                Clear all
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="h-24 w-full bg-background border-4 border-foreground rounded-none animate-pulse" />
            )}

            {/* Courses Grid */}
            {sortedCourses.length === 0 ? (
                <div className="text-center py-20 bg-background border-4 border-dashed border-foreground rounded-none">
                    <FaFilter className="text-foreground text-5xl mx-auto mb-4 animate-bounce" />
                    <p className="font-mixtape font-extrabold uppercase text-lg">No courses found</p>
                    <p className="font-mono text-base mt-2">Try updating your filters or search keywords.</p>
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
                                    className="bg-background border-4 border-foreground rounded-none shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] hover:-translate-y-1.5 hover:rotate-[1deg] hover:scale-[1.02] hover:shadow-[10px_10px_0px_0px_#000] dark:hover:shadow-[10px_10px_0px_0px_#fff] transition-all duration-300 w-full h-[155px] text-left rounded-none overflow-hidden"
                                >
                                    <CardBody className="p-4 flex flex-col justify-between h-full gap-2 overflow-hidden">
                                        <div className="flex justify-between items-start">
                                            <span className="font-mixtape text-xs uppercase font-extrabold text-black bg-yellow border-2 border-foreground px-2 py-0.5 shadow-[2px_2px_0px_0px_#000] rotate-[-2deg]">
                                                {course.code}
                                            </span>
                                            {course.reviewCount > 0 ? (
                                                <div className="flex items-center gap-1 font-mono text-xs font-black text-black bg-yellow px-2.5 py-0.5 border-2 border-foreground shadow-[2px_2px_0px_0px_#000] rotate-[2deg]">
                                                     <MdStar
                                                         className="w-3.5 h-3.5"
                                                         fill="#FAA307"
                                                         stroke="black"
                                                         strokeWidth={1.2}
                                                     />
                                                    <span>{course.avgRating.toFixed(1)}</span>
                                                    <span className="text-foreground/60 font-normal text-[10px] ml-1">
                                                        ({course.reviewCount})
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="font-mono text-[10px] uppercase font-black text-foreground/45 bg-foreground/5 px-2 py-0.5 border border-foreground/30">
                                                    No reviews
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="font-mixtape uppercase tracking-tight text-base font-extrabold line-clamp-2 leading-tight">
                                                {course.name}
                                            </h3>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5 mt-auto">
                                            {course.terms.map((term) => (
                                                <Chip
                                                    key={term}
                                                    size="sm"
                                                    radius="none"
                                                    className={clsx(
                                                        "border-2 border-foreground font-mono text-3xs font-extrabold px-2.5 py-1 h-fit",
                                                        term === 'No Longer Offered'
                                                            ? "bg-red text-white animate-pulse-custom"
                                                            : "bg-blue text-black"
                                                    )}
                                                >
                                                    {term}
                                                </Chip>
                                            ))}
                                        </div>
                                    </CardBody>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Infinite scroll sentinel */}
                    <div ref={sentinelRef} className="flex justify-center py-8">
                        {hasMore && (
                            <div className="flex items-center gap-2 text-foreground font-mono text-sm font-black uppercase bg-yellow border-3 border-foreground px-4 py-2 shadow-[4px_4px_0px_0px_#000] animate-pulse">
                                <Spinner size="sm" color="current" />
                                <span>Loading more courses...</span>
                            </div>
                        )}
                    </div>
                </>
            )}
            </div>
        </div>
    );
};
