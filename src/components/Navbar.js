import logo from '../Logo.png';
import fullLogo from '../Logo.png';
import {
  BrowserRouter as Router,
  Link,
} from "react-router-dom";
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

function Navbar() {
    const [connected, toggleConnect] = useState(false);
    const location = useLocation();
    const [currAddress, updateAddress] = useState('0x');

    async function getAddress() {
        const ethers = require("ethers");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        try {
            const addr = await signer.getAddress();
            updateAddress(addr);
            toggleConnect(true); // Set connected to true if address fetch is successful
        } catch (error) {
            console.error("Failed to get address:", error);
        }
    }

    function updateButton() {
        const ethereumButton = document.querySelector('.enableEthereumButton');
        ethereumButton.textContent = "Connected";
        ethereumButton.classList.remove("hover:bg-blue-700", "bg-blue-500");
        ethereumButton.classList.add("hover:bg-green-700", "bg-green-500");
    }

    async function connectWebsite() {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const targetChainId = '0x539'; // Set to correct chain ID based on your network

        if (chainId !== targetChainId) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: targetChainId }],
                });
            } catch (switchError) {
                console.error("Error switching chains:", switchError);
            }
        }
        
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            updateButton();
            getAddress();
            window.location.replace(location.pathname); // Refresh on connect
        } catch (error) {
            console.error("Error connecting to wallet:", error);
        }
    }

    useEffect(() => {
        if (window.ethereum === undefined) {
            return;
        }
        
        async function initializeConnection() {
            const isConnected = window.ethereum.isConnected();
            toggleConnect(isConnected);

            if (isConnected) {
                getAddress();
                updateButton();
            }
        }

        initializeConnection();

        // Update page if accounts change
        window.ethereum.on('accountsChanged', () => {
            window.location.replace(location.pathname);
        });

        // Handle chain changes
        window.ethereum.on('chainChanged', () => {
            window.location.reload();
        });
    }, [location.pathname]);

    return (
        <div className="">
            <nav className="w-screen">
                <ul className='flex items-end justify-between py-3 bg-transparent text-white pr-5'>
                    <li className='flex items-end ml-5 pb-2'>
                        <Link to="/">
                            <img src={fullLogo} alt="" width={80} height={80} className="inline-block -mt-2"/>
                            <div className='inline-block font-bold text-xl ml-2'>
                                NFT Marketplace
                            </div>
                        </Link>
                    </li>
                    <li className='w-3/6'>
                        <ul className='lg:flex justify-between font-bold mr-10 text-lg'>
                            <li className={location.pathname === "/" ? 'border-b-2 hover:pb-0 p-2' : 'hover:border-b-2 hover:pb-0 p-2'}>
                                <Link to="/">Marketplace</Link>
                            </li>
                            <li className={location.pathname === "/sellNFT" ? 'border-b-2 hover:pb-0 p-2' : 'hover:border-b-2 hover:pb-0 p-2'}>
                                <Link to="/sellNFT">Upload My NFT</Link>
                            </li>
                            <li className={location.pathname === "/profile" ? 'border-b-2 hover:pb-0 p-2' : 'hover:border-b-2 hover:pb-0 p-2'}>
                                <Link to="/profile">My Profile</Link>
                            </li>
                            <li>
                                <button
                                    className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                                    onClick={connectWebsite}
                                >
                                    {connected ? "Connected" : "Connect Wallet"}
                                </button>
                            </li>
                        </ul>
                    </li>
                </ul>
            </nav>
            <div className='text-white font-bold text-right mr-10 text-sm'>
                {currAddress !== "0x" ? `Connected to ${currAddress.substring(0, 15)}...` : "Not Connected. Please login to view NFTs"}
            </div>
        </div>
    );
}

export default Navbar;
