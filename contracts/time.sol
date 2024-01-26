// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;




library TimeLib {
    uint256 public constant SECOND = 1;
    uint256 public constant MINUTE = 60 * SECOND;
    uint256 public constant HOUR = 60 * MINUTE;
    uint256 public constant DAY = 24 * HOUR;
    uint256 public constant WEEK = 7 * DAY;
    uint256 public constant MONTH = 30 * DAY; 
// Note: This is a simplified approximation
}