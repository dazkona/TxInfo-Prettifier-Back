import 'jest';
const express = require('express');
const request = require('supertest');
import { StatusCodes } from 'http-status-codes';
import IntegrationHelpers from '../helpers/Integration-helpers';
import mongoose from 'mongoose';

describe('API integration tests', () => {
    let app: any;
    
    beforeAll(async() => {
        app = await IntegrationHelpers.getApp();
    });

    it('weird call', async () => {
        await request(app)
            .get('/api2')
            .set('Accept', 'application/json')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(StatusCodes.NOT_FOUND);
    });	

    it('ping-pong', async () => {
        const response = await request(app).get('/api/ping').set('Accept', 'application/json');
		expect(response.statusCode).toBe(StatusCodes.OK);
		expect(response.body.msg).toEqual("pong");
    });

    it('real transaction address', async () => {
        const response = await request(app).get('/api/tx/0x08502485a19f62c990f0ae2c4d9d124fe30199367251b4e00a6fbc731514392b').set('Accept', 'application/json');
		expect(response.body).not.toEqual({"data":{"trace":[],"wealthChanges":[]}});
		expect(response.statusCode).toBe(StatusCodes.OK);
    });

    it('invalid transaction address', async () => {
        const response = await request(app).get('/api/tx/0x0000000000000000000000000000000000000000000000000000000000000000').set('Accept', 'application/json');
		expect(response.statusCode).toBe(StatusCodes.OK);
		expect(response.body).toEqual({"data":{"trace":[],"wealthChanges":[]}});
    });	

	afterAll(async () => {
		await mongoose.disconnect();
	});
});