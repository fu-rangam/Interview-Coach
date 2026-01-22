import React from 'react';
import ReactMarkdown from 'react-markdown';
// // import rehypeRaw from 'rehype-raw'; // Removed for XSS remediation // Removed for XSS remediation
import { GlassCard } from './ui/glass/GlassCard';
import { X, Copy, Database, Check } from 'lucide-react';
import { InterviewSession } from '../types';
import { cn } from '../lib/utils';

interface DebugInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: InterviewSession;
}

export const DebugInfoModal: React.FC<DebugInfoModalProps> = ({ isOpen, onClose, session }) => {
    if (!isOpen) return null;

    // Helper: Generate Markdown Report
    const generateMarkdownReport = () => {
        const { blueprint, questions, currentQuestionIndex, answers, intakeData } = session;
        // Safe access to current question
        const currentQ = (questions && questions.length > currentQuestionIndex) ? questions[currentQuestionIndex] : null;
        if (!currentQ) return "No question active.";

        const currentAnswer = answers ? answers[currentQ.id] : undefined;
        const analysis = currentAnswer?.analysis;

        let report = `# Competency-Driven Interview Session Debug Report\n\n`;

        // Section 1: Target Role / JD
        report += `================================================================================\n`;
        report += `# 1. Target Role / JD\n`;
        report += `================================================================================\n\n`;
        if (blueprint && blueprint.role) {
            report += `**Role:** ${blueprint.role.title}\n`;
            report += `**Seniority:** ${blueprint.role.seniority || 'N/A'}\n`;
            // Truncate JD if too long for display
            const jdPreview = session.jobDescription
                ? (session.jobDescription.substring(0, 150) + (session.jobDescription.length > 150 ? '...' : ''))
                : 'N/A';
            report += `**Job Description:**\n> ${jdPreview}\n\n`;
        } else {
            report += `_(Role data missing)_\n\n`;
        }

        // Section 2: Intake Items / Values
        report += `================================================================================\n`;
        report += `# 2. Intake Items / Values\n`;
        report += `================================================================================\n\n`;
        if (intakeData) {
            report += `- **Stage:** ${intakeData.stage}\n`;
            report += `- **Biggest Struggle:** ${intakeData.biggestStruggle}\n`;
            report += `- **Challenge Level:** ${intakeData.challengeLevel}\n`;
            report += `- **Primary Goal:** ${intakeData.primaryGoal}\n`;
            report += `- **Confidence Score:** ${intakeData.confidenceScore}/5\n\n`;
        } else {
            report += `_(Intake data missing)_\n\n`;
        }

        // Section 3: Competency Blueprint (A1)
        report += `================================================================================\n`;
        report += `# 3. Competency Blueprint (A1)\n`;
        report += `================================================================================\n\n`;
        if (blueprint) {
            report += `**Role:** ${blueprint.role.title} (${blueprint.role.seniority || 'N/A'})\n`;
            report += `**Reading Level:** ${blueprint.readingLevel?.mode} (Max words: ${blueprint.readingLevel?.maxSentenceWords || 'N/A'})\n\n`;

            report += `### COMPETENCIES\n`;
            blueprint.competencies?.forEach(c => {
                report += `#### ${c.name} (${c.id}) [Weight: ${c.weight}]\n`;
                report += `- **Definition:** ${c.definition}\n`;
                report += `- **Signals:** ${(c.signals || []).join(', ')}\n`;
                report += `- **Evidence:** ${(c.evidenceExamples || []).join(', ')}\n`;
                report += `- **Bands:**\n  - Developing: "${c.bands?.Developing}"\n  - Good: "${c.bands?.Good}"\n  - Strong: "${c.bands?.Strong}"\n\n`;
            });

            report += `### SCORING MODEL\n`;
            report += `#### Dimensions:\n`;
            blueprint.scoringModel?.dimensions?.forEach(d => {
                report += `- ${d.name} (${d.id}) [Weight: ${d.weight}]\n`;
            });
            report += `\n#### Rating Bands:\n- Developing: ${JSON.stringify(blueprint.scoringModel.ratingBands.Developing)}\n- Good: ${JSON.stringify(blueprint.scoringModel.ratingBands.Good)}\n- Strong: ${JSON.stringify(blueprint.scoringModel.ratingBands.Strong)}\n\n`;
        } else {
            report += `_(Blueprint missing)_\n\n`;
        }
        report += `---\n\n`; // Separator

        // Section 2: Question Plan (B1)
        // Section 4: Question Plan (B1)
        report += `================================================================================\n`;
        report += `# 4. Question Plan (B1)\n`;
        report += `================================================================================\n\n`;

        questions?.forEach((q) => {
            const typeLabel = q.type ? `[${q.type}]` : 'N/A';
            const diffLabel = q.difficulty ? `[${q.difficulty}]` : 'N/A';
            report += `**[${q.id}]:** ${q.competencyId || 'N/A'} | ${typeLabel} | ${diffLabel}\n\n`;
            report += `**Intent:** ${q.intent || 'N/A'}\n\n`;
            if (q.tips && q.tips.pointsToCover && q.tips.pointsToCover.length > 0) {
                report += `#### Rubric Hints (from Tips):\n`;
                q.tips.pointsToCover.forEach(hint => {
                    report += `- ${hint}\n`;
                });
                report += `\n`;
            }
        });
        report += `---\n\n`;

        // Section 3: Question Text (C1)
        // Section 5: Question Text (C1)
        report += `================================================================================\n`;
        report += `# 5. Active Question (C1)\n`;
        report += `================================================================================\n\n`;
        report += `**${currentQ.id}:** "${currentQ.text}"\n`;
        report += `(Type: ${currentQ.type}, Difficulty: ${currentQ.difficulty}, C-ID: ${currentQ.competencyId})\n\n`;
        report += `---\n\n`;

        // Section 4: Micro-Acknowledgement (F1)
        // Section 6: Micro-Acknowledgement (F1)
        report += `================================================================================\n`;
        report += `# 6. Micro-Acknowledgement (F1)\n`;
        report += `================================================================================\n\n`;
        if (analysis?.coachReaction) {
            report += `> "${analysis.coachReaction}"\n`;
        } else {
            report += `_(Not generated)_\n`;
        }
        report += `\n---\n\n`;

        // Section 5: Answer Text
        // Section 7: Answer Text
        report += `================================================================================\n`;
        report += `# 7. Answer Text\n`;
        report += `================================================================================\n\n`;
        if (currentAnswer?.text) {
            report += `"${currentAnswer.text}"\n`;
        } else if (currentAnswer?.audioBlob) {
            report += `_(Audio Blob Present, Transcript missing)_\n`;
        } else {
            report += `_(No answer yet)_\n`;
        }
        report += `\n---\n\n`;

        // Section 6: Speaking Delivery (G1)
        // Section 8: Speaking Delivery (G1)
        report += `================================================================================\n`;
        report += `# 8. Speaking Delivery (G1)\n`;
        report += `================================================================================\n\n`;
        if (analysis?.deliveryStatus) {
            report += `- **Status:** ${analysis.deliveryStatus}\n`;
            if (analysis.deliveryTips && analysis.deliveryTips.length > 0) {
                analysis.deliveryTips.forEach(tip => report += `- **Tip:** ${tip}\n`);
            }
        } else {
            report += `_(N/A or Text Mode)_\n`;
        }
        report += `\n---\n\n`;

        // Section 7: Answer Evaluation (D1 & D2)
        // Section 9: Answer Evaluation (D1 & D2)
        report += `================================================================================\n`;
        report += `# 9. Answer Evaluation (D1 & D2)\n`;
        report += `================================================================================\n\n`;
        if (analysis?.answerScore) {
            report += `**Rating:** ${analysis.rating} (${analysis.answerScore}/100)\n\n`;

            report += `### Dimension Scores\n`;
            if (analysis.dimensionScores) {
                analysis.dimensionScores?.forEach(ds => {
                    const dim = blueprint?.scoringModel?.dimensions?.find(d => d.name === ds.dimensionId || d.id === ds.dimensionId);
                    const weight = dim?.weight || 1;
                    report += `- **${ds.dimensionId}**: ${ds.score} (Weight: ${weight})\n  - Note: "${ds.note}"\n`;
                });
            }

            report += `\n### D2 Math Check\n`;
            const totalWeightedScore = analysis.dimensionScores?.reduce((sum, ds) => {
                const dim = blueprint?.scoringModel?.dimensions?.find(d => d.name === ds.dimensionId || d.id === ds.dimensionId);
                return sum + (ds.score * (dim?.weight || 1));
            }, 0) || 0;
            const totalWeight = analysis.dimensionScores?.reduce((sum, ds) => {
                const dim = blueprint?.scoringModel?.dimensions?.find(d => d.name === ds.dimensionId || d.id === ds.dimensionId);
                return sum + (dim?.weight || 1);
            }, 0) || 1;
            report += `Weighted Sum (${totalWeightedScore}) / Total Weight (${totalWeight}) = **${Math.round(totalWeightedScore / totalWeight)}**\n\n`;

            report += `### Evidence\n`;
            analysis.evidenceExtracts?.forEach(e => report += `- "${e}"\n`);

            report += `\n### Missing Elements\n`;
            analysis.missingElements?.forEach(m => report += `- ${m}\n`);
        } else {
            report += `_(Evaluation pending)_\n`;
        }
        report += `\n---\n\n`;

        // Section 8: Feedback (E1)
        // Section 10: Feedback (E1)
        report += `================================================================================\n`;
        report += `# 10. Feedback (E1)\n`;
        report += `================================================================================\n\n`;
        if (analysis) {
            report += `### Key Feedback\n`;
            analysis.feedback?.forEach(f => report += `- ${f}\n`);
            report += `\n### Biggest Upgrade\n${analysis.biggestUpgrade || 'N/A'}\n`;
            report += `\n### Redo Prompt\n${analysis.redoPrompt || 'N/A'}\n`;
            if (analysis.strongResponse) {
                report += `\n### Strong Answer Example\n${analysis.strongResponse}\n`;
            }
        }
        report += `\n---\n\n`;

        // Section 9: Session Aggregation (H2)
        // Section 11: Session Aggregation (H2)
        report += `================================================================================\n`;
        report += `# 11. Session Aggregation (H2)\n`;
        report += `================================================================================\n\n`;
        const allAnswered = Object.values(session.answers).filter(a => a.analysis?.answerScore);
        if (allAnswered.length > 0) {
            const avgScore = Math.round(allAnswered.reduce((sum, a) => sum + (a.analysis?.answerScore || 0), 0) / allAnswered.length);
            report += `- **Overall Score:** ${avgScore}\n`;
            report += `_(Calculated based on ${allAnswered.length} answers)_\n`;
        } else {
            report += `_(Not enough data)_\n`;
        }

        return report;
    };

    // Ref for the rendered content
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [isCopied, setIsCopied] = React.useState(false);

    const copyToClipboard = async () => {
        if (contentRef.current) {
            const html = contentRef.current.innerHTML;
            const plainText = contentRef.current.innerText;

            try {
                // Use Clipboard API with HTML format for rich text pasting
                await navigator.clipboard.write([
                    new ClipboardItem({
                        'text/html': new Blob([html], { type: 'text/html' }),
                        'text/plain': new Blob([plainText], { type: 'text/plain' }),
                    }),
                ]);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            } catch {
                // Fallback to plain text if HTML copy fails
                try {
                    await navigator.clipboard.writeText(plainText);
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                } catch (err) {
                    console.error('Failed to copy', err);
                }
            }
        }
    };

    const reportContent = generateMarkdownReport();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <GlassCard className="w-full max-w-4xl h-[90vh] flex flex-col bg-zinc-900/95 border-cyan-500/20 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-2 text-cyan-400">
                        <Database size={20} />
                        <h3 className="font-semibold text-lg">Artifact Debug View</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={copyToClipboard}
                            disabled={isCopied}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border text-xs font-medium",
                                isCopied
                                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                                    : "bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border-white/10"
                            )}
                            title="Copy Markdown Report"
                            aria-label="Copy Markdown Report"
                        >
                            {isCopied ? <Check size={16} /> : <Copy size={16} />}
                            {isCopied ? "Copied!" : "Copy Report"}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-red-500/20 rounded-full text-zinc-400 hover:text-red-400 transition-colors"
                            aria-label="Close Debug View"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content - Rendered Markdown */}
                <div ref={contentRef} className="flex-1 overflow-auto p-6 custom-scrollbar bg-black/40">
                    <ReactMarkdown
                        components={{
                            h1: ({ children }) => (
                                <h1 className="text-2xl font-bold text-zinc-400 mb-4 pb-2">
                                    {children}
                                </h1>
                            ),
                            h2: ({ children }) => (
                                <h2 className="text-xl font-bold text-blue-400 mt-6 mb-3">
                                    {children}
                                </h2>
                            ),
                            h3: ({ children }) => (
                                <h3 className="text-lg font-semibold text-amber-500 mt-4 mb-2">
                                    {children}
                                </h3>
                            ),
                            h4: ({ children }) => (
                                <h4 className="text-blue-400 mt-3 mb-1">
                                    {children}
                                </h4>
                            ),
                            p: ({ children }) => (
                                <p className="text-zinc-200 text-sm leading-relaxed mb-2">
                                    {children}
                                </p>
                            ),
                            strong: ({ children }) => (
                                <strong className="text-amber-300 font-semibold">
                                    {children}
                                </strong>
                            ),
                            em: ({ children }) => (
                                <em className="text-zinc-400 italic">
                                    {children}
                                </em>
                            ),
                            ul: ({ children }) => (
                                <ul className="list-disc list-inside space-y-1 text-sm text-zinc-200 ml-2 mb-2">
                                    {children}
                                </ul>
                            ),
                            li: ({ children }) => (
                                <li className="text-zinc-200">
                                    {children}
                                </li>
                            ),
                            blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-cyan-500/50 pl-4 py-1 my-2 bg-cyan-500/5 rounded-r-2xl text-cyan-300 italic">
                                    {children}
                                </blockquote>
                            ),
                            hr: () => (
                                <hr className="my-4 border-white/10" />
                            ),
                            code: ({ children }) => (
                                <code className="bg-white/10 text-pink-400 px-1.5 py-0.5 rounded text-xs font-mono">
                                    {children}
                                </code>
                            ),
                        }}
                    >
                        {reportContent}
                    </ReactMarkdown>
                </div>
            </GlassCard>
        </div>
    );
};
