export const dynamic = 'force-static';

export default function TermsPage() {
    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto py-4">
            
            {/* Header */}
            <div className="border-b border-divider pb-6">
                <h1 className="text-3xl font-extrabold tracking-tight">Terms and Conditions of Use</h1>
                <p className="text-xs text-foreground/50 mt-1 uppercase tracking-wider font-semibold">
                    Effective: May 2026 &bull; Adelaide University Computer Science Club
                </p>
            </div>

            {/* Main Policy Body Container */}
            <div className="flex flex-col gap-6 text-sm text-foreground/80 leading-relaxed">
                
                {/* Introduction Callout Banner */}
                <div className="bg-default-50 border border-divider p-5 rounded-2xl text-xs text-foreground/60 leading-relaxed italic">
                    The Adelaide University Computer Science Club is a student club comprised of interested developers, inventors, and tech enthusiasts. We do not represent the School of Computer and Mathematical Sciences, the Faculty of Sciences, Engineering and Technology, or the Adelaide University.
                </div>

                <p>
                    This website seeks to be a general student-run guide, but its information has not been officially endorsed and is subject to change or correction. This is not official academic advice, and you should confirm any statements are correct with regard to your situation before relying on it. Any opinions expressed are those of the individual student authors, and may not necessarily represent those of the Adelaide University, Faculty, School, or Club.
                </p>

                <p>
                    You are responsible for any review content you provide and should only post content which you are comfortable with sharing. The Adelaide University Computer Science Club committee reserves the absolute right to moderate, flag, or permanently delete reviews that do not meet these Terms and Conditions or violate our Code of Conduct. Adelaide University policies apply, and if a breach is detected, further action may be taken with the University administration.
                </p>

                <p className="font-bold border-l-3 border-primary pl-3 text-foreground py-0.5">
                    By using our services, submitting ratings, or registering, you agree to the following terms of use:
                </p>

                {/* Terms List Grid */}
                <div className="flex flex-col gap-6 mt-2">
                    
                    {/* Item 1 */}
                    <div className="flex flex-col gap-1.5 bg-background/20 border border-divider/40 p-4 rounded-xl">
                        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                            <span className="text-primary font-extrabold">1.</span> Code of Conduct Compliance
                        </h3>
                        <p className="text-xs text-foreground/75 leading-relaxed">
                            Your reviews must abide by the **Adelaide University Student Charter** and Student Code of Conduct guidelines. This includes:
                        </p>
                        <ul className="list-disc pl-5 text-2xs text-foreground/60 flex flex-col gap-1 mt-1.5">
                            <li>
                                <strong>Open and Respectful Discussion:</strong> Adelaide University encourages critical thought and open discussion. Demonstrate respectful disagreement or feedback, expecting that you may be asked to explain or give evidence for your perspective.
                            </li>
                            <li>
                                <strong>Equity and Respect:</strong> Observe standards of equity and respect in dealing with every member of the Adelaide University community. Treat all members with courtesy and respect, free from all forms of unlawful discrimination, harassment, bullying, and vilification.
                            </li>
                            <li>
                                <strong>Non-Disruption:</strong> Respect University teaching, learning, academic, or other activities by not behaving in a way that significantly disrupts or interferes with these activities.
                            </li>
                            <li>
                                <strong>Compliance:</strong> Comply with any reasonable direction or request from a Adelaide University staff member or affiliate where the direction or request supports safety, good order, and compliance.
                            </li>
                        </ul>
                    </div>

                    {/* Item 2 */}
                    <div className="flex flex-col gap-1 bg-background/20 border border-divider/40 p-4 rounded-xl">
                        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                            <span className="text-primary font-extrabold">2.</span> Spam and Fake Content
                        </h3>
                        <p className="text-xs text-foreground/75 leading-relaxed">
                            Reviews must reflect genuine experiences of being a student enrolled in the course being reviewed. Additionally, reviews should not be posted for the purpose of manipulating a course&apos;s ratings. Do not post fake reviews and do not post a review multiple times.
                        </p>
                    </div>

                    {/* Item 3 */}
                    <div className="flex flex-col gap-1 bg-background/20 border border-divider/40 p-4 rounded-xl">
                        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                            <span className="text-primary font-extrabold">3.</span> Off-Topic Content
                        </h3>
                        <p className="text-xs text-foreground/75 leading-relaxed">
                            Only post reviews based on your experience while being enrolled in the relevant Adelaide University course. Our platform is not meant to be a forum for solicitation of goods and services, political or social commentary, or any other unrelated topics. Reviews which fail to meet this will be removed.
                        </p>
                    </div>

                    {/* Item 4 */}
                    <div className="flex flex-col gap-1 bg-background/20 border border-divider/40 p-4 rounded-xl">
                        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                            <span className="text-primary font-extrabold">4.</span> Illegal Content
                        </h3>
                        <p className="text-xs text-foreground/75 leading-relaxed">
                            Any review that describes or links to illegal activity will be removed. This includes but is not limited to: descriptions of illegal products or services, descriptions of graphic violence, or anything that violates local laws, rules, or regulations.
                        </p>
                    </div>

                    {/* Item 5 */}
                    <div className="flex flex-col gap-1 bg-background/20 border border-divider/40 p-4 rounded-xl">
                        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                            <span className="text-primary font-extrabold">5.</span> Offensive Content
                        </h3>
                        <p className="text-xs text-foreground/75 leading-relaxed">
                            Any review that contains profane, obscene, or offensive language will be removed.
                        </p>
                    </div>

                    {/* Item 6 */}
                    <div className="flex flex-col gap-1 bg-background/20 border border-divider/40 p-4 rounded-xl">
                        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                            <span className="text-primary font-extrabold">6.</span> Malicious Content
                        </h3>
                        <p className="text-xs text-foreground/75 leading-relaxed">
                            Any review that attempts to distribute or upload material that contains malicious code, scripts, or any other potentially harmful program or material will be removed.
                        </p>
                    </div>

                    {/* Item 7 */}
                    <div className="flex flex-col gap-1 bg-background/20 border border-divider/40 p-4 rounded-xl">
                        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                            <span className="text-primary font-extrabold">7.</span> Dangerous Content
                        </h3>
                        <p className="text-xs text-foreground/75 leading-relaxed">
                            Our platform is a place for safe communication. We do not permit reviewers to post dangerous content, including descriptions that:
                        </p>
                        <ul className="list-disc pl-5 text-2xs text-foreground/60 flex flex-col gap-1 mt-1">
                            <li>Threatens or advocates harm to oneself or others.</li>
                            <li>Harasses, intimidates, or bullies an individual or group.</li>
                            <li>Promotes discrimination of an individual or group based on their race, religion, disability, age, nationality, sexual orientation, gender identity, or any other characteristic associated with discrimination.</li>
                        </ul>
                    </div>

                    {/* Item 8 */}
                    <div className="flex flex-col gap-1 bg-background/20 border border-divider/40 p-4 rounded-xl">
                        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                            <span className="text-primary font-extrabold">8.</span> Impersonation
                        </h3>
                        <p className="text-xs text-foreground/75 leading-relaxed">
                            We do not allow individuals to write deceptive reviews or undertake false representations.
                        </p>
                    </div>

                    {/* Item 9 */}
                    <div className="flex flex-col gap-1 bg-background/20 border border-divider/40 p-4 rounded-xl">
                        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                            <span className="text-primary font-extrabold">9.</span> Conflict of Interest
                        </h3>
                        <p className="text-xs text-foreground/75 leading-relaxed">
                            Reviews are most valuable when they are unbiased and honest. A staff member or tutor for a course must not write a review for a semester in which they were teaching or managing the course.
                        </p>
                    </div>

                    {/* Item 10 */}
                    <div className="flex flex-col gap-1 bg-background/20 border border-divider/40 p-4 rounded-xl">
                        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                            <span className="text-primary font-extrabold">10.</span> Respectful Critiques
                        </h3>
                        <p className="text-xs text-foreground/75 leading-relaxed">
                            Reviews must be respectful. This includes:
                        </p>
                        <ul className="list-disc pl-5 text-2xs text-foreground/60 flex flex-col gap-1 mt-1">
                            <li>Being thoughtful, fair, and constructive.</li>
                            <li>Having a focus on learning and teaching activities, providing relevant examples to illustrate your point.</li>
                            <li>Avoiding comments which are personal or inappropriate, such as comments about dress, appearance, or voice.</li>
                            <li>Avoiding giving out private information, such as phone numbers, email addresses, or social media links of tutors, lecturers, or other students.</li>
                            <li>Refraining from writing anything that is offensive, racist, or sexist.</li>
                        </ul>
                    </div>

                </div>

            </div>
        </div>
    );
}
