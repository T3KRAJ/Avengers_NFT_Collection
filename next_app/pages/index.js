import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";


export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  const web3ModalRef = useRef();

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  const startPresale = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      const tx = await nftContract.startPreSale();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await checkIfPresaleStarted();
    } catch (err) {
      console.error(err);
    }
  };

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      const _presaleStarted = await nftContract.preSaleStarted();
      if (!_presaleStarted) {
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      const _presaleEnded = await nftContract.endPreSaleAt();
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
      if (hasEnded) {
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }
      return hasEnded;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

    const presaleMint = async () => {
      try {
        const signer = await getProviderOrSigner(true);
        const whitelistContract = new Contract(
          NFT_CONTRACT_ADDRESS,
          abi,
          signer
        );
        const tx = await whitelistContract.presaleMint({
          value: utils.parseEther("0.012"),
        });
        setLoading(true);
        await tx.wait();
        setLoading(false);
        window.alert("You successfully minted a Crypto Dev!");
      } catch (err) {
        console.error(err);
      }
    };

    const publicMint = async () => {
      try {
        const signer = await getProviderOrSigner(true);
        const whitelistContract = new Contract(
          NFT_CONTRACT_ADDRESS,
          abi,
          signer
        );
        const tx = await whitelistContract.mint({
          value: utils.parseEther("0.012"),
        });
        setLoading(true);
        await tx.wait();
        setLoading(false);
        window.alert("You successfully minted a Crypto Dev!");
      } catch (err) {
        console.error(err);
      }
    };

  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      const _owner = await nftContract.owner();
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

    const getTokenIdsMinted = async () => {
      try {
        const provider = await getProviderOrSigner();
        const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
        const _tokenIds = await nftContract.NFTTokenId();
        setTokenIdsMinted(_tokenIds.toString());
      } catch (err) {
        console.error(err);
      }
    };
    useEffect(() => {
      if (!walletConnected) {
        web3ModalRef.current = new Web3Modal({
          network: "rinkeby",
          providerOptions: {},
          disableInjectedProvider: false,
        });
        connectWallet();

        const _presaleStarted = checkIfPresaleStarted();
        if (_presaleStarted) {
          checkIfPresaleEnded();
        }
        getTokenIdsMinted();
        const presaleEndedInterval = setInterval(async function () {
          const _presaleStarted = await checkIfPresaleStarted();
          if (_presaleStarted) {
            const _presaleEnded = await checkIfPresaleEnded();
            if (_presaleEnded) {
              clearInterval(presaleEndedInterval);
            }
          }
        }, 5 * 1000);

        // set an interval to get the number of token Ids minted every 5 seconds
        setInterval(async function () {
          await getTokenIdsMinted();
        }, 5 * 1000);
      }
    }, [walletConnected]);

  const renderButton = () => {
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    if (isOwner && !presaleStarted) {
      return (
        <button className={styles.button} onClick={startPresale}>
          Start Presale!
        </button>
      );
    }

    if (!presaleStarted) {
      return (
        <div>
          <div className={styles.description}>Presale hasnt started!</div>
        </div>
      );
    }

    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            Presale has started!!! If your address is whitelisted, Mint a Crypto
            Dev 🥳
          </div>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 🚀
          </button>
        </div>
      );
    }

    if (presaleStarted && presaleEnded) {
      return (
        <button className={styles.button} onClick={publicMint}>
          Public Mint 🚀
        </button>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Avengers NFT</title>
        <meta name="description" content="Avenger NFT Engine" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div className={styles.card}>
          <h1 className={styles.title}>Mint Your Avenger NFT!</h1>
          <div className={styles.description}>
            Its an NFT collection for Avengers in Crypto.
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted <br />
          </div>
          <div>
            
          </div>
          <a
            href="https://testnets.opensea.io/collection/avengers-klj6vvvhm4"
            className={styles.opensea_link}
            target="__blank"
          >
            View all NFTs minted.
          </a><br/>
          {renderButton()}
        </div>
      </div>

      <footer className={styles.footer}>Made with &#10084; by T3KRAJ</footer>
    </div>
  );
}