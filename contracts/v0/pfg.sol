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
    ProposalState public proposalPhase = ProposalState.Accepted;

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

        assert(Grantor != Grantee, "Grantor cannot be Grantee");

        proposalPhase = ProposalState.Accepted;

        assert(proposalPhase, "proposalPhase needs to be accepted");

        // TODO: PFG OPEN SHORT

        _openPFGShort();
    }

    modifier proposalMinValueCheck() {
        require(msg.value > 0, "Proposal Value needs to be greator than 0");
        _;
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
        require(msg.sender == Grantor, "Only Grantor can call this function");
        _;
    }

    modifier readyToWithdraw() {
        require(
            block.timestamp >= unlockTime ||
                proposalPhase == ProposalState.Paid,
            "You can't withdraw yet"
        );
        _;
    }

    modifier checkActive() {
        require(proposalPhase != ProposalState.Canceled, "PFG Deactivated");
        _;
    }

    modifier depositsEnabled() {
        require(proposalPhase != ProposalState.Paid, "PFG Deposits Disabled");
        _;
    }

    function deposit() public payable checkActive onlyGrantor depositsEnabled {
        require(msg.value >= proposalValue, "Insufficient funds to deposit");

        unlockTime = 0;
        proposalPhase = ProposalState.Paid;

        emit Deposit(msg.value, block.timestamp);
    }

    function withdraw() public checkActive onlyGrantee readyToWithdraw {
        // TODO: PFG CLOSE
        uint amount = address(this).balance;

        emit Withdrawal("PFG", amount, block.timestamp);

        uint granteeShare = calcGranteeShare();

        if (!Grantee.send(amount)) {
            revert("Failed to transfer to grantee");
        }

        emit Withdrawal("Grantee", granteeShare, block.timestamp);

        uint qbShare = address(this).balance;

        if (QB.send(qbShare)) {
            revert("Failed to transfer to QB");
        }
        emit Withdrawal("QB", qbShare, block.timestamp);
    }

    function liquidate() public checkActive onlyQB {
        require(
            proposalPhase != ProposalState.Paid,
            "Beyond the phase of liquidation"
        );

        _closePFGShort();

        emit Withdrawal("QB", address(this).balance, block.timestamp);

        QB.transfer(address(this).balance);

        proposalPhase = ProposalState.Canceled;

        // if deposits are made post liquidations, only Grantee can withdraw the amount.
    }

    function calcGranteeShare() internal view returns (uint granteeShare) {
        uint bal = address(this).balance;

        granteeShare = bal - proposalValue;

        if (granteeShare < 0) {
            granteeShare = bal;
        }
        return granteeShare;
    }

    function _openPFGShort() internal {}

    function _closePFGShort() internal {}

    function init(
        address Grantor_,
        address Grantee_
    ) public checkActive onlyQB {
        Grantor = payable(Grantor_);
        Grantee = payable(Grantee_);
    }
}
