# WalletWatcher

A simple, elegant React application for checking Ethereum wallet balances and ERC-20 token holdings in real-time.

## 📦 Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/wallet-watcher.git
cd wallet-watcher
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory and add your RPC URL:

```env
REACT_APP_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
```

4. Start the development server:

```bash
npm start
```

## 🔧 Environment Setup

You'll need an Ethereum mainnet RPC endpoint. Popular options include:

- **Infura**: `https://mainnet.infura.io/v3/YOUR_PROJECT_ID`
- **Alchemy**: `https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY`
- **QuickNode**: `https://YOUR_ENDPOINT.quiknode.pro/YOUR_API_KEY/`

## 🚀 Future Enhancements

- [ ] Support for more ERC-20 tokens
- [ ] Multi-network support (Polygon, BSC, etc.)
- [ ] Transaction history viewing
- [ ] Portfolio value calculation
- [ ] Token price integration
- [ ] Export functionality
- [ ] Dark mode theme

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This tool is for informational purposes only. Always verify important transactions and balances through official sources. The developers are not responsible for any financial decisions made based on the information provided by this application.

## 🙏 Acknowledgments

- [Ethers.js](https://docs.ethers.org/) for blockchain interactions
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [React](https://reactjs.org/) for the UI framework
