import { CommitmentLevel, SubscribeRequest } from "@triton-one/yellowstone-grpc";
import { logger } from '../utils/logger';
import { sleep } from "../utils/sleep";
import { KeywordListCache } from '../cache/keyword-list.cache';

import { 
    RPC_ENDPOINT, 
    NOT_FREEZABLE, 
    NOT_MINTABLE, 
    LP_BURNED, 
    COMMITMENT_LEVEL, 
    METADATA_IS_NOT_MUTABLE, 
    HAS_SOCIALS,
    IS_PUMPFUN,
    USE_KEYWORD_LIST,
    CHECK_UPDATEAUTHORITY_BLACKLIST,
    AUTO_BLACKLIST_FREEZABLE_TOKENS,
    USE_SNIPE_LIST,
    CHECK_KEYWORD_BLACKLIST,
    MIN_POOL_SIZE
} from "../constants";
import Client from "@triton-one/yellowstone-grpc";
import { MARKET_STATE_LAYOUT_V3, LIQUIDITY_STATE_LAYOUT_V4, MarketStateLayoutV3, LiquidityStateLayoutV4, array } from "@raydium-io/raydium-sdk";

import { getPdaMetadataKey } from "@raydium-io/raydium-sdk";
import { MetadataDelegateRole, getMetadataAccountDataSerializer, transferOutOfEscrow } from '@metaplex-foundation/mpl-token-metadata';
//import { MetadataAccountData, MetadataAccountDataArgs } from '@metaplex-foundation/mpl-token-metadata';
//import { Serializer } from '@metaplex-foundation/umi/serializers';

import { PublicKey, Connection } from "@solana/web3.js";
import { BufferRingBuffer } from "../buffer/buffer";
import { SmallBufferRing } from "../buffer/map-ring";
import { getMint, TokenInvalidAccountOwnerError } from '@solana/spl-token';
import { BlacklistCache } from "../cache/blacklist.cache";
import { appendToFile } from "../utils/file";
import { SnipeListCache } from "../cache/snipe-list.cache";
import { KeywordBlacklistCache } from "../cache/keyword-blacklist.cache";
import { ArrayRing } from "../buffer/array-ring";


const keywordListCache = new KeywordListCache();
if (USE_KEYWORD_LIST) {
    keywordListCache.init();
}

const keywordBlacklistCache = new KeywordBlacklistCache();
if (CHECK_KEYWORD_BLACKLIST) {
    keywordBlacklistCache.init();
}

const snipeListCache = new SnipeListCache();
if (USE_SNIPE_LIST) {
    snipeListCache.init();
}

export const blacklistCache = new BlacklistCache();
if (CHECK_UPDATEAUTHORITY_BLACKLIST || AUTO_BLACKLIST_FREEZABLE_TOKENS){
    blacklistCache.init();
}
export const tokenUpdateAuthorityMap: Map<string, string> = new Map(); //<token mint, ua>

const client = new Client("http://grpc.solanavibestation.com:10000", undefined, undefined);

const connection = new Connection(RPC_ENDPOINT);

export const mapRingFilter = new SmallBufferRing(2000);

