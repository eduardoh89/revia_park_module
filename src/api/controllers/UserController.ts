import { Request, Response } from 'express';
import { User } from '../../models/User';
import { Role } from '../../models/Role';
import { Logger } from '../../shared/utils/logger';

const logger = new Logger('UserController');

export class UserController {
    static async getAll(req: Request, res: Response) {
        try {
            const users = await User.findAll({ include: [{ model: Role }] });
            res.json({ success: true, data: users });
        } catch (error) {
            logger.error('Error getting users', { error });
            res.status(500).json({ success: false, error: 'Error al obtener usuarios' });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = await User.findByPk(parseInt(id), { include: [{ model: Role }] });

            if (!user) {
                return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
            }

            res.json({ success: true, data: user });
        } catch (error) {
            logger.error('Error getting user', { error });
            res.status(500).json({ success: false, error: 'Error al obtener usuario' });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const { id_users, name, id_roles } = req.body;

            if (!id_users || !id_roles) {
                return res.status(400).json({ success: false, error: 'id_users e id_roles son obligatorios' });
            }

            const user = await User.create({ id_users, name, id_roles });

            res.status(201).json({ success: true, data: user });
        } catch (error) {
            logger.error('Error creating user', { error });
            res.status(500).json({ success: false, error: 'Error al crear usuario' });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, id_roles } = req.body;

            const user = await User.findByPk(parseInt(id));

            if (!user) {
                return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
            }

            await user.update({ name, id_roles });

            res.json({ success: true, data: user });
        } catch (error) {
            logger.error('Error updating user', { error });
            res.status(500).json({ success: false, error: 'Error al actualizar usuario' });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user = await User.findByPk(parseInt(id));

            if (!user) {
                return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
            }

            await user.destroy();

            res.json({ success: true, message: 'Usuario eliminado correctamente' });
        } catch (error) {
            logger.error('Error deleting user', { error });
            res.status(500).json({ success: false, error: 'Error al eliminar usuario' });
        }
    }
}
