import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecording } from './useRecording';

describe('useRecording', () => {
    const mockStream = {
        getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Use vi.stubGlobal for better browser API mocking in Vitest
        vi.stubGlobal('navigator', {
            mediaDevices: {
                getUserMedia: vi.fn().mockResolvedValue(mockStream),
            },
        });

        // Mock MediaRecorder
        class MockMediaRecorder {
            start = vi.fn();
            stop = vi.fn();
            ondataavailable: ((e: any) => void) | null = null;
            onstop: (() => void) | null = null;
            mimeType = 'audio/webm';

            constructor(stream: any, options: any) {
                MockMediaRecorder.instance = this;
            }

            static instance: any = null;
            static isTypeSupported = vi.fn().mockReturnValue(true);
        }

        vi.stubGlobal('MediaRecorder', MockMediaRecorder);
    });

    it('should initialize with isRecording: false', () => {
        const { result } = renderHook(() => useRecording());
        expect(result.current.isRecording).toBe(false);
    });

    it('should start recording successfully', async () => {
        const { result } = renderHook(() => useRecording());

        await act(async () => {
            await result.current.startRecording();
        });

        expect(result.current.isRecording).toBe(true);
        expect(result.current.mediaStream).toBe(mockStream);
    });

    it('should stop recording and return a blob', async () => {
        const { result } = renderHook(() => useRecording());

        await act(async () => {
            await result.current.startRecording();
        });

        let capturedBlob: Blob | null = null;
        const stopPromise = result.current.stopRecording().then(blob => {
            capturedBlob = blob;
        });

        // Simulate recorder stopping
        const instance = (global.MediaRecorder as any).instance;
        act(() => {
            if (instance.onstop) instance.onstop();
        });

        await stopPromise;

        expect(result.current.isRecording).toBe(false);
        expect(capturedBlob).toBeInstanceOf(Blob);
    });
});
