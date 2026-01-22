import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResumeUploadZone } from '../components/ResumeUploadZone';
import { vi, describe, it, expect } from 'vitest';

describe('ResumeUploadZone', () => {
  it('renders the upload area', () => {
    render(<ResumeUploadZone />);
    expect(screen.getByText(/Drag & drop your resume/i)).toBeInTheDocument();
  });

  it('shows browse button', () => {
    render(<ResumeUploadZone />);
    expect(screen.getByText(/Click to upload/i)).toBeInTheDocument();
  });
});
