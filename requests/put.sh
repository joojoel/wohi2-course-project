#!/usr/bin/env bash

if [ $# -eq 0 ] # If no input args
then
    curl -X PUT -H "Content-Type: application/json" \
         -d '{"question": "Test", "choice_1": "Test", "choice_2": "Test", "choice_3": "Test", "choice_4": "Test", "solution": 1, "keywords": ["test"]}' \
         http://localhost:3000/api/questions/1
else
    curl -X PUT -H "Content-Type: application/json" \
         -d '{"question": "Test", "choice_1": "Test", "choice_2": "Test", "choice_3": "Test", "choice_4": "Test", "solution": 1, "keywords": ["test"]}' \
         http://localhost:3000/api/questions/$1
fi
