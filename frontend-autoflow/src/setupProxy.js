const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // WebSocket proxy for SSH terminal
  app.use(
    '/ws',
    createProxyMiddleware({
      target: 'ws://localhost:5010',
      ws: true,
      changeOrigin: true,
    })
  );

  // AI Agents API proxy (specific endpoints)
  app.use(
    '/api/agent_status',
    createProxyMiddleware({
      target: 'http://localhost:5003',
      changeOrigin: true,
    })
  );

  app.use(
    '/api/agent-ai-config-task',
    createProxyMiddleware({
      target: 'http://localhost:5003',
      changeOrigin: true,
    })
  );

  // API proxy for all other API calls
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
    })
  );
}; 