const App = require('./App').default;

const app = new App();
(async () => {	
	await app.init();
})().catch(e => {console.log(e);});
