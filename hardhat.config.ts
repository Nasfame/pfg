import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"

import "hardhat-deploy"

import dotenv from "dotenv"

const ENV_FILE = process.env.DOTENV_CONFIG_PATH || "./.env"
dotenv.config({ path: ENV_FILE })

const NETWORK = process.env.NETWORK || "lilypad"

import {
  ACCOUNTS,
  ACCOUNT_ADDRESSES,
  NAMED_ACCOUNTS,
  PRIVATE_KEYS,
} from "./utils/accounts"
import { ethers } from "ethers"

const config: HardhatUserConfig = {
  defaultNetwork: NETWORK,
  networks: {
    // Add your network configurations here
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: PRIVATE_KEYS,
      tags: ["mainnet"],
    },
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: PRIVATE_KEYS,
      tags: ["testnet"],
    },
    local: {
      url: "http://127.0.0.1:8545",
      tags: ["local", "geth"],
      accounts: PRIVATE_KEYS,
    },
    lilypad: {
      url: "http://testnet.lilypad.tech:8545",
      accounts: PRIVATE_KEYS,
      tags: ["testnet", "lilypad"],
    },
    hardhat: {
      accounts: [
        {
          privateKey:
            process.env.QB_PRIVATE_KEY ||
            "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", //hardhat 01
          balance: `${1000000000000000000000000n}`,
        },
        {
          privateKey:
            process.env.GRANTOR_PRIVATE_KEY ||
            "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", //hardhat 02
          balance: ethers.parseEther("1000").toString(),
        },
        {
          privateKey:
            process.env.GRANTEE_PRIVATE_KEY ||
            "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", //hardhat 03
          balance: ethers.parseEther("0.5").toString(),
        },
      ],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  solidity: {
    version: "0.8.21",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
}

export default config
