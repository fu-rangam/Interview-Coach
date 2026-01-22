import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardHome } from './DashboardHome';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect } from 'vitest';

// Mock dependencies
vi.mock('../services/storageService', () => ({
  getAllSessions: () => [
    { id: '1', role: 'Developer', date: new Date().toISOString() },
    { id: '2', role: 'Designer', date: new Date().toISOString() },
  ],
  deleteSession: vi.fn(),
  exportSessionAsJSON: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('DashboardHome', () => {
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <DashboardHome />
      </BrowserRouter>
    );
  };

  it('renders the welcome message', () => {
    renderComponent();
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
  });

  it('renders the Start New Session button', () => {
    renderComponent();
    expect(screen.getByText('Start New Session')).toBeInTheDocument();
  });

  it('renders recent sessions', () => {
    renderComponent();
    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.getByText('Designer')).toBeInTheDocument();
  });

  it('navigates to interview setup when Start Session is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Start New Session'));
    expect(mockNavigate).toHaveBeenCalledWith('/interview');
  });
});
