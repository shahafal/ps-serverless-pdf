import config from '../config.json';

export const API_ENDPOINT = config.api.endpoint;
export const AUTH_CONFIG = {
    userPoolId: config.auth.userPoolId,
    userPoolWebClientId: config.auth.clientId,
    region: config.auth.region,
};

export default config;
