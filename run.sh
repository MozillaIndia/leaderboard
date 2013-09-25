#!/bin/sh
# This script pulls data and commit back to GitHub repo.

TIMESTAMP=$(date)
node datapull.js
git add .
git commit -m "Update stats.json - ${TIMESTAMP}"
git push -u origin gh-pages
