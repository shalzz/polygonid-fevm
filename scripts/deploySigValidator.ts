import { ethers, upgrades, config, network} from "hardhat";
import {BigNumber} from "ethers";
import fs from "fs";
import path from "path";
const pathOutputJson = path.join(__dirname, "./deploy_validator_output.json");

import util from "util";
const request = util.promisify(require("request"))

async function callRpc(method, params = undefined) {
    var options = {
        method: "POST",
        url: config.networks[config.defaultNetwork].url,
        // url: "https://api.hyperspace.node.glif.io/rpc/v1",
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

  const stateAddress = "0x46Fd04eEa588a3EA7e9F055dd691C688c4148ab3"; // current iden3 state smart contract
  const verifierContractWrapperName = "VerifierSigWrapper";
  const validatorContractName = "CredentialAtomicQuerySigValidator";

  const provider = new ethers.providers.FallbackProvider([ethers.provider], 1);
  provider.getFeeData = async () => FEE_DATA ;
  const deployer = new ethers.Wallet(config.networks[config.defaultNetwork].accounts[0]).connect(provider)

  const VerifierSigWrapper = await ethers.getContractFactory(
    verifierContractWrapperName, deployer
  );
  const verifierWrapper = await VerifierSigWrapper.deploy();

  await verifierWrapper.deployed();
  console.log(
    verifierContractWrapperName,
    " deployed to:",
    verifierWrapper.address
  );

  const CredentialAtomicQueryValidator = await ethers.getContractFactory(
    validatorContractName, deployer
  );

  const CredentialAtomicQueryValidatorProxy = await upgrades.deployProxy(
    CredentialAtomicQueryValidator,
    [verifierWrapper.address, stateAddress] // current state address on mumbai
  );

  await CredentialAtomicQueryValidatorProxy.deployed();
  console.log(
    validatorContractName,
    " deployed to:",
    CredentialAtomicQueryValidatorProxy.address
  );

  const outputJson = {
    verifierContractWrapperName,
    validatorContractName,
    validator: CredentialAtomicQueryValidatorProxy.address,
    verifier: verifierWrapper.address,
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
