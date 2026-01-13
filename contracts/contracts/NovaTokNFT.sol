// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NovaTokNFT
 * @dev ERC721 NFT contract for NovaTok Marketplace
 * Anyone can mint NFTs with custom metadata
 */
contract NovaTokNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Events
    event NFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI);

    constructor() ERC721("NovaTok NFT", "NOVA") Ownable(msg.sender) {
        _nextTokenId = 1; // Start from 1
    }

    /**
     * @dev Mint a new NFT to the caller
     * @param _tokenURI The metadata URI for the NFT
     * @return tokenId The ID of the newly minted token
     */
    function mint(string memory _tokenURI) public returns (uint256) {
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        emit NFTMinted(msg.sender, tokenId, _tokenURI);
        return tokenId;
    }

    /**
     * @dev Mint a new NFT to a specific address (owner only)
     * @param to The address to mint to
     * @param _tokenURI The metadata URI for the NFT
     * @return tokenId The ID of the newly minted token
     */
    function mintTo(address to, string memory _tokenURI) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        emit NFTMinted(to, tokenId, _tokenURI);
        return tokenId;
    }

    /**
     * @dev Get the next token ID that will be minted
     */
    function nextTokenId() public view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @dev Get the total number of tokens minted
     */
    function totalMinted() public view returns (uint256) {
        return _nextTokenId - 1;
    }
}
