## Backend: Node.js + TypeScript + MongoDB + Ethers
- Using official https://archivenode.io/ RPC node to make calls with EtherJS to get transactions detailed info.
- Using official https://etherscan.io/ API to obtain the ABI from smart contracts in the case are available.
- Using trick HTTP calls the site to https://etherscan.io/ to get contract public names and token icons. Sometimes I receive a website asking for a human confirmation and manage it with a try catch structure. If etherscan adds this information as an API endpoint I will be very grateful to use it.
- MongoDB allows us to save all obtained information about each address participating in the transactions and allows us to make fewer calls to restricted endpoints.

## Run the code
   Create a file inside src/private called private.json, including this lines:
```json
    {
    	"ARCHIVENODE_KEY": "XXXXXXXXXXXXXXXXXXXXXX",
    	"ETHERSCAN_KEY": "XXXXXXXXXXXXXXXXXXXX"
    }
```
Create /build/ABI, /build/TRACE and /build/TXINFO folders inside /build folder when compile from ts, before deploying.