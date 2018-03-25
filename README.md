
1. Set the comapign.api_key Google Cloud environment variables
```bash
  firebase functions:config:set compaign.api_key="xxxxxxxxxx" campaign.base_url="domain_url"
```
Or
```bash
 ./deploy_config/development.sh
```

2. Run test cloud functions locally
```bash
firebase functions:config:get > .runtimeconfig.json
firebase serve --only functions
```
