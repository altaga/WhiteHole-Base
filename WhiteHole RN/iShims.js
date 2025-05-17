import { ethers } from "ethers";
import crypto from "react-native-quick-crypto";
import 'node-libs-react-native/globals.js';

ethers.randomBytes.register((length) => {
  return new Uint8Array(crypto.randomBytes(length));
});

ethers.computeHmac.register((algo, key, data) => {
    return crypto.createHmac(algo, key).update(data).digest();
});

ethers.pbkdf2.register((passwd, salt, iter, keylen, algo) => {
  return crypto.pbkdf2Sync(passwd, salt, iter, keylen, algo);
});

ethers.sha256.register((data) => {
  return crypto.createHash('sha256').update(data).digest();
});

ethers.sha512.register((data) => {
  return crypto.createHash('sha512').update(data).digest();
});

BigInt.prototype.toJSON = function() { return Number(this).toString() }

console.log('iShims loaded');