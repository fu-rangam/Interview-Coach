import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:54321');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');

import type { InterviewSession } from '../types';

// Define mocks as top-level HOISTED constants
const { mockGetUser, mockFrom, mockInsert, mockSelect, mockEq, mockOrder, mockSingle, mockDelete } =
  vi.hoisted(() => ({
    mockGetUser: vi.fn(),
    mockFrom: vi.fn(),
    mockInsert: vi.fn(),
    mockSelect: vi.fn(),
    mockEq: vi.fn(),
    mockOrder: vi.fn(),
    mockSingle: vi.fn(),
    mockDelete: vi.fn(),
  }));

vi.mock('./supabase', () => ({
  supabase: {
    auth: { getUser: mockGetUser },
    from: mockFrom,
  },
}));

// Setup the mock chain properly
const mockChain = {
  insert: mockInsert,
  select: mockSelect,
  eq: mockEq,
  order: mockOrder,
  single: mockSingle,
  delete: mockDelete,
};

mockFrom.mockReturnValue(mockChain);

import { saveSession, getAllSessions, deleteSession, fetchSessionById } from './storageService';

describe('storageService', () => {
  const mockSession: InterviewSession = {
    role: 'Software Engineer',
    questions: [{ id: '1', text: 'Question 1' }],
    currentQuestionIndex: 0,
    answers: {},
    jobDescription: 'Test JD',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.setSystemTime(new Date('2025-12-26T16:00:00Z'));

    // Re-setup the chaining for each test
    mockInsert.mockReturnThis().mockReturnValue({ error: null });
    mockSelect.mockReturnThis().mockReturnValue({ data: [], error: null });
    mockEq.mockReturnThis().mockReturnValue({ data: null, error: null });
    mockOrder.mockReturnThis().mockReturnValue({ data: [], error: null });
    mockSingle.mockReturnValue({ data: null, error: null });
    mockDelete.mockReturnThis().mockReturnValue({ error: null });

    // Mock console.error to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('saveSession', () => {
    it('should save to Supabase when user is logged in', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });

      await saveSession(mockSession, 85);

      expect(mockFrom).toHaveBeenCalledWith('interviews');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          role: 'Software Engineer',
          score: 85,
        })
      );
    });

    it('should fallback to localStorage when user is guest', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      await saveSession(mockSession, 70);

      const stored = JSON.parse(localStorage.getItem('ai_interview_coach_sessions') || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].role).toBe('Software Engineer');
      expect(stored[0].score).toBe(70);
    });

    it('should fallback to localStorage if Supabase insertion fails', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
      mockInsert.mockReturnValueOnce({ error: new Error('DB Error') });

      await saveSession(mockSession, 90);

      const stored = JSON.parse(localStorage.getItem('ai_interview_coach_sessions') || '[]');
      expect(stored).toHaveLength(1);
    });
  });

  describe('getAllSessions', () => {
    it('should fetch from Supabase when logged in', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
      const mockData = [
        {
          id: 'uuid-1',
          created_at: '2025-12-26T15:00:00Z',
          role: 'DevOps',
          score: 95,
          feedback: JSON.stringify({ questions: [1, 2, 3] }),
        },
      ];
      mockSelect.mockReturnThis();
      mockEq.mockReturnThis();
      mockOrder.mockReturnValueOnce({ data: mockData, error: null });

      const result = await getAllSessions();

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('DevOps');
    });
  });

  describe('deleteSession', () => {
    it('should delete from Supabase if ID looks like a UUID', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      mockDelete.mockReturnThis();
      mockEq.mockReturnValueOnce({ error: null });

      const result = await deleteSession(uuid);

      expect(result).toBe(true);
      expect(mockEq).toHaveBeenCalledWith('id', uuid);
    });

    it('should delete from localStorage if ID is a short timestamp', async () => {
      localStorage.setItem(
        'ai_interview_coach_sessions',
        JSON.stringify([{ id: '12345', role: 'Delete Me' }])
      );

      const result = await deleteSession('12345');

      expect(result).toBe(true);
      const stored = JSON.parse(localStorage.getItem('ai_interview_coach_sessions') || '[]');
      expect(stored).toHaveLength(0);
    });
  });

  describe('fetchSessionById', () => {
    it('should fetch single session from Supabase', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      mockSelect.mockReturnThis();
      mockEq.mockReturnThis();
      mockSingle.mockReturnValueOnce({
        data: {
          id: uuid,
          role: 'AI Engineer',
          feedback: JSON.stringify({ questions: [] }),
          created_at: '2025-12-26T16:00:00Z',
        },
        error: null,
      });

      const result = await fetchSessionById(uuid);

      expect(result?.role).toBe('AI Engineer');
    });

    it('should find session in localStorage by ID', async () => {
      localStorage.setItem(
        'ai_interview_coach_sessions',
        JSON.stringify([{ id: '123', role: 'React Dev' }])
      );

      const result = await fetchSessionById('123');
      expect(result?.role).toBe('React Dev');
    });
  });
});
