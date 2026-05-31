import {
    countWords,
    checkTextForSpam,
    validateReviewDescription,
    validateCommentContent
} from '../spam';

describe('Spam and Word Count Utility', () => {
    describe('countWords', () => {
        it('correctly counts words separated by spaces, tabs, and newlines', () => {
            expect(countWords("Hello world this is a test.")).toBe(6);
            expect(countWords("Hello\tworld\nthis   is")).toBe(4);
        });

        it('returns 0 for empty or null strings', () => {
            expect(countWords("")).toBe(0);
            expect(countWords(null as any)).toBe(0);
        });
    });

    describe('checkTextForSpam', () => {
        it('returns isSpam: false for clean, natural texts', () => {
            const cleanText = "The lecturers in this course were fantastic. They explain difficult subjects clearly and give great feedback.";
            expect(checkTextForSpam(cleanText).isSpam).toBe(false);
        });

        it('flags character flooding consecutively repeated', () => {
            const flood = "This course was cooooouuuuurse.";
            expect(checkTextForSpam(flood).isSpam).toBe(true);
            expect(checkTextForSpam(flood).errorMsg).toContain("repetitive characters");
        });

        it('flags keyboard smashes with consecutive consonants', () => {
            const smash = "Don't take this class, the assignments are absolute asdfghjkl.";
            expect(checkTextForSpam(smash).isSpam).toBe(true);
            expect(checkTextForSpam(smash).errorMsg).toContain("keyboard smash");
        });

        it('flags high density repetitive word spam', () => {
            const wordRep = "great great great great great great great course";
            expect(checkTextForSpam(wordRep).isSpam).toBe(true);
            expect(checkTextForSpam(wordRep).errorMsg).toContain("repetitive words");
        });
    });

    describe('validateReviewDescription', () => {
        it('flags descriptions below the 20 words threshold', () => {
            const shortDesc = "This is a good course.";
            const result = validateReviewDescription(shortDesc);
            expect(result.isValid).toBe(false);
            expect(result.errorMsg).toContain("must be at least 20 words");
        });

        it('passes valid descriptions above 20 words', () => {
            const longDesc = "This course provides highly useful skills for database architecture and backend engineering. The assignments were demanding but incredibly rewarding for anyone interested in this domain.";
            expect(countWords(longDesc)).toBe(25);
            expect(validateReviewDescription(longDesc).isValid).toBe(true);
        });
    });

    describe('validateCommentContent', () => {
        it('flags comments below the 5 words threshold', () => {
            const shortComment = "Very good.";
            const result = validateCommentContent(shortComment);
            expect(result.isValid).toBe(false);
            expect(result.errorMsg).toContain("must be at least 5 words");
        });

        it('passes valid comments above 5 words', () => {
            const longComment = "This is a great comment with more words.";
            expect(countWords(longComment)).toBe(8);
            expect(validateCommentContent(longComment).isValid).toBe(true);
        });
    });
});
