import mongoose from 'mongoose';
import AddressModel from './model';
import { Address } from '../lib/types';

//-------------------------------------------------------------------
const createAddress = async (_address: Address) => {

	let address = new AddressModel({
		address: _address.address,
		name: _address.name,
		isToken: _address.isToken,
		tokenInfo: {
			rawName: _address.tokenInfo.rawName,
			icon: _address.tokenInfo.icon,
			erc: _address.tokenInfo.erc,
			sc: {
				bProxyUpdated: _address.tokenInfo.sc.bProxyUpdated,
				name: _address.tokenInfo.sc.name,
				symbol: _address.tokenInfo.sc.symbol,
				decimals: _address.tokenInfo.sc.decimals
			}
		}		
	});

	try
	{
		await address.save();
	}
	catch(err)
	{
		console.error(err);
	}
};

//-------------------------------------------------------------------
const readAddress = async (_address: string) => {
	let address = await AddressModel.findOne({ address: _address }).exec();
	return address;
};

//-------------------------------------------------------------------
const updateProxyedToken = async (_address: string, {name, symbol, decimals}: any) => {
	let address = await AddressModel.findOne({ address: _address }).exec();
	if(address)
	{
		address.tokenInfo.sc.name = name;
		address.tokenInfo.sc.symbol = symbol;
		address.tokenInfo.sc.decimals = decimals;
		address.tokenInfo.sc.bProxyUpdated = true;

		try
		{
			await address.save();
		}
		catch(err)
		{
			console.error(err);
		}
	}
};

//-------------------------------------------------------------------
export default {createAddress, readAddress, updateProxyedToken};