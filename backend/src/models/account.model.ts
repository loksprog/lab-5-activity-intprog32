import { DataTypes, Model, Optional } from "sequelize";
import type { Sequelize } from "sequelize";

export interface AccountAttributes {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  verified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AccountCreationAttributes
  extends Optional<AccountAttributes, "id" | "verified"> {}

export class Account
  extends Model<AccountAttributes, AccountCreationAttributes>
  implements AccountAttributes
{
  public id!: number;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public password!: string;
  public role!: string;
  public verified!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initAccountModel(sequelize: Sequelize): typeof Account {
  Account.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      firstName: { type: DataTypes.STRING, allowNull: false },
      lastName: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.STRING, allowNull: false, defaultValue: "employee" },
      verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
      sequelize,
      modelName: "Account",
      tableName: "accounts",
      timestamps: true,
      defaultScope: {
        attributes: { exclude: ["password"] },
      },
      scopes: {
        withPassword: { attributes: { include: ["password"] } },
      },
    }
  );
  return Account;
}