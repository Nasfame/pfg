// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "hardhat/console.sol";

contract PfgV0 {
    uint public deltaUnlockTime = 1209600; //2weeks
    uint public unlockTime;

    address payable public QB; //Questbook
    address payable public Grantor;
    address payable public Grantee;

    uint public proposalValue;


    event Deposit(uint amount, uint when);
    event Withdrawal(uint amount, uint when);

    constructor() payable {
        unlockTime = block.timestamp + deltaUnlockTime ;

        QB = payable(msg.sender);
        proposalValue = msg.value;

        emit Deposit(proposalValue, block.timestamp);

        Grantor = QB; //TODO: for simplicity; take from constructor arg.

        Grantee="0x823531B7c7843D8c3821B19D70cbFb6173b9Cb02"; //TODO: its me; but take from constructor arg
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


    function deposit() public payable onlyGrantor {
        require(msg.value > 0, "Deposit amount must be greater than 0");

        proposalValue += msg.value;

        emit Deposit(msg.value, block.timestamp);
    }


    function withdraw() public {
        require(block.timestamp >= unlockTime, "You can't withdraw yet");
        require(msg.sender == QB, "You aren't the owner");

        emit Withdrawal(address(this).balance, block.timestamp);

        QB.transfer(address(this).balance);
    }
}
