import Navbar from "./Navbar";
import NFTTile from "./NFTTile";
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState, useEffect } from "react";
import { GetIpfsUrlFromPinata } from "../utils";
import { ethers } from 'ethers';

export default function Marketplace() {
    const [data, updateData] = useState([]);
    const [dataFetched, updateFetched] = useState(false);
    const [loading, setLoading] = useState(true);
    const [walletConnected, setWalletConnected] = useState(false); // Track wallet connection status

    // Check if wallet is connected
    async function checkWalletConnection() {
        const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
            setWalletConnected(true);
        } else {
            setWalletConnected(false);
        }
    }

    async function getAllNFTs() {
        const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, provider);
        
        try {
            let transaction = await contract.getAllNFTs();

            // Fetch all details for each NFT from the contract
            const items = await Promise.all(transaction.map(async i => {
                var tokenURI = await contract.tokenURI(i.tokenId);
                tokenURI = GetIpfsUrlFromPinata(tokenURI);
                let meta = await axios.get(tokenURI);
                meta = meta.data;

                let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
                let item = {
                    price,
                    tokenId: i.tokenId.toNumber(),
                    seller: i.seller,
                    owner: i.owner,
                    image: meta.image,
                    name: meta.name,
                    description: meta.description,
                }
                return item;
            }));

            updateData(items);
            setLoading(false);
            updateFetched(true);
        } catch (error) {
            console.error("Error fetching NFTs: ", error);
            setLoading(false);
        }
    }

    useEffect(() => {
        checkWalletConnection();  // Check wallet connection on mount
        if (!dataFetched) {
            getAllNFTs();  // Fetch NFTs when component is mounted
        }

        // Listen for TokenListedSuccess event
        const listenToEvents = async () => {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);

            contract.on("TokenListedSuccess", (tokenId, seller, price) => {
                console.log(`Token Listed: ${tokenId} by ${seller} for ${price}`);

                // Optionally, refresh the list of NFTs when a new token is listed
                getAllNFTs();  // Re-fetch all NFTs to include the new one
            });
        };

        listenToEvents();
    }, [dataFetched]);  // Run only once when the component loads


    return (
        <div className="max-w-full h-screen">
            <Navbar />
            <div className="flex flex-col place-items-center mt-20">
                <div className="md:text-xl font-bold text-white">
                    Top NFTs
                </div>
                <div className="flex mt-5 justify-between flex-wrap max-w-screen-xl text-center">
                    {loading ? (
                        <div className="text-white text-lg">Loading NFTs...</div>
                    ) : (
                        data.length > 0 ? (
                            data.map((value, index) => {
                                return (
                                    <NFTTile data={value} key={index} />
                                );
                            })
                        ) : (
                            <div className="text-white text-lg">No NFTs available</div>
                        )
                    )}
                </div>
                {/* Display alert if wallet is not connected */}
                {!walletConnected && (
                    <div className="text-red-500 text-lg mt-5">
                        Please connect your wallet to interact with NFTs.
                    </div>
                )}
            </div>
        </div>
    );
}
