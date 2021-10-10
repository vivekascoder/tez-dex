import React, { useState, useEffect } from "react";
import "./index.css";

import { TezosToolkit } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
// import { OpKind, MANAGER_LAMBDA } from "@taquito/taquito";
import CONFIG from "./config.js";

const btnClass = `px-4 py-2 text-xs uppercase font-semibold bg-purple-500 text-white rounded-sm hover:bg-purple-600`;

function Notification({ error, setError }) {
  return (
    <div
      className={`fixed bottom-2 left-2 right-2 p-4 text-sm bg-purple-500 text-white shadow-md z-50 
        ${error ? "block" : "hidden"}`}
    >
      <div className="flex items-center space-x-4">
        <button
          onClick={() => {
            setError("");
          }}
        >
          ❎
        </button>
        <p className="flex-1">{error}</p>
      </div>
    </div>
  );
}

function App() {
  const [tezos, setTezos] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [error, setError] = useState("");
  const [swapXtzAmount, setSwapXtzAmount] = useState(0);
  const [swapTokenAmount, setSwapTokenAmount] = useState(0);

  async function connectToWallet() {
    if (!tezos) {
      const t = new TezosToolkit(CONFIG.rpcUrl);
      const wallet = new BeaconWallet({
        name: "Tez Dex",
        preferredNetwork: CONFIG.preferredNetwork,
      });
      await wallet.requestPermissions({
        network: { type: CONFIG.preferredNetwork },
      });
      t.setWalletProvider(wallet);
      const pkh = await t.wallet.pkh();
      setTezos(t);
      setWallet(pkh);
    } else {
      setError("The wallet is already connected.");
    }
  }

  async function exchange() {
    try {
      const dexContract = await tezos.wallet.at(CONFIG.dexAddress);
      if (swapXtzAmount > 0) {
        // Swap Xtz -> Token
        console.log('Tez -> Token')
        const xtz = parseInt(swapXtzAmount * 10 ** 6);
        
        // Interacting with the entry_point
        const op = await dexContract.methods.tez_to_token().send({amount: xtz, mutez: true});
        setError(`Operation Hash: ${op.opHash}`)
        const result = await op.confirmation();
        console.log(result);
      } 
      else if(swapTokenAmount > 0) {
        console.log('Token-> Tez')
        // Swap Token -> Xtz
        const catAmount = parseInt(swapTokenAmount * CONFIG.tokenDecimals);
        const tokenContract = await tezos.wallet.at(CONFIG.tokenAddress);
        const batch = await tezos.wallet.batch()
        .withContractCall(
          tokenContract.methods.approve(
            CONFIG.dexAddress,
            catAmount,
          )
        )
        .withContractCall(
          dexContract.methods.token_to_tez(catAmount)
        )
        const batchOp = await batch.send();
        console.log("Operation hash:", batchOp.hash);
        setError(`Operation Hash: ${batchOp.hash}`)
      } 
      else {
        setError(`Not a valid Value.`)
      }
    } catch(err) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-2xl mx-auto relative min-h-screen">
      {error ? <Notification error={error} setError={setError} /> : ""}
      <nav className="bg-gray-100 shadow-sm flex items-center justify-between p-4 mb-20">
        <h1 className="text-lg font-semibold">⚔️ Tez Dex</h1>
        <div className="flex space-x-3 items-center">
          <button className={btnClass} onClick={connectToWallet}>
            {wallet
              ? `${wallet.slice(0, 5)}...${wallet.slice(32, 36)}`
              : "💳️ Connect"}
          </button>
        </div>
      </nav>

      <div className="m-2 p-4 bg-gray-200">
        <p className="text-xs text-gray-500">⚔️ Tez Dex / Exchange</p>
        <form
          className="space-y-4 mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            exchange();
          }}
        >
          <input
            type="number"
            placeholder="Amount of XTZ"
            name="tez"
            className="block text-sm w-full"
            value={swapXtzAmount}
            onChange={(e) => {setSwapXtzAmount(e.target.value);}}
          />
          <input
            type="number"
            placeholder="Amount of Token"
            name="token"
            className="block text-sm w-full"
            value={swapTokenAmount}
            onChange={(e) => {setSwapTokenAmount(e.target.value);}}
          />
          <button
            className={btnClass}
          >
            🔃 Swap
          </button>
        </form>
      </div>

      <div className="m-2 p-4 bg-gray-200">
        <p className="text-xs text-gray-500">⚔️ Tez Dex / Add Liquidity</p>
        <form className="space-y-4 mt-4">
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Amount of XTZ"
              name="tez"
              className="text-sm w-full flex-1"
            />
            <button className={btnClass}>💦 Add</button>
          </div>
        </form>
      </div>

      <div className="m-2 p-4 bg-gray-200">
        <p className="text-xs text-gray-500">⚔️ Tez Dex / Remove Liquidity</p>
        <form className="space-y-4 mt-4">
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Amount of LP Tokens to burn"
              name="tez"
              className="text-sm w-full flex-1"
            />
            <button className={btnClass}>🔥 Remove</button>
          </div>
        </form>
      </div>

      <p className="absolute bottom-2 right-2 text-xs font-semibold">
        Coded by{" "}
        <a href="https://github.com/vivekascoder" className="text-blue-500">
          @vivekascoder
        </a>
      </p>
    </div>
  );
}

export default App;
