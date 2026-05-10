import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

 async findAll(
  page = 1,
  limit = 10,
) {
  const [users, total] =
    await this.userRepository.findAndCount({
      skip: (page - 1) * limit,

      take: limit,

      order: {
        createdAt: 'DESC',
      },
    });

  return {
    total,

    page,

    limit,

    totalPages: Math.ceil(total / limit),

    users: users.map((user) =>
      this.sanitizeUser(user),
    ),
  };
}

  async findById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async deleteUser(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.remove(user);

    return {
      message: 'User deleted successfully',
    };
  }

  private sanitizeUser(user: User) {
    const { password, ...safeUser } = user;

    return safeUser;
  }
}