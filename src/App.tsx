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

interface WalletInfo {
  address: string;
  ensName: string | null;
  balance: string;
  tokenBalances: TokenBalance[];
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

// Helper function to check if address is an ENS name
const isENSName = (input: string): boolean => {
  return input.includes('.') && (input.endsWith('.eth') || input.includes('.'));
};

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
  const [walletInput, setWalletInput] = useState<string>(''); // Stores the user address
  const [isLoading, setIsLoading] = useState<boolean>(false);      // Tracks if we're fetching data
  const [error, setError] = useState<string>('');                // Stores any error messages
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null); // Stores complete wallet info
  
  // Event handler for address changes
  const handleAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    setWalletInput(e.target.value);
    // Clear errors and previous results when user types
    if (error) setError('');
    if (walletInfo) setWalletInfo(null);
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

  // Enhanced ENS resolution function
  const resolveAddressAndENS = async (provider: JsonRpcProvider, input: string) => {
    let resolvedAddress: string | null;
    let ensName: string | null = null;

    try {
      if (isENSName(input)) {
        // Forward ENS resolution: ENS name to address
        resolvedAddress = await provider.resolveName(input);
        if (!resolvedAddress) {
          throw new Error('ENS name could not be resolved');
        }
        ensName = input; // The input itself is the ENS name
      } else {
        // Input is an address, validate it
        if (!isAddress(input.trim())) {
          throw new Error('Please enter a valid ETH wallet address or ENS name');
        }
        resolvedAddress = getAddress(input.trim()); // Checksum the address
        
        // Reverse ENS resolution: address to ENS name
        try {
          ensName = await provider.lookupAddress(resolvedAddress);
        } catch {
          // It's okay if reverse resolution fails, not all addresses have ENS names
        }
      }

      return { address: resolvedAddress, ensName };
    } catch (err) {
      throw err;
    }
  };
  
  // Event handler for form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevents page refresh on form submit
    
    // Input validation
    if (!walletInput.trim()) {
      setError('Please enter a wallet address or ENS Name');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setWalletInfo(null);
    
    try {
      // Get the wallet balance 
      // We'll use Etherscan API here
      const provider = new JsonRpcProvider(
        process.env.REACT_APP_RPC_URL
      );

      // Resolve address and ENS name
      const { address, ensName } = await resolveAddressAndENS(provider, walletInput.trim());

      // Get wallet balance
      const balance = await provider.getBalance(address);
      const formattedBalance = formatEther(balance);

      const fetchedTokenBalances = await Promise.all(
        TOKENS.map(token => 
          getTokenBalance(provider, address, token.address))
      );
      
      // Set all wallet information
      setWalletInfo({
        address,
        ensName,
        balance: formattedBalance,
        tokenBalances: fetchedTokenBalances
      });
      
    } catch (err) {
      // for debugging
      console.error(err);
      const errorMessage = 'Failed to fetch wallet information. Please try again later';
      setError(errorMessage);
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
            <label htmlFor="wallet-input" className="block text-sm font-medium text-gray-700 mb-2">
              Ethereum Address or ENS Name
            </label>
            <input
              id="wallet-input"
              type="text"
              value={walletInput}
              onChange={handleAddressChange}
              placeholder="0x... or abc.eth"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter an Ethereum address (0x...) or ENS name (.eth)
            </p>
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Checking...' : 'Check Wallet'}
          </button>
        </form>
        
        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {/* Success state */}
        {walletInfo && !error && (
          <div className="mt-6 p-6 bg-white border border-green-300 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-green-800 mb-1">Wallet Information</h2>
            
            <div className="space-y-2 mb-4">
              <div className="text-sm">
                <span className="font-medium text-gray-600">Address:</span>
                <br />
                <span className="text-gray-800 font-mono text-xs">{shortenAddress(walletInfo.address)}</span>
              </div>

              {walletInfo.ensName && (  
                <div className="text-sm">
                  <span className="font-medium text-gray-600">ENS Name:</span>
                  <br />
                  <span className="text-green-700 font-medium">{walletInfo.ensName}</span>
                </div>
              )}

              <div className="text-sm">
                <span className="font-medium text-gray-600">ETH Balance:</span>
                <br />
                <span className="text-lg font-bold text-green-700">
                  {formatBalance(walletInfo.balance)} ETH
                </span>
              </div>
            </div>
          </div>
        )}

        {walletInfo && walletInfo.tokenBalances.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Token Balances</h3>
            <div className="space-y-2">
              {walletInfo.tokenBalances.map((token, index) => (
                <div key={index} className="flex justify-between items-center py-2 px-3 bg-white rounded border">
                  <span className="font-medium text-gray-700">
                    {token.symbol || 'Unknown Token'}
                  </span>
                  <span className="text-blue-700 font-medium">
                    {token.balance && !token.error 
                      ? `${parseFloat(token.balance).toLocaleString(undefined, { maximumFractionDigits: 4 })}`
                      : 'Error'
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}