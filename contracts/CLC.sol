//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract CLC is ERC20 {
    address contractAddress;

    constructor(address marketPlaceAddress) ERC20('CryptoLionCoin', 'CLC') {
        contractAddress = marketPlaceAddress;
        _mint(contractAddress, 100000 * 10**decimals());
    }

    function buyCoin() public payable {
        require(balanceOf(contractAddress) > msg.value, 'Not enough tokens');
        _transfer(contractAddress, msg.sender, msg.value);
    }
}
