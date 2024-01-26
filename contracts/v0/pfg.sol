// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//import "hardhat/console.sol";

import "contracts/time.sol";

enum ProposalState {
    Accepted,
    Rejected,
    Canceled,
    Paid
}

enum ParticipantEnum {
    QUESTBOOK,
    GRANTOR,
    GRANTEE
}

contract PfgV0 {
    using TimeLib for uint256;
    uint256 public deltaUnlockTime;

    uint256 public unlockTime;


    address payable public QB; //Questbook
    address payable public Grantor;
    address payable public Grantee;

    //TODO: migrate: to types.sol/Proposal struct
    uint public proposalValue;
    ProposalState public proposalPhase;

    event Deposit(uint amount, uint when);
    event Withdrawal(string name, uint amount, uint when);

    constructor() payable proposalMinValueCheck {
        deltaUnlockTime = 2 * TimeLib.WEEK;

        unlockTime = block.timestamp + deltaUnlockTime;

        proposalValue = msg.value;

        emit Deposit(proposalValue, block.timestamp);

        QB = payable(msg.sender);

        Grantor = payable(0x09308A2577499f1fCDDfa4d5572e2e7e08f2C51D); //PFG

        Grantee = payable(0x823531B7c7843D8c3821B19D70cbFb6173b9Cb02); //HIRO
        require(Grantor!=Grantee, "Grantor cannot be Grantee");

        proposalPhase = ProposalState.Accepted;

        // TODO: PFG OPEN SHORT
    }

    modifier onlyQB() {
        require(msg.sender == QB, "Only QB can call this function");
        _;
    }

    modifier proposalMinValueCheck() {
        require(msg.value>0, "Proposal Value needs to be greator than 0");
        _;
    }


    modifier onlyGrantee() {
        require(msg.sender == Grantee, "Only Grantee can call this function");
        _;
    }

    modifier onlyGrantor() {
        require(msg.sender == Grantor, "Only Grantor can call this function");
        _;
    }

    modifier readyToWithdraw() {
        require(block.timestamp >= unlockTime || proposalPhase==ProposalState.Paid, "You can't withdraw yet");
        _;
    }

    function deposit() public payable onlyGrantor proposalMinValueCheck {
        require(msg.value >= proposalValue, "Insufficient funds to deposit");

        require(proposalPhase != ProposalState.Paid, "Proposal already paid");

        unlockTime = 0;
        proposalPhase = ProposalState.Paid;

        emit Deposit(msg.value, block.timestamp);
    }

    function withdraw() public onlyGrantee readyToWithdraw {
        // TODO: PFG CLOSE
        uint amount = address(this).balance;

        emit Withdrawal("PFG", amount, block.timestamp);

        uint granteeShare = calcGranteeShare();

        emit Withdrawal("Grantee", granteeShare, block.timestamp);

        Grantee.transfer(granteeShare);

        uint qbShare = address(this).balance;

        emit Withdrawal("QB", qbShare, block.timestamp);

        Grantor.transfer(qbShare);
    }

    function liquidate() public onlyQB {
        require(
            proposalPhase != ProposalState.Paid && proposalPhase != ProposalState.Canceled,
            "Beyond the phase of liquidation"
        );

        emit Withdrawal("QB", address(this).balance, block.timestamp);

        QB.transfer(address(this).balance);

        proposalPhase = ProposalState.Canceled;

        // if deposits are made post liquidations, only Grantee can withdraw the amount.
    }

    function calcGranteeShare()
        internal
        view
        returns (uint granteeShare)
    {
        uint bal = address(this).balance;

        granteeShare = bal - proposalValue;

        if (granteeShare < 0) {
            granteeShare = bal;
        }
        return granteeShare;
    }
}
