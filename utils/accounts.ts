// IMPORTANT: we cannot import hardhat directly here
// because it will cause a circular dependency
import { Account } from "./types";
import * as dotenv from "dotenv";
import { Wallet } from "ethers";

const ENV_FILE = ".env";
dotenv.config({ path: ENV_FILE });

export const loadEnv = (name: string, defaultValue: string) => {
  return process.env[name] || defaultValue;
};

export const loadPrivateKey = (name: string, defaultValue: string) => {
  return loadEnv(`${name.toUpperCase()}_PRIVATE_KEY`, defaultValue).trim();
};

export const loadAddress = (name: string, privateKey: string) => {
  let address = loadEnv(`${name.toUpperCase()}_ADDRESS`, "").trim();

  if (!address) {
    try {
      const wallet = new Wallet(privateKey);
      address = wallet.address;
    } catch (error:any) {
      console.error(
        `Error deriving address from private key for ${name}: ${error.message}`
      );
    }
  }

  return address;
};

// the default values here are the hardhat defualt insecure accounts
// this means that we get a reproducable dev environment between hardhat and geth
export const ACCOUNTS: Account[] = [
  {
    name: "QB",
    privateKey: loadPrivateKey(
      "QB",
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    ),
  },
  {
    name: "GRANTOR",
    privateKey: loadPrivateKey(
      "GRANTOR",
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
    ),
  },
  {
    name: "GRANTEE",
    privateKey: loadPrivateKey(
      "GRANTEE",
      "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
    ),
  },
].map((account:Account) => {
  // Check if the address is not already present
  if (!account.address) {
    // Derive the address using the loadAddress function
    account.address = loadAddress(account.name, account.privateKey);
  }
  return account
});

// map of account name -> account
export const NAMED_ACCOUNTS = ACCOUNTS.reduce<Record<string, Account>>(
  (all, acc) => {
    all[acc.name] = acc;
    return all;
  },
  {}
);

// map of account name -> account address
export const ACCOUNT_ADDRESSES = ACCOUNTS.reduce<Record<string, string>>(
  (all, acc) => {
    all[acc.name] = acc.address;
    return all;
  },
  {}
);

// flat list of private keys in order
export const PRIVATE_KEYS = ACCOUNTS.map((acc) => acc.privateKey);

export const getAccount = (name: string) => {
  const account = NAMED_ACCOUNTS[name];
  if (!account) {
    throw new Error(`Unknown account ${name}`);
  }
  return account;
};
