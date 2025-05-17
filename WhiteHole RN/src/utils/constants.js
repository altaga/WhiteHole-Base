import {Image} from 'react-native';
// Blockchain
import ARB from '../assets/logos/arb.png';
import AVAX from '../assets/logos/avax.png';
import BASE from '../assets/logos/base.png';
import ETH from '../assets/logos/eth.png';
import EURC from '../assets/logos/eurc.png';
import POL from '../assets/logos/matic.png';
import OP from '../assets/logos/op.png';
import USDC from '../assets/logos/usdc.png';
import USDT from '../assets/logos/usdt.png';
import WETH from '../assets/logos/weth.png';

const w = 50;
const h = 50;

export const refreshTime = 1000 * 60 * 2.5;

export const USDCicon = (
  <Image source={USDC} style={{width: 30, height: 30, borderRadius: 10}} />
);

export const iconsBlockchain = {
  eth: <Image source={ETH} style={{width: w, height: h, borderRadius: 10}} />,
  arb: <Image source={ARB} style={{width: w, height: h, borderRadius: 10}} />,
  pol: <Image source={POL} style={{width: w, height: h, borderRadius: 10}} />,
  avax: <Image source={AVAX} style={{width: w, height: h, borderRadius: 10}} />,
  op: <Image source={OP} style={{width: w, height: h, borderRadius: 10}} />,
  base: <Image source={BASE} style={{width: w, height: h, borderRadius: 10}} />,
  usdc: <Image source={USDC} style={{width: w, height: h, borderRadius: 10}} />,
  eurc: <Image source={EURC} style={{width: w, height: h, borderRadius: 10}} />,
  usdt: <Image source={USDT} style={{width: w, height: h, borderRadius: 10}} />,
  weth: <Image source={WETH} style={{width: w, height: h, borderRadius: 10}} />,
};

