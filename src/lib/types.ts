export enum TxActionCallType {
    None = "",
    Call = "call",
    CallCode = "callCode",
    DelegateCall = "delegateCall",
    StaticCall = "staticCall"
}

export enum TxTraceType {
	Call = "call",
}

export type TxAction = {
	from: string,
	callType: TxActionCallType,
	gas: string,
	input: string,
	to: string,
	value: string
}

export type TxResult = {
	gasUsed: string,
	output: string
}

export type TxTraceItem = {
	action: TxAction,
	blockHash: string, /*not interesting*/
	blockNumber: number, /*not interesting*/
	error: null | string,
	result: TxResult,
	subtraces: number, /* Amount of child traces */
	traceAddress: Array<number>, /* traceAddress field
		The traceAddress field of all returned traces, gives the exact location 
		in the call trace [index in root, index in first CALL, index in second CALL, …].
		
		i.e. if the trace is:
		
		A
		CALLs B
			CALLs C
		CALLs D
			CALLs E
		then it should look something like:
		
		[ {A: []}, {B: [0]}, {C: [0, 0]}, {D: [1]}, {E: [1, 0]} ]*/
	transactionHash: string, /*not interesting*/
	transactionPosition: number, /*not interesting*/
	type: TxTraceType
}

export enum TraceType {
	undef,
	Function,
	Error,
	Event,
	ProxyFunction, // internal special function that throws error
	UnverifiedFunction // internal special function
}

export type TraceInfoFunction = {
	contract: string,
	contractName: string,
	inputs: Array<any>,
	name: string,
	callType: string, // call, staticcall, delegatecall
	functionType: string, // constructor | event | function
	stateMutability: string,
	outputs: Array<any>
}

export type TraceInfoError = {
	contract: string,
	contractName: string,
	inputs: Array<any>,
	name: string
}

export type TraceInfoEvent = {
	contract: string,
	contractName: string,
	inputs: Array<any>,
	name: string
}

export type TraceItem = {
	type: TraceType,
	info: any, //null | TraceInfoFunction | TraceInfoError | TraceInfoEvent,
	nExpectedChildren: number,
	children: Array<TraceItem>,
	bError: boolean,
	error: null | string
}

export type TraceWealthChange = {
	from: {
		address: string,
		name: string
	},
	to: {
		address: string,
		name: string
	},
	amount: number | string | any,
	token: {
		decimals: number,
		address: string,
		units: string // "" for eth and address contract for other tokens
	}
};

export type Address = {
	address: string,
	name: string,
	abi: JSON,
	isToken: boolean,
	tokenInfo: {
		rawName: string,
		icon: string,
		erc: string,
		sc: {
			bProxyUpdated: boolean,
			name: string,
			symbol: string,
			decimals: number
		}
	},
};