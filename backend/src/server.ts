import Fastify from 'fastify';

const server = Fastify({
  logger: {
    level: 'info',
  },
});

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const host = process.env.HOST || '0.0.0.0';

const start = async () => {
  try {
    await server.listen({ port, host });
    const memoryUsage = process.memoryUsage();
    server.log.info(
      `Server started on ${host}:${port} | RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
    );
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

export default server;
