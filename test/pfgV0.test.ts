import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers"
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { expect } from "chai"
import { ethers } from "hardhat"

import moment from "moment"

describe("PfgV0", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployPFGFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60
    const oneYearInSeconds = moment().add(1, "year").diff(moment(), "seconds")

    const ONE_GWEI = 1_000_000_000

    const PROPOSAL_VALUE = ethers.parseEther(
      process.env.PROPOSAL_VALUE || "0.2"
    )

    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS //TODO:

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners()

    const PFG = await ethers.getContractFactory("PfgV0")
    // const pfg = await PFG.deploy(unlockTime, { value: PROPOSAL_VALUE }) TODO:
    const pfg = await PFG.deploy([], { value: PROPOSAL_VALUE })

    return {
      pfg,
      unlockTime,
      lockedAmount: PROPOSAL_VALUE,
      owner,
      otherAccount,
    }
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { pfg, owner } = await loadFixture(deployPFGFixture)

      expect(await pfg.owner()).to.equal(owner.address)
    })

    it("Should receive and store the funds to pfg", async function () {
      const { pfg, lockedAmount } = await loadFixture(deployPFGFixture)

      expect(await ethers.provider.getBalance(pfg.target)).to.equal(
        lockedAmount
      )
    })

    it("Should fail if the unlockTime is not in the future", async function () {
      // We don't use the fixture here because we want a different deployment
      const latestTime = await time.latest()
      const Lock = await ethers.getContractFactory("Lock")
      await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
        "Unlock time should be in the future"
      )
    })
  })

  describe("Withdrawals", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called too soon", async function () {
        const { pfg } = await loadFixture(deployPFGFixture)

        await expect(pfg.withdraw()).to.be.revertedWith(
          "You can't withdraw yet"
        )
      })

      it("Should revert with the right error if called from another account", async function () {
        const { pfg, unlockTime, otherAccount } =
          await loadFixture(deployPFGFixture)

        // We can increase the time in Hardhat Network
        await time.increaseTo(unlockTime)

        // We use pfg.connect() to send a transaction from another account
        await expect(pfg.connect(otherAccount).withdraw()).to.be.revertedWith(
          "You aren't the owner"
        )
      })

      it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
        const { pfg, unlockTime } = await loadFixture(deployPFGFixture)

        // Transactions are sent using the first signer by default
        await time.increaseTo(unlockTime)

        await expect(pfg.withdraw()).not.to.be.reverted
      })
    })

    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        const { pfg, unlockTime, lockedAmount } =
          await loadFixture(deployPFGFixture)

        await time.increaseTo(unlockTime)

        await expect(pfg.withdraw())
          .to.emit(pfg, "Withdrawal")
          .withArgs(lockedAmount, anyValue) // We accept any value as `when` arg
      })
    })

    describe("Transfers", function () {
      it("Should transfer the funds to the owner", async function () {
        const { pfg, unlockTime, lockedAmount, owner } =
          await loadFixture(deployPFGFixture)

        await time.increaseTo(unlockTime)

        await expect(pfg.withdraw()).to.changeEtherBalances(
          [owner, pfg],
          [lockedAmount, -lockedAmount]
        )
      })
    })
  })
})
