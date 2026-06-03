import { Response } from 'express';
import { sendResponse } from '../utils/sendResponse';

describe('sendResponse utility', () => {
  const createMockResponse = (): Response => {
    const res = {} as Partial<Response>;
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn().mockReturnThis();
    return res as Response;
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sends response with data and meta when provided', () => {
    const mockRes = createMockResponse();
    const data = { foo: 'bar' };
    const meta = { total: 1 };
    sendResponse(mockRes, 200, 'OK', data, meta);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: 'OK',
      data,
      meta,
    });
  });

  it('sends response without meta when meta is undefined', () => {
    const mockRes = createMockResponse();
    const data = { foo: 'bar' };
    sendResponse(mockRes, 201, 'Created', data);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: 'Created',
      data,
    });
  });
});
