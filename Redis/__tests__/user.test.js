import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import userModel from '../models/user.model.js';

let mongoServer;

export const connect = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};

export const disconnect = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongoServer.stop();
};

export const clearCollections = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

beforeAll(async () => await connect());
afterAll(async  () => await disconnect());
afterEach(async () => await clearCollections());


describe('User Model Test', () => {
  it('should create & save user successfully', async () => {
    const validUser = new userModel({name: "Aashish", email: "aashish@gmail.com"});
    const savedUser = await validUser.save();
    expect(savedUser.name).toBe('Aashish');
    expect(savedUser.email).toBe('aashish@gmail.com');
  });
})