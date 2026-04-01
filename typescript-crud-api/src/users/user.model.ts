import { DataTypes, Model, Optional } from "sequelize";
import type {Sequelize} from 'sequelize';

// Define the attributes interface 
export interface UserAttributes {
    id: number;
    email: string;
}