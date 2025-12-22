import "reflect-metadata";
import { DataSource } from "typeorm";
import { Vehicle } from "./entity/Vehicle";
import { ParkingLot } from "./entity/ParkingLot";
import { ParkingSession } from "./entity/ParkingSession";
import { Payment } from "./entity/Payment";




export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "backend_db",
    synchronize: true, // WARNING: Disable in production
    logging: false,
    entities: [Vehicle, ParkingLot, ParkingSession, Payment],
    migrations: [],
    subscribers: [],
});
