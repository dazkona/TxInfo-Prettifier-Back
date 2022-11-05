const axios = require('axios');
const cheerio = require('cheerio');

const ETHERSCAN_BASEURL = 'https://etherscan.io/address/';

export async function getPublicName(address: string)
{
	var publicName = "";
	try
	{
		const pageContent = await axios.get(ETHERSCAN_BASEURL+address);
		const $ = cheerio.load(pageContent.data);
		publicName = $('div#ContentPlaceHolder1_divSummary div.card-header span.u-label span').text();
	}
	catch(err)
	{
		console.error(err);
	}
	return publicName;
}

// If there isn't official name, we look at Contract Code name
export async function getPublicNameSecondary(address: string)
{
	var publicName = "";
	try
	{
		const pageContent = await axios.get(ETHERSCAN_BASEURL+address+'#code');
		const $ = cheerio.load(pageContent.data);
		publicName = $('div#ContentPlaceHolder1_contractCodeDiv span.h6.font-weight-bold:first').text();
	}
	catch(err)
	{
		console.error(err);
	}
	return publicName;
}

export async function isToken(address: string)
{
	var ret = {
		isToken: false,
		img: "",
		rawNameCoin: ""
	};

	try
	{	
		const pageContent = await axios.get(ETHERSCAN_BASEURL+address);
		const $ = cheerio.load(pageContent.data);
		const logo = $('div#ContentPlaceHolder1_divSummary div#ContentPlaceHolder1_cardright div.card-body div#ContentPlaceHolder1_tr_tokeninfo div.col-md-8 img');
		if(logo.length === 1 && logo[0].hasOwnProperty('attribs'))
		{
			// is token!!!
			ret.isToken = true;
			ret.img = logo[0].attribs.src;
			ret.rawNameCoin = $('div#ContentPlaceHolder1_divSummary div#ContentPlaceHolder1_cardright div.card-body div#ContentPlaceHolder1_tr_tokeninfo div.col-md-8 a').text();
		}
	}
	catch(err)
	{
		console.error(err);
	}		

	return ret;
}