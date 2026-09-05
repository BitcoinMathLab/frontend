import { P2pkhTraceRequest } from './trace-api.models';

export const CURATED_P2PKH_TXID =
  '40e331b67c0fe7750bb3b1943b378bf702dce86124dc12fa5980f975db7ec930';

export const CURATED_P2PKH_REQUEST: P2pkhTraceRequest = Object.freeze({
  transaction_hex:
    '0100000001a4e61ed60e66af9f7ca4f2eb25234f6e32e0cb8f6099db21a2462c42de61640b010000006b' +
    '483045022100c233c3a8a510e03ad18b0a24694ef00c78101bfd5ac075b8c1037952ce26e91e02205aa5f8f88f29bb' +
    '4ad5808ebc12abfd26bd791256f367b04c6d955f01f28a7724012103f0609c81a45f8cab67fc2d050c21b1acd3d37c' +
    '7acfd54041be6601ab4cef4f31feffffff02f9243751130000001976a9140c443537e6e31f06e6edb2d4bb80f8481e' +
    '2831ac88ac14206c00000000001976a914d807ded709af8893f02cdc30a37994429fa248ca88ac751a0600',
  input_index: 0,
  spent_outputs: [
    {
      amount_sats: 82_974_043_165,
      script_pubkey_hex: '76a91455ae51684c43435da751ac8d2173b2652eb6410588ac',
    },
  ],
});
