const fs = require('fs');
const fsp = require("fs").promises;
import etherscanAPI from './EtherscanAPI';

//-------------------------------------------------------------------
class CachedABIs
{
	private ERCMethods: any = {
		"20": ["name", "symbol", "decimals", "totalSupply", "balanceOf", "transfer", "transferFrom", "approve", "allowance"],
		"721": ["balanceOf", "ownerOf", "safeTransferFrom", "transferFrom", "approve", "getApproved", "setApprovalForAll", "isApprovedForAll", "safeTransferFrom"],
		"1155": ["balanceOf", "balanceOfBatch", "setApprovalForAll", "isApprovedForAll", "safeTransferFrom", "safeBatchTransferFrom"]
	};

	//---------------------------------------------------------------
	checkAccomplishERC(abi: any, erc: string)
	{
		var checkedMethods = this.ERCMethods[erc].map((m: string) => { return {method: m, found: false};});
		var nCheckedMethods = 0;
		checkedMethods.forEach((element: any, index: number, array: any) => {
			const bFound = (abi.find((abiEl: any) => abiEl.name == element.method && abiEl.type == 'function') !== undefined);
			checkedMethods[index].found = bFound;
			if(bFound)
				nCheckedMethods++;
		});

		return (nCheckedMethods == checkedMethods.length);
	}

	//---------------------------------------------------------------
	async saveToCache(contractAddress: string, abi: JSON)
	{
		await fsp.writeFile(process.cwd()+'/ABI/'+contractAddress+'.json', JSON.stringify(abi), function (err: any) {
			if(err)
				console.log(err);
		});
	}

	//---------------------------------------------------------------
	async readFromCache(contractAddress: string): Promise<JSON>
	{
		const fileCont = await fsp.readFile(process.cwd()+'/ABI/'+contractAddress+'.json');
		return JSON.parse(fileCont);
	}

	//---------------------------------------------------------------
	async getABI(contractAddress: string)
	{
		var bExists: boolean = false;
		try
		{
			bExists = fs.existsSync(process.cwd()+'/ABI/'+contractAddress+'.json');
		}
		catch(error)
		{
			console.log(error)
		}

		if(bExists)
		{
			const abi = await this.readFromCache(contractAddress);
			return abi;
		}
		else
		{
			const abi: JSON | null = await etherscanAPI.getContractABI(contractAddress);
			if(abi)
				await this.saveToCache(contractAddress, abi);

			return abi;
		}
	}
}

const cachedABIs = new CachedABIs();
export default cachedABIs;