export const blockchains = [
  {
    network: 'Base',
    apiname: 'base',
    token: 'ETH',
    chainId: 8453,
    blockExplorer: 'https://basescan.org/',
    rpc: ['https://base-rpc.publicnode.com', "https://base.llamarpc.com","https://base.drpc.org"],
    iconSymbol: 'eth',
    decimals: 18,
    wormholeChainId: 30,
    batchBalancesAddress: '0x31C0e6E622116EE00e8d6DbBf845759BE17e6D93',
    wormholeRelayer: '0x706f82e9bb5b0813501714ab5974216704980e31',
    circleRelayer: '0x4cb69FaE7e7Af841e44E1A1c30Af640739378bb2',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    crossChainChat: '0xfd936715112059dB054d32de741cd5e63f11e6c6',
    color: '#0052ff',
    tokens: [
      {
        name: 'Ethereum (BASE)',
        symbol: 'ETH',
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
        icon: iconsBlockchain.base,
        coingecko: 'ethereum',
      },
      {
        name: 'USDC (BASE)',
        symbol: 'USDC',
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        decimals: 6,
        icon: iconsBlockchain.usdc,
        coingecko: 'usd-coin',
      },
      {
        name: 'EURC (BASE)',
        symbol: 'EURC',
        address: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
        decimals: 6,
        icon: iconsBlockchain.eurc,
        coingecko: 'euro-coin',
      },
      {
        name: 'Wrapped ETH (BASE)',
        symbol: 'WETH',
        address: '0x4200000000000000000000000000000000000006',
        decimals: 18,
        icon: iconsBlockchain.weth,
        coingecko: 'weth',
      },
    ],
  },
  {
    network: 'Ethereum',
    apiname: 'eth',
    token: 'ETH',
    chainId: 1,
    blockExplorer: 'https://etherscan.io/',
    rpc: ['https://ethereum-rpc.publicnode.com', "https://eth.llamarpc.com", "https://eth-pokt.nodies.app", "https://eth.drpc.org"],
    iconSymbol: 'eth',
    decimals: 18,
    wormholeChainId: 2,
    batchBalancesAddress: '0x0d29EBC0d84AF212762081e6c3f5993180f7C7cF',
    wormholeRelayer: '0x27428DD2d3DD32A4D7f7C497eAaa23130d894911',
    circleRelayer: '0x4cb69FaE7e7Af841e44E1A1c30Af640739378bb2',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    crossChainChat: '0xfd936715112059dB054d32de741cd5e63f11e6c6',
    color: '#627EEA',
    tokens: [
      {
        name: 'Ethereum',
        symbol: 'ETH',
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
        icon: iconsBlockchain.eth,
        coingecko: 'ethereum',
      },
      {
        name: 'USDC',
        symbol: 'USDC',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        decimals: 6,
        icon: iconsBlockchain.usdc,
        coingecko: 'usd-coin',
      },
      {
        name: 'EURC',
        symbol: 'EURC',
        address: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c',
        decimals: 6,
        icon: iconsBlockchain.eurc,
        coingecko: 'euro-coin',
      },
      {
        name: 'Tether USD',
        symbol: 'USDT',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        decimals: 6,
        icon: iconsBlockchain.usdt,
        coingecko: 'tether',
      },
      {
        name: 'Wrapped ETH',
        symbol: 'WETH',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        decimals: 18,
        icon: iconsBlockchain.weth,
        coingecko: 'weth',
      },
    ],
  },
  {
    network: 'Arbitrum',
    apiname: 'arb',
    token: 'ETH',
    chainId: 42161,
    blockExplorer: 'https://arbiscan.io/',
    rpc: ['https://arbitrum-one-rpc.publicnode.com', "https://arb-pokt.nodies.app", "https://arbitrum.drpc.org"],
    iconSymbol: 'eth',
    decimals: 18,
    wormholeChainId: 23,
    batchBalancesAddress: '0xd9842bc03662E5d8cAafF9aA91fAF4e43cab816C',
    wormholeRelayer: '0x27428DD2d3DD32A4D7f7C497eAaa23130d894911',
    circleRelayer: '0x4cb69FaE7e7Af841e44E1A1c30Af640739378bb2',
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    crossChainChat: '0xfd936715112059dB054d32de741cd5e63f11e6c6',
    color: '#28A0F0',
    tokens: [
      {
        name: 'Ethereum (ARB)',
        symbol: 'ETH',
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
        icon: iconsBlockchain.arb,
        coingecko: 'ethereum',
      },
      {
        name: 'USDC (ARB)',
        symbol: 'USDC',
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        decimals: 6,
        icon: iconsBlockchain.usdc,
        coingecko: 'usd-coin',
      },
      {
        name: 'Tether (ARB)',
        symbol: 'USDT',
        address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        decimals: 6,
        icon: iconsBlockchain.usdt,
        coingecko: 'tether',
      },
      {
        name: 'Wrapped ETH (ARB)',
        symbol: 'WETH',
        address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        decimals: 18,
        icon: iconsBlockchain.weth,
        coingecko: 'weth',
      },
    ],
  },
  {
    network: 'Avalanche',
    apiname: 'avax',
    token: 'AVAX',
    chainId: 43114,
    blockExplorer: 'https://snowtrace.io/',
    rpc: ['https://avalanche.drpc.org', "https://avax-pokt.nodies.app/", "https://avalanche.drpc.org"],
    iconSymbol: 'avax',
    decimals: 18,
    wormholeChainId: 6,
    batchBalancesAddress: '0xc83bc103229484f40588b5CDE47CbA2A4c312033',
    wormholeRelayer: '0x27428DD2d3DD32A4D7f7C497eAaa23130d894911',
    circleRelayer: '0x4cb69FaE7e7Af841e44E1A1c30Af640739378bb2',
    USDC: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    crossChainChat: '0xfd936715112059dB054d32de741cd5e63f11e6c6',
    color: '#E84142',
    tokens: [
      {
        name: 'Avalanche',
        symbol: 'AVAX',
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
        icon: iconsBlockchain.avax,
        coingecko: 'avalanche-2',
      },
      {
        name: 'USDC (AVAX)',
        symbol: 'USDC',
        address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
        decimals: 6,
        icon: iconsBlockchain.usdc,
        coingecko: 'usd-coin',
      },
      {
        name: 'EURC (AVAX)',
        symbol: 'EURC',
        address: '0xc891eb4cbdeff6e073e859e987815ed1505c2acd',
        decimals: 6,
        icon: iconsBlockchain.eurc,
        coingecko: 'euro-coin',
      },
      {
        name: 'Tether (AVAX)',
        symbol: 'USDT',
        address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
        decimals: 6,
        icon: iconsBlockchain.usdt,
        coingecko: 'tether',
      },
      {
        name: 'Wrapped ETH (AVAX)',
        symbol: 'WETH',
        address: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
        decimals: 18,
        icon: iconsBlockchain.weth,
        coingecko: 'weth',
      },
    ],
  },
  {
    network: 'Optimism',
    apiname: 'op',
    token: 'ETH',
    chainId: 10,
    blockExplorer: 'https://optimistic.etherscan.io/',
    rpc: ['https://optimism-rpc.publicnode.com', "https://op-pokt.nodies.app", "https://optimism.drpc.org"],
    iconSymbol: 'eth',
    decimals: 18,
    wormholeChainId: 24,
    batchBalancesAddress: '0x966e5C8b979fBec883968495c029f65375cA9301',
    wormholeRelayer: '0x27428DD2d3DD32A4D7f7C497eAaa23130d894911',
    circleRelayer: '0x4cb69FaE7e7Af841e44E1A1c30Af640739378bb2',
    USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    crossChainChat: '0xfd936715112059dB054d32de741cd5e63f11e6c6',
    color: '#ff273f',
    tokens: [
      {
        name: 'Ethereum (OP)',
        symbol: 'ETH',
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
        icon: iconsBlockchain.op,
        coingecko: 'ethereum',
      },
      {
        name: 'USDC (OP)',
        symbol: 'USDC',
        address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        decimals: 6,
        icon: iconsBlockchain.usdc,
        coingecko: 'usd-coin',
      },
      {
        name: 'Tether (OP)',
        symbol: 'USDT',
        address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
        decimals: 6,
        icon: iconsBlockchain.usdt,
        coingecko: 'tether',
      },
      {
        name: 'Wrapped ETH (OP)',
        symbol: 'WETH',
        address: '0x4200000000000000000000000000000000000006',
        decimals: 18,
        icon: iconsBlockchain.weth,
        coingecko: 'weth',
      },
    ],
  },
  {
    network: 'Polygon',
    apiname: 'pol',
    token: 'POL',
    chainId: 137,
    blockExplorer: 'https://polygonscan.com/',
    rpc: ['https://polygon-bor-rpc.publicnode.com', "https://polygon-pokt.nodies.app", "https://polygon.drpc.org"],
    iconSymbol: 'pol',
    decimals: 18,
    wormholeChainId: 5,
    batchBalancesAddress: '0xc83bc103229484f40588b5CDE47CbA2A4c312033',
    wormholeRelayer: '0x27428DD2d3DD32A4D7f7C497eAaa23130d894911',
    circleRelayer: '0x4cb69FaE7e7Af841e44E1A1c30Af640739378bb2',
    USDC: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
    crossChainChat: '0xfd936715112059dB054d32de741cd5e63f11e6c6',
    color: '#8247E5',
    tokens: [
      {
        name: 'Polygon',
        symbol: 'POL',
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
        icon: iconsBlockchain.pol,
        coingecko: 'matic-network',
      },
      {
        name: 'USDC (POL)',
        symbol: 'USDC',
        address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
        decimals: 6,
        icon: iconsBlockchain.usdc,
        coingecko: 'usd-coin',
      },
      {
        name: 'Tether (POL)',
        symbol: 'USDT',
        address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        decimals: 6,
        icon: iconsBlockchain.usdt,
        coingecko: 'tether',
      },
      {
        name: 'Wrapped ETH (POL)',
        symbol: 'WETH',
        address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        decimals: 18,
        icon: iconsBlockchain.weth,
        coingecko: 'weth',
      },
    ],
  },
];

