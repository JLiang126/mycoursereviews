import Redis from 'ioredis';

import { env } from '@/env.mjs';

// Avoid multiple connections in development hot-reloads
const globalForRedis = globalThis as unknown as {
    redis: Redis | undefined;
};

export const redis = globalForRedis.redis ?? new Redis(env.REDIS_URL);
if (env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export interface CourseData {
    code: string;
    name: string;
    description: string;
    terms: string[];
    officialLink: string;
    // Rich fields from /courses/{id} detail endpoint
    coordinator?: string | null;
    campus?: string | null;
    units?: number | null;
    levelOfStudy?: string | null;
    prerequisites?: string | null;
    corequisites?: string | null;
    antirequisites?: string | null;
    assessments?: Array<{ title: string; weighting: string; hurdle: string }>;
    learningOutcomes?: Array<{ description: string; outcomeIndex: number }>;
    textbooks?: string | null;
    subjectName?: string | null;
}

// Robust fallback course mocks for developer ease & server safety
const FALLBACK_COURSES: CourseData[] = [
    {
        code: 'COMP SCI 1102',
        name: 'Object Oriented Programming',
        description: 'An introduction to programming in the object-oriented paradigm. Topics include classes, objects, inheritance, polymorphism, design patterns, and debugging structures.',
        terms: ['Semester 1', 'Semester 2', 'Summer'],
        officialLink: 'https://www.adelaide.edu.au/course-outlines/105703/1/sem-1/',
    },
    {
        code: 'COMP SCI 2000',
        name: 'Computer Systems',
        description: 'Covers execution of programs on computer systems, detailing binary compilation, assembly language, memory architectures, caching protocols, and process management.',
        terms: ['Semester 1', 'Semester 2'],
        officialLink: 'https://www.adelaide.edu.au/course-outlines/106342/1/sem-2/',
    },
    {
        code: 'COMP SCI 2207',
        name: 'Web and Database Systems',
        description: 'Full stack development methodologies. Students study HTTP protocols, relational database management systems (SQL), CSS, HTML, client-side JS, and security models.',
        terms: ['Semester 1', 'Semester 2'],
        officialLink: 'https://www.adelaide.edu.au/course-outlines/106093/1/sem-1/',
    },
    {
        code: 'COMP SCI 3006',
        name: 'Software Engineering & Project',
        description: 'A capstone team project developing modern software solutions for clients. Emphasizes Agile sprint planning, DevOps, unit testing, and design systems.',
        terms: ['Semester 1', 'Semester 2'],
        officialLink: 'https://www.adelaide.edu.au/course-outlines/105742/1/sem-1/',
    },
    {
        code: 'COMP SCI 3310',
        name: 'Artificial Intelligence',
        description: 'Fundamental methodologies under AI including heuristic searches, neural networks, Bayesian decision making, natural language processing, and deep learning algorithms.',
        terms: ['Semester 1'],
        officialLink: 'https://www.adelaide.edu.au/course-outlines/105710/1/sem-1/',
    },
];

function getSubjectAbbreviation(subjectName: string): string {
    const name = subjectName.trim().toLowerCase();
    
    if (name === 'computer science') return 'COMP SCI';
    if (name === 'mathematical sciences') return 'MATHS';
    if (name === 'statistics') return 'STATS';
    if (name === 'electric/electronic eng & tech') return 'ELEC ENG';
    if (name === 'information systems') return 'INFOSYS';
    if (name === 'artificial intelligence') return 'AI';
    if (name === 'computer graphics') return 'COMP GRAP';
    
    if (subjectName.length <= 8) return subjectName.toUpperCase();
    return subjectName;
}

/**
 * Maps a course code prefix (abbreviation) back to the full subject name used by the Courses API.
 * e.g. "INFO" -> "Information Systems", "COMP SCI" -> "Computer Science"
 */
function getSubjectNameFromCodePrefix(codePrefix: string): string | null {
    const prefix = codePrefix.trim().toUpperCase();
    const mapping: Record<string, string> = {
        'COMP SCI': 'Computer Science',
        'MATHS': 'Mathematical Sciences',
        'STATS': 'Statistics',
        'ELEC ENG': 'Electric/Electronic Eng & Tech',
        'INFOSYS': 'Information Systems',
        'INFO': 'Information Systems',
        'AI': 'Artificial Intelligence',
        'COMP GRAP': 'Computer Graphics',
        'PROJ MGT': 'Project Management',
        // Codes that are purely numeric prefixes not needing a space (e.g., ARTI)
        'ARTI': 'Artificial Intelligence',
    };
    return mapping[prefix] ?? null;
}

export const CoursesApiClient = {
    /**
     * Retrieves all Adelaide University courses by first fetching the full
     * subjects list from the API, then querying every subject × term.
     * Results cached in Redis for 24 hours.
     */
    async getAllCourses(): Promise<CourseData[]> {
        const cacheKey = 'courses:all';

        try {
            const cachedData = await redis.get(cacheKey);
            if (cachedData) return JSON.parse(cachedData) as CourseData[];
        } catch (error) {
            console.error('Redis cache lookup error:', error);
        }

        const headers = {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; MyCourseReviews/1.0)',
        };

        const year = new Date().getFullYear();
        const termQueries = [
            { alias: 'sem1', displayName: 'Semester 1' },
            { alias: 'sem2', displayName: 'Semester 2' },
            { alias: 'summer', displayName: 'Summer' },
            { alias: 'winter', displayName: 'Winter' },
        ];

        // Step 1: Fetch the complete subjects list from the API
        let subjects: string[] = [];
        try {
            const subjectsUrl = `${env.COURSES_API_URL}/subjects?year=${year}&term=sem1`;
            const subjectsResponse = await fetch(subjectsUrl, { headers, next: { revalidate: 86400 } });
            if (subjectsResponse.ok) {
                const rawSubjects = await subjectsResponse.json() as Array<string | { code: string; name: string }>;
                subjects = rawSubjects
                    .map(s => (typeof s === 'string' ? s : (s.name || s.code || '')))
                    .filter(Boolean);
                console.log(`[CoursesAPI] Fetched ${subjects.length} subjects.`);
            }
        } catch (err) {
            console.warn('[CoursesAPI] Failed to fetch subjects list:', err);
        }

        if (subjects.length === 0) {
            console.warn('[CoursesAPI] No subjects returned; using fallbacks.');
            return FALLBACK_COURSES;
        }

        // Step 2: Fetch courses for every subject × every term
        const coursesMap = new Map<string, CourseData>();

        for (const subject of subjects) {
            for (const termQuery of termQueries) {
                try {
                    const searchParams = new URLSearchParams({
                        year: String(year),
                        term: termQuery.alias,
                        subject,
                    });
                    const url = `${env.COURSES_API_URL}/courses?${searchParams.toString()}`;
                    const response = await fetch(url, { headers, next: { revalidate: 86400 } });
                    if (!response.ok) continue;

                    const resJson = await response.json();
                    const rawCourses: Array<{ id: string; name?: { subject?: string; code?: string; title?: string } }> = resJson?.courses || [];

                    for (const raw of rawCourses) {
                        if (!raw.name) continue;
                        const fullSubjectName = raw.name.subject || subject;
                        const catalogCode = raw.name.code || '';
                        const title = raw.name.title || '';
                        if (!catalogCode) continue;

                        // Use catalog code as-is when it already contains letters+digits (ARTI2001, INFO3003)
                        // Otherwise prefix with subject abbreviation (COMP SCI 1102)
                        let code: string;
                        if (/[A-Za-z]/.test(catalogCode) && /\d/.test(catalogCode)) {
                            code = catalogCode.trim();
                        } else {
                            code = `${getSubjectAbbreviation(fullSubjectName)} ${catalogCode}`.trim();
                        }

                        const normalizedCode = code.toUpperCase();
                        const displayTerm = termQuery.displayName;

                        if (coursesMap.has(normalizedCode)) {
                            const existing = coursesMap.get(normalizedCode)!;
                            if (!existing.terms.includes(displayTerm)) existing.terms.push(displayTerm);
                        } else {
                            coursesMap.set(normalizedCode, {
                                code,
                                name: title || code,
                                description: '', // fetched on demand on detail page
                                terms: [displayTerm],
                                officialLink: `https://www.adelaide.edu.au/course-outlines/${raw.id || encodeURIComponent(normalizedCode)}`,
                                subjectName: fullSubjectName, // full name e.g. "Artificial Intelligence"
                            });
                        }
                    }
                } catch (err) {
                    console.warn(`[CoursesAPI] Failed fetch: subject=${subject}, term=${termQuery.alias}`, err);
                }
            }
        }

        if (coursesMap.size > 0) {
            const data = Array.from(coursesMap.values());
            try {
                await redis.set(cacheKey, JSON.stringify(data), 'EX', 86400);
            } catch (redisErr) {
                console.warn('[CoursesAPI] Redis set failed:', redisErr);
            }
            return data;
        }

        console.warn('[CoursesAPI] Courses API returned 0 courses; using fallbacks.');
        return FALLBACK_COURSES;
    },

    /**
     * Retrieves full detail for a single course by its display code (e.g. "ARTI2001", "COMP SCI 1102").
     * Two-tier subject search: known prefix map → full subjects scan.
     * Cached in Redis for 24 hours.
     */
    async getCourseByCode(code: string): Promise<CourseData | null> {
        const cacheKey = `course:${code}`;

        try {
            const cachedData = await redis.get(cacheKey);
            if (cachedData) return JSON.parse(cachedData) as CourseData;
        } catch (error) {
            console.error('[CoursesAPI] Redis single-course lookup error:', error);
        }

        const headers = {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; MyCourseReviews/1.0)',
        };

        const year = new Date().getFullYear();
        const termQueries = ['sem1', 'sem2', 'summer', 'winter'];

        const codeUpper = code.trim().toUpperCase();

        // Extract the catalog code (e.g. "ARTI2001" from "ARTI2001" or "1102" from "COMP SCI 1102")
        const catalogCodeMatch = codeUpper.match(/([A-Z]+\d+\w*)$/);
        const catalogCode = catalogCodeMatch ? catalogCodeMatch[1] : codeUpper;

        // Extract the alphabetic prefix (e.g. "COMP SCI", "INFO", "ARTI") for fast-path lookup
        const prefixMatch = codeUpper.match(/^([A-Z][A-Z\s]*?)\s*\d/);
        const codePrefix = prefixMatch ? prefixMatch[1].trim() : '';

        /**
         * Searches one subject across all term aliases for the given catalog code.
         * On match: fetches detail, builds and caches the full CourseData, returns it.
         */
        const searchSubject = async (subject: string): Promise<CourseData | null> => {
            for (const term of termQueries) {
                try {
                    const searchParams = new URLSearchParams({ year: String(year), term, subject });
                    const searchUrl = `${env.COURSES_API_URL}/courses?${searchParams.toString()}`;
                    const searchResponse = await fetch(searchUrl, { headers, next: { revalidate: 86400 } });
                    if (!searchResponse.ok) continue;

                    const resJson = await searchResponse.json();
                    const rawCourses: Array<{ id: string; name?: { subject?: string; code?: string; title?: string } }> = resJson?.courses || [];

                    const match = rawCourses.find(c => {
                        const apiCode = (c?.name?.code || '').toUpperCase().replace(/\s+/g, '');
                        return apiCode === catalogCode.replace(/\s+/g, '');
                    });

                    if (!match) continue;

                    // Found — now fetch full detail by the API's opaque id
                    const apiId = match.id;
                    const fullSubjectName = match.name?.subject || subject;
                    const matchCode = match.name?.code || catalogCode;
                    const matchTitle = match.name?.title || code;

                    let detail: Record<string, unknown> = {};
                    try {
                        const detailResponse = await fetch(`${env.COURSES_API_URL}/courses/${apiId}`, {
                            headers,
                            next: { revalidate: 86400 },
                        });
                        if (detailResponse.ok) detail = await detailResponse.json();
                    } catch (detailErr) {
                        console.warn(`[CoursesAPI] Detail fetch failed for id ${apiId}:`, detailErr);
                    }

                    // Build display code
                    let normalizedCode: string;
                    if (/[A-Za-z]/.test(matchCode) && /\d/.test(matchCode)) {
                        normalizedCode = matchCode;
                    } else {
                        normalizedCode = `${getSubjectAbbreviation(fullSubjectName)} ${matchCode}`.trim();
                    }

                    // Parse terms from detail — API returns "Semester 1,Semester 2" as a string
                    let termNames: string[];
                    const rawTermStr = detail?.term as string | undefined;
                    if (rawTermStr) {
                        termNames = rawTermStr.split(',').map(t => t.trim()).filter(Boolean);
                    } else if (Array.isArray(detail?.terms)) {
                        termNames = (detail.terms as string[]).map(t => t.replace(' School', ''));
                    } else {
                        termNames = [term === 'sem1' ? 'Semester 1' : term === 'sem2' ? 'Semester 2' : term.charAt(0).toUpperCase() + term.slice(1)];
                    }

                    const description = (detail?.course_overview as string) || (detail?.description as string) || '';

                    const officialLink =
                        (detail?.course_outline_url as string) ||
                        (detail?.course_url as string) ||
                        `https://www.adelaide.edu.au/course-outlines/${apiId}`;

                    type RawAssessment = { title?: string; weighting?: string; hurdle?: string };
                    const rawAssessments = Array.isArray(detail?.assessments) ? (detail.assessments as RawAssessment[]) : [];
                    const assessments = rawAssessments.map(a => ({
                        title: a.title ?? '',
                        weighting: a.weighting ?? '',
                        hurdle: a.hurdle ?? '',
                    }));

                    type RawOutcome = { description?: string; outcome_index?: number };
                    const rawOutcomes = Array.isArray(detail?.learning_outcomes) ? (detail.learning_outcomes as RawOutcome[]) : [];
                    const learningOutcomes = rawOutcomes.map(o => ({
                        description: o.description ?? '',
                        outcomeIndex: o.outcome_index ?? 0,
                    }));

                    const reqs = detail?.requirements as Record<string, string | null> | undefined;
                    const detailName = detail?.name as { subject?: string } | undefined;
                    const resolvedSubjectName = detailName?.subject || fullSubjectName || null;

                    const data: CourseData = {
                        code: normalizedCode,
                        name: matchTitle,
                        description,
                        terms: termNames,
                        officialLink,
                        coordinator: (detail?.course_coordinator as string) || null,
                        campus: (detail?.campus as string) || null,
                        units: (detail?.units as number) || null,
                        levelOfStudy: (detail?.level_of_study as string) || null,
                        prerequisites: reqs?.prerequisites ?? null,
                        corequisites: reqs?.corequisites ?? null,
                        antirequisites: reqs?.antirequisites ?? null,
                        assessments: assessments.length > 0 ? assessments : undefined,
                        learningOutcomes: learningOutcomes.length > 0 ? learningOutcomes : undefined,
                        textbooks: (detail?.textbooks as string) || null,
                        subjectName: resolvedSubjectName,
                    };

                    try {
                        await redis.set(cacheKey, JSON.stringify(data), 'EX', 86400);
                    } catch (_) { /* ignore */ }

                    return data;
                } catch (err) {
                    console.warn(`[CoursesAPI] Search error: code=${code}, subject=${subject}, term=${term}`, err);
                }
            }
            return null;
        };

        // Strategy 1: fast path — try known prefix→subject mapping
        const knownSubject = getSubjectNameFromCodePrefix(codePrefix);
        if (knownSubject) {
            const result = await searchSubject(knownSubject);
            if (result) return result;
        }

        // Strategy 2: universal fallback — scan all subjects from the API
        let allSubjects: string[] = [];
        try {
            const subjectsUrl = `${env.COURSES_API_URL}/subjects?year=${year}&term=sem1`;
            const subjectsResponse = await fetch(subjectsUrl, { headers, next: { revalidate: 86400 } });
            if (subjectsResponse.ok) {
                const raw = await subjectsResponse.json() as Array<string | { code: string; name: string }>;
                allSubjects = raw.map(s => (typeof s === 'string' ? s : (s.name || s.code || ''))).filter(Boolean);
            }
        } catch (err) {
            console.warn('[CoursesAPI] Failed to fetch subjects for fallback search:', err);
        }

        for (const subject of allSubjects.filter(s => s !== knownSubject)) {
            const result = await searchSubject(subject);
            if (result) return result;
        }

        // Strategy 3: local fallback list
        return FALLBACK_COURSES.find(c => c.code.toLowerCase() === code.toLowerCase()) ?? null;
};

                                prerequisites: reqs?.prerequisites ?? null,
                                corequisites: reqs?.corequisites ?? null,
                                antirequisites: reqs?.antirequisites ?? null,
                                assessments: assessments.length > 0 ? assessments : undefined,
                                learningOutcomes: learningOutcomes.length > 0 ? learningOutcomes : undefined,
                                textbooks: (detail?.textbooks as string) ?? null,
                                subjectName: resolvedSubjectName,
                            };

                            // Cache for 24 hours
                            try {
                                await redis.set(cacheKey, JSON.stringify(data), 'EX', 86400);
                            } catch (redisErr) {
                                console.warn('Redis set failed:', redisErr);
                            }
                            return data;
                        }
                    }
                } catch (searchErr) {
                    console.warn(`Search failed for ${code} in subject ${subjectName} term ${term}:`, searchErr);
                }
            }
        }

        // Fallback: check local hardcoded course list
        const fallback = FALLBACK_COURSES.find(c => c.code.toLowerCase() === code.toLowerCase());
        if (fallback) return fallback;

        // Last resort: try direct API call with transformed code variants
        const idsToTry = [code.replace(/\s+/g, '_'), encodeURIComponent(code)];
        for (const id of idsToTry) {
            try {
                const response = await fetch(`${env.COURSES_API_URL}/courses/${id}`, {
                    headers,
                    next: { revalidate: 86400 },
                });
                if (response.ok) {
                    const resJson = await response.json();
                    const subject = resJson?.name?.subject || '';
                    const catCode = resJson?.name?.code || code;
                    const title = resJson?.name?.title || code;
                    const description = resJson?.description || resJson?.outline || `Official Adelaide University outline for ${code}.`;
                    const terms = Array.isArray(resJson?.terms) ? resJson.terms : ['Semester 1', 'Semester 2'];
                    const officialLink = resJson?.officialLink || resJson?.link || `https://www.adelaide.edu.au/course-outlines/${id}`;

                    const data: CourseData = {
                        code: subject ? `${subject} ${catCode}`.trim() : code,
                        name: title,
                        description,
                        terms: terms.map((t: string) => t.replace(' School', '')),
                        officialLink,
                    };
                    try {
                        await redis.set(cacheKey, JSON.stringify(data), 'EX', 86400);
                    } catch (_) { /* ignore */ }
                    return data;
                }
            } catch (err) {
                console.warn(`Direct lookup failed for ${code} with id ${id}:`, err);
            }
        }

        return null;
    },
};
