const hre = require("hardhat");

async function main() {
  console.log("Deploying RestockApproval contract...");
  
  const RestockApproval = await hre.ethers.getContractFactory("RestockApproval");
  const contract = await RestockApproval.deploy();
  
  // For ethers v6, use waitForDeployment() instead of deployed()
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  
  console.log(`✅ Contract deployed to: ${address}`);
  console.log("");
  console.log("Save this address! You'll need it for Django's .env file.");
  console.log("");
  console.log("Add this to backend/.env:");
  console.log(`CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});