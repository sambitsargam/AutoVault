import React, { useState } from 'react';
import { Strategy } from '../types';
import { TrendingUp, HelpCircle, Award, AlertTriangle } from 'lucide-react';

interface StrategyListProps {
  strategies: Strategy[];
  recommendation: string;
  reason: string;
  advisorError: string | null;
  isLoading: boolean;
}

const StrategyList: React.FC<StrategyListProps> = ({
  strategies,
  recommendation,
  reason,
  advisorError,
  isLoading
}) => {
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);

  const toggleExpand = (name: string) => {
    setExpandedStrategy(expandedStrategy === name ? null : name);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-200">
      <div className="px-6 py-5">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <TrendingUp size={20} className="mr-2 text-blue-500" />
          Strategy APYs
        </h2>
        
        {advisorError && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start">
              <AlertTriangle size={16} className="mt-0.5 mr-2 text-yellow-600 dark:text-yellow-500" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">{advisorError}</p>
            </div>
          </div>
        )}
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ))}
          </div>
        ) : (
          <ul className="space-y-3">
            {strategies.map(strategy => {
              const isRecommended = strategy.name === recommendation;
              const isExpanded = strategy.name === expandedStrategy;
              
              return (
                <li 
                  key={strategy.name}
                  className={`p-3 rounded-lg transition-all duration-200 ${
                    isRecommended 
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                      : 'bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(strategy.name)}>
                    <div className="flex items-center">
                      {isRecommended && (
                        <Award size={18} className="mr-2 text-green-500 dark:text-green-400" />
                      )}
                      <span className={`font-medium ${isRecommended ? 'text-green-700 dark:text-green-300' : 'text-gray-800 dark:text-gray-200'}`}>
                        {strategy.name}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <span className={`font-semibold mr-2 ${
                        isRecommended ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {strategy.apy?.toFixed(2)}%
                      </span>
                      
                      {isRecommended && (
                        <button 
                          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(strategy.name);
                          }}
                        >
                          <HelpCircle size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {isRecommended && isExpanded && reason && (
                    <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800 text-sm text-gray-600 dark:text-gray-300 animate-fadeIn">
                      <p>{reason}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StrategyList;