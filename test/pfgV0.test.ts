import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

import moment from "moment";
import Ethers from "@typechain/ethers-v6";

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

    const pfgQB = pfg.connect(QB);
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
      pfgQB,
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
      await time.increaseTo(await pfg.unlockTime());

      expect(await pfgGrantee.withdraw())
        .to.emit(pfg, "Withdrawal")
        .withArgs("PFG")
        .to.emit(pfg, "Withdrawal")
        .withArgs("Grantee")
        .to.emit(pfg, "Withdrawal")
        .withArgs("QB");
    });

    it("Should not allow withdrawal before the unlock time", async function () {
      const { pfg, Grantee, pfgGrantee } = await loadFixture(deployPFGFixture);

      await expect(pfgGrantee.withdraw()).revertedWith(
        "You can't withdraw yet",
      );
    });

    it("Should not allow withdrawal from a Grantee account", async function () {
      const { pfg, Grantor } = await loadFixture(deployPFGFixture);
      await time.increaseTo(await pfg.unlockTime());

      const wallet = ethers.Wallet.createRandom(ethers.provider);

      await expect(pfg.connect(wallet).withdraw()).to.be.revertedWith(
        "Only Grantee can call this function",
      );
    });
  });

  const getBal = async (addr: string) => {
    return ethers.provider.getBalance(addr);
  };

  describe("Liquidate", function () {
    it("Should allow the QB to liquidate the contract", async function () {
      const { pfg, QB, pfgQB } = await loadFixture(deployPFGFixture);
      expect(await pfgQB.liquidate()).to.emit(pfg, "Withdrawal");
      expect(await pfg.proposalPhase()).to.equal(2);
      expect(await getBal(await pfg.getAddress())).to.equal(0);
    });

    /*   it("Should not allow liquidation after the proposal is paid", async function () {
      const { pfg, QB, pfgQB } = await loadFixture(deployPFGFixture);
      await pfg.withdraw();
      await expect(pfgQB.liquidate()).to.be.revertedWith(
        "Beyond the phase of liquidation",
      );
    });*/
  });
});
