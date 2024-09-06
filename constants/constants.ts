import { Commitment } from "@solana/web3.js";
import { logger, retrieveEnvVariable } from "../utils";

export const NETWORK = 'mainnet-beta';
export const COMMITMENT_LEVEL: Commitment = retrieveEnvVariable('COMMITMENT_LEVEL', logger) as Commitment;
export const RPC_ENDPOINT = retrieveEnvVariable('RPC_ENDPOINT', logger);
export const RPC_WEBSOCKET_ENDPOINT = retrieveEnvVariable('RPC_WEBSOCKET_ENDPOINT', logger);
export const LOG_LEVEL = retrieveEnvVariable('LOG_LEVEL', logger);

export const BLOCK_ENGINE_URL = retrieveEnvVariable('BLOCK_ENGINE_URL', logger);
export const NO_AUTH = retrieveEnvVariable('NO_AUTH', logger);
export const AUTH_KEYPAIR_PATH = retrieveEnvVariable('AUTH_KEYPAIR_PATH', logger);

export const PRIVATE_KEY = retrieveEnvVariable('PRIVATE_KEY', logger);
export const QUOTE_MINT = retrieveEnvVariable('QUOTE_MINT', logger);
export const QUOTE_AMOUNT = retrieveEnvVariable('QUOTE_AMOUNT', logger);
export const JITO_TIP = retrieveEnvVariable('JITO_TIP', logger);
export const SECONDS_TO_WAIT_AFTER_BUY_BEFORE_CONTINUING_SNIPING = Number(retrieveEnvVariable('SECONDS_TO_WAIT_AFTER_BUY_BEFORE_CONTINUING_SNIPING', logger));
export const MAX_SECONDS_FROM_POOL_OPEN_TO_TOKEN_STREAMED = Number(retrieveEnvVariable('MAX_SECONDS_FROM_POOL_OPEN_TO_TOKEN_STREAMED', logger));

//Filtration
export const LIST_REFRESH_INTERVAL = Number(retrieveEnvVariable('LIST_REFRESH_INTERVAL', logger));
export const USE_SNIPE_LIST = retrieveEnvVariable('USE_SNIPE_LIST', logger) === 'true';
export const USE_KEYWORD_LIST = retrieveEnvVariable('USE_KEYWORD_LIST', logger) === 'true';
export const CHECK_UPDATEAUTHORITY_BLACKLIST = retrieveEnvVariable('CHECK_UPDATEAUTHORITY_BLACKLIST', logger) === 'true';
export const AUTO_BLACKLIST_FREEZABLE_TOKENS = retrieveEnvVariable('AUTO_BLACKLIST_FREEZABLE_TOKENS', logger) === 'true';
export const CHECK_KEYWORD_BLACKLIST = retrieveEnvVariable('CHECK_KEYWORD_BLACKLIST', logger) === 'true';
export const NOT_FREEZABLE = retrieveEnvVariable('NOT_FREEZABLE', logger) === 'true';
export const NOT_MINTABLE = retrieveEnvVariable('NOT_MINTABLE', logger) === 'true';
export const LP_BURNED = retrieveEnvVariable('LP_BURNED', logger) === 'true';
export const METADATA_IS_NOT_MUTABLE = retrieveEnvVariable('METADATA_IS_NOT_MUTABLE', logger) === 'true';
export const HAS_SOCIALS = retrieveEnvVariable('HAS_SOCIALS', logger) === 'true';
export const IS_PUMPFUN = retrieveEnvVariable('IS_PUMPFUN', logger) === 'true';
export const MIN_POOL_SIZE = Number(retrieveEnvVariable('MIN_POOL_SIZE', logger));

export const LEADER_CHECK = retrieveEnvVariable('LEADER_CHECK', logger) === 'true';