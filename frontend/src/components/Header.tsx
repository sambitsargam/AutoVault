import React from 'react';
import { formatAddress } from '../utils/format';
import { Wallet } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  network: string;
  account: string;
  isConnecting: boolean;
  onConnect: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  network, 
  account, 
  isConnecting, 
  onConnect 
}) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">
                AutoVault
              </h1>
            </div>
            <div className="ml-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="hidden sm:inline">Network:</span> XDC Mainnet
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {account ? (
              <div className="flex items-center px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                <Wallet size={16} className="mr-2" />
                <span>{formatAddress(account)}</span>
              </div>
            ) : (
              <button
                onClick={onConnect}
                disabled={isConnecting}
                className="flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-200 disabled:opacity-70"
              >
                <Wallet size={16} className="mr-2" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;