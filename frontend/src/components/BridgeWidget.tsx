import React, { useState, useEffect } from 'react';
import { Contract, formatUnits, parseUnits } from 'ethers';
import { ArrowDownUp, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const CHAIN_INFO = {
  1: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  42161: { name: 'Arbitrum', symbol: 'ETH', decimals: 18 },
  50: { name: 'XDC', symbol: 'XDC', decimals: 18 }
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

interface BridgeWidgetProps {
  provider: any; // Replace 'any' with the actual provider type if available, e.g., ethers.providers.Web3Provider
  account: string;
}

const BridgeWidget: React.FC<BridgeWidgetProps> = ({ provider, account }) => {
  const [sourceChain, setSourceChain] = useState(1);
  const [destChain, setDestChain] = useState(50);
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

      const usdcAddress = isFromNative
        ? '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
        : '0x2a8e898b6242355c290e1f4fc966b8788729a4d4';

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
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Bridge transaction failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const swapChains = () => {
    setSourceChain(destChain);
    setDestChain(sourceChain);
  };

  if (!provider || !account) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Bridge USDC
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Please connect your wallet to use the bridge.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className="px-6 py-5">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <ArrowDownUp size={20} className="mr-2 text-blue-500" />
          Bridge USDC
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                From
              </label>
              <select
                value={sourceChain}
                onChange={(e) => setSourceChain(Number(e.target.value))}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value={1}>Ethereum</option>
                <option value={42161}>Arbitrum</option>
                <option value={50}>XDC</option>
              </select>
            </div>

            <button
              onClick={swapChains}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowDownUp size={20} className="text-blue-500" />
            </button>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                To
              </label>
              <select
                value={destChain}
                onChange={(e) => setDestChain(Number(e.target.value))}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value={1}>Ethereum</option>
                <option value={42161}>Arbitrum</option>
                <option value={50}>XDC</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount (USDC)
            </label>
            <div className="relative rounded-md shadow-sm">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Available: {availableBalance} USDC
            </div>
          </div>

          {fee !== '0' && (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Bridge fee: {fee} {(CHAIN_INFO as Record<number, { name: string; symbol: string; decimals: number }>)[sourceChain].symbol}
            </div>
          )}

          {isPaused && (
            <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Bridge is currently paused
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3">
              <div className="flex">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Bridge transaction successful!
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleBridge}
            disabled={isLoading || isPaused || !amount || Number(amount) <= 0 || Number(amount) > Number(availableBalance)}
            className="w-full py-2 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Processing...
              </>
            ) : (
              'Bridge USDC'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BridgeWidget;
