import { checkProfanity } from 'glin-profanity';

export function checkTextForProfanity(text: string): { containsProfanity: boolean; errorMsg?: string } {
    if (!text) return { containsProfanity: false };
    
    try {
        const result = checkProfanity(text, {
            detectLeetspeak: true,
            leetspeakLevel: 'moderate',
            normalizeUnicode: true,
            languages: ['english'],
            customWords: [
                // Evasions / Leetspeak / Base variations
                'fack', 'facked', 'facking', 'fck', 'fcking', 'fcks', 'fucked', 'shitted',
                // Toxicity / Abusive language / Student personal attacks
                'idiot', 'retarded', 'stupid', 'dumb', 'trash', 'garbage', 
                'useless', 'hate', 'crap', 'rubbish', 'suck', 'sucks', 
                'kill yourself', 'kys'
            ],
        });
        
        if (result.containsProfanity) {
            return {
                containsProfanity: true,
                errorMsg: "Profanity or bad sentiment detected. Please write a meaningful, constructive response."
            };
        }
    } catch (err) {
        console.error("Profanity detection failed:", err);
    }
    return { containsProfanity: false };
}
