const express = require('express');
const http = require('http');
const traceTx = require('./lib/traceTx').default;

const router = express.Router();

router.get('/tx/:txHash', async (req: any, res:any, next:any) => 
{
	const txHash = req.params.txHash;

	const txTraceInfo = await traceTx(txHash);
	if(txTraceInfo)
		res.status(200).json({data: txTraceInfo});
	else 
		res.status(404).json({err: "Transaction not found"});
});

export = router;