import Fastify from 'fastify';
import { registerProjectRoutes } from './api/routes/projects.js';
import { registerEstimateRoutes } from './api/routes/estimates.js';

export const buildApp = () => {
  const app = Fastify({ logger: true });
  registerProjectRoutes(app);
  registerEstimateRoutes(app);
  return app;
};

if (process.env.NODE_ENV !== 'test') {
  const app = buildApp();
  app.listen({ port: Number(process.env.PORT || 3000), host: '0.0.0.0' }).catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
}
