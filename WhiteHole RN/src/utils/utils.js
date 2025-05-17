import AsyncStorage from '@react-native-async-storage/async-storage';
import Decimal from 'decimal.js';
import {Contract, getAddress} from 'ethers';
import {DynamicProvider, FallbackStrategy} from 'ethers-dynamic-provider';
import ReactNativeBiometrics from 'react-native-biometrics';
import EncryptedStorage from 'react-native-encrypted-storage';
import Crypto from 'react-native-quick-crypto';
import {encodePacked, keccak256, namehash} from 'viem';
import {base, mainnet} from 'viem/chains';
import {basenamesABI} from '../contracts/basenames';
import {blockchains} from './constants';

export function setupProvider(rpcs) {
  return new DynamicProvider(rpcs, {
    strategy: new FallbackStrategy(),
  });
}

export async function getAsyncStorageValue(label) {
  try {
    const session = await AsyncStorage.getItem('General');
    if (label in JSON.parse(session)) {
      return JSON.parse(session)[label];
    } else {
      return null;
    }
  } catch {
    return null;
  }
}

export async function setAsyncStorageValue(value) {
  const session = await AsyncStorage.getItem('General');
  await AsyncStorage.setItem(
    'General',
    JSON.stringify({
      ...JSON.parse(session),
      ...value,
    }),
  );
}

export async function getEncryptedStorageValue(label) {
  try {
    const session = await EncryptedStorage.getItem('General');
    if (label in JSON.parse(session)) {
      return JSON.parse(session)[label];
    } else {
      return null;
    }
  } catch {
    return null;
  }
}

export async function setEncryptedStorageValue(value) {
  const session = await EncryptedStorage.getItem('General');
  await EncryptedStorage.setItem(
    'General',
    JSON.stringify({
      ...JSON.parse(session),
      ...value,
    }),
  );
}

export function findIndexByProperty(array, property, value) {
  for (let i = 0; i < array.length; i++) {
    if (array[i][property] === value) {
      return i;
    }
  }
  return -1; // If not found
}

export async function eraseStorageFull() {
  // Debug Only
  try {
    await EncryptedStorage.clear();
    await AsyncStorage.clear();
  } catch (error) {
    console.log(error);
  }
}

export function arraySum(array) {
  return array.reduce((accumulator, currentValue) => {
    return accumulator + currentValue;
  }, 0);
}

export function epsilonRound(num, zeros = 4) {
  let temp = num;
  if (typeof num === 'string') {
    temp = parseFloat(num);
  }
  return (
    Math.round((temp + Number.EPSILON) * Math.pow(10, zeros)) /
    Math.pow(10, zeros)
  );
}

export function formatDate(date) {
  // Array of month names
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  // Get the day, month, and year from the date object
  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();

  // Format the date in the desired format
  const formattedDate = `${monthNames[monthIndex]} / ${
    day < 10 ? '0' : ''
  }${day} / ${year}`;

  return formattedDate;
}

export function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function deleteLeadingZeros(string) {
  let number = parseFloat(string);
  let formattedString = number.toFixed(2).toString();
  return formattedString;
}

function isNumber(string) {
  return !isNaN(parseFloat(string)) && isFinite(string);
}

export function formatInputText(inputText) {
  if (
    inputText === '0.00' ||
    inputText === '0' ||
    inputText === '00' ||
    inputText === '.' ||
    inputText === ''
  ) {
    return '0.00';
  } else if (isNumber(inputText) && !inputText.includes('.')) {
    return inputText + '.00';
  } else {
    let zeroAttached = '';
    if (inputText.includes('.')) {
      if (inputText.split('.')[0].length === 0) {
        zeroAttached = '0';
      }
      if (inputText.split('.')[1].length > 2) {
        return (
          zeroAttached +
          inputText.split('.')[0] +
          '.' +
          inputText.split('.')[1].substring(0, 2)
        );
      } else if (inputText.split('.')[1].length === 2) {
        return zeroAttached + inputText;
      } else if (inputText.split('.')[1].length === 1) {
        return zeroAttached + inputText + '0';
      } else {
        return zeroAttached + inputText + '00';
      }
    } else {
      return zeroAttached + inputText + '.00';
    }
  }
}

