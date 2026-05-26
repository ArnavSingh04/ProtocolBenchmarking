const path = require("path");

/** @type {import("next").NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias["meteor/meteor"] = path.resolve(
      __dirname,
      "lib/server/meteorShim.js"
    );
    return config;
  }
};

module.exports = nextConfig;
