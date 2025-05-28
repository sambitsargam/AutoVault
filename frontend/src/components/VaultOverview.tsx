import React from 'react';
import { formatNumber } from '../utils/format';
import { DollarSign, Percent, BarChart3 } from 'lucide-react';

interface VaultOverviewProps {
  tvl: string;
  userShares: string;
  shareValue: string;
  isLoading: boolean;
}

const VaultOverview: React.FC<VaultOverviewProps> = ({
  tvl,
  userShares,
  shareValue,
  isLoading
}) => {
  const hasShares = parseFloat(userShares) > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-200">
      <div className="px-6 py-5">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <BarChart3 size={20} className="mr-2 text-blue-500" />
          Vault Overview
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <DollarSign size={18} className="mr-2 text-green-500" />
              <span>Total Value Locked:</span>
            </div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {isLoading ? (
                <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : (
                `${formatNumber(tvl, 2)} USDC.e`
              )}
            </div>
          </div>
          
          {hasShares && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <Percent size={18} className="mr-2 text-blue-500" />
                  <span>Your Shares:</span>
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {isLoading ? (
                    <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ) : (
                    `${formatNumber(shareValue, 6)} vUSDC.e`
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-600 dark:text-gray-300">
                  <DollarSign size={18} className="mr-2 text-green-500" />
                  <span>Value:</span>
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {isLoading ? (
                    <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ) : (
                    `${formatNumber(shareValue, 6)} USDC.e`
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VaultOverview;