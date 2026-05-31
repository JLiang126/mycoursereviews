import { describe, it } from 'node:test';
import assert from 'node:assert';
import { checkTextForProfanity } from '../profanity';

describe('Profanity Moderation Checker', () => {
    it('returns containsProfanity: false for clean text', () => {
        const cleanText = "This is an absolutely fantastic and highly useful course. The lecturers were amazing.";
        const result = checkTextForProfanity(cleanText);
        assert.strictEqual(result.containsProfanity, false);
    });

    it('returns containsProfanity: false for empty or undefined text', () => {
        assert.strictEqual(checkTextForProfanity('').containsProfanity, false);
        assert.strictEqual(checkTextForProfanity(undefined as any).containsProfanity, false);
    });

    it('returns containsProfanity: true and the custom error message for direct profanity', () => {
        const badText = "This course was absolute shit and the assignment was rubbish.";
        const result = checkTextForProfanity(badText);
        assert.strictEqual(result.containsProfanity, true);
        assert.strictEqual(result.errorMsg, "Profanity or bad sentiment detected. Please write a meaningful, constructive response.");
    });

    describe('Unicode Normalization & Homoglyph Evasions', () => {
        it('flags unicode lookalike variations of bad words', () => {
            const diacritics = "Don't take this course, it's a piece of füçk.";
            assert.strictEqual(checkTextForProfanity(diacritics).containsProfanity, true);

            const cyrillicLookalikes = "The assignments in this class are absolute ѕhіt."; // Uses Cyrillic 'ѕ' and 'і'
            assert.strictEqual(checkTextForProfanity(cyrillicLookalikes).containsProfanity, true);

            const greekUpsilon = "This exam is fυcked up."; // Uses Greek 'υ'
            assert.strictEqual(checkTextForProfanity(greekUpsilon).containsProfanity, true);
        });
    });

    describe('Leetspeak Detection & Obfuscation Evasions', () => {
        it('flags classic leetspeak character substitutions', () => {
            const badLeetspeak = "Don't take this class, the exams are f4cked up.";
            assert.strictEqual(checkTextForProfanity(badLeetspeak).containsProfanity, true);

            const sh1tEvasion = "This course is total sh1t.";
            assert.strictEqual(checkTextForProfanity(sh1tEvasion).containsProfanity, true);

            const assEvasion = "The coordinator is an @ss.";
            assert.strictEqual(checkTextForProfanity(assEvasion).containsProfanity, true);

            const bitchEvasion = "This assignment is a b1tch.";
            assert.strictEqual(checkTextForProfanity(bitchEvasion).containsProfanity, true);
        });

        it('flags spacing and repetition obfuscations', () => {
            const spacesText = "This class is absolute f u c k.";
            assert.strictEqual(checkTextForProfanity(spacesText).containsProfanity, true);

            const repetitionText = "This exam was fuuuuuck.";
            assert.strictEqual(checkTextForProfanity(repetitionText).containsProfanity, true);
        });
    });

    describe('ML-like Toxicity, Personal Attacks & Bad Sentiment', () => {
        it('flags personal attacks against lecturers/coordinators', () => {
            const personalAttack = "The lecturer is an idiot and incredibly stupid.";
            assert.strictEqual(checkTextForProfanity(personalAttack).containsProfanity, true);

            const dumbCoordinator = "The coordinator is so dumb and useless.";
            assert.strictEqual(checkTextForProfanity(dumbCoordinator).containsProfanity, true);
        });

        it('flags toxic student comments and harmful sentiments', () => {
            const toxicSentiment = "This course is absolute trash and garbage.";
            assert.strictEqual(checkTextForProfanity(toxicSentiment).containsProfanity, true);

            const extremeHarm = "If you take this class you should kill yourself.";
            assert.strictEqual(checkTextForProfanity(extremeHarm).containsProfanity, true);

            const kysAttack = "The staff are terrible, kys.";
            assert.strictEqual(checkTextForProfanity(kysAttack).containsProfanity, true);
        });
    });
});
