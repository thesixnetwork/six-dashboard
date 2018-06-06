#!/bin/bash
config=$1
: ${1?"Usage: $0 ARGUMENT"}
#  Script exits here if command-line parameter absent,
#+ with following error message.
#    generate_claim.sh: 1: Usage: agenerate_claim.sh FIREBASE_CONFIG_PATH.json
test ! -d "./config" && echo 'Creating config dir' && mkdir config 
test ! -f "./config/config.json" && echo "Copping $1 to ./config/config.json" && cp $1 ./config/config.json
echo 'Install node module'
wait=10
npm install

echo 'npm install n'
sleep 1
npm install n
#sudo ./node_modules/n/bin/n stable

echo '5 STEP Generate Claim service'
echo ''
echo '#1 (1/5) Generate JSON FROM CSV'
node generate_json_from_csv.js 
echo ''
echo '#2 (2/5) Generate Private sale user to JSON and Create User'
node generate_private_sale_users.js
echo ''
echo "Sleep $wait seconds for Waiting cloud function create user."
sleep $wait 
echo '#3 (3/5) Generate Public sale user to JSON'
sleep 3
node generate_public_sale_claim.js 
echo ''
echo '#4 (4/5) Generate airdrop user to JSON'
sleep 3
node generate_airdrop_claim.js 
echo ''
echo '#5 (5/5) Insert all claim user into FireStore'
sleep 3
#node insert_json_to_db.js

