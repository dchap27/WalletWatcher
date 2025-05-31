import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JsonRpcProvider, isAddress, getAddress } from 'ethers';
import '@testing-library/jest-dom';
import App from './App';

// Mock ethers library
jest.mock('ethers', () => ({
  ...jest.requireActual('ethers'),
  JsonRpcProvider: jest.fn().mockImplementation(() => ({
    getBalance: jest.fn(),
    resolveName: jest.fn(),
    lookupAddress: jest.fn(),
  })),
  isAddress: jest.fn(),
  getAddress: jest.fn(),
  Contract: jest.fn(),
}));

// Get the mocked functions after the mock is created
const mockIsAddress = isAddress as jest.MockedFunction<typeof isAddress>;
const mockGetAddress = getAddress as jest.MockedFunction<typeof getAddress>;

// Mock environment variable
process.env.REACT_APP_RPC_URL = 'https://mock-rpc-url.com';

describe('Wallet Watcher App', () => {
  let mockProvider: {
    resolveName: jest.Mock;
    getBalance: jest.Mock;
    lookupAddress: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Create a fresh mock provider instance
    mockProvider = {
      resolveName: jest.fn(),
      getBalance: jest.fn(),
      lookupAddress: jest.fn(),
    };
    // Make JsonRpcProvider return our mock provider
    (JsonRpcProvider as jest.Mock).mockImplementation(() => mockProvider);
  });

  test('renders app title and input field', () => {
    render(<App />);
    
    expect(screen.getByText('Wallet Watcher')).toBeInTheDocument();
    expect(screen.getByLabelText(/ethereum address or ens name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /check wallet/i })).toBeInTheDocument();
  });

  test('shows error for empty input', async () => {
    render(<App />);
    
    const submitButton = screen.getByRole('button', { name: /check wallet/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a wallet address or ens name/i)).toBeInTheDocument();
    });
  });

  test('shows error for invalid address', async () => {

    mockIsAddress.mockReturnValue(false);

    
    render(<App />);
    
    const input = screen.getByLabelText(/ethereum address or ens name/i);
    const submitButton = screen.getByRole('button', { name: /check wallet/i });
    
    fireEvent.change(input, { target: { value: 'invalid-address' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid eth wallet address or ens name/i)).toBeInTheDocument();
    });
  });

  test('handles ENS name input correctly', async () => {
    
    mockIsAddress.mockReturnValue(false);
    mockProvider.resolveName.mockResolvedValue('0x1234567890123456789012345678901234567890');
    mockProvider.getBalance.mockResolvedValue(BigInt(1500000000000000000));
    mockProvider.lookupAddress.mockResolvedValue('vitalik.eth');
    mockGetAddress.mockReturnValue('0x1234567890123456789012345678901234567890');
    
    render(<App />);
    
    const input = screen.getByLabelText(/ethereum address or ens name/i);
    const submitButton = screen.getByRole('button', { name: /check wallet/i });
    
    fireEvent.change(input, { target: { value: 'vitalik.eth' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/wallet information/i)).toBeInTheDocument();
    });
  });

  test('handles valid address input correctly', async () => {
    
    mockIsAddress.mockReturnValue(true);
    mockGetAddress.mockReturnValue('0x1234567890123456789012345678901234567890');
    mockProvider.getBalance.mockResolvedValue(BigInt('1500000000000000000'));
    mockProvider.lookupAddress.mockResolvedValue('vitalik.eth');
    
    render(<App />);
    
    const input = screen.getByLabelText(/ethereum address or ens name/i);
    const submitButton = screen.getByRole('button', { name: /check wallet/i });
    
    fireEvent.change(input, { target: { value: '0x1234567890123456789012345678901234567890' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/wallet information/i)).toBeInTheDocument();
    });
  });

  test('displays loading state during API call', async () => {
    
    mockIsAddress.mockReturnValue(true);
    mockGetAddress.mockReturnValue('0x1234567890123456789012345678901234567890');
    mockProvider.getBalance.mockImplementation(() => new Promise(resolve => setTimeout(() => 
      resolve(BigInt('1500000000000000000')), 100)));
    
    render(<App />);
    
    const input = screen.getByLabelText(/ethereum address or ens name/i);
    const submitButton = screen.getByRole('button', { name: /check wallet/i });
    
    fireEvent.change(input, { target: { value: '0x1234567890123456789012345678901234567890' } });
    fireEvent.click(submitButton);

    expect(screen.getByText(/checking/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    
    // wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/checking/i)).not.toBeInTheDocument();
      expect(submitButton).toBeEnabled();
    })
    
  });

  test('clears error when user starts typing', () => {
    render(<App />);
    
    const input = screen.getByLabelText(/ethereum address or ens name/i);
    const submitButton = screen.getByRole('button', { name: /check wallet/i });
    
    // Trigger error first
    fireEvent.click(submitButton);
    
    // Then start typing
    fireEvent.change(input, { target: { value: '0x' } });
    
    // Error should be cleared
    expect(screen.queryByText(/please enter a wallet address or ens name/i)).not.toBeInTheDocument();
  });

  test('handles API errors gracecully', async () => {
    mockIsAddress.mockReturnValue(true);
    mockGetAddress.mockReturnValue('0x1234567890123456789012345678901234567890');
    mockProvider.getBalance.mockRejectedValue(new Error('Network error'));

    render(<App />);

    const input = screen.getByLabelText(/ethereum address or ens name/i);
    const submitButton = screen.getByRole('button', {name: /check wallet/i });

    fireEvent.change(input, { target: { value: '0x1234567890123456789012345678901234567890'} });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Network error. Please try again later/i)).toBeInTheDocument();
    });
  });
});