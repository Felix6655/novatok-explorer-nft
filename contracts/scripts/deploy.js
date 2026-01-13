const hre = require("hardhat");

async function main() {
  console.log("Deploying NovaTokNFT to Sepolia...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", hre.ethers.formatEther(balance), "ETH");

  const NovaTokNFT = await hre.ethers.getContractFactory("NovaTokNFT");
  const novaTokNFT = await NovaTokNFT.deploy();

  await novaTokNFT.waitForDeployment();

  const address = await novaTokNFT.getAddress();
  console.log("\n========================================");
  console.log("NovaTokNFT deployed to:", address);
  console.log("========================================");
  console.log("\nAdd this to your .env file:");
  console.log(`NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=${address}`);
  console.log("\nVerify on Etherscan:");
  console.log(`npx hardhat verify --network sepolia ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
