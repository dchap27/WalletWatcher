import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JsonRpcProvider, isAddress, getAddress, formatEther, Contract } from 'ethers';
import '@testing-library/jest-dom';
import App from './App';

// Mock the entire ethers module
jest.mock('ethers', () => ({
    ...jest.requireActual('ethers'),
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
        resolveName: jest.fn(),
        getBalance: jest.fn(),
        lookupAddress: jest.fn(),
    })),
    isAddress: jest.fn(),
    getAddress: jest.fn(),
    formatEther: jest.fn(),
    Contract: jest.fn(),
}));

// Type the mocked functions
const mockIsAddress = isAddress as jest.MockedFunction<typeof isAddress>;
const mockGetAddress = getAddress as jest.MockedFunction<typeof getAddress>;
const mockFormatEther = formatEther as jest.MockedFunction<typeof formatEther>;
const mockContract = Contract as jest.MockedClass<typeof Contract>;

describe('Integration Tests', () => {
  let mockProvider: {
        resolveName: jest.Mock;
        getBalance: jest.Mock;
        lookupAddress: jest.Mock;
    };

  beforeEach(() => {
    jest.clearAllMocks();

    mockProvider = {
        resolveName: jest.fn(),
        getBalance: jest.fn(),
        lookupAddress: jest.fn()
    };

    (JsonRpcProvider as jest.Mock).mockImplementation(() => mockProvider);
  });

  test('complete flow: ENS resolution to wallet info display', async () => {
    
    // Mock ENS resolution
    mockIsAddress.mockReturnValue(false); // Input is ENS name
    mockProvider.resolveName.mockResolvedValue('0x1234567890123456789012345678901234567890');
    mockGetAddress.mockReturnValue('0x1234567890123456789012345678901234567890');
    
    // Mock balance and reverse ENS
    (mockProvider.getBalance as jest.Mock).mockResolvedValue(BigInt('1500000000000000000'));
    (mockProvider.lookupAddress as jest.Mock).mockResolvedValue('vitalik.eth');
    mockFormatEther.mockReturnValue('1.5');
    
    render(<App />);
    
    // Input ENS name
    const input = screen.getByLabelText(/ethereum address or ens name/i);
    fireEvent.change(input, { target: { value: 'vitalik.eth' } });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /check wallet/i });
    fireEvent.click(submitButton);
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText(/wallet information/i)).toBeInTheDocument();
      expect(screen.getByText(/vitalik\.eth/)).toBeInTheDocument();
      expect(screen.getByText(/1\.5000 ETH/)).toBeInTheDocument();
    });
  });

  test('complete flow: Address input to wallet info with token balances', async () => {
    
    // Mock address validation
    mockIsAddress.mockReturnValue(true);
    mockGetAddress.mockReturnValue('0x1234567890123456789012345678901234567890');
    
    // Mock balance
    mockProvider.getBalance.mockResolvedValue(BigInt('2000000000000000000'));
    mockProvider.lookupAddress.mockResolvedValue(null); // No ENS name
    mockFormatEther.mockReturnValue('2.0');
    
    // Mock token contracts
    const mockContractInstance = {
      balanceOf: jest.fn().mockResolvedValue('1000000'),
      decimals: jest.fn().mockResolvedValue(6),
      symbol: jest.fn().mockResolvedValue('USDT'),
    } as unknown as Contract;

    mockContract.mockImplementation(() => mockContractInstance);
    
    render(<App />);
    
    // Input address
    const input = screen.getByLabelText(/ethereum address or ens name/i);
    fireEvent.change(input, { target: { value: '0x1234567890123456789012345678901234567890' } });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /check wallet/i });
    fireEvent.click(submitButton);
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByText(/wallet information/i)).toBeInTheDocument();
      expect(screen.getByText(/2\.0000 ETH/)).toBeInTheDocument();
      expect(screen.getByText(/token balances/i)).toBeInTheDocument();
    });
  });
});