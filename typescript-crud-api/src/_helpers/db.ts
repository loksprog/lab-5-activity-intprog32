import config from '../../config.json';
import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';

export interface Database {
    User: any;
}

export const db:Database = {} as Database;

export async function initialize() : Promise<void> {
    const {host, port, user, password, database} = config.database;
}