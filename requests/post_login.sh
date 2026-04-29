#!/usr/bin/env bash

curl -X POST -H "Content-Type: application/json" \
     -d '{"email": "test@gmail.com", "password": "testpass"}' \
     http://localhost:3000/api/auth/login
