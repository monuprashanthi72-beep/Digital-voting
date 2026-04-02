// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract Transaction{
    uint256 transactionCounter;

    event Transfer(address from,address receiver,string user_id,string election_id,string candidate_id,uint timestamp);

    struct TransactionStruct {
        address from;
        address receiver;
        string user_id;
        string election_id;
        string candidate_id;
        uint timestamp;
    }

    TransactionStruct[] transactions;
    uint256 public startTime;
    uint256 public endTime;
    address public admin;

    constructor() {
        admin = msg.sender;
        // Default: election starts now and ends in 100 years for initial demo
        startTime = block.timestamp;
        endTime = block.timestamp + 3153600000; 
    }

    modifier onlyDuringElection() {
        require(block.timestamp >= startTime, "Election has not started yet");
        require(block.timestamp <= endTime, "Election has already ended");
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    function setElectionPeriod(uint256 _startTime, uint256 _endTime) public onlyAdmin {
        require(_startTime < _endTime, "Start time must be before end time");
        startTime = _startTime;
        endTime = _endTime;
    }

    function addToBlockchain(address payable receiver,string memory user_id,string memory election_id,string memory candidate_id) public onlyDuringElection {
        transactionCounter+=1;
        transactions.push(TransactionStruct(msg.sender,receiver,user_id,election_id,candidate_id,block.timestamp));

        emit Transfer(msg.sender,receiver,user_id,election_id,candidate_id,block.timestamp);
    }

    function getAllTransaction() public view returns (TransactionStruct[] memory){
        return transactions;
    }

    function getTransactionCount() public view returns (uint256){
        return transactionCounter;
    }

}