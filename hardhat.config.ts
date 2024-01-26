import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import "hardhat-deploy";

import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const config: HardhatUserConfig = {
  defaultNetwork: "local",
  networks: {
    // Add your network configurations here
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.PRIVATE_KEY ?? ""],
      tags: ["mainnet"],
    },
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.PRIVATE_KEY ?? ""],
      tags: ["testnet"],
    },
    local: {
      url: "http://127.0.0.1:8545",
      tags: ["local"],
    },
    lilypad: {
      url: "http://testnet.lilypad.tech:8545",
      accounts: [
        process.env.QB_PRIVATE_KEY,
        process.env.GRANTOR_PRIVATE_KEY,
        process.env.GRANTEE_PRIVATE_KEY,
      ],
      tags: ["testnet", "lilypad"],
    },
  },
  solidity: {
    version: "0.8.20",
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

  namedAccounts: {
    QB: {
      default: 0, // here this will by default take the first account as deployer
      1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
      4: "0xA296a3d5F026953e17F472B497eC29a5631FB51B", // but for rinkeby it will be a specific address
      goerli: "0x84b9514E013710b9dD0811c9Fe46b837a4A0d8E0", //it can also specify a specific netwotk name (specified in hardhat.config.js)
    },
  },
};

export default config;
