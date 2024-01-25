// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library ProposalLibrary {
    struct Proposal {
        uint id;
        string title;
        string description;
        uint value;
        address payable recipient;
        string phase;
    }
}
