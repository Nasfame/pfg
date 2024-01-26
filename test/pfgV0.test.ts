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
  async function deployOneYearLockFixture() {
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
      pfg: pfg,
      unlockTime,
      lockedAmount: PROPOSAL_VALUE,
      owner,
      otherAccount,
    }
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { pfg: lock, owner } = await loadFixture(deployOneYearLockFixture)

      expect(await lock.owner()).to.equal(owner.address)
    })

    it("Should receive and store the funds to lock", async function () {
      const { pfg: lock, lockedAmount } = await loadFixture(
        deployOneYearLockFixture
      )

      expect(await ethers.provider.getBalance(lock.target)).to.equal(
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
        const { pfg: lock } = await loadFixture(deployOneYearLockFixture)

        await expect(lock.withdraw()).to.be.revertedWith(
          "You can't withdraw yet"
        )
      })

      it("Should revert with the right error if called from another account", async function () {
        const {
          pfg: lock,
          unlockTime,
          otherAccount,
        } = await loadFixture(deployOneYearLockFixture)

        // We can increase the time in Hardhat Network
        await time.increaseTo(unlockTime)

        // We use lock.connect() to send a transaction from another account
        await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
          "You aren't the owner"
        )
      })

      it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
        const { pfg: lock, unlockTime } = await loadFixture(
          deployOneYearLockFixture
        )

        // Transactions are sent using the first signer by default
        await time.increaseTo(unlockTime)

        await expect(lock.withdraw()).not.to.be.reverted
      })
    })

    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        const {
          pfg: lock,
          unlockTime,
          lockedAmount,
        } = await loadFixture(deployOneYearLockFixture)

        await time.increaseTo(unlockTime)

        await expect(lock.withdraw())
          .to.emit(lock, "Withdrawal")
          .withArgs(lockedAmount, anyValue) // We accept any value as `when` arg
      })
    })

    describe("Transfers", function () {
      it("Should transfer the funds to the owner", async function () {
        const {
          pfg: lock,
          unlockTime,
          lockedAmount,
          owner,
        } = await loadFixture(deployOneYearLockFixture)

        await time.increaseTo(unlockTime)

        await expect(lock.withdraw()).to.changeEtherBalances(
          [owner, lock],
          [lockedAmount, -lockedAmount]
        )
      })
    })
  })
})