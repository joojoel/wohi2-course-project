#!/usr/bin/env bash

mysql -u "root" "-p1234" -e "DROP DATABASE cms;"
mysql -u "root" "-p1234" -e "CREATE DATABASE cms;"
npx prisma migrate dev --name init
npx prisma db seed
