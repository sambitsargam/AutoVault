import React, { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, AlertCircle } from 'lucide-react';

interface ActionPanelProps {
  isTransacting: boolean;
  error: string | null;
  onDeposit: (amount: string) => Promise<boolean>;
  onWithdraw: (amount: string) => Promise<boolean>;
}

const ActionPanel: React.FC<ActionPanelProps> = ({
  isTransacting,
  error,
  onDeposit,
  onWithdraw
}) => {
  const [amount, setAmount] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [transactionSuccess, setTransactionSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransactionSuccess(false);
    
    try {
      const success = await (activeTab === 'deposit' 
        ? onDeposit(amount) 
        : onWithdraw(amount));
        
      if (success) {
        setAmount('');
        setTransactionSuccess(true);
        setTimeout(() => setTransactionSuccess(false), 5000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-200">
      <div className="px-6 py-5">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Actions
        </h2>
        
        <div className="mb-4">
          <div className="flex rounded-md overflow-hidden">
            <button
              type="button"
              className={`flex-1 py-2 px-4 ${
                activeTab === 'deposit'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              } transition-colors duration-200`}
              onClick={() => setActiveTab('deposit')}
            >
              <div className="flex items-center justify-center">
                <ArrowDownCircle size={16} className="mr-2" />
                Deposit
              </div>
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-4 ${
                activeTab === 'withdraw'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              } transition-colors duration-200`}
              onClick={() => setActiveTab('withdraw')}
            >
              <div className="flex items-center justify-center">
                <ArrowUpCircle size={16} className="mr-2" />
                Withdraw
              </div>
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount (USDC.e)
            </label>
            <div className="relative rounded-md shadow-sm">
              <input
                type="number"
                id="amount"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="block w-full pr-12 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200 py-2 px-3"
                step="0.000001"
                min="0"
                required
                disabled={isTransacting}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400">USDC.e</span>
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isTransacting || !amount || parseFloat(amount) <= 0}
            className={`w-full py-2 px-4 rounded-md ${
              activeTab === 'deposit'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white font-medium transition-colors duration-200 disabled:opacity-70 flex items-center justify-center`}
          >
            {isTransacting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              activeTab === 'deposit' ? 'Deposit' : 'Withdraw'
            )}
          </button>
          
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 animate-fadeIn">
              <div className="flex">
                <AlertCircle size={16} className="text-red-500 dark:text-red-400 mt-0.5" />
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {transactionSuccess && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 animate-fadeIn">
              <div className="flex">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Transaction completed successfully!
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ActionPanel;