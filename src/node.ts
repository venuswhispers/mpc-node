
/*
 * Teleport Bridge 
 * Copyright (c) Artrepreneur1
 * Use of this source code is governed by an MIT
 * license that can be found in the LICENSE file.
 * This is an implementation of a privacy bridging node. 
 * Currently, utilizes ECDSA Signatures to validate burning or vaulting of assets.
 * Signatures allow minting to occur cross chain. 
 */
import type { SETTINGS } from './types'
import cors from 'cors';
import express from 'express';
import path from 'path';
import util from 'util';
import ethers from 'ethers';
import Web3 from 'web3';
import axios from 'axios';
import ip from 'ip';
import find from 'find-process';
import { settings } from './config';

/* Settings Mapping */
const settingsMap = new Map();

for (const [key, value] of Object.entries(settings)) {
  //Stucture: settingsMap.set('someLuxCoin', {chain1:'', ..., chainN: ''})  
  settingsMap.set(key, value);
}

/* RPC list */
const rpcList = settings.RPC;
/* Networks (ie. chains) */
const networkName = settings.NetNames;
/* DB */
const DB = settings.DB;
/* Signature Re-signing flag */
const newSigAllowed = settings.NewSigAllowed;
/* Signing MSG */
var msg = settings.Msg; //signing msg used in front running prevention
/* List of Signing Managers for MPC */
const sm_managers = settings.SigningManagers;
/** key share for this node */
const keyStore = settings.KeyStore;
/* MPC Peers */
const mpcPeerArr = [];
/* Dupelist - a graylist for slowing flood attack */
var dupeStart = 0, dupeStop = 0;
var dupeListLimit = Number(settings.DupeListLimit);
var dupeList = new Map();
/* SM Manager Timeout Params */
const smTimeOutBound = (Number(settings.SMTimeout) * 100 * Math.random()) % 60; //0.5;
/* TXID processing state */
const txProcMap = new Map();
/* Bridge contracts for Teleport Bridge */
const list = settings.Teleporter;

function getWeb3ForId(toNetId: number) {
  return new Web3(new Web3.providers.HttpProvider(rpcList[toNetId]));
}

/* Given network id returns the appropriate contract to talk to as array of values */
const getNetworkAddresses = (toNetId: number, tokenName: string) => {
  let arr: any[] = [];
  const web3 = getWeb3ForId(toNetId);
  const chainName: string = networkName[toNetId];
  console.log('tokenName.toString():', tokenName.toString(), 'chainName:', chainName);
  arr.push(settings[tokenName][chainName], web3, list[chainName]);
  return arr;
}

var Exp = /((^[0-9]+[a-z]+)|(^[a-z]+[0-9]+))+[0-9a-z]+$/i;

const app = express();
app.use(cors());

app.get("/", (req: express.Request, res: express.Response) => {
  res.json("running...")
});

var port = process.env.PORT || 6000; //6000;
var server = app.listen(port, function () {
  var host = server.address();
  console.log('>> Teleporter Running At:', host, port);
});