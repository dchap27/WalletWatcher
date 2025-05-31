describe('Utility Functions', () => {
  // These would be exported from your App.tsx or moved to a utils file
  const isENSName = (input: string): boolean => {
    return input.includes('.') && (input.endsWith('.eth') || input.includes('.'));
  };

  const shortenAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: string): string => {
    const num = parseFloat(balance);
    return num.toLocaleString(undefined, 
      { minimumFractionDigits: 4, maximumFractionDigits: 4});
  };

  describe('isENSName', () => {
    test('returns true for .eth names', () => {
      expect(isENSName('vitalik.eth')).toBe(true);
      expect(isENSName('test.eth')).toBe(true);
    });

    test('returns true for other TLD names', () => {
      expect(isENSName('example.com')).toBe(true);
    });

    test('returns false for addresses', () => {
      expect(isENSName('0x1234567890123456789012345678901234567890')).toBe(false);
    });

    test('returns false for strings without dots', () => {
      expect(isENSName('vitalik')).toBe(false);
    });
  });

  describe('shortenAddress', () => {
    test('shortens long addresses correctly', () => {
      const address = '0x1234567890123456789012345678901234567890';
      expect(shortenAddress(address)).toBe('0x1234...7890');
    });

    test('handles short addresses', () => {
      const address = '0x123456';
      expect(shortenAddress(address)).toBe('0x1234...3456');
    });
  });

  describe('formatBalance', () => {
    test('formats balance with 4 decimal places', () => {
      expect(formatBalance('1.5')).toBe('1.5000');
      expect(formatBalance('1000.123456')).toBe('1,000.1235');
    });

    test('handles zero balance', () => {
      expect(formatBalance('0')).toBe('0.0000');
    });

    test('handles very large numbers', () => {
      expect(formatBalance('1000000.5')).toBe('1,000,000.5000');
    });
  });
});