## ZKP Verifier on FEVM

### Overview

Repository contains implementation for onchain zero-knowledge proof verification.

We aim to provide solidity implementations of:

- Atomic query MTP validator
- Atomic query Signature validator
- ZKP Verifier standard

Also, it contains the example of ERC20 based smart contract with enabled zkp verifications for token transfers.

### Contracts

#### FEVM Hyperspace Testnet
StateV1: [0x3E5A1dec88f22b0beb8BdDf5a6460360C2DcAd1B](https://fvm.starboard.ventures/contracts/0x3E5A1dec88f22b0beb8BdDf5a6460360C2DcAd1B)
MTPValidator: [0x845fEb2fb68D5857e2447C474AD5fcaf29d91197](https://explorer.glif.io/address/0x845fEb2fb68D5857e2447C474AD5fcaf29d91197/?network=hyperspacenet)

SigValidator: [0x2aF149a52314eF434501DDD752A22de824202FD0](https://explorer.glif.io/address/0x2aF149a52314eF434501DDD752A22de824202FD0/?network=hyperspacenet)

|                    |                    Sig                   |                    MTP                     |
|:------------------:|:------------------------------------------:|:------------------------------------------:|
| **ERC20 examples** | 0xC5695C13324CaEAFB4D231372Dfd5e38f42CD754 | 0x0000000000000000000000000000000000000000 |
| **ERC20 with custom schema** | 0xeF39043d21B588961C20D468D7aF2cA3bacD2920 | 0x0000000000000000000000000000000000000000 |


0xeF39043d21B588961C20D468D7aF2cA3bacD2920


#### Polygon Mumbai Testnet.

|                    |                    Sig                   |                    MTP                     |
|:------------------:|:------------------------------------------:|:------------------------------------------:|
|   **Validators**   | 0xb1e86C4c687B85520eF4fd2a0d14e81970a15aFB | 0x217Ca85588293Fb845daBCD6385Ebf9877fAF649 |
| **ERC20 examples** | 0x752A8f2Fd1c5FC5c9241090BD183709D4591D4cb | 0x16b2e8653c7dCFd221114A7e1664D3c884f03090 |

## QR Code JSON

```json
{
    "id":"c811849d-6bfb-4d85-936e-3d9759c7f105",
    "typ":"application/iden3comm-plain-json",
    "type":"https://iden3-communication.io/proofs/1.0/contract-invoke-request",
    "body":{
        "transaction_data":{
            "contract_address":"0xC5695C13324CaEAFB4D231372Dfd5e38f42CD754",
            "method_id":"b68967e2",
            "chain_id":3141,
            "network":"fevm-hyperspace"
            },
        "reason":"airdrop participation",
        "scope":[{
            "id":1,
            "circuit_id":"credentialAtomicQuerySig",
            "rules":{
                "query":{
                    "allowed_issuers":["*"],
                    "req":{
                        "dateOfBirth":{
                            "$lt":20020101
                            }
                        },
                    "schema":{
                            "url":"88b696448270329a88f795b7197bc7fa",
                            "type":"AgeCredential"
                            }
                        }
                    }
                }]
            }
}
```
