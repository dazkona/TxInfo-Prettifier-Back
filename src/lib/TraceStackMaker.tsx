const fs = require('fs');
const ethers = require('ethers');

import { TraceItem, TraceWealthChange, TraceType, TxTraceItem, Address } from './types';
import addressManager from './AddressManager';

//-------------------------------------------------------------------
export default class TraceStackMaker
{
	private trace: Array<TraceItem>;
	private wealthChanges: Array<TraceWealthChange>;

	//---------------------------------------------------------------
	constructor()
	{
		this.trace = [];
		this.wealthChanges = [];
	}

	//---------------------------------------------------------------
	getTrace()
	{
		return this.trace;
	}

	//---------------------------------------------------------------
	getWealthChanges()
	{
		return this.wealthChanges;
	}

	//---------------------------------------------------------------
	getNameFromAddressInfo(addressInfo: Address)
	{
		var contractName = addressInfo.name ? addressInfo.name : addressInfo.address;

		if(addressInfo.tokenInfo.sc.name !== "")
			contractName = addressInfo.tokenInfo.sc.name;
		else if(addressInfo.tokenInfo.rawName !== "")
			contractName = addressInfo.tokenInfo.rawName;

		return contractName;
	}

	//---------------------------------------------------------------
	async completeWealthChangeInfo(twc: TraceWealthChange)
	{
		console.info(twc);
		// from name
		let fromAddressInfo = await addressManager.readAddress(twc.from.address);
		console.info('fromAddressInfo:',fromAddressInfo);
		twc.from.name = this.getNameFromAddressInfo(fromAddressInfo);
		console.info('from name:'+twc.from.name);

		// to name
		let toAddressInfo = await addressManager.readAddress(twc.to.address);
		console.info('toAddressInfo:',toAddressInfo);
		twc.to.name = this.getNameFromAddressInfo(toAddressInfo);
		console.info('to name:'+twc.to.name);

		// token units
		// token decimals
		// token amount
		if(twc.token.address !== "")
		{
			let tokenAddressInfo = await addressManager.readAddress(twc.token.address);
			console.info('tokenAddressInfo:',tokenAddressInfo);
			if(tokenAddressInfo && tokenAddressInfo.isToken)
			{
				twc.token.decimals = tokenAddressInfo.tokenInfo.sc.decimals;
				twc.token.units = tokenAddressInfo.tokenInfo.sc.symbol;

				try
				{
					if(twc.amount.hasOwnProperty('_isBigNumber') && twc.amount._isBigNumber)
					{
						const bnValue = ethers.BigNumber.from(twc.amount);
						twc.amount = ethers.utils.formatUnits(bnValue, twc.token.decimals);
					}
				}
				catch(err)
				{}
			}
		}
	}

