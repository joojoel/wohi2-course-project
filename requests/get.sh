#!/usr/bin/env bash

#curl http://localhost:3000/api/questions/2 | jq

curl http://localhost:3000/api/questions/2 \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc3NzQ1NDA0OSwiZXhwIjoxNzc3NDU3NjQ5fQ.HETk_AVg33Q1nPuGQytGANaCXHt-uFpyJiExDrb0KHY" \
    | jq
