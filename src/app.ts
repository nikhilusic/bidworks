import Fastify from 'fastify';
import { corsMiddleware } from './api/middleware/cors.js';
import { dbPlugin } from './api/plugins/db.js';
import { projectRoutes } from './api/routes/projects.js';
import { estimateRoutes } from './api/routes/estimates.js';

export const buildApp = async () => {
  const app = Fastify({ logger: true });
  
  // Enable CORS for frontend development
  await corsMiddleware(app);
  
  // Health check endpoint
  app.get('/', async () => {
    return { status: 'ok', message: 'BidWorks Estimation API is running' };
  });
  
  await app.register(dbPlugin);
  await app.register(projectRoutes, { prefix: '/api/projects' });
  await app.register(estimateRoutes, { prefix: '/api/projects' });
  return app;
};

if (process.env.NODE_ENV !== 'test') {
  buildApp().then((app) => {
    app.listen({ port: Number(process.env.PORT || 3000), host: '0.0.0.0' }).catch((err: Error) => {
      app.log.error(err);
      process.exit(1);
    });
  }).catch((err: Error) => {
    console.error('Failed to start app:', err);
    process.exit(1);
  });
}
