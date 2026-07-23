import { app } from './src/app';
const request = async (method: string, url: string) => {
  return new Promise<any>((resolve) => {
    const req = { method, url, headers: {}, connection: { remoteAddress: '127.0.0.1' }, on: () => {} } as any;
    const res = { statusCode: 200, headers: {}, setHeader(k: string, v: string) { this.headers[k] = v; }, status(code: number) { this.statusCode = code; return this; }, json(data: any) { resolve({ status: this.statusCode, data }); }, end(data: any) { resolve({ status: this.statusCode, data }); } } as any;
    app(req, res, () => resolve({ status: 404, data: 'Not Found' }));
  });
};
request('GET', '/api/v1/portfolios').then(console.log);
