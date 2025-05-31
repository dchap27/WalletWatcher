import { getTokenBalance } from './App';
import { JsonRpcProvider, Contract, getAddress, formatUnits } from 'ethers';

jest.mock('ethers');

describe('getTokenBalance function', () => {
  let mockProvider: jest.Mocked<JsonRpcProvider>;
  let mockContract: any;

  beforeEach(() => {
    mockContract = {
      balanceOf: jest.fn(),
      decimals: jest.fn(),
      symbol: jest.fn(),
    } as unknown as Contract;
    
    jest.mocked(Contract).mockImplementation(() => mockContract);
    
    mockProvider = new JsonRpcProvider() as jest.Mocked<JsonRpcProvider>;
  });

  test('returns token balance successfully', async () => {
    
    jest.mocked(getAddress).mockReturnValue('0x1234567890123456789012345678901234567890');
    mockContract.balanceOf.mockResolvedValue('1000000');
    mockContract.decimals.mockResolvedValue(6);
    mockContract.symbol.mockResolvedValue('USDT');
    jest.mocked(formatUnits).mockReturnValue('1.000000');

    const result = await getTokenBalance(
      mockProvider,
      '0x1234567890123456789012345678901234567890',
      '0xdAC17F958D2ee523a2206206994597C13D831ec7'
    );

    expect(result).toEqual({
      symbol: 'USDT',
      address: '0x1234567890123456789012345678901234567890',
      balance: '1.000000',
      decimals: 6
    });
  });

  test('handles invalid token address', async () => {
    
    jest.mocked(getAddress).mockImplementation(() => {
      throw new Error('Invalid address');
    });

    const result = await getTokenBalance(
      mockProvider,
      '0x1234567890123456789012345678901234567890',
      'invalid-address'
    );

    expect(result).toEqual({
      address: 'invalid-address',
      balance: null,
      error: true
    });
  });

  test('handles contract call failure', async () => {
    
    jest.mocked(getAddress).mockReturnValue('0x1234567890123456789012345678901234567890');
    mockContract.balanceOf.mockRejectedValue(new Error('Contract error'));

    const result = await getTokenBalance(
      mockProvider,
      '0x1234567890123456789012345678901234567890',
      '0xdAC17F958D2ee523a2206206994597C13D831ec7'
    );

    expect(result).toEqual({
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      balance: null,
      error: true
    });
  });
});