import {getPublicName, getPublicNameSecondary, isToken} from './etherscan';

class ContractNames
{
	private names: Array<{contract: string, name: string}>;

	constructor()
	{
		this.names = [];
	}

	async addContractName(contractAddress: string)
	{
		if(this.names.findIndex(element => element.contract === contractAddress) === -1)
		{
			let contractName = await getPublicName(contractAddress);
			if(contractName === "")
				contractName = await getPublicNameSecondary(contractAddress);
			this.names.push({contract: contractAddress, name: contractName});
			return contractName;
		}
		return "";
	}

	async getContractName(contractAddress: string)
	{
		const idx = this.names.findIndex(element => element.contract === contractAddress);
		if(idx !== -1)
			return this.names[idx].name;
		else
		{
			let name = await this.addContractName(contractAddress);
			return name;
		}
	}
}

const contractNames = new ContractNames();
export default contractNames;