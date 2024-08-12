import Web3 from "web3"
import { RegisteredSubscription } from "web3/lib/commonjs/eth.exports"
import dotenv from "dotenv"
import { recoverAddress } from "ethers"
dotenv.config()

const signClient = async (i: number, msgHash: string, txInfo: string[], txProcMap: Map<any, any>, web3: Web3<RegisteredSubscription>) => {
  console.log("---------------------In Sign Client---------------------")
  const flatSig = web3.eth.accounts.sign(msgHash, "0x" + process.env.PRIVATE_KEY)

  console.log("Flat Sig:", flatSig.signature)
  const addr = recoverAddress(flatSig.messageHash, flatSig.signature)
  console.log(addr)
  console.log("v:", flatSig.v, "r:", flatSig.r, "s:", flatSig.s, "hash:", flatSig.messageHash, "\n")
  let finalSig = "0x" + flatSig.r + flatSig.s + flatSig.v
  if (finalSig.length < 132) {
    throw new Error("elements in xs are not pairwise distinct")
  }

  // Handle odd length sigs
  if (finalSig.length % 2 != 0) {
    finalSig = "0x0" + finalSig.split("0x")[1]
  }

  console.log("Signature3:", finalSig)
  return Promise.resolve(finalSig)
}

/**
 * @param message
 * @param web3
 * @param txInfo
 * @param txProcMap
 * @returns
 */
//will become MPC
export const signMsg = async (message: string, web3: Web3<RegisteredSubscription>, txInfo: string[], txProcMap: Map<any, any>) => {
  try {
    //let flatSig = await web3.eth.accounts.sign(message, PK)
    const myMsgHashAndPrefix = web3.eth.accounts.hashMessage(message)
    const netSigningMsg = myMsgHashAndPrefix.substr(2)
    const i = 0
    console.log("txInfo:", txInfo)
    try {
      const mpcSig = await signClient(i, netSigningMsg, txInfo, txProcMap, web3)
      return Promise.resolve(mpcSig)
    } catch (err) {
      console.log("Error:", err)
      return Promise.reject("signClientError:")
    }
  } catch (err) {
    console.log("Error:", err)
    return Promise.reject(err)
  }
}

/**
 * Concatenate the message to be hashed.
 * @param amt
 * @param targetAddressHash
 * @param txid
 * @param toContractAddress
 * @param toChainIdHash
 * @param vault
 * @returns string
 */
export const concatMsg = (amt: string, targetAddressHash: string, txid: string, toContractAddress: string, toChainIdHash: string, vault: boolean) => {
  return amt + targetAddressHash + txid + toContractAddress + toChainIdHash + vault
}

/**
 * @param amt
 * @param web3
 * @param vault
 * @param txInfo
 * @param txProcMap
 */
export const hashAndSignTx = async (amt: string, web3: Web3<RegisteredSubscription>, vault: boolean, txInfo: string[], txProcMap: Map<any, any>) => {
  try {
    const toTargetAddrHash = txInfo[5]
    const txid = txInfo[0]
    const toChainIdHash = txInfo[2]
    const toContractAddress = txInfo[4]
    const nonce = txInfo[7]

    console.log("Hashing:", "To Wei Amount:", amt, "txid:", txid, "To Chain ID:", toChainIdHash, "Contract Address:", toContractAddress, "Vault:", vault)
    const message = concatMsg(amt, toTargetAddrHash, txid, toContractAddress, toChainIdHash, vault)
    console.log("Message:", message)
    const hash = web3.utils.soliditySha3(message)
    console.log("Hash:", hash)
    const sig = await signMsg(hash, web3, txInfo, txProcMap)
    console.log("sig2:", sig)
    // console.log("MPC Address:", web3.eth.accounts.recover(hash, sig))
    return Promise.resolve(sig)
  } catch (err) {
    if (err.toString().includes("invalid point")) {
      hashAndSignTx(amt, web3, vault, txInfo, txProcMap)
    } else {
      console.log(err)
      return Promise.reject(err)
    }
  }
}
