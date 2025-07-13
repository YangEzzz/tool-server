import request from 'supertest';
import app from '../../../src/app';

describe('Health Controller', () => {
  it('should return 200 OK', async () => {
    const response = await request(app.callback()).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
}); 