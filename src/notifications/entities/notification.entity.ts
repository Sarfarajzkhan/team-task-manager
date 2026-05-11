import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  link: string; // URL to redirect when clicked (e.g., /tasks/uuid)

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  recipient: User;

  @CreateDateColumn()
  createdAt: Date;
}
