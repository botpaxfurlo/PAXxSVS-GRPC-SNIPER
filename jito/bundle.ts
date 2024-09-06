import bs58 from 'bs58';

import { logger } from '../utils/logger';

import { newTokenTimestampPerf } from '../streaming/raydium';

import {
  PRIVATE_KEY,
  BLOCK_ENGINE_URL,
  JITO_TIP
} from '../constants';

import {
  PublicKey, 
  Keypair, 
  VersionedTransaction, 
  MessageV0
} from '@solana/web3.js';

import { Bundle } from 'jito-ts/dist/sdk/block-engine/types';
import { searcherClient } from 'jito-ts/dist/sdk/block-engine/searcher';

const SIGNER_WALLET = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));

const blockEngineUrl = BLOCK_ENGINE_URL || '';
console.log('BLOCK_ENGINE_URL:', blockEngineUrl);
const c = searcherClient(blockEngineUrl, undefined);

// Get Tip Accounts
let tipAccounts: string[] = [];
(async () => {
  try {
    tipAccounts = await c.getTipAccounts();
    console.log('Result:', tipAccounts);
  } catch (error) {
    console.error('Error:', error);
  }
})();

export async function sendBundle(latestBlockhash: string, message: MessageV0, mint: PublicKey) {

  try {

    const transaction = new VersionedTransaction(message);

    transaction.sign([SIGNER_WALLET]);


    const _tipAccount = tipAccounts[Math.floor(Math.random() * 6)];
    const tipAccount = new PublicKey(_tipAccount);
    const tipAmount: number = Number(JITO_TIP);


    const b = new Bundle([transaction], 2);
    b.addTipTx(
        SIGNER_WALLET,
        tipAmount,      // Adjust Jito tip amount here
        tipAccount,
        latestBlockhash
    );

    
    const bundleResult = await c.sendBundle(b);

    const bundleTimestampPerf = performance.now()
    const bundleTimestampDate = new Date();
    const bundleTimeFormatted = `${bundleTimestampDate.getHours().toString().padStart(2, '0')}:${bundleTimestampDate.getMinutes().toString().padStart(2, '0')}:${bundleTimestampDate.getSeconds().toString().padStart(2, '0')}.${bundleTimestampDate.getMilliseconds().toString().padStart(3, '0')}`;
    const elapsedStreamToBundlePerf = bundleTimestampPerf - newTokenTimestampPerf;
    
    logger.warn(`Time Elapsed (Streamed > Bundle send): ${elapsedStreamToBundlePerf}ms`);
    logger.info(`Time bundle sent: ${bundleTimeFormatted} | bundleResult = ${bundleResult}`);
    logger.info(`https://dexscreener.com/solana/${mint}?maker=${SIGNER_WALLET.publicKey}`);



  } catch (error) {
    logger.error(error);
  }  

}

export async function getJitoLeaderSchedule() {

  const leaderSchedule = new Set<number>();
  const cs = searcherClient(blockEngineUrl);

  let response: any;
  try {
    response = await cs.getConnectedLeaders();
  } catch (error) {
    console.error('Error:', error);
  }

  for (let key in response) {

    let validator = response[key];

    for (let slot in validator.slots) {

      leaderSchedule.add(validator.slots[slot] as number);
    }
  }

  return leaderSchedule;
}