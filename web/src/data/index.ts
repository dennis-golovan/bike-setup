import { BikeSetupDb } from './db';
import { Repository } from './repository';

export const db = new BikeSetupDb();
export const repo = new Repository(db);
