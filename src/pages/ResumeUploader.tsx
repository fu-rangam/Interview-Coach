import React from 'react';
import { Button } from '../components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/ui/card';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ResumeUploader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in-up">
      <div className="flex flex-col gap-2 items-center text-center">
        <h1 className="text-4xl font-bold text-rangam-navy mb-4 font-display">Resume Builder</h1>
        <p className="text-xl text-slate-600 max-w-2xl">
          Our AI-powered Resume Builder is coming soon! Create professional, ATS-friendly resumes in
          minutes.
        </p>

        <Card className="mt-12 w-full max-w-xl text-center">
          <CardHeader className="flex flex-col items-center pb-2 pt-10">
            <div className="w-24 h-24 rounded-full bg-rangam-orange/10 flex items-center justify-center mb-6 border border-rangam-orange/20">
              <FileText size={48} className="text-rangam-orange" />
            </div>
            <CardTitle className="text-2xl font-bold text-rangam-navy font-display">
              Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-8 flex justify-center">
            <CardDescription className="text-base max-w-md">
              We're working hard to bring you the best resume building experience.
            </CardDescription>
          </CardContent>
          <CardFooter className="flex justify-center pb-10">
            <Button onClick={() => navigate('/')} variant="default">
              Back to Portal
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