export const chains = blockchains.filter((_, index) => index !== 1); // Remove Ethereum, high fees

export const baseWallets = Object.fromEntries(
  blockchains.map(x => [x.apiname, {id: '', address: ''}]),
);

// Cloud Account Credentials
export const CloudAccountController =
  '0x72b9EB24BFf9897faD10B3100D35CEE8eDF8E43b';
export const CloudPublicKeyEncryption = `
-----BEGIN RSA PUBLIC KEY-----
MIIBCgKCAQEAtflt9yF4G1bPqTHtOch47UW9hkSi4u2EZDHYLLSKhGMwvHjajTM+
wcgxV8dlaTh1av/2dWb1EE3UMK0KF3CB3TZ4t/p+aQGhyfsGtBbXZuwZAd8CotTn
BLRckt6s3jPqDNR3XR9KbfXzFObNafXYzP9vCGQPdJQzuTSdx5mWcPpK147QfQbR
K0gmiDABYJMMUos8qaiKVQmSAwyg6Lce8x+mWvFAZD0PvaTNwYqcY6maIztT6h/W
mfQHzt9Z0nwQ7gv31KCw0Tlh7n7rMnDbr70+QVd8e3qMEgDYnx7Jm4BzHjr56IvC
g5atj1oLBlgH6N/9aUIlP5gkw89O3hYJ0QIDAQAB
-----END RSA PUBLIC KEY-----
`;
