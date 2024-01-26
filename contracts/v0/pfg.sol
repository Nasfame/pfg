// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//import "hardhat/console.sol";

enum ProposalState {
    Accepted,
    Rejected,
    Canceled,
    Paid
}

type TIME is uint;


contract PfgV0 {
    TIME public deltaUnlockTime = 2 * WEEK; 
    TIME public unlockTime;
    
    TIME private constant SECOND=1;
    TIME private constant MINUTE=60*SECOND;
    TIME private constant HOUR=60*MINUTE;
    TIME private constant DAY = 24 * HOUR;
    TIME private constant WEEK = 7 * DAY;
    TIME private constant MONTH = 30 * DAY; // Note: This is a simplified approximation

    address payable public QB; //Questbook
    address payable public Grantor;
    address payable public Grantee;

    // migrate: to types.sol/Proposal struct
    uint public proposalValue;
    ProposalState public proposalPhase;

    event Deposit(uint amount, uint when);
    event Withdrawal(uint amount, uint when);

    constructor() payable proposalValueCheck {
        unlockTime = block.timestamp + deltaUnlockTime;

        proposalValue = msg.value;

        emit Deposit(proposalValue, block.timestamp);

        QB = payable(msg.sender);

        Grantor = QB; //TODO: for simplicity; take from constructor arg.

        Grantee = payable(0x823531B7c7843D8c3821B19D70cbFb6173b9Cb02); //TODO: its me; but take from constructor arg

        require(Grantor!=Grantee, "Grantor cannot be Grantee");

        proposalPhase = ProposalState.Accepted;
    }

    modifier onlyQB() {
        require(msg.sender == QB, "Only QB can call this function");
        _;
    }

    modifier proposalValueCheck() {
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
        require(block.timestamp >= unlockTime, "You can't withdraw yet");
        _;
    }

    function deposit() public payable onlyGrantor proposalValueCheck {
        require(msg.value > 0, "Deposit amount must be greater than 0");

        require(msg.value >= proposalValue, "Insufficient funds to deposit");
 
        require(proposalPhase != ProposalState.Paid, "Proposal already paid");

        unlockTime = 0;
        proposalPhase = ProposalState.Paid;

        emit Deposit(msg.value, block.timestamp);

        // TODO: PFG OPEN SHORT
    }

    function withdraw() public onlyGrantee readyToWithdraw {
        emit Withdrawal(address(this).balance, block.timestamp);

        // TODO: PFG CLOSE

        uint granteeShare = calcGranteeShare();

        Grantee.transfer(granteeShare);

        uint qbShare = address(this).balance;

        Grantor.transfer(qbShare);
    }

    function liquidate() public onlyQB {
        require(
            proposalPhase != ProposalState.Paid && proposalPhase != ProposalState.Canceled,
            "Beyond the phase of liquidation"
        );

        emit Withdrawal(address(this).balance, block.timestamp);

        QB.transfer(address(this).balance);

        proposalPhase = ProposalState.Canceled;

        // if deposits are made post liquidations, only Grantee can withdraw the amount.
    }

    function calcGranteeShare()
        internal
        view
        readyToWithdraw
        returns (uint granteeShare)
    {
        uint bal = address(this).balance;

        granteeShare = bal - proposalValue;

        if (granteeShare < 0) {
            granteeShare = bal;
        }
        return granteeShare;
    }

    function convertTimstamp(uint timestamp) public pure returns (uint year, uint month, uint day, uint hour, uint minute, uint second) {
         return DateTime.timestampToDateTime(timestamp);
    }
}
