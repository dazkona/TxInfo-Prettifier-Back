const fs = require('fs');
const fsp = require("fs").promises;
const ethers = require('ethers');

//import {ARCHIVENODE_KEY, ETHERSCAN_KEY} from '../private/private';
const privates: any = require('../private/private.json');
import { TraceItem, TraceWealthChange, TraceType, TxTraceItem } from './types';
const TraceStackMaker = require('./TraceStackMaker').default;

//-------------------------------------------------------------------
var providerURL = 'https://api.archivenode.io/'+privates.ARCHIVENODE_KEY;
var jsonRpcProvider = new ethers.providers.JsonRpcProvider(providerURL);

//-------------------------------------------------------------------
async function getCachedTxInfo(hash: string): Promise<any>
{
	try
	{
		if(fs.existsSync(process.cwd()+'/TXINFO/'+hash+'.json'))
		{
			const fileCont = await fsp.readFile(process.cwd()+'/TXINFO/'+hash+'.json');
			return JSON.parse(fileCont);
		}
	}
	catch(error2)
	{
		console.log(error2);
	}
	
	return null;
}

//-------------------------------------------------------------------
async function saveCachedTxInfo(hash: string, txInfo: object): Promise<any>
{
	await fsp.writeFile(process.cwd()+'/TXINFO/'+hash+'.json', JSON.stringify(txInfo), function (err: any) {
		if(err)
			console.log(err);
	});
}

//-------------------------------------------------------------------
export default async (hash: string) => {

	try
	{
		const cachedTxInfo = await getCachedTxInfo(hash);
		if(cachedTxInfo)
		{
			return cachedTxInfo;
		}
		else
		{
			var bExists: boolean = false;
			try
			{
				bExists = fs.existsSync(process.cwd()+'/TRACE/'+hash+'.json');
			}
			catch(error)
			{
				console.log(error);
			}

			var transactionJSON = null;
			if(bExists)
			{
				const fileCont = await fsp.readFile(process.cwd()+'/TRACE/'+hash+'.json');
				transactionJSON = JSON.parse(fileCont);
			}
			else
			{
				transactionJSON = await jsonRpcProvider.send('trace_transaction', [hash]);
				await fsp.writeFile(process.cwd()+'/TRACE/'+hash+'.json', JSON.stringify(transactionJSON));			
			}

			let tsm: typeof TraceStackMaker = new TraceStackMaker();
			await tsm.parseTransactionTrace(hash, transactionJSON);
			await tsm.updateWealthInfo();
			await tsm.debugDump(hash); // TODO: Only for debug

			var txInfo = {
				trace: tsm.getTrace(),
				wealthChanges: tsm.getWealthChanges()
			};

			await saveCachedTxInfo(hash, txInfo);

			return txInfo;
		}
	}
	catch(error2)
	{
		console.log(error2);
	}

	return {trace: [], wealthChanges: []};
};