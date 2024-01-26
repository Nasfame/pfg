import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/dist/types";
import { ACCOUNTS, ACCOUNT_ADDRESSES } from "../utils/accounts";

const deployPFG: DeployFunction = async function deployPFG({
  deployments,
  getNamedAccounts,
  network,
}: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;
  const { QB: deployer } = await getNamedAccounts();

  // Change the following addresses based on your deployment needs
  const QB_ADDRESS = deployer;
  const GRANTOR_ADDRESS = ACCOUNT_ADDRESSES["GRANTOR"];
  const GRANTEE_ADDRESS = ACCOUNT_ADDRESSES["GRANTEE"];
  const DELTA_UNLOCK_TIME = 2 * 7 * 24 * 60 * 60; // 2 weeks in seconds
  const PROPOSAL_VALUE = ethers.parseEther(process.env.PROPOSAL_VALUE || "0.2"); // Change to the desired value in Ether

  console.log("Deploy:Start");
  // Deploy the contract
  // FIXME: fixme use hardhat-deploy (its not working)
  // const PfgV0 = await deploy("PfgV0", {
  //   from: QB_ADDRESS,
  //   args: [],
  //   log: true,
  // });

  const PfgV0 = await ethers.deployContract("PfgV0", [], {
    //deploying to QB (as its 1st address in private keys passed in hardhat config)
    value: PROPOSAL_VALUE,
  });

  const PFGContractAddr = PfgV0.target; //PFGV0.address

  console.log("PfgV0 deployed to:", PFGContractAddr);
  console.log("PfgV0", PfgV0);

  //TODO: migrate if necessary some of the code to inialize function

  // Get the deployed contract instance
  // const pfgInstance = await ethers.getContractAt("PfgV0", PFGContractAddr);

  // // Perform initialization
  // await pfgInstance.initialize(
  //   QB_ADDRESS,
  //   GRANTOR_ADDRESS,
  //   GRANTEE_ADDRESS,
  //   DELTA_UNLOCK_TIME,
  //   PROPOSAL_VALUE,
  // );

  return true;
};

deployPFG.id = "PfgV0";

deployPFG.tags = ["PfgV0"];

export default deployPFG;
