// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title NovatoKNFT
 * @dev ERC721 NFT contract with ERC-2981 royalty support
 * @notice Supports minting with custom tokenURI and on-chain royalty info
 */
contract NovatoKNFT is ERC721, ERC721URIStorage, ERC2981, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // Default royalty percentage in basis points (500 = 5%)
    uint96 public constant DEFAULT_ROYALTY_BPS = 500;

    /**
     * @dev Constructor sets up the NFT collection with default royalties
     * @param name_ The name of the NFT collection
     * @param symbol_ The symbol of the NFT collection
     * @param royaltyReceiver The address that will receive royalty payments
     * @param royaltyBps Royalty percentage in basis points (e.g., 500 = 5%)
     */
    constructor(
        string memory name_,
        string memory symbol_,
        address royaltyReceiver,
        uint96 royaltyBps
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        // Set default royalty for all tokens
        // If royaltyReceiver is zero address, use msg.sender
        address receiver = royaltyReceiver == address(0) ? msg.sender : royaltyReceiver;
        // If royaltyBps is 0, use default
        uint96 bps = royaltyBps == 0 ? DEFAULT_ROYALTY_BPS : royaltyBps;
        _setDefaultRoyalty(receiver, bps);
    }

    /**
     * @dev Mint a new NFT with the given tokenURI
     * @param tokenURI The metadata URI for the token (should be ipfs:// or https://)
     * @return tokenId The ID of the newly minted token
     */
    function mint(string memory tokenURI) public returns (uint256) {
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        return tokenId;
    }

    /**
     * @dev Mint a new NFT with custom royalty settings
     * @param tokenURI The metadata URI for the token
     * @param royaltyReceiver The address to receive royalties for this specific token
     * @param royaltyBps Royalty percentage in basis points for this token
     * @return tokenId The ID of the newly minted token
     */
    function mintWithRoyalty(
        string memory tokenURI,
        address royaltyReceiver,
        uint96 royaltyBps
    ) public returns (uint256) {
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        // Set token-specific royalty if provided
        if (royaltyReceiver != address(0) && royaltyBps > 0) {
            _setTokenRoyalty(tokenId, royaltyReceiver, royaltyBps);
        }
        
        return tokenId;
    }

    /**
     * @dev Update the default royalty settings (owner only)
     * @param receiver The new royalty receiver address
     * @param feeNumerator The new royalty percentage in basis points
     */
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    /**
     * @dev Delete the default royalty (owner only)
     */
    function deleteDefaultRoyalty() external onlyOwner {
        _deleteDefaultRoyalty();
    }

    /**
     * @dev Set royalty for a specific token (owner only)
     * @param tokenId The token ID to set royalty for
     * @param receiver The royalty receiver address
     * @param feeNumerator The royalty percentage in basis points
     */
    function setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 feeNumerator
    ) external onlyOwner {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    /**
     * @dev Reset token royalty to default (owner only)
     * @param tokenId The token ID to reset
     */
    function resetTokenRoyalty(uint256 tokenId) external onlyOwner {
        _resetTokenRoyalty(tokenId);
    }

    /**
     * @dev Get the current token count
     * @return The total number of tokens minted
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    // ============ Overrides ============

    /**
     * @dev Override tokenURI to use ERC721URIStorage
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Override supportsInterface to include ERC2981
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
