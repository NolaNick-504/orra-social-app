module.exports = {
  apps: [{
    name: 'orra',
    script: 'bash',
    args: '.zscripts/dev.sh',
    env: {
      NODE_ENV: 'production',
      NEXTAUTH_SECRET: 'orra-s3cr3t-k3y-p3rman3nt-2024',
      NEXTAUTH_URL: 'http://localhost:3000',
      AUTH_TRUST_HOST: 'true',
      DATABASE_URL: 'file:/home/z/my-project/db/custom.db',
      AUTOPOST_KEY: 'orra-internal-autopost-2026',
    }
  }]
};