	/*
		https://docs.ethers.io/v5/api/utils/abi/interface/
		https://docs.ethers.io/v5/api/utils/abi/fragments/#ConstructorFragment
	*/
	//---------------------------------------------------------------
	async parseTraceItem(transactionTrace: Array<any>, pPointer: any, parent: null | TraceItem)
	{
		const elm = transactionTrace[pPointer.pointer];

		const caller: string = elm.action.from;
		const toAddress: string = elm.action.to;
		const input: string = elm.action.input; 
		const resultData: string = elm.result ? elm.result.output : "";
		const callType: string = elm.action.callType;
		const value: string = elm.action.value;

		const addressInfo = await addressManager.readAddress(toAddress);
		var contractName = this.getNameFromAddressInfo(addressInfo);

		const bError = elm.hasOwnProperty('error');
		var item: TraceItem = {
			type: TraceType.undef,
			info: null,
			nExpectedChildren: elm.subtraces,
			children: [],
			bError: bError,
			error: bError ? elm.error: null
		};

		if(addressInfo.abi)
		{
			// alt with plain etherjs
			const iface = new ethers.utils.Interface(addressInfo.abi);
			try
			{
				const functionFragment = iface.getFunction(input.slice(0,10));
				var functionName = functionFragment.name;
				if(functionName === '0x')
					functionName = "fallback";

				const inputs = functionFragment.inputs;
				const decodedArgs = iface.decodeFunctionData(input.slice(0,10), input);
				const parsedInputs = inputs.map((i: any) => {return {
					type: i.type,
					name: i.name,
					value: decodedArgs.length > 1 ? decodedArgs[i.name] : decodedArgs[0]
				}});

				const functionFragmentType = functionFragment.type;
				const stateMutability = functionFragment.stateMutability;

				var parsedOutputs = null;
				if(!bError)
				{
					const outputs = functionFragment.outputs;
					var decodedResult = iface.decodeFunctionResult(functionName, resultData);
					parsedOutputs = outputs.map((o: any) => {return {
						type: o.type,
						name: o.name,
						value: decodedResult.length > 1 ? decodedResult[o.name] : decodedResult[0]
					}});
				}

				item.type = TraceType.Function;
				item.info = {
					contract: toAddress,
					contractName,
					inputs: parsedInputs,
					name: functionName,
					functionType: functionFragmentType,
					callType: callType,
					traceAddress: elm.traceAddress.join("."),
					value, 
					stateMutability: stateMutability,
					outputs: parsedOutputs
				};

				if(addressInfo.isToken)
				{
					if(functionName === "transfer")
					{
						const transferTo = item.info.inputs[0].value;
						const transferAmount = item.info.inputs[1].value;
						var tempToken = addressInfo.address;

						if(callType === 'delegatecall')
						{
							// proxy call, have to see on parent's info
							var parentAddressInfo = await addressManager.readAddress(parent.info.contract);
							if(!parentAddressInfo.tokenInfo.sc.bProxyUpdated)
								await addressManager.updateProxyedToken(parent.info.contract, addressInfo.abi);

							tempToken = parentAddressInfo.address;
						}

						var twct = {
							from: { address: caller, name: "" },
							to: { address: transferTo, name: "" },
							amount: transferAmount,
							token: { decimals: 18, address: tempToken, units: ""}
						};
						//await this.completeWealthChangeInfo(twct);
						this.wealthChanges.push(twct);
					}
					else if(functionName === "transferFrom")
					{
						const transferFrom = item.info.inputs[0].value;
						const transferTo = item.info.inputs[1].value;
						const transferAmount = item.info.inputs[2].value;
						var tempToken = addressInfo.address;

						if(callType === 'delegatecall')
						{
							// proxy call, have to see on parent's info
							var parentAddressInfo = await addressManager.readAddress(parent.info.contract);
							if(!parentAddressInfo.tokenInfo.sc.bProxyUpdated)
								await addressManager.updateProxyedToken(parent.info.contract, addressInfo.abi);

							tempToken = parentAddressInfo.address;
						}	

						var twcf: TraceWealthChange = {
							from: { address: transferFrom, name: "" },
							to: { address: transferTo, name: "" },
							amount: transferAmount,
							token: { decimals: 18, address: tempToken, units: "" }
						};
						
						this.wealthChanges.push(twcf);
					}
				}
			}
			catch(error)
			{
				try
				{
					const errorFragment = iface.getError(input.slice(0,10));
					const errorFragmentType = errorFragment.type ; // Manage!
				}
				catch(err2)
				{
					try
					{
						const eventFragment = iface.getEvent(input.slice(0,10));
						const eventFragmentType = eventFragment.type ; // Manage!
					}
					catch(err3)
					{
						// In this case we are on a proxy call
						// and 99.9% sure that will have subtraces=1
						// and the next will be and action.calltype='delegatecall' 

						// fill with raw params
						var tempFunctionName = input.slice(0,10);
						if(tempFunctionName === '0x')
							tempFunctionName = "fallback";

						item.type = TraceType.ProxyFunction;
						item.info = {
							contract: toAddress,
							contractName,
							inputs: [{
								name: '',
								type: 'raw',
								value: input.slice(10)
							}],
							name: tempFunctionName,
							functionType: 'function',
							stateMutability: '',
							callType: callType,
							traceAddress: elm.traceAddress.join("."),
							value,
							outputs: [{
								name: '',
								type: 'raw',
								value: resultData
							}]
						};						
					}
				}
			}
		}
		else
		{
			// fill with raw params
			var tempFunctionName = input.slice(0,10);
			if(tempFunctionName === '0x')
				tempFunctionName = "fallback";

			item.type = TraceType.UnverifiedFunction;
			item.info = {
				contract: toAddress,
				contractName,
				inputs: [{
					name: '',
					type: 'raw',
					value: input.slice(10)
				}],
				name: tempFunctionName,
				functionType: 'function',
				stateMutability: '',
				callType: callType,
				traceAddress: elm.traceAddress.join("."),
				value,
				outputs: [{
					name: '',
					type: 'raw',
					value: resultData
				}]
			};
		}

		const bnEthValue = ethers.BigNumber.from(value);
		const prettyEthValue = ethers.utils.formatEther(bnEthValue);
		if(prettyEthValue !== "0.0")
		{
			var twce = {
				from: {
					address: caller,
					name: ""
				},
				to: {
					address: toAddress,
					name: ""
				},
				amount: prettyEthValue,
				token: {
					decimals: 18,
					address: "",
					units: "Eth"
				}
			};
			
			this.wealthChanges.push(twce);	
		}		

		if(item.nExpectedChildren > 0)
		{
			for(var i = 1; i <= item.nExpectedChildren; i++)
			{
				pPointer.pointer++;
				const childItem = await this.parseTraceItem(transactionTrace, pPointer, item);
			}
		}

		if(parent != null)
			parent.children.push(item);
		return item;
	}

