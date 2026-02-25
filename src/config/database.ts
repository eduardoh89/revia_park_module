import { Sequelize } from 'sequelize-typescript';
import { VehicleType } from '../models/VehicleType';
import { Vehicle } from '../models/Vehicle';
import { ParkingLot } from '../models/ParkingLot';
import { Contract } from '../models/Contract';
import { ParkingSession } from '../models/ParkingSession';
import { PaymentMethod } from '../models/PaymentMethod';
import { Payment } from '../models/Payment';
import { PaymentLink } from '../models/PaymentLink';
import { CreditNote } from '../models/CreditNote';
import { WhatsAppContact } from '../models/WhatsAppContact';
import { WhatsAppConversation } from '../models/WhatsAppConversation';
import { ModuleItem } from '../models/ModuleItem';
import { Module } from '../models/Module';
import { Company } from '../models/Company';
import { ContractType } from '../models/ContractType';
import { VehicleRate } from '../models/VehicleRate';
import { VehicleRateConfig } from '../models/VehicleRateConfig';
import { ContractRate } from '../models/ContractRate';
import { ContractRateConfig } from '../models/ContractRateConfig';
import { QRConfig } from '../models/QRConfig';
import { ExceptionType } from '../models/ExceptionType';
import { Exception } from '../models/Exception';

export const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'backend_db',
    logging: false,
    dialectOptions: {
        charset: 'utf8mb4'
    },
    define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
    },
    models: [
        VehicleType,
        Vehicle,
        ParkingLot,
        Company,
        ContractType,
        Contract,
        ParkingSession,
        PaymentMethod,
        Payment,
        PaymentLink,
        CreditNote,
        WhatsAppContact,
        WhatsAppConversation,
        ModuleItem,
        Module,
        VehicleRate,
        VehicleRateConfig,
        ContractRate,
        ContractRateConfig,
        QRConfig,
        ExceptionType,
        Exception
    ],
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

export const connectDatabase = async (): Promise<void> => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        throw error;
    }
};
