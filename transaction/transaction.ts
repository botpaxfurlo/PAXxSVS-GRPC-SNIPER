import { Liquidity, LiquidityPoolKeys, LiquidityStateV4, Token, TokenAmount } from "@raydium-io/raydium-sdk";
import { Commitment, ComputeBudgetProgram, Connection, Keypair, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import { COMMITMENT_LEVEL, LOG_LEVEL, PRIVATE_KEY, QUOTE_AMOUNT, QUOTE_MINT, RPC_ENDPOINT, RPC_WEBSOCKET_ENDPOINT } from "../constants";
import {
    createAssociatedTokenAccountIdempotentInstruction,
    getAssociatedTokenAddressSync,
    TOKEN_PROGRAM_ID,
  } from '@solana/spl-token';

import { sendBundle } from "../jito/bundle";
import { logger } from "../utils/logger";
import { MinimalMarketLayoutV3 } from "../market";
import { createPoolKeys, getTokenAccounts } from "../liquidity";
import { getJitoLeaderSchedule } from "../jito/bundle";

export let leaderSchedule: Set<number>;

let wallet: Keypair;
let quoteToken: Token;
let quoteTokenAssociatedAddress: PublicKey;
let quoteAmount: TokenAmount;

wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
quoteAmount = new TokenAmount(Token.WSOL, QUOTE_AMOUNT, false);



export interface MinimalTokenAccountData {
    mint: PublicKey;
    address: PublicKey;
    poolKeys?: LiquidityPoolKeys;
    market?: MinimalMarketLayoutV3;
  };

const existingTokenAccounts: Map<string, MinimalTokenAccountData> = new Map<string, MinimalTokenAccountData>();

const solanaConnection = new Connection(RPC_ENDPOINT, {
    wsEndpoint: RPC_WEBSOCKET_ENDPOINT,
  });
  
// Init Function
export async function init(): Promise<void> {
    logger.level = LOG_LEVEL;
  
    // get wallet
    wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));
    logger.info(`Wallet Address: ${wallet.publicKey}`);
  
  
    // get quote mint and amount
    switch (QUOTE_MINT) {
      case 'WSOL': {
        quoteToken = Token.WSOL;
        quoteAmount = new TokenAmount(Token.WSOL, QUOTE_AMOUNT, false);
        break;
      }
      case 'USDC': {
        quoteToken = new Token(
          TOKEN_PROGRAM_ID,
          new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
          6,
          'USDC',
          'USDC',
        );
        quoteAmount = new TokenAmount(quoteToken, QUOTE_AMOUNT, false);
        break;
      }
      default: {
        throw new Error(`Unsupported quote mint "${QUOTE_MINT}". Supported values are USDC and WSOL`);
      }
    }
  
    logger.info(
      `Script will buy all new tokens using ${QUOTE_MINT}. Amount that will be used to buy each token is: ${quoteAmount.toFixed().toString()}`,
    );
  
    // check existing wallet for associated token account of quote mint
    const tokenAccounts = await getTokenAccounts(solanaConnection, wallet.publicKey, COMMITMENT_LEVEL);
  
    for (const ta of tokenAccounts) {
      existingTokenAccounts.set(ta.accountInfo.mint.toString(), <MinimalTokenAccountData>{
        mint: ta.accountInfo.mint,
        address: ta.pubkey,
      });
    }
  
    const tokenAccount = tokenAccounts.find((acc) => acc.accountInfo.mint.toString() === quoteToken.mint.toString())!;
  
    if (!tokenAccount) {
      throw new Error(`No ${quoteToken.symbol} token account found in wallet: ${wallet.publicKey}`);
    }
  
    quoteTokenAssociatedAddress = tokenAccount.pubkey;

    leaderSchedule = await getJitoLeaderSchedule();
  
  }

// Create transaction
export async function buy(latestBlockhash: string, newTokenAccount: PublicKey, poolState: LiquidityStateV4, marketDetails: MinimalMarketLayoutV3): Promise<void>  {
    try {
      
      const ata = getAssociatedTokenAddressSync(poolState.baseMint, wallet.publicKey);
      const poolKeys = createPoolKeys(newTokenAccount, poolState, marketDetails!);
      const { innerTransaction } = Liquidity.makeSwapFixedInInstruction(
        {
          poolKeys: poolKeys,
          userKeys: {
            tokenAccountIn: quoteTokenAssociatedAddress,
            tokenAccountOut: ata,
            owner: wallet.publicKey,
          },
          amountIn: quoteAmount.raw,
          minAmountOut: 0,
        },
        poolKeys.version,
      );
  
      
      const messageV0 = new TransactionMessage({
        payerKey: wallet.publicKey,
        recentBlockhash: latestBlockhash,
        instructions: [
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 }), // Set this to super small value since it is not taken into account when sending as bundle.
          ComputeBudgetProgram.setComputeUnitLimit({ units: 80000 }), // Calculated amount of units typically used in our transaction is about 70848. Setting limit slightly above.
          createAssociatedTokenAccountIdempotentInstruction(
            wallet.publicKey,
            ata,
            wallet.publicKey,
            poolState.baseMint,
          ),
          ...innerTransaction.instructions,
        ],
      }).compileToV0Message();
  
  
      //let commitment: Commitment = retrieveEnvVariable('COMMITMENT_LEVEL', logger) as Commitment;

      // const transaction = new VersionedTransaction(messageV0);

      // transaction.sign([wallet, ...innerTransaction.signers]);


      /*const signature = await solanaConnection.sendRawTransaction(transaction.serialize(), {
        preflightCommitment: commitment,
      });
*/
      //logger.info(`Sending bundle transaction with mint - ${signature}`);
      sendBundle(latestBlockhash, messageV0, poolState.baseMint);
    }
    catch (error) {
      logger.error(error);
    }
  
  }
