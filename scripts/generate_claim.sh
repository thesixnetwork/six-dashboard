#!/bin/bash
config=$1
: ${1?"Usage: $0 ARGUMENT"}
#  Script exits here if command-line parameter absent,
#+ with following error message.
#    generate_claim.sh: 1: Usage: agenerate_claim.sh FIREBASE_CONFIG_PATH.json
test ! -d "./config" && echo 'Creating config dir' && mkdir config 
test ! -f "./config/config.json" && echo "Copping $1 to ./config/config.json" && cp $1 ./config/config.json
echo 'Install node module'
npm install

echo 'npm install n'
sleep 1
npm install n
#sudo ./node_modules/n/bin/n stable

echo '4 STEP Generate Claim service'
echo ''
sleep 1
echo '#1 (1/4) Generate JSON FROM CSV'
node generate_json_from_csv.js 
sleep 1
echo ''
echo '#2 (2/4) Generate Private sale user to JSON'
node generate_private_sale_users.js
sleep 1
echo ''
echo '#3 (3/4) Generate Public sale user to JSON'
node generate_public_sale_claim.js 
echo ''
echo '#4 (4/4) Insert all claim user into FireStore'
node insert_json_to_db.js
