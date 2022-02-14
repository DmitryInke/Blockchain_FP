import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Web3Modal from 'web3modal';

import { nftAddress, nftMarketAddress } from '../config';

import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import CLMarket from '../artifacts/contracts/CLMarket.sol/CLMarket.json';

export default function Home() {
  const [nfts, setNFts] = useState([]);
  const [address, setAddress] = useState([]);
  const [loadingState, setLoadingState] = useState('not-loaded');

  useEffect(() => {
    loadNFTs();
    getAddress();
  }, []);

  const router = useRouter();

  async function loadNFTs() {
    // what we want to load:
    // ***provider, tokenContract, marketContract, data for our marketItems***

    const provider = new ethers.providers.JsonRpcProvider();
    const tokenContract = new ethers.Contract(nftAddress, NFT.abi, provider);
    const marketContract = new ethers.Contract(
      nftMarketAddress,
      CLMarket.abi,
      provider
    );
    const data = await marketContract.fetchMarketTokens();

    const items = await Promise.all(
      data.map(async i => {
        const tokenUri = await tokenContract.tokenURI(i.tokenId);
        // we want get the token metadata - json
        const meta = await axios.get(tokenUri);
        let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
        let item = {
          price,
          tokenId: i.tokenId.toNumber(),
          seller: i.seller,
          owner: i.owner,
          image: meta.data.image,
          name: meta.data.name,
          description: meta.data.description,
        };
        return item;
      })
    );

    setNFts(items);
    setLoadingState('loaded');
  }

  async function getAddress() {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    setAddress(await signer.getAddress());
  }

  // function to buy nfts for market

  async function buyNFT(nft) {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const contract = new ethers.Contract(
      nftMarketAddress,
      CLMarket.abi,
      signer
    );

    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether');
    const transaction = await contract.createMarketSale(
      nftAddress,
      nft.tokenId,
      {
        value: price,
      }
    );

    await transaction.wait();
    loadNFTs();
    router.push('./my-nfts');
  }
  if (loadingState === 'loaded' && !nfts.length)
    return (
      <div>
        <h1 className="px-20 py-7 text-4x1 font-bold">
          No NFts in marketplace
        </h1>
        <p
          className="font-bold text-right text-xl"
          style={{ marginTop: '30%', marginRight: '1%' }}
        >
          Account: {address}
        </p>
      </div>
    );

  return (
    <div style={{ marginLeft: '7%', padding: '10px' }}>
      <div className="px-4" style={{ maxWidth: '1600px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {nfts.map((nft, i) => (
            <div key={i} className="border shadow rounded-x1 overflow-hidden">
              <img src={nft.image} />
              <div className="p-4 bg-white">
                <p
                  style={{ height: '64px' }}
                  className="p-3 text-black font-bold border-b-4 border-amber-300 "
                >
                  {nft.name}
                </p>
                <div style={{ height: '72px', overflow: 'auto' }}>
                  <p className="p-3 text-gray-500 font-bold">
                    {nft.description}
                  </p>
                </div>
              </div>
              <div className="px-6 pb-2 bg-white ">
                <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-black mr-2 mb-2">
                  {nft.price} ETH
                </span>
              </div>
              <div className="p-4 bg-black">
                <button
                  className="w-full bg-teal-400 hover:bg-teal-300 text-gray-800 font-bold py-2 px-4 rounded-l"
                  onClick={() => buyNFT(nft)}
                >
                  Buy
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="font-bold text-right text-xl" style={{ marginTop: '2%' }}>
        Account: {address}
      </p>
    </div>
  );
}
