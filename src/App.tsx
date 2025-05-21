import React, { useState, ChangeEvent, FormEvent } from 'react';
import "./styles.css";

import { JsonRpcProvider, formatEther } from "ethers";

export default function App() {
  // State variables - these store data that can change
  const [walletAddress, setWalletAddress] = useState(''); // Stores the user input
  const [isLoading, setIsLoading] = useState(false);      // Tracks if we're fetching data
  const [error, setError] = useState('');                // Stores any error messages
  const [balance, setBalance] = useState<string | null>(null);          // Stores the wallet balance
  
  // Event handler for input changes
  const handleAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    setWalletAddress(e.target.value);
    // Clear errors when user types
    if (error) setError('');
  };
  
  // Event handler for form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevents page refresh on form submit
    
    // Input validation
    if (!walletAddress.trim()) {
      setError('Please enter a wallet address');
      return;
    }
    
    // Handle ETH address format validation
    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      setError('Please enter a valid ETH wallet address');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Get the wallet balance 
      // We'll use Etherscan API here
      const provider = new JsonRpcProvider(
        process.env.REACT_APP_RPC_URL
      );
      const balance = await provider.getBalance(walletAddress);
      setBalance(formatEther(balance));
      
    } catch (err) {
      setError('Failed to fetch balance');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Wallet Watcher
        </h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="wallet-address" className="block text-sm font-medium text-gray-700 mb-2">
              Ethereum Wallet Address
            </label>
            <input
              id="wallet-address"
              type="text"
              value={walletAddress}
              onChange={handleAddressChange}
              placeholder="0x..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Checking...' : 'Check Balance'}
          </button>
        </form>
        
        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {/* Success state */}
        {balance && !error && (
          <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded-md">
            <h2 className="text-lg font-semibold text-green-800 mb-2">Wallet Balance</h2>
            <p className="text-2xl font-bold text-green-700">{balance} ETH</p>
          </div>
        )}
      </div>
    </div>
  );
}
