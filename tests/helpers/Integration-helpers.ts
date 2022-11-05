import * as express from 'express';
import App from '../../src/App';

export default class IntegrationHelpers {

    public static appInstance: express.Application;

    public static async getApp(): Promise<express.Application> {
        if(this.appInstance)
            return this.appInstance;
        
        const app: App = new App();
        await app.init();
        this.appInstance = app.router;

        return this.appInstance;
    }

    public clearDatabase(): void {
        console.info('clear the database');
    }
}