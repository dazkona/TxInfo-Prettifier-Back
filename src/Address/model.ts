import mongoose, {Document, Schema} from "mongoose";

export interface IAddress {
	address: string,
	name: string,
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
	}
};

export interface IAddressModel extends IAddress, Document {}

const AddressSchema: Schema = new Schema({
	address: {type: String, required: true},
	name: {type: String, required: false},
	isToken: {type: Boolean, required: true},
	tokenInfo: {
		rawName: {type: String, required: false},
		icon: {type: String, required: false},
		erc: {type: String, required: false},
		sc: {
			bProxyUpdated: {type: Boolean, required: false},
			name: {type: String, required: false},
			symbol: {type: String, required: false},
			decimals: {type: String, required: Number}
		}
	}
});

export default mongoose.model<IAddressModel>('Address', AddressSchema);