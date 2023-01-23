import { ethers, upgrades, config } from "hardhat";
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

export async function deployValidatorContracts(
  verifierContractWrapperName: string,
  validatorContractName: string
): Promise<{
  state: any;
  validator: any;
}> {
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

  const StateVerifier = await ethers.getContractFactory("Verifier", deployer);
  const stateVerifier = await StateVerifier.deploy();

  await stateVerifier.deployed();
  console.log("State Verifier deployed to:", stateVerifier.address);

  const ValidatorContractVerifierWrapper = await ethers.getContractFactory(
    verifierContractWrapperName, deployer
  );
  const validatorContractVerifierWrapper =
    await ValidatorContractVerifierWrapper.deploy();

  await validatorContractVerifierWrapper.deployed();
  console.log(
    "Validator Verifier Wrapper deployed to:",
    validatorContractVerifierWrapper.address
  );

  const State = await ethers.getContractFactory("State", deployer);
  const state = await upgrades.deployProxy(State, [stateVerifier.address]);

  await state.deployed();

  console.log("State deployed to:", state.address);

  const ValidatorContract = await ethers.getContractFactory(
    validatorContractName, deployer
  );

  const validatorContractProxy = await upgrades.deployProxy(ValidatorContract, [
    validatorContractVerifierWrapper.address,
    state.address,
  ]);

  await validatorContractProxy.deployed();
  console.log(
    `${validatorContractName} deployed to: ${validatorContractProxy.address}`
  );

  return {
    validator: validatorContractProxy,
    state,
  };
}

export async function deployERC20ZKPVerifierToken(
  name: string,
  symbol: string
): Promise<{
  address: string;
}> {
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

  const ERC20Verifier = await ethers.getContractFactory("ERC20Verifier", deployer);
  const erc20Verifier = await ERC20Verifier.deploy(name, symbol);

  await erc20Verifier.deployed();
  console.log("ERC20Verifier deployed to:", erc20Verifier.address);

  return erc20Verifier;
}

export interface VerificationInfo {
  inputs: Array<string>;
  pi_a: Array<string>;
  pi_b: Array<Array<string>>;
  pi_c: Array<string>;
}

export function prepareInputs(json: any): VerificationInfo {
  const { proof, pub_signals } = json;
  const { pi_a, pi_b, pi_c } = proof;
  const [[p1, p2], [p3, p4]] = pi_b;
  const preparedProof = {
    pi_a: pi_a.slice(0, 2),
    pi_b: [
      [p2, p1],
      [p4, p3],
    ],
    pi_c: pi_c.slice(0, 2),
  };

  return { inputs: pub_signals, ...preparedProof };
}

export function toBigNumber({ inputs, pi_a, pi_b, pi_c }: VerificationInfo) {
  return {
    inputs: inputs.map((input) => ethers.BigNumber.from(input)),
    pi_a: pi_a.map((input) => ethers.BigNumber.from(input)),
    pi_b: pi_b.map((arr) => arr.map((input) => ethers.BigNumber.from(input))),
    pi_c: pi_c.map((input) => ethers.BigNumber.from(input)),
  };
}

export async function publishState(
  state: any,
  json: { [key: string]: string }
): Promise<void> {
  const {
    inputs: [id, oldState, newState, isOldStateGenesis],
    pi_a,
    pi_b,
    pi_c,
  } = prepareInputs(json);

  const transitStateTx = await state.transitState(
    id,
    oldState,
    newState,
    isOldStateGenesis === "1" ? true : false,
    pi_a,
    pi_b,
    pi_c
  );

  await transitStateTx.wait();
}
