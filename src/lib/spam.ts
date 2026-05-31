
/**
 * Counts the number of words in a given text string.
 */
export function countWords(text: string): number {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Analyzes text for common spam patterns, keyboard smashes, character flooding, and word repetitions.
 */
export function checkTextForSpam(text: string): { isSpam: boolean; errorMsg?: string } {
    if (!text) return { isSpam: false };

    const trimmed = text.trim();

    // 1. Character Flooding (e.g., "aaaaa" or "cooooouuuuurse")
    // Flag if any character (except spaces or dots) is repeated 5 or more times consecutively
    if (/(.)\1{4,}/.test(trimmed.replace(/\s+/g, ''))) {
        return {
            isSpam: true,
            errorMsg: "Spam detected (repetitive characters). Please write a meaningful, constructive response."
        };
    }

    // 2. Keyboard Smash Detection (e.g., "asdfghjkl", "qwertyuiop")
    // Flag if there are 6 or more consecutive consonants (common in keyboard smashes)
    if (/[qwrtpsdfghjklzxcvbnm]{6,}/i.test(trimmed)) {
        return {
            isSpam: true,
            errorMsg: "Spam detected (keyboard smash). Please write a meaningful, constructive response."
        };
    }

    // 3. Word Repetition Ratio (e.g., "good good good good good")
    const words = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length >= 5) {
        const uniqueWords = new Set(words);
        const uniqueRatio = uniqueWords.size / words.length;
        if (uniqueRatio < 0.4) {
            return {
                isSpam: true,
                errorMsg: "Spam detected (repetitive words). Please write a meaningful, constructive response."
            };
        }
    }

    return { isSpam: false };
}

/**
 * Validates review description content against word counts and spam checks.
 */
export function validateReviewDescription(text: string): { isValid: boolean; errorMsg?: string } {
    const wordCount = countWords(text);
    if (wordCount < 20) {
        return {
            isValid: false,
            errorMsg: `Review description must be at least 20 words (currently ${wordCount} words).`
        };
    }

    const spamCheck = checkTextForSpam(text);
    if (spamCheck.isSpam) {
        return {
            isValid: false,
            errorMsg: spamCheck.errorMsg
        };
    }

    return { isValid: true };
}

/**
 * Validates comment content against word counts and spam checks.
 */
export function validateCommentContent(text: string): { isValid: boolean; errorMsg?: string } {
    const wordCount = countWords(text);
    if (wordCount < 5) {
        return {
            isValid: false,
            errorMsg: `Comment must be at least 5 words (currently ${wordCount} words).`
        };
    }

    const spamCheck = checkTextForSpam(text);
    if (spamCheck.isSpam) {
        return {
            isValid: false,
            errorMsg: spamCheck.errorMsg
        };
    }

    return { isValid: true };
}
