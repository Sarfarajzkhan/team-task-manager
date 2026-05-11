import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';

import { Role } from '../../common/enums/role.enum';

import { Project } from '../../projects/entities/project.entity';

import { Task } from '../../tasks/entities/task.entity';

import { DeleteDateColumn } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Index()
    @Column({
        unique: true,
    })
    email: string;

    @Column()
    password: string;

    @Column({
        type: 'enum',
        enum: Role,
        default: Role.MEMBER,
    })
    role: Role;

    @OneToMany(() => Project, (project) => project.createdBy)
    projects: Project[];

    @OneToMany(() => Task, (task) => task.assignedTo)
    assignedTasks: Task[];

    @OneToMany(() => Task, (task) => task.createdBy)
    createdTasks: Task[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}