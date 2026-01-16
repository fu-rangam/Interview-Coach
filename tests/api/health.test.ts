import { describe, it, expect, vi } from 'vitest';
import handler from '../../api/health';

describe('Health API Handler', () => {
    it('should return 200 and ok status', async () => {
        const mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
        };
        const mockReq = {};

        await handler(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({ status: 'ok', message: 'API is working' });
    });
});
