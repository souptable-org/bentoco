cd /d C:\Users\harsh\bentoco
set DATABASE_URL=postgres://postgres:postgres@localhost:5432/bentoco
set NODE_ENV=development
set JWT_SECRET=supersecret_bentoco_jwt
set COOKIE_SECRET=supersecret_bentoco_cookie
set ADMIN_CORS=http://localhost:7001,http://127.0.0.1:7001,http://agency.localhost:7001,http://app.localhost:7001
set AUTH_CORS=http://localhost:7001,http://127.0.0.1:7001,http://agency.localhost:7001,http://app.localhost:7001
node packages/cli/bentoco-cli/cli.js start --types false -p 9000 > server-9000.log 2>&1
