import { Request, Response } from 'express';
import { RoleModulePermission } from '../../models/RoleModulePermission';
import { Role } from '../../models/Role';
import { ModuleItem } from '../../models/ModuleItem';
import { sequelize } from '../../config/database';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('RoleModulePermissionController');

export class RoleModulePermissionController {
    static async getAll(req: Request, res: Response) {
        try {
            const permissions = await RoleModulePermission.findAll({
                include: [{ model: Role }, { model: ModuleItem }]
            });
            res.json({ success: true, data: permissions });
        } catch (error) {
            logger.error('Error getting role module permissions', { error });
            res.status(500).json({ success: false, error: 'Error al obtener permisos' });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const permission = await RoleModulePermission.findByPk(parseInt(id), {
                include: [{ model: Role }, { model: ModuleItem }]
            });

            if (!permission) {
                return res.status(404).json({ success: false, error: 'Permiso no encontrado' });
            }

            res.json({ success: true, data: permission });
        } catch (error) {
            logger.error('Error getting role module permission', { error });
            res.status(500).json({ success: false, error: 'Error al obtener permiso' });
        }
    }

    static async getByRole(req: Request, res: Response) {
        try {
            const { roleId } = req.params;
            const permissions = await RoleModulePermission.findAll({
                where: { id_roles: parseInt(roleId) },
                include: [{ model: ModuleItem }]
            });
            res.json({ success: true, data: permissions });
        } catch (error) {
            logger.error('Error getting permissions by role', { error });
            res.status(500).json({ success: false, error: 'Error al obtener permisos del rol' });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const { can_view, can_create, can_edit, can_delete, id_roles, id_module_items } = req.body;

            if (!id_roles || !id_module_items) {
                return res.status(400).json({ success: false, error: 'id_roles e id_module_items son obligatorios' });
            }

            const permission = await RoleModulePermission.create({
                can_view: can_view ?? 1,
                can_create: can_create ?? 0,
                can_edit: can_edit ?? 0,
                can_delete: can_delete ?? 0,
                id_roles,
                id_module_items
            });

            res.status(201).json({ success: true, data: permission });
        } catch (error) {
            logger.error('Error creating role module permission', { error });
            res.status(500).json({ success: false, error: 'Error al crear permiso' });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { can_view, can_create, can_edit, can_delete, id_roles, id_module_items } = req.body;

            const permission = await RoleModulePermission.findByPk(parseInt(id));

            if (!permission) {
                return res.status(404).json({ success: false, error: 'Permiso no encontrado' });
            }

            await permission.update({ can_view, can_create, can_edit, can_delete, id_roles, id_module_items });

            res.json({ success: true, data: permission });
        } catch (error) {
            logger.error('Error updating role module permission', { error });
            res.status(500).json({ success: false, error: 'Error al actualizar permiso' });
        }
    }

    /**
     * POST /api/v1/role-module-permissions/bulk
     * Reemplaza todos los permisos de los roles indicados en el array.
     * Body: { permissions: [{ can_view, can_create, can_edit, can_delete, id_roles, id_module_items }] }
     */
    static async bulk(req: Request, res: Response) {
        try {
            const { permissions } = req.body;

            if (!Array.isArray(permissions) || permissions.length === 0) {
                return res.status(400).json({ success: false, error: 'permissions debe ser un array no vacío' });
            }

            const result = await sequelize.transaction(async (t) => {
                // Obtener roles únicos del array
                const roleIds = [...new Set(permissions.map((p: any) => p.id_roles))];

                // Eliminar permisos existentes de esos roles
                await RoleModulePermission.destroy({
                    where: { id_roles: roleIds },
                    transaction: t
                });

                // Insertar los nuevos permisos — se omite id_role_module_permissions
                // para que MySQL genere el ID con AUTO_INCREMENT
                const cleanPermissions = permissions.map(({ id_role_module_permissions, ...rest }: any) => rest);
                return RoleModulePermission.bulkCreate(cleanPermissions, { transaction: t });
            });

            res.status(201).json({ success: true, data: result });
        } catch (error) {
            logger.error('Error bulk creating role module permissions', { error });
            res.status(500).json({ success: false, error: 'Error al guardar permisos' });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const permission = await RoleModulePermission.findByPk(parseInt(id));

            if (!permission) {
                return res.status(404).json({ success: false, error: 'Permiso no encontrado' });
            }

            await permission.destroy();

            res.json({ success: true, message: 'Permiso eliminado correctamente' });
        } catch (error) {
            logger.error('Error deleting role module permission', { error });
            res.status(500).json({ success: false, error: 'Error al eliminar permiso' });
        }
    }
}
