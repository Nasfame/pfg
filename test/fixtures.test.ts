import { getAccount } from "utils/accounts"
import hre, { ethers } from "hardhat"
import deployPFG from "scripts/deployPFGV0"
import { BigNumberish, Signer } from "ethers"

export const getWallet = (name: string) => {
  const account = getAccount(name)
  return new ethers.Wallet(account.privateKey, ethers.provider)
}

const DEFAULT_PROPOSAL_AMOUNT = ethers.parseEther("0.5")
/*

  DEPLOYMENT

*/
export async function deployContract<T extends any>(
  name: string,
  signer: Signer,
  args: any[] = []
): Promise<T> {
  const factory = await ethers.getContractFactory(name, signer)
  const contract = (await factory.deploy(...args)) as unknown as T
  return contract
}

export async function deployPFGV0(
  signer: Signer,
  tokenSupply: BigNumberish = DEFAULT_PROPOSAL_AMOUNT
) {
  return deployContract<any>("PFGV0", signer, [])
}

export async function setupPFGV0Fixture({
  testMode = false,
  withFunds = false,
}: {
  testMode?: boolean
  withFunds?: boolean
}) {
  const QB = getWallet("QB")
  const pfg = await deployPFG(QB)
  return pfg
}
