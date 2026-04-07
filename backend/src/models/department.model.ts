import { DataTypes, Model, Optional } from "sequelize";
import type { Sequelize } from "sequelize";

export interface DepartmentAttributes {
  id: number;
  name: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DepartmentCreationAttributes extends Optional<
  DepartmentAttributes,
  "id"
> {}

export class Department
  extends Model<DepartmentAttributes, DepartmentCreationAttributes>
  implements DepartmentAttributes
{
  public id!: number;
  public name!: string;
  public description!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export function initDepartmentModel(sequelize: Sequelize): typeof Department {
  Department.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false, unique: true },
      description: { type: DataTypes.STRING, allowNull: false },
    },
    {
      sequelize,
      modelName: "Department",
      tableName: "departments",
      timestamps: true,
    },
  );
  return Department;
}