	//---------------------------------------------------------------
	debugDumpTrace(itemList: Array<TraceItem>, dump: {contents: string}, tab: number)
	{
		itemList.forEach(item => {
			for(let t = 0; t < tab; t++)
				dump.contents += "\t";

			if(item.type === TraceType.Function || item.type === TraceType.ProxyFunction || item.type === TraceType.UnverifiedFunction)
			{
				if(item.bError)
					dump.contents += "!!!!" + item.error + "!!!! ";
				dump.contents += "{" + item.info.traceAddress + "} ";
				dump.contents += "|" + item.info.callType;
				dump.contents += "|" + item.info.contractName;
				dump.contents += "." + item.info.name;
				dump.contents += "(";
				const tempArgs = item.info.inputs.map((arg: any) => {
					if(arg.type === 'uint256' && arg.value !== undefined)
					{
						const bn = ethers.BigNumber.from(arg.value);
						return arg.name+":"+arg.type+"="+bn.toString();
					}
					else
						return arg.name+":"+arg.type+"="+arg.value;
				});
				dump.contents += tempArgs.join(", ");
				dump.contents += ") ["
				const bnEthValue = ethers.BigNumber.from(item.info.value);
				dump.contents += ethers.utils.formatEther(bnEthValue);
				dump.contents += "] -> ";
				dump.contents += "(";
				
				// if returns a single element
				if(item.info.outputs)
				{
					if(item.info.outputs.length === 1)
					{
						const arg = item.info.outputs[0];
						if(arg.type === 'uint256' && arg.value !== undefined)
						{
							const bn = ethers.BigNumber.from(arg.value);
							dump.contents += ":"+arg.type+"="+bn.toString();
						}
						else
							dump.contents += ":"+arg.type+"="+arg.value;
					}
					else
					{
						const tempRets = item.info.outputs.map((arg: any) => {
							if(arg.type === 'uint256' && arg.value !== undefined)
							{
								const bn = ethers.BigNumber.from(arg.value);
								return arg.name+":"+arg.type+"="+bn.toString();
							}
							else
								return arg.name+":"+arg.type+"="+arg.value;
						});
						dump.contents += tempRets.join(", ");
					}
				}
				dump.contents += ")\n";				
			}

			if(item.nExpectedChildren > 0)
				this.debugDumpTrace(item.children, dump, tab + 1);
		});
	}

	//---------------------------------------------------------------
	async debugWealthTrace(dump: {contents: string})
	{
		dump.contents += "\n\n\n";
		for(const element of this.wealthChanges)
		{
			dump.contents += "{" + element.from.name + "|"+element.from.address+"} --[";
			dump.contents += element.amount + " " + element.token.units;
			dump.contents += "]--> {" + element.to.name + "|"+element.to.address+"}\n";
		}
	}

	//---------------------------------------------------------------
	async debugDump(hash:string)
	{
		// debug dump
		let dump = {
			contents: ""
		};
		this.debugDumpTrace(this.trace, dump, 0);

		await this.debugWealthTrace(dump);

		fs.writeFile(process.cwd()+'/TXINFO/dump-'+hash+'.txt', dump.contents, function (err: any) {
			if(err)
				console.log(err);
		});
	}

	//---------------------------------------------------------------
	async parseTransactionTrace(hash:string, transactionTrace: Array<any>)
	{
		let pPointer = {
			pointer: 0
		};
		for(; pPointer.pointer < transactionTrace.length; pPointer.pointer++)
		{
			const item: TraceItem = await this.parseTraceItem(transactionTrace, pPointer, null);
			this.trace.push(item);
		}
	}

	//---------------------------------------------------------------
	async updateWealthInfo()
	{
		for(var i = 0; i < this.wealthChanges.length; i++)
		{
			await this.completeWealthChangeInfo(this.wealthChanges[i]);
		}
	}
}