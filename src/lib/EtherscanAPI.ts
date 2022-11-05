const axios = require('axios');
//import {ARCHIVENODE_KEY, ETHERSCAN_KEY} from '../private/private';
const privates: any = require('../private/private.json');
import {unixTimestamp, asyncwait} from './utils';

//-------------------------------------------------------------------
class EtherscanAPI
{
	private lastCall: number; // UNIX datetime
	private api: any;

	//---------------------------------------------------------------
	constructor()
	{
		this.lastCall = unixTimestamp();
	}

	//---------------------------------------------------------------
	async getContractABI(contractAddress: string): Promise<any>
	{
		const now: number = unixTimestamp();
		let pendingMs:number = 200 - (now - this.lastCall);
		if(pendingMs < 1)
			pendingMs = 1;

		await asyncwait(pendingMs);

		const response = await axios.get('https://api.etherscan.io/api\
											?module=contract\
											&action=getabi\
											&address='+contractAddress+'\
											&apikey='+privates.ETHERSCAN_KEY);
		// TODO: manage errors
		if(response.data.message == 'NOTOK')
			return null;
		else
		{
			const abi = JSON.parse(response.data.result);
			this.lastCall = unixTimestamp();
			return abi;
		}
	}
}

const etherscanAPI = new EtherscanAPI();
export default etherscanAPI;