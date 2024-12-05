import Navbar from "./Navbar";
import axie from "../tile.jpeg";
import { useLocation, useParams } from 'react-router-dom';
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState, useEffect } from "react";
import { GetIpfsUrlFromPinata } from "../utils";
import { ethers } from "ethers"; 

export default function NFTPage() {
    const [data, updateData] = useState({});
    const [dataFetched, updateDataFetched] = useState(false);
    const [message, updateMessage] = useState("");
    const [currAddress, updateCurrAddress] = useState("0x");
    const params = useParams();
    const tokenId = params.tokenId;

    async function getNFTData(tokenId) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const addr = await signer.getAddress();
        const contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
        
        let tokenURI = await contract.tokenURI(tokenId);
        const listedToken = await contract.getListedTokenForId(tokenId);
        tokenURI = GetIpfsUrlFromPinata(tokenURI);
        let meta = await axios.get(tokenURI);
        meta = meta.data;
    
        let item = {
            // Convert price from Wei to Ether for display
            price: ethers.utils.formatUnits(listedToken.price, 'ether'),
            tokenId: tokenId,
            seller: listedToken.seller,
            owner: listedToken.owner,
            image: meta.image,
            name: meta.name,
            description: meta.description,
        };
        
        updateData(item);
        updateDataFetched(true);
        updateCurrAddress(addr);
    }
    

    useEffect(() => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, provider);

        // Event listener for PriceUpdated
        const onPriceUpdated = (updatedTokenId, newPrice) => {
            if (updatedTokenId.toString() === tokenId.toString()) {
                alert(`Price for token ID ${updatedTokenId} has been updated!`);
                getNFTData(tokenId); // Refresh NFT data to show the new price
            }
        };

        // Set up event listener for PriceUpdated
        contract.on("PriceUpdated", onPriceUpdated);

        // Clean up the event listener when the component unmounts
        return () => {
            contract.off("PriceUpdated", onPriceUpdated);
        };
    }, [tokenId]); // Dependency on tokenId to reset listener if tokenId changes


    async function buyNFT(tokenId) {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            
            // Pull the deployed contract instance
            const contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
    
            // Retrieve the latest price from the contract
            const listedToken = await contract.getListedTokenForId(tokenId);
            const salePrice = listedToken.price; // This should return the latest price in wei
    
            updateMessage("Buying the NFT... Please Wait");
            let transaction = await contract.executeSale(tokenId, { value: salePrice }); // Use the latest price here
            await transaction.wait();
    
            alert('You successfully bought the NFT!');
            updateMessage("");
        } catch (e) {
            console.error("Error buying NFT: ", e); // Log the error for better debugging
            alert("Error buying NFT: " + e.message);
        }
    }

    function UpdateNFTPrice({ tokenId }) {
        const [priceParams, setPriceParams] = useState({ newPrice: '' });
        const [message, setMessage] = useState('');

        async function updatePrice(e) {
            e.preventDefault();
            const { newPrice } = priceParams;
        
            // Ensure the new price is valid
            if (!newPrice || parseFloat(newPrice) <= 0) {
                setMessage("Please enter a valid price!");
                return;
            }
        
            // Update the price on the blockchain
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
                const price = ethers.utils.parseUnits(newPrice, 'ether');
        
                // Call the contract function to update the price
                let transaction = await contract.updatePrice(tokenId, price);
                await transaction.wait();
        
                alert("Successfully updated the NFT price!");
                setPriceParams({ newPrice: '' }); // Clear the input
                setMessage(""); // Clear message
        
                // Set dataFetched to false to trigger data refresh
                updateDataFetched(false);
                
                // Refresh the NFT data to reflect the new price
                await getNFTData(tokenId); // <-- Call to refresh data
        
            } catch (error) {
                console.error("Error updating price: ", error);
                setMessage("Error updating price. Please try again.");
            }
        }
        

        return (
            <div>
                <h3 className="text-center font-bold text-purple-500 mb-8">Update NFT Price</h3>
                <form className="bg-white shadow-md rounded px-8 pt-4 pb-8 mb-4" onSubmit={updatePrice}>
                    <div className="mb-6">
                        <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="newPrice">New Price (in ETH)</label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            type="number"
                            placeholder="Min 0.01 ETH"
                            step="0.01"
                            value={priceParams.newPrice}
                            onChange={e => setPriceParams({ newPrice: e.target.value })}
                        />
                    </div>
                    <div className="text-red-500 text-center">{message}</div>
                    <button
                        type="submit"
                        className="font-bold mt-10 w-full bg-sky-700 text-white rounded p-2 shadow-lg"
                        id="update-button"
                    >
                        Update Price
                    </button>
                </form>
            </div>
        );
    }

    if (!dataFetched) getNFTData(tokenId);
    if (typeof data.image === "string") data.image = GetIpfsUrlFromPinata(data.image);

    return (
        <div style={{ minHeight: "100vh" }}>
            <Navbar />
            <div className="flex ml-20 mt-20">
                <img src={data.image} alt="" className="w-2/5" />
                <div className="text-xl ml-20 space-y-8 text-white shadow-2xl rounded-lg border-2 p-5">
                    <div>Name: {data.name}</div>
                    <div>Description: {data.description}</div>
                    <div>Price: <span className="">{data.price + " ETH"}</span></div>
                    <div>Owner: <span className="text-sm">{data.owner}</span></div>
                    <div>Seller: <span className="text-sm">{data.seller}</span></div>
                    <div>
                        {currAddress !== data.owner && currAddress !== data.seller ? (
                            <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => buyNFT(tokenId)}>Buy this NFT</button>
                        ) : currAddress === data.seller ? (
                            <UpdateNFTPrice tokenId={tokenId} />
                        ) : (
                            <div className="text-emerald-700">You are the owner of this NFT :)</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}