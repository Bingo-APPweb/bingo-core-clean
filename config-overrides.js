module.exports = function override(config) {
    // Adicionar polyfills para módulos Node.js
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "http": require.resolve("stream-http"),
      "url": require.resolve("url/"),
      "zlib": require.resolve("browserify-zlib"),
      "fs": false,
      "stream": require.resolve("stream-browserify")
    };
    return config;
  };