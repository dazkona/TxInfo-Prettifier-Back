import {getPublicName, getPublicNameSecondary, isToken} from './etherscan';

class ContractTokens
{
	private tokens: Array<{contract: string, name: string, icon: string}>;
	private noTokens: Array<string>;

	constructor()
	{
		this.tokens = [];
		this.noTokens = [];
	}

	async isToken(contractAddress: string)
	{
		var idx: number = this.noTokens.findIndex(element => element === contractAddress);
		if(idx !== -1)
			return false;
		else
		{
			idx = this.tokens.findIndex(element => element.contract === contractAddress);
			if(idx !== -1)
				return true;
			else
			{
				const tokenInfo = await this.addToken(contractAddress);
				return tokenInfo.isToken;
			}
		}
	}

	async addToken(contractAddress: string)
	{
		if(this.noTokens.findIndex(element => element === contractAddress) !== -1)
		{
			return {isToken: false};
		}
		else
		{ 
			var idx = this.tokens.findIndex(element => element.contract === contractAddress);
			if(idx === -1)
			{
				let istoken: any = await isToken(contractAddress);
				if(istoken.isToken)
				{
					this.tokens.push({contract: contractAddress, name: istoken.rawNameCoin, icon: istoken.img});
					return {isToken: true, token: {
						contract: contractAddress, name: istoken.rawNameCoin, icon: istoken.img
					}};
				}
				else
				{
					this.noTokens.push(contractAddress);
					return {isToken: false};
				}
			}
			else
				return {isToken: true, token: this.tokens[idx]};			
		}
	}

	async getToken(contractAddress: string)
	{
		const idx = this.tokens.findIndex(element => element.contract === contractAddress);
		if(idx >= 0)
			return this.tokens[idx];
		else
			return null;
	}	
}

const contractTokens = new ContractTokens();
export default contractTokens;