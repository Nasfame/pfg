import { ethers } from "hardhat";

async function getBalance(address: string) {
  const provider = ethers.provider;
  // Get the balance of the address
  const balance = await provider.getBalance(address);

  // Print the balance to the console
  console.log(`Balance of ${address}: ${ethers.formatEther(balance)} ETH`);

  return balance;
}
