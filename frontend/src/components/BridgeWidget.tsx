import React, { useState, useEffect } from 'react';
import { Contract, formatUnits, parseUnits } from 'ethers';
import { ArrowDownUp, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const CHAIN_INFO = {
  1: { name: 'Ethereum', symbol: 'ETH', decimals: 18, usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  42161: { name: 'Arbitrum', symbol: 'ETH', decimals: 18, usdc: '0xaf88d065e77c8cc2239327c5edb3a432268e5831' },
  50: { name: 'XDC', symbol: 'XDC', decimals: 18, usdc: '0x2a8e898b6242355c290e1f4fc966b8788729a4d4' }
};

const LOCKER_ABI = [
  'function initPaused() external view returns (bool)',
  'function globalPaused() external view returns (bool)',
  'function fees(uint24) external view returns (uint256)',
  'function userLock(uint24,address,uint256) external payable'
];

const MINTER_ABI = [
  'function initPaused() external view returns (bool)',
  'function globalPaused() external view returns (bool)',
  'function fees(uint24) external view returns (uint256)',
  'function lockedOn(uint24) external view returns (uint256)',
  'function userBurn(uint24,address,uint256) external payable'
];

const MINTER_MANAGER_ABI = [
  'function minterAllowance(address) external view returns (uint256)'
];

const BridgeWidget = ({ provider, account }) => {
  const [sourceChain, setSourceChain] = useState(50); // Default from XDC
  const [destChain, setDestChain] = useState(1); // Default to Ethereum
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('0');
  const [availableBalance, setAvailableBalance] = useState('0');
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!provider || !account) return;
    checkBridgeStatus();
  }, [provider, account, sourceChain, destChain]);

  const checkBridgeStatus = async () => {
    try {
      setError('');
      setIsLoading(true);

      const isFromNative = sourceChain === 1 || sourceChain === 42161;
      const contractAddress = isFromNative
        ? '0x7c62Bb89ABb22a6bA8668bEE8ddEC416bD402492'
        : '0x7a0182d8C3D6F52F615FF8bCbbEed66436281De4';

      const contract = new Contract(
        contractAddress,
        isFromNative ? LOCKER_ABI : MINTER_ABI,
        provider
      );

      const [initPaused, globalPaused] = await Promise.all([
        contract.initPaused(),
        contract.globalPaused()
      ]);
      setIsPaused(initPaused || globalPaused);

      const feeAmount = await contract.fees(destChain);
      setFee(formatUnits(feeAmount, 18));

      if (isFromNative) {
        const managerContract = new Contract(
          '0x2A8E898b6242355c290E1f4Fc966b8788729A4D4',
          MINTER_MANAGER_ABI,
          provider
        );
        const allowance = await managerContract.minterAllowance(
          '0x7a0182d8C3D6F52F615FF8bCbbEed66436281De4'
        );
        setAvailableBalance(formatUnits(allowance, 6));
      } else {
        const locked = await contract.lockedOn(destChain);
        setAvailableBalance(formatUnits(locked, 6));
      }
    } catch (err) {
      console.error('Bridge status check failed:', err);
      setError('Failed to check bridge status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBridge = async () => {
    if (!provider || !account || !amount) return;
    try {
      setError('');
      setSuccess(false);
      setIsLoading(true);

      const isFromNative = sourceChain === 1 || sourceChain === 42161;
      const signer = provider.getSigner();

      const usdcAddress = CHAIN_INFO[sourceChain].usdc;

      const usdcContract = new Contract(
        usdcAddress,
        ['function approve(address,uint256) external returns (bool)'],
        signer
      );

      const bridgeAddress = isFromNative
        ? '0x7c62Bb89ABb22a6bA8668bEE8ddEC416bD402492'
        : '0x7a0182d8C3D6F52F615FF8bCbbEed66436281De4';

      const approvalTx = await usdcContract.approve(
        bridgeAddress,
        parseUnits(amount, 6)
      );
      await approvalTx.wait();

      const bridgeContract = new Contract(
        bridgeAddress,
        isFromNative ? LOCKER_ABI : MINTER_ABI,
        signer
      );

      const bridgeTx = await (isFromNative
        ? bridgeContract.userLock(
            destChain,
            account,
            parseUnits(amount, 6),
            { value: parseUnits(fee, 18) }
          )
        : bridgeContract.userBurn(
            destChain,
            account,
            parseUnits(amount, 6),
            { value: parseUnits(fee, 18) }
          )
      );

      await bridgeTx.wait();
      setSuccess(true);
      setAmount('');
    } catch (err) {
      console.error('Bridge transaction failed:', err);
      setError(err.message || 'Bridge transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  const swapChains = () => {
    setSourceChain(destChain);
    setDestChain(sourceChain);
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-blue-50 dark:bg-blue-900 rounded shadow space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2 text-blue-800 dark:text-white">
        <ArrowDownUp size={20} className="text-blue-600" />
        Bridge USDC
      </h2>

      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <label className="block text-sm mb-1 text-blue-900 dark:text-white">From</label>
          <select
            value={sourceChain}
            onChange={(e) => setSourceChain(Number(e.target.value))}
            className="w-full p-2 rounded border border-blue-300 dark:border-blue-600"
          >
            <option value={1}>Ethereum</option>
            <option value={42161}>Arbitrum</option>
            <option value={50}>XDC</option>
          </select>
        </div>

        <button onClick={swapChains} className="p-2 mt-5 hover:bg-blue-200 dark:hover:bg-blue-700 rounded-full">
          <ArrowDownUp size={20} className="text-blue-800 dark:text-white" />
        </button>

        <div className="flex-1">
          <label className="block text-sm mb-1 text-blue-900 dark:text-white">To</label>
          <select
            value={destChain}
            onChange={(e) => setDestChain(Number(e.target.value))}
            className="w-full p-2 rounded border border-blue-300 dark:border-blue-600"
          >
            <option value={1}>Ethereum</option>
            <option value={42161}>Arbitrum</option>
            <option value={50}>XDC</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1 text-blue-900 dark:text-white">Amount (USDC)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 rounded border border-blue-300 dark:border-blue-600"
          placeholder="0.00"
        />
        <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">Available: {availableBalance} USDC</p>
      </div>

      {fee !== '0' && (
        <p className="text-sm text-blue-700 dark:text-blue-200">Bridge fee: {fee} {CHAIN_INFO[sourceChain].symbol}</p>
      )}

      {isPaused && (
        <div className="p-3 bg-yellow-100 dark:bg-yellow-800 rounded text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
          <AlertCircle size={18} />
          Bridge is currently paused
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-800 rounded text-red-900 dark:text-red-100 flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-100 dark:bg-green-800 rounded text-green-900 dark:text-green-100 flex items-center gap-2">
          <CheckCircle2 size={18} />
          Bridge transaction successful!
        </div>
      )}

      <button
        onClick={handleBridge}
        disabled={isLoading || isPaused || !amount || Number(amount) <= 0 || Number(amount) > Number(availableBalance)}
        className="w-full p-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            Processing...
          </span>
        ) : (
          'Bridge USDC'
        )}
      </button>
    </div>
  );
};

export default BridgeWidget;