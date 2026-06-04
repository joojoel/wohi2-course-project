#!/usr/bin/env bash

mysql -u "root" -p1234 -e "DROP DATABASE cms;"
mysql -u "root" -p1234 -e "CREATE DATABASE cms;"
npx prisma migrate dev --name init
npx prisma db seed

# Test database setup
mysql -u "root" -p1234 -e "DROP DATABASE cms_test;"
mysql -u "root" -p1234 -e "CREATE DATABASE cms_test;"

mysql -u "root" -p1234 -e "DROP USER 'wohii'@'localhost';"
mysql -u "root" -p1234 -e "CREATE USER 'wohii'@'localhost' IDENTIFIED BY 'soc';"

# Grant your app user access to it (also as root)
mysql -u "root" -psoc -e "
  GRANT ALL PRIVILEGES ON cms_test.* TO 'wohii'@'localhost';
  FLUSH PRIVILEGES;
"

# Verify the grant landed
mysql -u "wohii" -psoc -e "SHOW GRANTS FOR CURRENT_USER();"

# Apply Prisma migrations to the test DB
npm run test:setup
