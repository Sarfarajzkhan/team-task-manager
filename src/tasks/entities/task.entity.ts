import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

import { Project } from '../../projects/entities/project.entity';

import { TaskStatus } from '../../common/enums/task-status.enum';

import { Priority } from '../../common/enums/priority.enum';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string;

  @Index()
  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM,
  })
  priority: Priority;

  @Column({
    type: 'timestamp',
  })
  dueDate: Date;

  @ManyToOne(() => User, {
    eager: true,
    nullable: false,
  })
  assignedTo: User;

  @ManyToOne(() => User, {
    eager: true,
    nullable: false,
  })
  createdBy: User;

  @ManyToOne(() => Project, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  project: Project;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}