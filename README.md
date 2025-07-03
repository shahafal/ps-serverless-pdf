# serverless-pdf-reader

Based on David Tucker ps-serverless-app from his Pluralsight coures.

This implementation is using AWS SDK v3 and verified for Node v22.

## Webapp Setup

### Prerequisites
- Node.js v22 or later
- Yarn package manager

### Configuration
1. Navigate to the webapp directory:
   ```bash
   cd webapp
   ```

2. Create a `config.json` file by copying the sample configuration:
   ```bash
   cp config.sample.json config.json
   ```

3. Update the `config.json` file with your AWS settings:
   ```json
   {
     "api": {
       "endpoint": "https://your-api-endpoint.com"
     },
     "auth": {
       "userPoolId": "region_XXXXXXXXX",
       "clientId": "your-client-id",
       "region": "your-region"
     }
   }
   ```

### Installing Dependencies
Run the following command to install required dependencies:
```bash
yarn install
```

### Development
To run the application locally in development mode:
```bash
yarn start
```
This will start the development server and open the application in your default browser.

### Production Build
To create a production build:
```bash
yarn build
```
This will create an optimized production build in the `dist` directory.
