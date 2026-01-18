import React from 'react';
import { GlassCard } from './ui/glass/GlassCard';
import { X, Copy, Database } from 'lucide-react';
import { InterviewSession, Question, AnalysisResult, CompetencyBlueprint, ScoringDimension } from '../types';

interface DebugInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: InterviewSession;
}

export const DebugInfoModal: React.FC<DebugInfoModalProps> = ({ isOpen, onClose, session }) => {
    if (!isOpen) return null;

    // Helper: Generate Markdown Report
    const generateMarkdownReport = () => {
        const { blueprint, questions, currentQuestionIndex, answers } = session;
        const currentQ = questions[currentQuestionIndex];
        const currentAnswer = answers[currentQ.id];
        const analysis = currentAnswer?.analysis;

        let report = `# Competency-Driven Interview Session Debug Report\n\n`;

        // Section 1: Competency Blueprint (A1)
        report += `## 1. Competency Blueprint (A1)\n\n`;
        if (blueprint) {
            report += `**Role:** ${blueprint.role.title} (${blueprint.role.seniority || 'N/A'})\n`;
            report += `**Reading Level:** ${blueprint.readingLevel?.mode} (Max words: ${blueprint.readingLevel?.maxSentenceWords || 'N/A'})\n\n`;

            report += `### Competencies\n`;
            blueprint.competencies?.forEach(c => {
                report += `#### ${c.name} (${c.id}) [Weight: ${c.weight}]\n`;
                report += `- **Definition:** ${c.definition}\n`;
                report += `- **Signals:** ${(c.signals || []).join(', ')}\n`;
                report += `- **Evidence:** ${(c.evidenceExamples || []).join(', ')}\n`;
                report += `- **Bands:**\n  - Developing: "${c.bands?.Developing}"\n  - Good: "${c.bands?.Good}"\n  - Strong: "${c.bands?.Strong}"\n\n`;
            });

            report += `### Scoring Model\n`;
            report += `**Dimensions:**\n`;
            blueprint.scoringModel?.dimensions?.forEach(d => {
                report += `- ${d.name} (${d.id}) [Weight: ${d.weight}]\n`;
            });
            report += `\n**Rating Bands:**\n- Developing: ${JSON.stringify(blueprint.scoringModel.ratingBands.Developing)}\n- Good: ${JSON.stringify(blueprint.scoringModel.ratingBands.Good)}\n- Strong: ${JSON.stringify(blueprint.scoringModel.ratingBands.Strong)}\n\n`;
        } else {
            report += `_(Blueprint missing)_\n\n`;
        }
        report += `---\n\n`; // Separator

        // Section 2: Question Plan (B1)
        report += `## 2. Question Plan (B1)\n\n`;
        questions?.forEach((q) => {
            report += `- **[${q.id}]** ${q.competencyId || 'N/A'} | ${q.type || 'N/A'} | ${q.difficulty || 'N/A'}\n`;
            report += `  - **Intent:** ${q.intent || 'N/A'}\n`;
            if (q.tips) {
                report += `  - **Rubric Hints (from Tips):**\n    - ${q.tips.pointsToCover.join('\n    - ')}\n`;
            }
            report += `\n`;
        });
        report += `---\n\n`;

        // Section 3: Question Text (C1)
        report += `## 3. Active Question (C1)\n\n`;
        report += `**${currentQ.id}:** "${currentQ.text}"\n`;
        report += `(Type: ${currentQ.type}, Difficulty: ${currentQ.difficulty}, C-ID: ${currentQ.competencyId})\n\n`;
        report += `---\n\n`;

        // Section 4: Micro-Acknowledgement (F1)
        report += `## 4. Micro-Acknowledgement (F1)\n\n`;
        if (analysis?.coachReaction) {
            report += `> "${analysis.coachReaction}"\n`;
        } else {
            report += `_(Not generated)_\n`;
        }
        report += `\n---\n\n`;

        // Section 5: Answer Text
        report += `## 5. Answer Text\n\n`;
        if (currentAnswer?.text) {
            report += `"${currentAnswer.text}"\n`;
        } else if (currentAnswer?.audioBlob) {
            report += `_(Audio Blob Present, Transcript missing)_\n`;
        } else {
            report += `_(No answer yet)_\n`;
        }
        report += `\n---\n\n`;

        // Section 6: Speaking Delivery (G1)
        report += `## 6. Speaking Delivery (G1)\n\n`;
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
        report += `## 7. Answer Evaluation (D1 & D2)\n\n`;
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
        report += `## 8. Feedback (E1)\n\n`;
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
        report += `## 9. Session Aggregation (H2)\n\n`;
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

    const copyToClipboard = () => {
        const text = generateMarkdownReport();
        navigator.clipboard.writeText(text);
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
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/10 text-xs font-medium"
                            title="Copy Markdown Report"
                        >
                            <Copy size={16} /> Copy Report
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-red-500/20 rounded-full text-zinc-400 hover:text-red-400 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 custom-scrollbar bg-black/40 font-mono text-xs md:text-sm text-zinc-300 leading-relaxed">
                    <pre className="whitespace-pre-wrap font-mono text-zinc-300">
                        {reportContent}
                    </pre>
                </div>
            </GlassCard>
        </div>
    );
};
