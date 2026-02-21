import { Request, Response } from 'express';
import { Company } from '../../models/Company';
import { Logger } from '../../shared/utils/logger';
import { validate as validateRut } from 'rut.js';

const logger = new Logger('CompanyController');

/**
 * Formatea un RUT con zero-fill a 8 dígitos + guión + dígito verificador
 * Entrada: "6320987-5" o "63209875" → Salida: "06320987-5"
 */
const formatRut = (rut: string): string => {
    // Quitar puntos si vienen
    let clean = rut.replace(/\./g, '');

    // Si no tiene guión, insertar antes del último carácter
    if (!clean.includes('-')) {
        clean = clean.slice(0, -1) + '-' + clean.slice(-1);
    }

    const [body, dv] = clean.split('-');
    const paddedBody = body.padStart(8, '0');
    return `${paddedBody}-${dv}`;
};

export class CompanyController {
    /**
     * GET /api/v1/companies
     * Listar todas las empresas
     */
    static async getAll(req: Request, res: Response) {
        try {
            const companies = await Company.findAll();

            res.json({
                success: true,
                data: companies,
            });
        } catch (error) {
            logger.error('Error getting companies', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener empresas',
            });
        }
    }

    /**
     * GET /api/v1/companies/:id
     * Obtener una empresa por ID
     */
    static async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const company = await Company.findByPk(parseInt(id));

            if (!company) {
                return res.status(404).json({
                    success: false,
                    error: 'Empresa no encontrada',
                });
            }

            res.json({
                success: true,
                data: company,
            });
        } catch (error) {
            logger.error('Error getting company', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener empresa',
            });
        }
    }

    /**
     * POST /api/v1/companies
     * Crear una nueva empresa
     */
    static async create(req: Request, res: Response) {
        try {
            const { rut, name, business_name, phone, email } = req.body;

            if (!rut) {
                return res.status(400).json({
                    success: false,
                    error: 'El RUT es obligatorio',
                });
            }

            if (!validateRut(rut)) {
                return res.status(409).json({
                    success: false,
                    error: 'El RUT ingresado no es válido',
                });
            }

            if (!business_name) {
                return res.status(409).json({
                    success: false,
                    error: 'La razón social es obligatoria',
                });
            }

            const formattedRut = formatRut(rut);


            const company = await Company.create({ rut: formattedRut, name, business_name, phone, email });

            res.status(201).json({
                success: true,
                data: company,
            });
        } catch (error) {
            logger.error('Error creating company', { error });
            res.status(500).json({
                success: false,
                error: 'Error al crear empresa',
            });
        }
    }

    /**
     * PUT /api/v1/companies/:id
     * Actualizar una empresa
     */
    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { rut, name, business_name, phone, email } = req.body;

            const company = await Company.findByPk(parseInt(id));

            if (!company) {
                return res.status(404).json({
                    success: false,
                    error: 'Empresa no encontrada',
                });
            }

            if (!rut) {
                return res.status(400).json({
                    success: false,
                    error: 'El RUT es obligatorio',
                });
            }

            if (!business_name) {
                return res.status(400).json({
                    success: false,
                    error: 'La razón social es obligatoria',
                });
            }

            const formattedRut = formatRut(rut);

            await company.update({ rut: formattedRut, name, business_name, phone, email });

            res.json({
                success: true,
                data: company,
            });
        } catch (error) {
            logger.error('Error updating company', { error });
            res.status(500).json({
                success: false,
                error: 'Error al actualizar empresa',
            });
        }
    }

    /**
     * DELETE /api/v1/companies/:id
     * Eliminar una empresa
     */
    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const company = await Company.findByPk(parseInt(id));

            if (!company) {
                return res.status(404).json({
                    success: false,
                    error: 'Empresa no encontrada',
                });
            }

            await company.destroy();

            res.json({
                success: true,
                message: 'Empresa eliminada correctamente',
            });
        } catch (error) {
            logger.error('Error deleting company', { error });
            res.status(500).json({
                success: false,
                error: 'Error al eliminar empresa',
            });
        }
    }
}