export const bufferFilterCheckedAlready = new BufferRingBuffer(2000);
let filterRateLimitReached = false;
const filterRateLimitSleep = 100;
async function filterMintAddress(quoteVault: PublicKey , tokenMint: string, tokenAccount: PublicKey, connection: Connection): Promise<boolean> {
    let filteringOn = false;

    const tokenMint_PK = new PublicKey(tokenMint)

    //Check if it was checked already and returned no filter match
    if (Buffer.isBuffer(bufferFilterCheckedAlready.findPattern(tokenMint_PK))) {
        
        return false;
    }

    if (filterRateLimitReached) {

        logger.warn(`Sleeping ${filterRateLimitSleep}ms`);
        sleep(filterRateLimitSleep);
    }
    filterRateLimitReached = false;

    try {
        //Any filter on
        if (NOT_FREEZABLE || 
            NOT_MINTABLE || 
            LP_BURNED || 
            HAS_SOCIALS || 
            METADATA_IS_NOT_MUTABLE || 
            IS_PUMPFUN ||
            USE_KEYWORD_LIST ||
            CHECK_UPDATEAUTHORITY_BLACKLIST ||
            CHECK_KEYWORD_BLACKLIST ||
            MIN_POOL_SIZE > 0) {

            filteringOn = true;
            //Freeze or mint filter on
            const checkResult = await checkFreezeAndMint(NOT_FREEZABLE, NOT_MINTABLE, tokenMint_PK)

            if (!checkResult) {
                return false;
            } else {
                const checkResult = await metadataFilters(tokenMint_PK)

                if (!checkResult) {
                    return false;
                } else {
                    //LP burned filter on
                    if (LP_BURNED) {/*
                        logger.info('LP Burned Filter On');
                        const info = await connection.getAccountInfo(tokenAccount);
                        if (info) {
                            logger.info(info);
                            const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(info.data);
                            logger.info(`Base Mint: ${poolState.baseMint}`);
                            logger.info(`poolState: ${poolState}`);
                            const amount = await connection.getTokenSupply(poolState.lpMint, COMMITMENT_LEVEL);
                            logger.info(`Token Account: ${tokenAccount}`);
                            const burned = amount.value.uiAmount === 0;
                            logger.info(`Burned Flag: ${burned}`);
                            if (burned) {
                                filterMatchResult = true;
                            } else {
                                return false;
                            }
                        }
                    */}

                    //Is pumpfun
                    if (IS_PUMPFUN) {
                        //const pumpFunProgram_ID = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'
                        //const pumpFunProgram_PK = PublicKey(pumpFunProgramId)
                        //const accountInfo = await connection.getAccountInfo(pumpFunProgram_PK, COMMITMENT_LEVEL);
                        if (tokenMint.search('pump') == 39) {
                            return true;
                        } else {
                            return false;
                        }
                    }

                    if (USE_SNIPE_LIST && !snipeListCache?.isInList(tokenMint)) {
                        return false;
                    }

                    if (MIN_POOL_SIZE > 0) {
                        const solDecimals = 9;
                        
                        const balance = await connection.getTokenAccountBalance(quoteVault);
                        const quoteVaultBalance = parseFloat(balance.value.amount) / Math.pow(10, solDecimals)
                        console.log(`${tokenMint}`)
                        console.log(`${JSON.stringify(balance)}`)

                        if (quoteVaultBalance <= MIN_POOL_SIZE) {

                        }
                    }

                    return true;
                }

            }


            

        } else {

            return true; //no filter on, return true for no filtering
        }

    } catch (error: any) {
        if (error instanceof TokenInvalidAccountOwnerError) {
            console.error(`TokenInvalidAccountOwnerError: The account ${tokenMint} is not owned by the expected token program.`);
        } else {

            if (error.message.includes('503')) {
                filterRateLimitReached = true;
            }

            const errorMessage = error.message || "Unknown error occurred";
            console.error(`Error fetching info for ${tokenMint} | Error: ${errorMessage}`); //, error);
        }

        if (filteringOn) {
            return false; //error occurred, assume no matching filter
        } else {
            return true; //no filters on, shouldn't error but true for no filtering
        }
        
    }

}

export async function streamOpenbookFiltered(): Promise<void> {
    const stream = await client.subscribe();
    // Collecting all incoming events.
    stream.on("data", async (data) => {
        if (data.account != undefined) {
            const poolState = MARKET_STATE_LAYOUT_V3.decode(data.account.account.data);
            const tokenAccount = new PublicKey(data.account.account.pubkey);
            const baseMintString = poolState.baseMint.toString();

            const marketDetailsDecoded = {
                bids: poolState.bids,
                asks: poolState.asks,
                eventQueue: poolState.eventQueue,
            };

            const filterMatchResult = await filterMintAddress(poolState.quoteVault, poolState.baseMint.toString(), tokenAccount, connection);

            if (filterMatchResult) {
                mapRingFilter.add(baseMintString,marketDetailsDecoded);

            } else {
                bufferFilterCheckedAlready.enqueue(data.account.account.data); //to reduce RPC calls for multiple rows of the same token mint in the openbook stream
            }
        }
    });

    // Create a subscription request.
    const request: SubscribeRequest = {
        "slots": {},
        "accounts": {
          "raydium": {
            "account": [],
            "filters": [
              {
                "memcmp": {
                  "offset": MARKET_STATE_LAYOUT_V3.offsetOf('quoteMint').toString(),
                  "base58": "So11111111111111111111111111111111111111112"
                }
              }
            ],
            "owner": ["srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX"] //Openbook program ID
          }
        },
        "transactions": {},
        "blocks": {},
        "blocksMeta": {},
        "accountsDataSlice": [],
        "commitment": CommitmentLevel.PROCESSED,
        entry: {}
      }

    // Sending a subscription request.
    await new Promise<void>((resolve, reject) => {
        stream.write(request, (err: null | undefined) => {
            if (err === null || err === undefined) {
                resolve();
            } else {
                reject(err);
            }
        });
    }).catch((reason) => {
        console.error(reason);
        throw reason;
    });
}

async function getUpdateAuthority(tokenMint_PK: PublicKey): Promise<string> {

    const metadataPDA = getPdaMetadataKey(tokenMint_PK);
    const metadataAccount = await connection.getAccountInfo(metadataPDA.publicKey, COMMITMENT_LEVEL);
    if (!metadataAccount?.data) {
        return '';
    }
    const metadataSerializer = getMetadataAccountDataSerializer()
    const deserialize = metadataSerializer.deserialize(metadataAccount.data);
    const tokenUpdateAuthority = deserialize[0].updateAuthority;

    return tokenUpdateAuthority;
}

