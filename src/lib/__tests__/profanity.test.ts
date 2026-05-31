import { checkTextForProfanity } from '../profanity';

describe('Profanity Moderation Checker', () => {
    it('returns containsProfanity: false for clean text', () => {
        const cleanText = "This is an absolutely fantastic and highly useful course. The lecturers were amazing.";
        const result = checkTextForProfanity(cleanText);
        expect(result.containsProfanity).toBe(false);
    });

    it('returns containsProfanity: false for empty or undefined text', () => {
        expect(checkTextForProfanity('').containsProfanity).toBe(false);
        expect(checkTextForProfanity(undefined as any).containsProfanity).toBe(false);
    });

    it('returns containsProfanity: true and the custom error message for direct profanity', () => {
        const badText = "This course was absolute shit and the assignment was rubbish.";
        const result = checkTextForProfanity(badText);
        expect(result.containsProfanity).toBe(true);
        expect(result.errorMsg).toBe("Profanity or bad sentiment detected. Please write a meaningful, constructive response.");
    });

    describe('Unicode Normalization & Homoglyph Evasions', () => {
        it('flags unicode lookalike variations of bad words', () => {
            const diacritics = "Don't take this course, it's a piece of füçk.";
            expect(checkTextForProfanity(diacritics).containsProfanity).toBe(true);

            const cyrillicLookalikes = "The assignments in this class are absolute ѕhіt."; // Uses Cyrillic 'ѕ' and 'і'
            expect(checkTextForProfanity(cyrillicLookalikes).containsProfanity).toBe(true);

            const greekUpsilon = "This exam is fυcked up."; // Uses Greek 'υ'
            expect(checkTextForProfanity(greekUpsilon).containsProfanity).toBe(true);
        });
    });

    describe('Leetspeak Detection & Obfuscation Evasions', () => {
        it('flags classic leetspeak character substitutions', () => {
            const badLeetspeak = "Don't take this class, the exams are f4cked up.";
            expect(checkTextForProfanity(badLeetspeak).containsProfanity).toBe(true);

            const sh1tEvasion = "This course is total sh1t.";
            expect(checkTextForProfanity(sh1tEvasion).containsProfanity).toBe(true);

            const assEvasion = "The coordinator is an @ss.";
            expect(checkTextForProfanity(assEvasion).containsProfanity).toBe(true);

            const bitchEvasion = "This assignment is a b1tch.";
            expect(checkTextForProfanity(bitchEvasion).containsProfanity).toBe(true);
        });

        it('flags spacing and repetition obfuscations', () => {
            const spacesText = "This class is absolute f u c k.";
            expect(checkTextForProfanity(spacesText).containsProfanity).toBe(true);

            const repetitionText = "This exam was fuuuuuck.";
            expect(checkTextForProfanity(repetitionText).containsProfanity).toBe(true);
        });
    });

    describe('ML-like Toxicity, Personal Attacks & Bad Sentiment', () => {
        it('flags personal attacks against lecturers/coordinators', () => {
            const personalAttack = "The lecturer is an idiot and incredibly stupid.";
            expect(checkTextForProfanity(personalAttack).containsProfanity).toBe(true);

            const dumbCoordinator = "The coordinator is so dumb and useless.";
            expect(checkTextForProfanity(dumbCoordinator).containsProfanity).toBe(true);
        });

        it('flags toxic student comments and harmful sentiments', () => {
            const toxicSentiment = "This course is absolute trash and garbage.";
            expect(checkTextForProfanity(toxicSentiment).containsProfanity).toBe(true);

            const extremeHarm = "If you take this class you should kill yourself.";
            expect(checkTextForProfanity(extremeHarm).containsProfanity).toBe(true);

            const kysAttack = "The staff are terrible, kys.";
            expect(checkTextForProfanity(kysAttack).containsProfanity).toBe(true);
        });
    });
});
