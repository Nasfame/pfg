import deployPFG from "./deployPFGV0";

import hre from "hardhat"
async function main() {
  console.log("Starting deploy")
  await deployPFG(hre); 
}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
