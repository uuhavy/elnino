import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  BASE_CHAIN_HEX,
  BASE_RPC,
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
} from '../lib/contract';

export function useWallet() {
  const [wallet, setWallet] = useState(null); // { provider, signer, address }
  const [feeStatus, setFeeStatus] = useState(null); // null, 'paying', 'ok', 'skip'
  const [txHash, setTxHash] = useState(null);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert(
        'MetaMask không tìm thấy. Hãy cài MetaMask để dùng tính năng on-chain.',
      );
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: BASE_CHAIN_HEX }],
        });
      } catch (err) {
        if (err.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: BASE_CHAIN_HEX,
                chainName: 'Base',
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: [BASE_RPC],
                blockExplorerUrls: ['https://basescan.org'],
              },
            ],
          });
        } else {
          throw err;
        }
      }

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWallet({ provider, signer, address });
    } catch (err) {
      console.error('Wallet connect failed:', err);
      try {
        alert('Kết nối ví thất bại: ' + (err?.message || err));
      } catch (e) {}
    }
  }, []);

  const payStartFee = useCallback(async () => {
    if (!wallet?.signer) return;
    if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000')
      return;

    setFeeStatus('paying');
    try {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        wallet.signer,
      );
      const fee = await contract.gameStartFee();
      const tx = await contract.payGameStart({ value: fee });
      await tx.wait();
      setFeeStatus('ok');
      setTxHash(tx.hash);
    } catch (e) {
      console.warn('payStartFee failed:', e.message);
      setFeeStatus('skip');
    }
  }, [wallet]);

  const payEndFee = useCallback(async () => {
    if (!wallet?.signer) return;
    if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000')
      return;

    setFeeStatus('paying');
    try {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        wallet.signer,
      );
      const fee = await contract.gameEndFee();
      const tx = await contract.payGameEnd({ value: fee });
      await tx.wait();
      setFeeStatus('ok');
      setTxHash(tx.hash);
    } catch (e) {
      console.warn('payEndFee failed:', e.message);
      setFeeStatus('skip');
    }
  }, [wallet]);

  const resetFeeStatus = useCallback(() => {
    setFeeStatus(null);
    setTxHash(null);
  }, []);

  return {
    wallet,
    feeStatus,
    txHash,
    connect,
    payStartFee,
    payEndFee,
    resetFeeStatus,
  };
}
