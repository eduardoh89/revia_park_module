import { Request, Response } from 'express';
import { ModuleItem } from '../../models/ModuleItem';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('ModuleItemController');

export class ModuleItemController {
    /**
     * GET /api/v1/module-items
     * Listar todos los items de módulo
     */
    static async getAll(req: Request, res: Response) {
        try {
            const moduleItems = await ModuleItem.findAll();

            res.json({
                success: true,
                data: moduleItems.map((item) => ({
                    id: item.id_module_items,
                    code: item.code,
                    name: item.name,
                    icon: item.icon,
                    route: item.route,
                    is_active: item.is_active,
                    id_modules: item.id_modules,
                })),
            });
        } catch (error) {
            logger.error('Error getting module items', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener items de módulo',
            });
        }
    }

    /**
     * GET /api/v1/module-items/:id
     * Obtener un item de módulo por ID
     */
    static async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const moduleItem = await ModuleItem.findByPk(parseInt(id));

            if (!moduleItem) {
                return res.status(404).json({
                    success: false,
                    error: 'Item de módulo no encontrado',
                });
            }

            res.json({
                success: true,
                data: {
                    id: moduleItem.id_module_items,
                    code: moduleItem.code,
                    name: moduleItem.name,
                    icon: moduleItem.icon,
                    route: moduleItem.route,
                    is_active: moduleItem.is_active,
                    id_modules: moduleItem.id_modules,
                },
            });
        } catch (error) {
            logger.error('Error getting module item', { error });
            res.status(500).json({
                success: false,
                error: 'Error al obtener item de módulo',
            });
        }
    }

    /**
     * POST /api/v1/module-items
     * Crear un nuevo item de módulo
     */
    static async create(req: Request, res: Response) {
        try {
            const { code, name, icon, route, is_active, sort_order,id_modules } = req.body;

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

            if (!id_modules) {
                return res.status(400).json({
                    success: false,
                    error: 'El id del módulo es obligatorio',
                });
            }

            const moduleItem = await ModuleItem.create({
                code,
                name,
                icon,
                route,
                is_active: is_active ?? 1,
                sort_order,
                id_modules,
            });

            res.status(201).json({
                success: true,
                data: {
                    id: moduleItem.id_module_items,
                    code: moduleItem.code,
                    name: moduleItem.name,
                    icon: moduleItem.icon,
                    route: moduleItem.route,
                    is_active: moduleItem.is_active,
                    sort_order : moduleItem.sort_order,
                    id_modules: moduleItem.id_modules,
                },
            });
        } catch (error) {
            logger.error('Error creating module item', { error });
            res.status(500).json({
                success: false,
                error: 'Error al crear item de módulo',
            });
        }
    }

    /**
     * PUT /api/v1/module-items/:id
     * Actualizar un item de módulo
     */
    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { code, name, icon, route, is_active,sort_order, id_modules } = req.body;

            const moduleItem = await ModuleItem.findByPk(parseInt(id));

            if (!moduleItem) {
                return res.status(404).json({
                    success: false,
                    error: 'Item de módulo no encontrado',
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

            await moduleItem.update({ code, name, icon, route, is_active, id_modules });

            res.json({
                success: true,
                data: {
                    id: moduleItem.id_module_items,
                    code: moduleItem.code,
                    name: moduleItem.name,
                    icon: moduleItem.icon,
                    route: moduleItem.route,
                    is_active: moduleItem.is_active,
                    sort_order : moduleItem.sort_order,
                    id_modules: moduleItem.id_modules,
                },
            });
        } catch (error) {
            logger.error('Error updating module item', { error });
            res.status(500).json({
                success: false,
                error: 'Error al actualizar item de módulo',
            });
        }
    }

    /**
     * DELETE /api/v1/module-items/:id
     * Eliminar un item de módulo
     */
    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const moduleItem = await ModuleItem.findByPk(parseInt(id));

            if (!moduleItem) {
                return res.status(404).json({
                    success: false,
                    error: 'Item de módulo no encontrado',
                });
            }

            await moduleItem.destroy();

            res.json({
                success: true,
                message: 'Item de módulo eliminado correctamente',
            });
        } catch (error) {
            logger.error('Error deleting module item', { error });
            res.status(500).json({
                success: false,
                error: 'Error al eliminar item de módulo',
            });
        }
    }
}
