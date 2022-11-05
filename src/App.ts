const express = require('express');
const http = require('http');
const rateLimit = require('express-rate-limit');
const mongoose = require("mongoose");
const { config } = require("./config");
const  APIRoutes = require("./api");

export default class App
{
	public router: any;

	constructor()
	{

	}

	protected startServer(): void
	{
		this.router.use((req: any, res: any, next: any) => {
			console.info('API call IN ['+req.method+'] URL['+req.url+'] remoteIP['+req.socket.remoteAddress+']');
	
			res.on('finish', () => {
				console.info('API call OUT ['+req.method+'] URL['+req.url+'] remoteIP['+req.socket.remoteAddress+'] => ['+res.statusCode+']');
			});
	
			next();
		});
	
		this.router.use(express.urlencoded({extended: true}));
		this.router.use(express.json());
		/*this.router.use(rateLimit({
			windowMs: 1 * 60 * 1000, // 1 min in milliseconds
			max: 1,
			message: 'Call rate error, you have reached maximum retries. Please try again after 1 minute',
			statusCode: 429,
			headers: true,
		}));*/
	
		this.router.use((req: any, res: any, next: any) => {
			res.header('Access-Control-Allow-Origin', '*');
			res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-Width, Content-Type, Accept, Authorization');
	
			if(req.method == 'OPTIONS')
			{
				res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
				return res.status(200).json({});
			}
	
			next();
		});
	
		// Routes
		this.router.use('/api', APIRoutes);
	
		// ping-pong, under routes
		this.router.get('/api/ping', (req: any, res: any, next: any)=> {
			res.status(200).json({msg: 'pong', dt: Date.now()});
		});
	
		// last, checking for errors
		this.router.use((req: any, res: any, next: any) => {
			return res.status(404).json({msg: 'API endpoint not found'});
		});
		
		http.createServer(this.router).listen(config.SERVER_PORT, () => {
			console.info('Server is running on '+config.SERVER_PORT);
		});

		process.on('exit', () => {
			mongoose.disconnect();
		});		
	}

	public async init(): Promise<void>
	{
		this.router = express();

		return new Promise((resolve, reject) => {
			mongoose.connect(config.MONGO_URL+':'+config.MONGO_SERVER_PORT)
				.then(() => {
					console.log('MongoDB connected');
					this.startServer();
					resolve();
				})
				.catch((error: any) => {
					console.log('MongoDB err try connecting: '+error);
					reject();
				});
		});
	}
}