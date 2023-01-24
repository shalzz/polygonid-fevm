import { ethers, config } from "hardhat";
import fs from "fs";
import path from "path";
const pathOutputJson = path.join(
  __dirname,
  "./deploy_erc20verifier_output.json"
);

import util from "util";
const request = util.promisify(require("request"))

async function callRpc(method, params = undefined) {
    var options = {
        method: "POST",
        url: "https://api.hyperspace.node.glif.io/rpc/v1",
        // url: "http://localhost:1234/rpc/v0",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            method: method,
            params: params,
            id: 1,
        }),
    }
    const res = await request(options)
    return JSON.parse(res.body).result
}

async function main() {
  const priorityFee = await callRpc("eth_maxPriorityFeePerGas")
  const FEE_DATA = {
    maxFeePerGas:         ethers.utils.parseUnits('50', 'gwei'),
    maxPriorityFeePerGas: priorityFee,
    lastBaseFeePerGas: null,
    gasPrice: null,
  };

  const provider = new ethers.providers.FallbackProvider([ethers.provider], 1);
  provider.getFeeData = async () => FEE_DATA ;
  const deployer = new ethers.Wallet(config.networks["hyperspace"].accounts[0]).connect(provider)

  const contractName ="ERC20Verifier"
  const name = "ERC20ZKPVerifier";
  const symbol = "ERCZKP";
  const ERC20ContractFactory = await ethers.getContractFactory(contractName, deployer);
  const erc20instance = await ERC20ContractFactory.deploy(
    name,
    symbol
  );

  await erc20instance.deployed();
  console.log(contractName, " deployed to:", erc20instance.address);

  // set default query
  const circuitId = "credentialAtomicQueryMTP"; //"credentialAtomicQueryMTP";

  // mtp:validator: 0x845fEb2fb68D5857e2447C474AD5fcaf29d91197   // current mtp validator address on hyperspace
  // sig:validator: 0x2aF149a52314eF434501DDD752A22de824202FD0   // current sig validator address on hyperspace
  const validatorAddress = "0x2aF149a52314eF434501DDD752A22de824202FD0";

  const ageQuery = {
    schema: ethers.BigNumber.from("210459579859058135404770043788028292398"),
    slotIndex: 2,
    operator: 2,
    value: [20020101, ...new Array(63).fill(0).map(i => 0)],
    circuitId,
  };

  const requestId = await erc20instance.TRANSFER_REQUEST_ID();
  try {
    let tx = await erc20instance.setZKPRequest(
      requestId,
      validatorAddress,
      ageQuery
    );
    console.log(tx.hash);
  } catch (e) {
    console.log("error: ", e);
  }

  const outputJson = {
    circuitId,
    token: erc20instance.address,
    network: process.env.HARDHAT_NETWORK,
  };
  fs.writeFileSync(pathOutputJson, JSON.stringify(outputJson, null, 1));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
