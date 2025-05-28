import React from 'react';
import { formatNumber } from '../utils/format';
import { Wallet, Clock, ArrowUpRight } from 'lucide-react';

interface Transaction {
  hash: string;
  value: string | number;
  to: string;
}

interface WalletDetailsProps {
  balance: string;
  usdceBalance: string;
  transactions: Transaction[];
}

const WalletDetails: React.FC<WalletDetailsProps> = ({
  balance,
  usdceBalance,
  transactions
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-200">
      <div className="px-6 py-5">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <Wallet size={20} className="mr-2 text-blue-500" />
          Wallet Details
        </h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Native Token Balance</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatNumber(balance, 4)} XDC
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">USDC.e Balance</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatNumber(usdceBalance, 2)} USDC.e
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center mb-3">
              <Clock size={16} className="mr-2 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Recent Transactions
              </h3>
            </div>
            
            {transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div 
                    key={tx.hash}
                    className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatNumber(tx.value, 4)} XDC
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        To: {tx.to.substring(0, 6)}...{tx.to.slice(-4)}
                      </div>
                    </div>
                    <a
                      href={`https://explorer.xinfin.network/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <ArrowUpRight size={16} />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                No recent transactions
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletDetails;