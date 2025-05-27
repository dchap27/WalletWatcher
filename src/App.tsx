import React, { useState, ChangeEvent, FormEvent } from 'react';
import "./styles.css";

import { JsonRpcProvider, formatEther, isAddress, Contract, formatUnits, getAddress } from 'ethers';

// Define interfaces for better type safety
interface TokenBalance {
  symbol?: string;
  address: string;
  balance: string | null;
  decimals?: number;
  error?: boolean;
}

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

export async function getTokenBalance(
  provider: JsonRpcProvider,
  walletAddress: string,
  tokenAddress: string
): Promise<TokenBalance> {
  try {
    // address validation
    let checksummedTokenAddress: string;
    try{
      checksummedTokenAddress = getAddress(tokenAddress); // this enforces checksum
    } catch (checksumError){
      console.error(`Invalid address format for ${tokenAddress}:`, checksumError);
      return {
        address: tokenAddress,
        balance: null,
        error: true
      };
    }
    const tokenContract = new Contract(checksummedTokenAddress, ERC20_ABI, provider);
    const [rawBalance, decimals, symbol] = await Promise.all([
      tokenContract.balanceOf(walletAddress),
      tokenContract.decimals(),
      tokenContract.symbol()
    ]);
    return {
      symbol,
      address: checksummedTokenAddress,
      balance: formatUnits(rawBalance, decimals),
      decimals
    };

  } catch (err) {
    console.error(`Error fetching token ${tokenAddress}:`, err);
    return {
      address: tokenAddress,
      balance: null,
      error: true
    };
  }
}

const TOKENS = [
  {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT mainnet
    name: "Tether"
  },
  {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC mainnet
    name: "USD Coin"
  }
];

export default function App() {
  // State variables - these store data that can change
  const [walletAddress, setWalletAddress] = useState<string>(''); // Stores the user input
  const [isLoading, setIsLoading] = useState<boolean>(false);      // Tracks if we're fetching data
  const [error, setError] = useState<string>('');                // Stores any error messages
  const [balance, setBalance] = useState<string | null>(null);          // Stores the wallet balance
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  
  // Event handler for input changes
  const handleAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    setWalletAddress(e.target.value);
    // Clear errors when user types
    if (error) setError('');
  };

  // helper function to formats the balance
  const formatBalance = (balance: string): string => {
    const num = parseFloat(balance);
    return num.toLocaleString(undefined, 
      { minimumFractionDigits: 4, maximumFractionDigits: 4});
  }

  // Abbreviate wallet address
  const shortenAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  
  // Event handler for form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevents page refresh on form submit
    
    // Input validation
    if (!walletAddress.trim()) {
      setError('Please enter a wallet address');
      return;
    }
    
    // Handle ETH address format validation
    if (!isAddress(walletAddress.trim())) {
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

      const fetchedTokenBalances = await Promise.all(
        TOKENS.map(token => 
          getTokenBalance(provider, walletAddress, token.address))
      );
      setTokenBalances(fetchedTokenBalances);
      
    } catch (err) {
      // for debugging
      console.error(err);
      setError('Failed to fetch balance. Please try again later');
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
          <div className="mt-6 p-6 bg-white border border-green-300 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-green-800 mb-1">Wallet Info</h2>
            
            <div className="text-sm text-gray-500 mb-2">
              <span className="font-medium">Address:</span> {shortenAddress(walletAddress)}
            </div>

            <div className="text-lg font-bold text-green-700">
              <span className="font-medium">Balance: </span>{formatBalance(balance)} ETH
            </div>
          </div>
        )}

        {tokenBalances.length > 0 && (
          <div className="mt-4 p-4 bg-blue-100 border border-blue-300 rounded-md">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">Token Balances</h2>
            <ul className="space-y-2">
              {tokenBalances.map((token, index) => (
                <li key={index} className="text-blue-700 font-medium">
                  {token.balance && token.symbol ? `${token.balance} ${token.symbol}` : 'Error loading token'}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}