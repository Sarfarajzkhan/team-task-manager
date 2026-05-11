import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(recipient: User, message: string, link?: string) {
    const notification = this.notificationRepository.create({
      recipient,
      message,
      link,
    });
    return this.notificationRepository.save(notification);
  }

  async getForUser(user: User) {
    return this.notificationRepository.find({
      where: { recipient: { id: user.id } },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async getUnreadCount(user: User) {
    return this.notificationRepository.count({
      where: { recipient: { id: user.id }, isRead: false },
    });
  }

  async markAsRead(id: string) {
    await this.notificationRepository.update(id, { isRead: true });
  }

  async markAllAsRead(user: User) {
    await this.notificationRepository.update(
      { recipient: { id: user.id }, isRead: false },
      { isRead: true },
    );
  }
}
