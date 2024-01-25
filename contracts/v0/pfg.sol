// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "hardhat/console.sol";

enum ProposalState {
    Accepted,
    Rejected,
    Canceled,
    Paid
}
struct Proposal {
    uint id;
    string title;
    string description;
    uint value;
    address payable recipient;
    string phase;
}

contract PfgV0 {
    uint public deltaUnlockTime = 1209600; //2weeks
    uint public unlockTime;

    address payable public QB; //Questbook
    address payable public Grantor;
    address payable public Grantee;

    uint public proposalValue;
    ProposalState public proposalPhase;

    event Deposit(uint amount, uint when);
    event Withdrawal(uint amount, uint when);

    constructor() payable {
        unlockTime = block.timestamp + deltaUnlockTime;

        proposalValue = msg.value;
        emit Deposit(proposalValue, block.timestamp);

        QB = payable(msg.sender);

        Grantor = QB; //TODO: for simplicity; take from constructor arg.

        Grantee = payable(0x823531B7c7843D8c3821B19D70cbFb6173b9Cb02); //TODO: its me; but take from constructor arg

        proposalPhase = ProposalState.Accepted;
    }

    modifier onlyQB() {
        require(msg.sender == QB, "Only QB can call this function");
        _;
    }

    modifier onlyGrantee() {
        require(msg.sender == Grantee, "Only Grantee can call this function");
        _;
    }

    modifier onlyGrantor() {
        require(msg.sender == Grantee, "Only Grantor can call this function");
        _;
    }

    modifier readyToWithdraw() {
        require(block.timestamp >= unlockTime, "You can't withdraw yet");
        _;
    }

    function deposit() public payable onlyGrantor {
        require(msg.value > 0, "Deposit amount must be greater than 0");

        require(msg.value >= proposalValue, "Insufficient funds to deposit");

        require(proposalPhase == ProposalState.Paid, "Proposal already paid");

        unlockTime = 0;
        proposalPhase = ProposalState.Paid;

        emit Deposit(msg.value, block.timestamp);
    }

    function withdraw() public onlyGrantee readyToWithdraw {
        emit Withdrawal(address(this).balance, block.timestamp);

        Grantee.transfer(address(this).balance);
    }

    function liquidate() public onlyQB {
        require(
            proposalPhase != ProposalState.Paid,
            "Insufficient funds to liquid"
        );

        emit Withdrawal(address(this).balance, block.timestamp);

        QB.transfer(address(this).balance);

        // if deposits are made post liquidations, only Grantee can withdraw the amount.
    }
}
