# Lightspeed UI
- This is a POC for LightSpeed AI work 
- UI Built with LWC and rollup bundler

# Install and Setup
- Clone this repo - git@git.soma.salesforce.com:lightspeed/lightspeed.git
- Navigate to this folder - /lightspeed_ui
- `yarn install` (node version - v16.20.0 ^)
- `yarn watch`
- Preview in browser in localhost
- `http://localhost:10001`

# This UI is using Lightspeed API
- /generate-metadata-config-plan/
- /analyze-salesforce-metadata-dependencies/
- /generate-metadata/

- To run the API Server locally 
- go to file - `lightspeed_api.py`
- Run it using F5 on VSCode

- To Run local File server - 
- Navigate to this folder - /local_webservice
- `yarn install` (node version - v16.20.0 ^)
- `yarn watch`

- Will spin up express server to handle file system calls
- `http://localhost:3001`