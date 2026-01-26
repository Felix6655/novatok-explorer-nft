const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Configuration - can be overridden via environment variables
  const NFT_NAME = process.env.NFT_NAME || "NovatoK NFT";
  const NFT_SYMBOL = process.env.NFT_SYMBOL || "NVTK";
  
  // Royalty configuration
  // Default: 5% (500 basis points) to deployer
  const ROYALTY_RECEIVER = process.env.ROYALTY_RECEIVER || deployer.address;
  const ROYALTY_BPS = parseInt(process.env.ROYALTY_BPS || "500"); // 500 = 5%

  console.log("\nDeployment Configuration:");
  console.log("  Name:", NFT_NAME);
  console.log("  Symbol:", NFT_SYMBOL);
  console.log("  Royalty Receiver:", ROYALTY_RECEIVER);
  console.log("  Royalty BPS:", ROYALTY_BPS, `(${ROYALTY_BPS / 100}%)`);

  // Deploy the contract
  const NovatoKNFT = await hre.ethers.getContractFactory("NovatoKNFT");
  const nft = await NovatoKNFT.deploy(
    NFT_NAME,
    NFT_SYMBOL,
    ROYALTY_RECEIVER,
    ROYALTY_BPS
  );

  await nft.waitForDeployment();
  const contractAddress = await nft.getAddress();

  console.log("\n✅ NovatoKNFT deployed to:", contractAddress);
  console.log("\nNext steps:");
  console.log(`1. Update NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress} in your .env`);
  console.log(`2. Verify on block explorer:\n   npx hardhat verify --network <network> ${contractAddress} "${NFT_NAME}" "${NFT_SYMBOL}" "${ROYALTY_RECEIVER}" ${ROYALTY_BPS}`);

  // Return deployment info for testing
  return {
    address: contractAddress,
    name: NFT_NAME,
    symbol: NFT_SYMBOL,
    royaltyReceiver: ROYALTY_RECEIVER,
    royaltyBps: ROYALTY_BPS,
  };
}

main()
  .then((result) => {
    console.log("\nDeployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nDeployment failed:", error);
    process.exit(1);
  });
