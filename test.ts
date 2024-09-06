import { streamNewTokens } from './streaming/raydium';
import { streamOpenbookFiltered } from './streaming/openbook-filtered'
//import { streamOpenbook } from './streaming/openbook';

import { performance } from "perf_hooks"; 

import { init } from './transaction/transaction';

export const runTimestamp = Math.floor(new Date().getTime() / 1000);

/*
const blockEngineUrl = process.env.BLOCK_ENGINE_URL || '';
console.log('BLOCK_ENGINE_URL:', blockEngineUrl);

const authKeypairPath = process.env.AUTH_KEYPAIR_PATH || '';
console.log('AUTH_KEYPAIR_PATH:', authKeypairPath);
const decodedKey = new Uint8Array(
  JSON.parse(Fs.readFileSync(authKeypairPath).toString()) as number[]
);
const keypair = Keypair.fromSecretKey(decodedKey);
*/

async function start() {

  await init();

  streamNewTokens();
  streamOpenbookFiltered();

}

/*
const searcherClient = (
  url: string,
  authKeypair: Keypair,
  grpcOptions?: Partial<ChannelOptions>
): SearcherServiceClient => {
  const authProvider = new AuthProvider(
    new AuthServiceClient(url, ChannelCredentials.createSsl()),
    authKeypair
  );
  const client: SearcherServiceClient = new SearcherServiceClient(
    url,
    ChannelCredentials.createSsl(),
    { interceptors: [authInterceptor(authProvider)], ...grpcOptions }
  );

  return client;
}
*/

start();