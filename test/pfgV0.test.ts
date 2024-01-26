import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers"
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { expect } from "chai"
import { ethers } from "hardhat"

import moment from "moment"

const PROPOSAL_VALUE = ethers.parseEther(process.env.PROPOSAL_VALUE || "0.2")
describe("PfgV0", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployPFGFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60
    const oneYearInSeconds = moment().add(1, "year").diff(moment(), "seconds")

    const ONE_GWEI = 1_000_000_000

    const proposalValue = PROPOSAL_VALUE

    // const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS //TODO:

    // Contracts are deployed using the first signer/account by default
    const [QB, Grantor, Grantee] = await ethers.getSigners()

    const PFG = await ethers.getContractFactory("PfgV0")
    // const pfg = await PFG.deploy(unlockTime, { value: PROPOSAL_VALUE }) TODO:
    const pfg = await PFG.deploy({ value: PROPOSAL_VALUE })

    return {
      pfg,
      proposalValue,
      owner: QB,
      QB,
      Grantor,
      Grantee,
    }
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { pfg, QB } = await loadFixture(deployPFGFixture)

      expect(await pfg.QB()).to.equal(QB.address)
    })

    it("Should receive and store the funds to pfg", async function () {
      const { pfg, proposalValue } = await loadFixture(deployPFGFixture)

      expect(await ethers.provider.getBalance(pfg.target)).to.equal(
        proposalValue
      )
    })
  })
})
