import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

import moment from "moment";

const PROPOSAL_VALUE = ethers.parseEther(process.env.PROPOSAL_VALUE || "0.2");
describe("PfgV0", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployPFGFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const oneYearInSeconds = moment().add(1, "year").diff(moment(), "seconds");

    const ONE_GWEI = 1_000_000_000;

    const proposalValue = PROPOSAL_VALUE;

    // const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS //TODO:

    // Contracts are deployed using the first signer/account by default
    const [QB, Grantor, Grantee] = await ethers.getSigners();

    const PFG = await ethers.getContractFactory("PfgV0");
    // const pfg = await PFG.deploy(unlockTime, { value: PROPOSAL_VALUE }) TODO:
    const pfg = await PFG.deploy({ value: PROPOSAL_VALUE });

    /* const QB = getAccount("QB")
    const Grantor = getAccount("Grantor")
    const Grantee = getAccount("Grantee")*/

    const pfgGrantor = pfg.connect(Grantor);
    const pfgGrantee = pfg.connect(Grantee);

    return {
      pfg,
      proposalValue,
      owner: QB,
      QB,
      Grantor,
      Grantee,
      pfgGrantee,
      pfgGrantor,
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { pfg, QB } = await loadFixture(deployPFGFixture);

      expect(await pfg.QB()).to.equal(QB.address);
    });

    it("Should receive and store the funds to pfg", async function () {
      const { pfg, proposalValue } = await loadFixture(deployPFGFixture);

      expect(await ethers.provider.getBalance(pfg.target)).to.equal(
        proposalValue,
      );
    });

    it("Should have the correct grantor and grantee addresses", async function () {
      const { pfg, Grantor, Grantee } = await loadFixture(deployPFGFixture);

      expect(await pfg.Grantor()).to.equal(Grantor.address);
      expect(await pfg.Grantee()).to.equal(Grantee.address);
    });
  });

  describe("Deposit", function () {
    it("Should allow the grantor to deposit funds", async function () {
      const { pfg, Grantor, proposalValue } =
        await loadFixture(deployPFGFixture);

      const pfgI = pfg.connect(Grantor);
      expect(await pfgI.deposit({ value: proposalValue }))
        .to.emit(pfg, "Deposit")
        .withArgs();

      expect(await ethers.provider.getBalance(await pfg.getAddress())).to.gt(0);
    });

    it("Should not allow deposits after the proposal is paid", async function () {
      const { pfg, Grantor, proposalValue, pfgGrantee, pfgGrantor } =
        await loadFixture(deployPFGFixture);

      expect(await pfg.proposalPhase()).to.equal(0);

      expect(await pfgGrantor.deposit({ value: proposalValue }))
        .to.emit(pfgGrantor, "Deposit")
        .withArgs();

      expect(await pfg.proposalPhase()).to.equal(3);

      await expect(
        pfgGrantor.deposit({ value: proposalValue }),
      ).to.be.revertedWith("PFG Deposits Disabled");
    });
    it("Should not allow deposits with insufficient funds", async function () {
      const { pfg, Grantor, proposalValue, pfgGrantor } =
        await loadFixture(deployPFGFixture);

      expect(await pfg.proposalPhase()).to.equal(0);
      await expect(
        pfgGrantor.deposit({ value: ethers.parseEther("0.0000000001") }),
      ).to.be.revertedWith("Insufficient funds to deposit");
    });
  });

  describe("Withdraw", function () {
    it("Should allow the Grantee to withdraw funds after the unlock time", async function () {
      const { pfg, Grantee, pfgGrantee } = await loadFixture(deployPFGFixture);

      await time.increaseTo((await pfg.unlockTime()).add(10));
      expect(await pfgGrantee.withdraw())
        .to.emit(pfg, "Withdrawal")
        .withArgs(anyValue, anyValue);
    });

    it("Should not allow withdrawal before the unlock time", async function () {
      const { pfg, Grantee } = await loadFixture(deployPFGFixture);
      await expect(pfg.connect(Grantee).withdraw()).to.be.revertedWith(
        "You can't withdraw yet",
      );
    });

    it("Should not allow withdrawal from a non-grantee account", async function () {
      const { pfg, Grantor } = await loadFixture(deployPFGFixture);
      await time.increaseTo((await pfg.unlockTime()).add(1));
      await expect(pfg.connect(Grantor).withdraw()).to.be.revertedWith(
        "You aren't the owner",
      );
    });
  });

  /*  describe("Liquidate", function () {
    it("Should allow the QB to liquidate the contract", async function () {
      const { pfg, QB } = await loadFixture(deployPFGFixture);
      await expect(pfg.connect(QB).liquidate())
        .to.emit(pfg, "Withdrawal")
        .withArgs(anyValue, anyValue);
      expect(await ethers.provider.getBalance(pfg.address)).to.equal(0);
      expect(await pfg.proposalPhase()).to.equal(ProposalState.Canceled);
    });

    it("Should not allow liquidation after the proposal is paid", async function () {
      const { pfg, QB } = await loadFixture(deployPFGFixture);
      await pfg.withdraw();
      await expect(pfg.connect(QB).liquidate()).to.be.revertedWith(
        "Beyond the phase of liquidation",
      );
    });
  });*/
});
