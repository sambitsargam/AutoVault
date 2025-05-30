import { CivicAuthProvider, UserButton } from "@civic/auth-web3/react";
import { ThemeProvider } from "./context/ThemeContext";
import useWallet from "./hooks/useWallet";
import useVault from "./hooks/useVault";
import Header from "./components/Header";
import VaultOverview from "./components/VaultOverview";
import StrategyList from "./components/StrategyList";
import ActionPanel from "./components/ActionPanel";
import BridgeWidget from './components/BridgeWidget';
import WalletDetails from "./components/WalletDetails";
import { ArrowRight, Shield, Zap, BarChart } from "lucide-react";

/**
 * Wrap the entire dApp with CivicAuthProvider so that any component
 * can consume the auth context via `useUser()` or render <UserButton/>.
 * The CLIENT_ID is read from Vite env (add VITE_CIVIC_AUTH_CLIENT_ID to your .env file).
 */
function App() {
  const {
    provider,
    account,
    network,
    balance,
    usdceBalance,
    transactions,
    isConnecting,
    connectWallet
  } = useWallet();

  const {
    tvl,
    apys,
    recommendation,
    reason,
    userShares,
    shareValue,
    isLoading,
    isTransacting,
    error,
    advisorError,
    handleAction
  } = useVault(provider, account);

  const handleDeposit = async (amount: string) => {
    return handleAction("deposit", amount);
  };

  const handleWithdraw = async (amount: string) => {
    return handleAction("withdraw", amount);
  };

  /**
   * -------------------- UI FRAGMENTS --------------------
   * We keep the original “landing” and “vault” UI intact, but compute them
   * first so we can return a single JSX tree from the component.
   */
  const landingView = (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
        {/* Wallet & Network in header */}
        <Header
          network={network}
          account={account}
          isConnecting={isConnecting}
          onConnect={connectWallet}
        />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="py-20 text-center">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
              AutoVault: AI-Powered Yield Optimization
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Our advanced AI algorithms automatically allocate your funds to the highest-yielding strategies across DeFi protocols.
            </p>
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
            >
              Start Earning
              <ArrowRight className="ml-2" size={20} />
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 py-16">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm">
              <div className="inline-block p-3 bg-blue-100 dark:bg-blue-900 rounded-lg mb-4">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Secure & Audited
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our smart contracts are thoroughly audited and battle-tested for maximum security.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm">
              <div className="inline-block p-3 bg-green-100 dark:bg-green-900 rounded-lg mb-4">
                <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                AI-Powered
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Advanced algorithms continuously analyze and optimize yield strategies.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm">
              <div className="inline-block p-3 bg-purple-100 dark:bg-purple-900 rounded-lg mb-4">
                <BarChart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Real-Time Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Track your earnings and portfolio performance with detailed analytics.
              </p>
            </div>
          </div>

          {/* TVL Display */}
          <div className="text-center py-16 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Total Value Locked
            </h2>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {tvl} USDC.e
            </p>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );

  const vaultView = (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
        <Header
          network={network}
          account={account}
          isConnecting={isConnecting}
          onConnect={connectWallet}
        />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <VaultOverview
                tvl={tvl}
                userShares={userShares}
                shareValue={shareValue}
                isLoading={isLoading}
              />

              <StrategyList
                strategies={apys}
                recommendation={recommendation}
                reason={reason}
                advisorError={advisorError}
                isLoading={isLoading}
              />

              <WalletDetails
                balance={balance}
                usdceBalance={usdceBalance}
                transactions={transactions}
              />
            </div>
            <div  className=" space-y-6">
              
              <ActionPanel
                isTransacting={isTransacting}
                error={error}
                onDeposit={handleDeposit}
                onWithdraw={handleWithdraw}
              />
              <BridgeWidget
                provider={provider}
                account={account}
              />
            </div>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );

  /**
   * -------------------- RETURN --------------------
   * The CivicAuthProvider gives every child component access to auth context.
   * We also render <UserButton/> fixed to the top‑right so users can sign in
   * or manage their Civic profile at any time.
   */
  return (
    <CivicAuthProvider clientId="4df65395-a34c-4875-9fe7-6576c841e726" displayMode="iframe">
      {/* Auth widget in the corner */}
      <div className="absolute top-4 right-4 z-50">
        <UserButton />
      </div>
      {/* dApp content (wallet decides which view to show) */}
      {account ? vaultView : landingView}
    </CivicAuthProvider>
  );
}

export default App;
