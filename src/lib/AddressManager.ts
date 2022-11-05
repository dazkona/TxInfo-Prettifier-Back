const ethers = require('ethers');

//import {ARCHIVENODE_KEY, ETHERSCAN_KEY} from '../private/private';
const privates: any = require('../private/private.json');

import { Address } from './types';
import cachedABIs from './CachedABIs';
import contractNames from './ContractNames';
import contractTokens from './ContractTokens';

import AddressController from './../Address/controller';

class AddressManager
{
	private addressList: Address[];

	constructor()
	{
		this.addressList = [];
	}

	//---------------------------------------------------------------
	async getTokenInfo(contractAddress: string, abi: any)
	{
		var providerURL = 'https://api.archivenode.io/'+privates.ARCHIVENODE_KEY;
		var jsonRpcProvider = new ethers.providers.JsonRpcProvider(providerURL);
		const contract = new ethers.Contract(contractAddress, abi, jsonRpcProvider);
		const name = await contract.name();
		const symbol = await contract.symbol();
		const decimals = await contract.decimals();
		return {name, symbol, decimals};
	}

	// https://ethereum.stackexchange.com/questions/121370/how-do-i-call-functions-from-read-as-proxy-on-smart-contracts/127259#127259
	//---------------------------------------------------------------
	async updateProxyedToken(contractAddress: string, abi: any)
	{
		const {name, symbol, decimals} = await this.getTokenInfo(contractAddress, abi);
		AddressController.updateProxyedToken(contractAddress, {name, symbol, decimals});
	}

	//---------------------------------------------------------------
	detectTokenBase(abi: any)
	{
		const isTokenERC1155 = cachedABIs.checkAccomplishERC(abi, "1155");
		const isTokenERC721 = isTokenERC1155 ? false : cachedABIs.checkAccomplishERC(abi, "721");
		const isTokenERC20 = isTokenERC1155 || isTokenERC721 ? false: cachedABIs.checkAccomplishERC(abi, "20");
		const isToken = (isTokenERC1155 || isTokenERC721 || isTokenERC20);
		const erc = isToken ? (isTokenERC20 ? "20" : isTokenERC721 ? "721" : "1155") : "";
		return {isToken, erc};
	}

	//---------------------------------------------------------------
	async readNewAddress(contractAddress: string)
	{
		let abi = await cachedABIs.getABI(contractAddress);

		var newAddress: Address = {
			address: contractAddress,
			abi,
			name: "",
			isToken: false, 
			tokenInfo: {
				rawName: "",
				icon: "",
				erc: "",
				sc: {
					bProxyUpdated: false,
					name: "",
					symbol: "",
					decimals: 0
				}
			}
		};

		// get basic info from etherscan
		// ALERT! etherscan detect calls from servers and block them
		const tokenInfo = await contractTokens.addToken(contractAddress);
		if(tokenInfo.isToken)
		{
			newAddress.isToken = true;
			newAddress.tokenInfo.rawName = tokenInfo.token.name;
			newAddress.tokenInfo.icon = tokenInfo.token.icon;
		}

		if(newAddress.abi !== null)
		{
			const {isToken, erc} = this.detectTokenBase(newAddress.abi);
			newAddress.isToken = isToken;
			if(newAddress.isToken)
			{
				newAddress.tokenInfo.erc = erc;

				// Use ethersJS to call ABI and ask for: "name", "symbol", "decimals"
				try
				{
					const {name, symbol, decimals} = await this.getTokenInfo(contractAddress, abi);
					newAddress.tokenInfo.sc.name = name;
					newAddress.tokenInfo.sc.symbol = symbol;
					newAddress.tokenInfo.sc.decimals = decimals;
				}
				catch(errCall)
				{
					console.log(errCall);
				}					
			}
			else
			{
				// ALERT! etherscan detect calls from servers and block them
				let name = await contractNames.getContractName(contractAddress);
				if(name !== "")
					newAddress.tokenInfo.rawName = name;
			}
		}
		else
			newAddress.tokenInfo.erc = "unknown";

		await AddressController.createAddress(newAddress);

		return newAddress;
	}

	//---------------------------------------------------------------
	async readAddress(contractAddress: string): Promise<any>
	{
		const existingAddress = await AddressController.readAddress(contractAddress);
		if(existingAddress !== null)
		{
			console.warn("cached address: "+contractAddress);
			let abi = await cachedABIs.getABI(contractAddress);
			return {abi, ...existingAddress.toJSON()};
		}
		else
		{
			const newAddress = await this.readNewAddress(contractAddress);
			return newAddress;
		}
	}
}

const addressManager = new AddressManager();
export default addressManager;