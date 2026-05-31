import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
    countWords,
    checkTextForSpam,
    validateReviewDescription,
    validateCommentContent
} from '../spam';

describe('Spam and Word Count Utility', () => {
    describe('countWords', () => {
        it('correctly counts words separated by spaces, tabs, and newlines', () => {
            assert.strictEqual(countWords("Hello world this is a test."), 6);
            assert.strictEqual(countWords("Hello\tworld\nthis   is"), 4);
        });

        it('returns 0 for empty or null strings', () => {
            assert.strictEqual(countWords(""), 0);
            assert.strictEqual(countWords(null as any), 0);
        });
    });

    describe('checkTextForSpam', () => {
        it('returns isSpam: false for clean, natural texts', () => {
            const cleanText = "The lecturers in this course were fantastic. They explain difficult subjects clearly and give great feedback.";
            assert.strictEqual(checkTextForSpam(cleanText).isSpam, false);
        });

        it('flags character flooding consecutively repeated', () => {
            const flood = "This course was cooooouuuuurse.";
            assert.strictEqual(checkTextForSpam(flood).isSpam, true);
            assert.ok(checkTextForSpam(flood).errorMsg?.includes("repetitive characters"));
        });

        it('flags keyboard smashes with consecutive consonants', () => {
            const smash = "Don't take this class, the assignments are absolute asdfghjkl.";
            assert.strictEqual(checkTextForSpam(smash).isSpam, true);
            assert.ok(checkTextForSpam(smash).errorMsg?.includes("keyboard smash"));
        });

        it('flags high density repetitive word spam', () => {
            const wordRep = "great great great great great great great course";
            assert.strictEqual(checkTextForSpam(wordRep).isSpam, true);
            assert.ok(checkTextForSpam(wordRep).errorMsg?.includes("repetitive words"));
        });
    });

    describe('validateReviewDescription', () => {
        it('flags descriptions below the 20 words threshold', () => {
            const shortDesc = "This is a good course.";
            const result = validateReviewDescription(shortDesc);
            assert.strictEqual(result.isValid, false);
            assert.ok(result.errorMsg?.includes("must be at least 20 words"));
        });

        it('passes valid descriptions above 20 words', () => {
            const longDesc = "This course provides highly useful skills for database architecture and backend engineering. The assignments were demanding but incredibly rewarding for anyone interested in this domain.";
            assert.strictEqual(countWords(longDesc), 25);
            assert.strictEqual(validateReviewDescription(longDesc).isValid, true);
        });
    });

    describe('validateCommentContent', () => {
        it('flags comments below the 5 words threshold', () => {
            const shortComment = "Very good.";
            const result = validateCommentContent(shortComment);
            assert.strictEqual(result.isValid, false);
            assert.ok(result.errorMsg?.includes("must be at least 5 words"));
        });

        it('passes valid comments above 5 words', () => {
            const longComment = "This is a great comment with more words.";
            assert.strictEqual(countWords(longComment), 8);
            assert.strictEqual(validateCommentContent(longComment).isValid, true);
        });
    });
});
