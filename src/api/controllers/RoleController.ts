import { Request, Response } from 'express';
import { Role } from '../../models/Role';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('RoleController');

export class RoleController {
    static async getAll(req: Request, res: Response) {
        try {
            const roles = await Role.findAll();
            res.json({ success: true, data: roles });
        } catch (error) {
            logger.error('Error getting roles', { error });
            res.status(500).json({ success: false, error: 'Error al obtener roles' });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const role = await Role.findByPk(parseInt(id));

            if (!role) {
                return res.status(404).json({ success: false, error: 'Rol no encontrado' });
            }

            res.json({ success: true, data: role });
        } catch (error) {
            logger.error('Error getting role', { error });
            res.status(500).json({ success: false, error: 'Error al obtener rol' });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const { id_roles, name, description, is_active, not_delete } = req.body;

            if (!id_roles || !name) {
                return res.status(400).json({ success: false, error: 'id_roles y name son obligatorios' });
            }

            const role = await Role.create({ id_roles, name, description, is_active: is_active ?? 1, not_delete });

            res.status(201).json({ success: true, data: role });
        } catch (error) {
            logger.error('Error creating role', { error });
            res.status(500).json({ success: false, error: 'Error al crear rol' });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, description, is_active, not_delete } = req.body;

            const role = await Role.findByPk(parseInt(id));

            if (!role) {
                return res.status(404).json({ success: false, error: 'Rol no encontrado' });
            }

            if (!name) {
                return res.status(400).json({ success: false, error: 'El nombre es obligatorio' });
            }

            await role.update({ name, description, is_active, not_delete });

            res.json({ success: true, data: role });
        } catch (error) {
            logger.error('Error updating role', { error });
            res.status(500).json({ success: false, error: 'Error al actualizar rol' });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const role = await Role.findByPk(parseInt(id));

            if (!role) {
                return res.status(404).json({ success: false, error: 'Rol no encontrado' });
            }

            await role.destroy();

            res.json({ success: true, message: 'Rol eliminado correctamente' });
        } catch (error) {
            logger.error('Error deleting role', { error });
            res.status(500).json({ success: false, error: 'Error al eliminar rol' });
        }
    }
}
