// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;




library TimeLib {
    type TIME is uint;
    TIME private constant SECOND=1;
    TIME private constant MINUTE=60*SECOND;
    TIME private constant HOUR=60*MINUTE;
    TIME private constant DAY = 24 * HOUR;
    TIME private constant WEEK = 7 * DAY;
    TIME private constant MONTH = 30 * DAY; // Note: This is a simplified approximation
}