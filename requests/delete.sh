#!/usr/bin/env bash

if [ $# -eq 0 ] # If no input args
then curl -X DELETE http://localhost:3000/api/questions/1
else curl -X DELETE http://localhost:3000/api/questions/$1
fi
