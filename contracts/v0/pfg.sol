// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "hardhat/console.sol";

contract PfgV0 {
    uint public deltaUnlockTime = 1209600; //2weeks
    uint public unlockTime;
    address payable public owner;
    uint public initialDeposit;

    event Deposit(uint amount, uint when);
    event Withdrawal(uint amount, uint when);

    constructor() payable {
        unlockTime = block.timestamp + deltaUnlockTime ;

        owner = payable(msg.sender);
        initialDeposit = msg.value;

        emit Deposit(initialDeposit, block.timestamp);
    }

    function withdraw() public {
        require(block.timestamp >= unlockTime, "You can't withdraw yet");
        require(msg.sender == owner, "You aren't the owner");

        emit Withdrawal(address(this).balance, block.timestamp);

        owner.transfer(address(this).balance);
    }
}