async function checkFreezeAndMint(checkFreeze: boolean, checkMint: boolean, tokenMint_PK: PublicKey): Promise<boolean> {    
    try {
        const mintInfo = await getMint(connection, tokenMint_PK);

        const isMintable = mintInfo.mintAuthority !== null;
        const isFreezable = mintInfo.freezeAuthority !== null;
    
        const checkResult = await checkFreezeAndAddToBlacklist(isFreezable,checkFreeze, tokenMint_PK);
            
        if (!checkResult) {
            return false;
        } else {
            if (checkMint) {
                if (isMintable) {
                    return false;
                } else {
                    return true;
                }
            } else {
                return true;
            }
        }

    } catch (error: any) {
        return false;
    }


}

async function checkFreezeAndAddToBlacklist(isFreezable: boolean, checkFreeze: boolean, tokenMint_PK: PublicKey): Promise<boolean> {
    if (checkFreeze) {
        if (isFreezable) {
            
            if (AUTO_BLACKLIST_FREEZABLE_TOKENS) {

                const tokenUpdateAuthority = await getUpdateAuthority(tokenMint_PK);

                if (tokenUpdateAuthority) {

                    if (!blacklistCache?.isInListBS(tokenUpdateAuthority)) {
                        await appendToFile('./blacklist.txt', tokenUpdateAuthority);
                    }

                }

            }
             
            return false;

        } else if (!isFreezable) {
            return true;
        } else {
            return !isFreezable;
        }
    } else {
        return true;
    }
}

async function metadataFilters(tokenMint_PK: PublicKey): Promise<boolean> {
    
    //Socials or metadata filter on
    if (HAS_SOCIALS || METADATA_IS_NOT_MUTABLE || USE_KEYWORD_LIST || CHECK_UPDATEAUTHORITY_BLACKLIST || CHECK_KEYWORD_BLACKLIST) {
        const metadataPDA = getPdaMetadataKey(tokenMint_PK);
        const metadataAccount = await connection.getAccountInfo(metadataPDA.publicKey, COMMITMENT_LEVEL);
        if (!metadataAccount?.data) {
            return false;
        }
        const metadataSerializer = getMetadataAccountDataSerializer()
        const deserialize = metadataSerializer.deserialize(metadataAccount.data);
        

        const checkResult = await checkUpdateAuthorityBlacklist(CHECK_UPDATEAUTHORITY_BLACKLIST,deserialize[0].updateAuthority,tokenMint_PK.toString())
        
        if (!checkResult) {
            return false;
        } else {


            if (CHECK_KEYWORD_BLACKLIST || USE_KEYWORD_LIST) {
                const tokenName = deserialize[0].name;
                const tokenNameLC = tokenName.toLowerCase();
                const tokenNameWords = tokenNameLC.split(' ');

                if (USE_KEYWORD_LIST) {

                    let keywordMatchResult = false;
                    for (var word of tokenNameWords) {
                        if (keywordListCache?.isInList(word)) {
                            keywordMatchResult = true;
                        }
                    }
                    if (!keywordMatchResult) {
                        return false;
                    }
                    
                } 
    
                if (CHECK_KEYWORD_BLACKLIST) {
    
                    if (keywordBlacklistCache?.isInList(tokenNameLC)) {
                        return false;
                    } else {
                        for (var word of tokenNameWords){
                            if (keywordBlacklistCache?.isInList(word)){
                                return false;
                            }
                        }
                        for (var keyword of keywordBlacklistCache.keywordBlacklist) {
                            if (tokenNameLC.includes(keyword)) {
                                return false;
                            }
                        }
                    }
    
                }
            }
            
            if (METADATA_IS_NOT_MUTABLE) {
                const isMutable = deserialize[0].isMutable;
                if (isMutable) {
                    return false;
                }
            }
            
            if (HAS_SOCIALS) {/*
                const socialsResponse = await fetch(deserialize[0].uri);
                const socialsResponseData = await socialsResponse.json();
                const hasSocials = Object.values(socialsResponseData?.extensions ?? {}).some((value: any) => value !== null && value.length > 0);

                if (hasSocials) {
                    filterMatchResult = true;
                } else {
                    return false;
                }
            */}

            return true;
        }
            
    } else {
        return true;
    }

}

async function checkUpdateAuthorityBlacklist(checkBlacklist: boolean, updateAuthority: string, tokenMint: string): Promise<boolean> {

    if (CHECK_UPDATEAUTHORITY_BLACKLIST) {
        tokenUpdateAuthorityMap.set(tokenMint,updateAuthority);

        if (blacklistCache?.isInListBS(updateAuthority)) {
            return false;
        } else {
            return true;
        }
    } else {
        return true;
    }
}