#!/bin/sh
# This install script sets up the server.
# It expects Node.js to be installed

username = # your username
password = # your password
git config remote.origin.url https://${username}:${password}@github.com/${username}/leaderboard.git
npm install bz
cp bz.js node_modules/bz/lib
