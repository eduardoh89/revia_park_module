import { Request, Response } from 'express';
import { Module } from '../../models/Module';
import { ModuleItem } from '../../models/ModuleItem';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('ModuleController');

export class ModuleController {
    /**
     * GET /api/v1/modules
     * Listar todos los módulos
     */
    static async getAll(req: Request, res: Response) {
        try {
            const includeItems = req.query.include === 'items';

            const modules = await Module.findAll({
                ...(includeItems && { include: [{ model: ModuleItem }] }),
            });

            const sorted = modules
                .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                .map((m) => {
                    const json = m.toJSON() as any;
                    if (json.moduleItems) {
                        json.moduleItems.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
                    }
                    return json;
                });

            res.json({
                success: true,
                data: sorted,
            });
        } catch (error) {
            logger.error('Error getting modules', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener módulos',
            });
        }
    }

    /**
     * GET /api/v1/modules/:id
     * Obtener un módulo por ID
     */
    static async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const module = await Module.findByPk(parseInt(id), {
                include: [{ model: ModuleItem }],
            });

            if (!module) {
                return res.status(404).json({
                    success: false,
                    error: 'Módulo no encontrado',
                });
            }

            res.json({
                success: true,
                data: {
                    id: module.id_modules,
                    code: module.code,
                    name: module.name,
                    icon: module.icon,
                    route: module.route,
                    sort_order: module.sort_order,
                    is_active: module.is_active,
                    items: (module.moduleItems || []).map((item) => ({
                        id: item.id_module_items,
                        code: item.code,
                        name: item.name,
                        icon: item.icon,
                        route: item.route,
                        is_active: item.is_active,
                    })),
                },
            });
        } catch (error) {
            logger.error('Error getting module', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener módulo',
            });
        }
    }

    /**
     * POST /api/v1/modules
     * Crear un nuevo módulo
     */
    static async create(req: Request, res: Response) {
        try {
            const { code, name, icon, route, sort_order, is_active } = req.body;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    error: 'El nombre es obligatorio',
                });
            }

            if (!route) {
                return res.status(400).json({
                    success: false,
                    error: 'La ruta es obligatoria',
                });
            }

            const module = await Module.create({
                code,
                name,
                icon,
                route,
                sort_order,
                is_active: is_active ?? 1,
            });

            res.status(201).json({
                success: true,
                data: {
                    id: module.id_modules,
                    code: module.code,
                    name: module.name,
                    icon: module.icon,
                    route: module.route,
                    sort_order: module.sort_order,
                    is_active: module.is_active,
                },
            });
        } catch (error) {
            logger.error('Error creating module', { error });
            res.status(500).json({
                success: false,
                error: 'Error al crear módulo',
            });
        }
    }

    /**
     * PUT /api/v1/modules/:id
     * Actualizar un módulo
     */
    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { code, name, icon, route, sort_order, is_active } = req.body;

            const module = await Module.findByPk(parseInt(id));

            if (!module) {
                return res.status(404).json({
                    success: false,
                    error: 'Módulo no encontrado',
                });
            }

            if (!name) {
                return res.status(400).json({
                    success: false,
                    error: 'El nombre es obligatorio',
                });
            }

            if (!route) {
                return res.status(400).json({
                    success: false,
                    error: 'La ruta es obligatoria',
                });
            }

            await module.update({ code, name, icon, route, sort_order, is_active });

            res.json({
                success: true,
                data: {
                    id: module.id_modules,
                    code: module.code,
                    name: module.name,
                    icon: module.icon,
                    route: module.route,
                    sort_order: module.sort_order,
                    is_active: module.is_active,
                },
            });
        } catch (error) {
            logger.error('Error updating module', { error });
            res.status(500).json({
                success: false,
                error: 'Error al actualizar módulo',
            });
        }
    }

    /**
     * DELETE /api/v1/modules/:id
     * Eliminar un módulo
     */
    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const module = await Module.findByPk(parseInt(id));

            if (!module) {
                return res.status(404).json({
                    success: false,
                    error: 'Módulo no encontrado',
                });
            }

            await module.destroy();

            res.json({
                success: true,
                message: 'Módulo eliminado correctamente',
            });
        } catch (error) {
            logger.error('Error deleting module', { error });
            res.status(500).json({
                success: false,
                error: 'Error al eliminar módulo',
            });
        }
    }
}
