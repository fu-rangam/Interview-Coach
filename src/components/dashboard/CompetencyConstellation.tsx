import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ConstellationSignal } from '../../services/coachService';
import { motion } from 'framer-motion';

interface CompetencyConstellationProps {
  signal: ConstellationSignal;
}

export const CompetencyConstellation: React.FC<CompetencyConstellationProps> = ({ signal }) => {
  if (signal.state === 'Loading' || signal.state === 'Empty' || signal.points.length === 0) {
    return (
      <Card className="h-full border-slate-100 flex items-center justify-center min-h-[300px]">
        <span className="text-slate-300 text-sm">Not enough data for constellation</span>
      </Card>
    );
  }

  // Radar Chart Config
  const size = 200;
  const center = size / 2;
  const radius = size * 0.4;

  const points = signal.points;
  const angleStep = (Math.PI * 2) / points.length;

  // Calculate coordinates
  const getCoordinates = (value: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2; // Start at top
    return {
      x: center + Math.cos(angle) * (radius * value),
      y: center + Math.sin(angle) * (radius * value),
    };
  };

  // Generate path for the shape
  const shapePath =
    points
      .map((p, i) => {
        const { x, y } = getCoordinates(p.strength, i);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ') + ' Z';

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Competency Shape
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-6">
        <div className="relative w-[200px] h-[200px]">
          {/* Background Circles (Web) */}
          {[0.25, 0.5, 0.75, 1].map((r, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius * r}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="1"
            />
          ))}

          {/* Axes */}
          {points.map((_, i) => {
            const { x, y } = getCoordinates(1, i);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
            );
          })}

          <svg width={size} height={size} className="absolute top-0 left-0">
            {/* The Data Shape */}
            <motion.path
              d={shapePath}
              fill="rgba(59, 130, 246, 0.2)"
              stroke="#2563EB"
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />

            {/* Vertices */}
            {points.map((p, i) => {
              const { x, y } = getCoordinates(p.strength, i);
              return (
                <circle key={i} cx={x} cy={y} r={3} fill="#2563EB" stroke="white" strokeWidth="1" />
              );
            })}
          </svg>

          {/* Labels */}
          {points.map((p, i) => {
            const { x, y } = getCoordinates(1.2, i); // Push label out
            return (
              <div
                key={i}
                className="absolute text-[10px] font-medium text-slate-500 text-center w-20 leading-tight"
                style={{
                  left: x - 40, // center the 80px width
                  top: y - 10,
                }}
              >
                {p.competency}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-slate-400 mt-6 text-center italic">
          Relative strengths. Outer edge represents high confidence & mastery.
        </p>
      </CardContent>
    </Card>
  );
};
