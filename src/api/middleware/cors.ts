import { FastifyInstance } from 'fastify';

export const corsMiddleware = async (app: FastifyInstance) => {
  app.addHook('onRequest', async (request, reply) => {
    const origin = request.headers.origin || '*';
    
    // Allow requests from localhost:5173 (frontend dev server)
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:8080',
    ];
    
    if (allowedOrigins.includes(origin) || origin === '*') {
      reply.header('Access-Control-Allow-Origin', origin);
      reply.header('Access-Control-Allow-Credentials', 'true');
      reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return reply.status(204).send();
    }
  });
};