export async function checkBiometrics() {
  const biometrics = new ReactNativeBiometrics();
  return new Promise(async resolve => {
    biometrics
      .simplePrompt({promptMessage: 'Confirm fingerprint'})
      .then(async resultObject => {
        const {success} = resultObject;
        if (success) {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch(async () => {
        resolve(false);
      });
  });
}

export function showSixDigits(num) {
  if (typeof num === 'number') {
    // Convert number to string
    let numString = num.toString();

    // Extract first 6 digits
    let result = numString.substring(0, 6);

    // Return result
    return result;
  } else {
    return 'Input is not a number.';
  }
}

export function balancedSaving(number, usd) {
  // this function can be improved
  const balance = number * usd;
  let amount = 0;
  if (balance <= 1) {
    amount = 1;
  } else if (balance > 1 && balance <= 10) {
    amount = Math.ceil(balance);
  } else if (balance > 10 && balance <= 100) {
    const intBalance = parseInt(balance, 10);
    const value = parseInt(Math.round(intBalance).toString().slice(-2), 10);
    let unit = parseInt(Math.round(intBalance).toString().slice(-1), 10);
    let decimal = parseInt(Math.round(intBalance).toString().slice(-2, -1), 10);
    if (unit < 5) {
      unit = '5';
      decimal = decimal.toString();
    } else {
      unit = '0';
      decimal = (decimal + 1).toString();
    }
    amount = intBalance - value + parseInt(decimal + unit, 10);
  } else if (balance > 100) {
    const intBalance = parseInt(Math.floor(balance / 10), 10);
    amount = (intBalance + 1) * 10;
  }
  return new Decimal(amount).sub(new Decimal(balance)).div(usd).toNumber();
}

export function balancedSavingToken(number, usd1, usd2) {
  // this function can be improved
  const balance = number * usd1;
  let amount = 0;
  if (balance <= 1) {
    amount = 1;
  } else if (balance > 1 && balance <= 10) {
    amount = Math.ceil(balance);
  } else if (balance > 10 && balance <= 100) {
    const intBalance = parseInt(balance, 10);
    const value = parseInt(Math.round(intBalance).toString().slice(-2), 10);
    let unit = parseInt(Math.round(intBalance).toString().slice(-1), 10);
    let decimal = parseInt(Math.round(intBalance).toString().slice(-2, -1), 10);
    if (unit < 5) {
      unit = '5';
      decimal = decimal.toString();
    } else {
      unit = '0';
      decimal = (decimal + 1).toString();
    }
    amount = intBalance - value + parseInt(decimal + unit, 10);
  } else if (balance > 100) {
    const intBalance = parseInt(Math.floor(balance / 10), 10);
    amount = (intBalance + 1) * 10;
  }
  return new Decimal(amount).sub(new Decimal(balance)).div(usd2).toNumber();
}
export function percentageSaving(number, percentage) {
  return number * (percentage / 100);
}

export function percentageSavingToken(number, percentage, usd1, usd2) {
  return number * (percentage / 100) * (usd1 / usd2);
}

export function verifyWallet(hexString) {
  try {
    const publicKey = hexString;
    return publicKey.length === 42;
  } catch (e) {
    return false;
  }
}

export function parseToInt(string, decimals) {
  return parseInt(parseFloat(string) * Math.pow(10, decimals));
}

export function setTokens(array) {
  return array.map((item, index) => {
    return {
      ...item,
      index,
      value: index.toString(),
      label: item.symbol,
      key: item.symbol,
    };
  });
}

export function setChains(array) {
  return array.map((item, index) => {
    return {
      ...item,
      color: 'white',
      index,
      value: index.toString(),
      label: item.network,
      key: item.iconSymbol,
    };
  });
}

export function decrypt(encryptedText, _secret, myIV) {
  const secret = getAddress(_secret);
  const iv = Buffer.from(myIV, 'base64'); // Convert IV back to a buffer

  // Create the key from the secret
  const key = Crypto.createHash('sha256').update(secret).digest();

  // Create the decipher object
  const decipher = Crypto.createDecipheriv('aes-256-cbc', key, iv);

  // Decrypt the ciphertext
  let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export function encrypt(plaintext, _secret, myIV = null) {
  const secret = getAddress(_secret);
  // Create a key from the secret using SHA-256 (32 bytes for AES-256)
  const key = Crypto.createHash('sha256').update(secret).digest();

  // Generate a random 16-byte IV
  const iv =
    myIV === null ? Crypto.randomBytes(16) : Buffer.from(myIV, 'base64');

  // Create the cipher object
  const cipher = Crypto.createCipheriv('aes-256-cbc', key, iv);

  // Encrypt the plaintext
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  // Return IV + encrypted text, separated by ':'
  return [iv.toString('base64'), encrypted];
}

export function removeDuplicatesByKey(arr, key) {
  const seen = new Set();

  return arr
    .slice()
    .reverse() // Reverse the array
    .filter(item => {
      if (seen.has(item[key])) {
        return false; // Skip if the value has already been seen
      }
      seen.add(item[key]);
      return true; // Keep the item if it's the first time the value is encountered
    })
    .reverse(); // Reverse it back to original order
}

// Base

export const convertChainIdToCoinType = chainId => {
  // L1 resolvers to addr
  if (chainId === mainnet.id) {
    return 'addr';
  }
  const cointype = (0x80000000 | chainId) >>> 0;
  return cointype.toString(16).toLocaleUpperCase();
};

export const convertReverseNodeToBytes = (address, chainId) => {
  const addressFormatted = address.toLocaleLowerCase();
  const addressNode = keccak256(addressFormatted.substring(2));
  const chainCoinType = convertChainIdToCoinType(chainId);
  const baseReverseNode = namehash(
    `${chainCoinType.toLocaleUpperCase()}.reverse`,
  );
  const addressReverseNode = keccak256(
    encodePacked(['bytes32', 'bytes32'], [baseReverseNode, addressNode]),
  );
  return addressReverseNode;
};

export async function getBasename(address) {
  const provider = setupProvider(blockchains[0].rpc);
  const contract = new Contract(
    '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD',
    basenamesABI,
    provider,
  );
  const addressReverseNode = convertReverseNodeToBytes(address, base.id);
  const name = await contract.name(addressReverseNode);
  return name === '' ? address : name;
}

export function isValidUUID(uuid) {
  const regex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
  return regex.test(uuid);
}