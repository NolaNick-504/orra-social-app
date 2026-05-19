// ORRA Production Server — uses standalone build for correct static file serving
const { join } = require('path');
const port = parseInt(process.env.PORT || '3000', 10);
const hostname = process.env.HOSTNAME || '0.0.0.0';

// The standalone server is the correct way to run Next.js with output: "standalone"
// It properly serves .next/static/chunks/* files
process.env.NODE_ENV = 'production';
require(join(__dirname, '.next/standalone/server.js'));
