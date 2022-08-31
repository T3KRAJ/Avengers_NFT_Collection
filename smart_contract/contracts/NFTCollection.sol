// SPDX-License-Identifier: MIT
  pragma solidity ^0.8.4;

  import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
  import "@openzeppelin/contracts/access/Ownable.sol";
  import "@openzeppelin/contracts/utils/Counters.sol";
  import "./IWhitelist.sol";
  import "hardhat/console.sol";


  contract NFTCollection is Ownable, ERC721Enumerable {
    string public _baseTokenURI;
    bool public contractPaused;
    uint256 public constant maxNFT = 20;
    IWhitelist whitelist;
    uint256 public constant _price = 0.01 ether;
    bool public preSaleStarted;
    uint256 public endPreSaleAt;
    uint256 public NFTTokenId = 0;

    modifier onlyWhenNotPaused {
        require(!contractPaused, "Contract currently paused");
        _;
    }

    constructor(string memory baseTokenURI, address _whiteListContract) ERC721("Avengers", "AVG"){
        _baseTokenURI = baseTokenURI;
        whitelist = IWhitelist(_whiteListContract);
    }

    function startPreSale() public onlyOwner {
        preSaleStarted = true;
        endPreSaleAt = block.timestamp + 5 minutes;
    }

    function pauseContract(bool _val) public onlyOwner {
        contractPaused = _val;
    }

      function presaleMint() public payable onlyWhenNotPaused {
          require(preSaleStarted && block.timestamp < endPreSaleAt, "Presale is not running");
          require(whitelist.whitelistedAddresses(msg.sender), "You are not whitelisted");
          require(msg.value >= _price, "Ether sent is not correct");
          require(NFTTokenId < maxNFT, "Exceeded maximum Avengers NFTs supply");
          _safeMint(msg.sender, NFTTokenId);
          NFTTokenId ++;
      }

      function mint() public payable onlyWhenNotPaused {
          require(preSaleStarted && block.timestamp >=  endPreSaleAt, "Presale has not ended yet");
          require(msg.value >= _price, "Ether sent is not correct");
          require(NFTTokenId < maxNFT, "Exceeded maximum Avengers NFTs supply");
          _safeMint(msg.sender, NFTTokenId);
          NFTTokenId++;
      }

        function _baseURI() internal view virtual override returns (string memory) {
          return _baseTokenURI;
      }
      function withdraw() public onlyOwner  {
          address _owner = owner();
          uint256 amount = address(this).balance;
          (bool sent, ) =  _owner.call{value: amount}("");
          require(sent, "Failed to send Ether");
      }

       // Function to receive Ether. msg.data must be empty
      receive() external payable {}

      // Fallback function is called when msg.data is not empty
      fallback() external payable {}
  }