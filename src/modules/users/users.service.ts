// import { Injectable, NotFoundException } from '@nestjs/common';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
// import { User, UserDocument } from './entities/user.entity';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import * as bcrypt from 'bcrypt'; // <--- تم تغيير 'bcryptjs' إلى 'bcrypt'

// @Injectable()
// export class UsersService {
//   findOrCreateAdmin(adminEmail: string, hashedPassword: string, arg2: string) {
//     throw new Error('Method not implemented.');
//   }
//   findByEmail(email: string) {
//     throw new Error('Method not implemented.');
//   }
//   constructor(
//     @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
//   ) {}

//   async create(createUserDto: CreateUserDto): Promise<UserDocument> {
//     console.log(
//       'UsersService: Attempting to create user with data:',
//       createUserDto,
//     ); // <<-- أضف هذا السطر
//     try {
//       // <<-- أضف try-catch حول عملية حفظ المستخدم
//       const user = new this.userModel(createUserDto);
//       const savedUser = await user.save();
//       console.log('UsersService: User saved successfully:', savedUser.email); // <<-- أضف هذا السطر
//       return savedUser;
//     } catch (error) {
//       console.error('UsersService: Error saving user to database:', error); // <<-- أضف هذا السطر
//       throw error; // أعد رمي الخطأ
//     }
//   }

//   async findAll(): Promise<UserDocument[]> {
//     return await this.userModel.find().select('-password').lean();
//   }

//   async findOne(id: string): Promise<UserDocument> {
//     const user = await this.userModel.findById(id).exec();
//     if (!user) {
//       throw new NotFoundException(`User with id ${id} not found`);
//     }
//     return user;
//   }
//   async findOneByEmail(email: string): Promise<UserDocument> {
//     const user = await this.userModel.findOne({ email }).exec();
//     if (!user) {
//       throw new NotFoundException(`User with id ${email} not found`);
//     }
//     return user;
//   }

//   async update(
//     id: string,
//     updateUserDto: UpdateUserDto,
//   ): Promise<UserDocument> {
//     const updatedUser = await this.userModel.findByIdAndUpdate(
//       id,
//       updateUserDto,
//       { new: true },
//     );
//     if (updateUserDto.password) {
//       updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
//     }
//     const updatedUser = await this.userModel
//       .findByIdAndUpdate(id, updateUserDto, { new: true })
//       .select('-password -__v')
//       .exec();
//     if (!updatedUser) {
//       throw new NotFoundException(`User with id ${id} not found`);
//     }
//     return updatedUser;
//   }

//   async remove(id: string): Promise<void> {
//     const deletedUser = await this.userModel.findByIdAndDelete(id);
//     if (!deletedUser) {
//       throw new NotFoundException(`User with id ${id} not found`);
//     }
//   }
// }
// src/modules/users/users.service.ts
// src/modules/users/users.service.ts
// src/modules/auth/auth.service.ts
// src/modules/users/users.service.ts
// src/modules/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument, UserRole } from './entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { TodoDocument } from '../todos/entities/todo.entity';

interface UserWithPopulatedTodos extends UserDocument {
  assignedTodos?: TodoDocument[];
  completedTodos?: TodoDocument[];
  createdTodos?: TodoDocument[];
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    console.log(
      'UsersService: Attempting to create user with data:',
      createUserDto,
    );
    try {
      const user = new this.userModel(createUserDto);
      const savedUser = await user.save();
      console.log('UsersService: User saved successfully:', savedUser.email);
      return savedUser;
    } catch (error) {
      console.error('UsersService: Error saving user to database:', error);
      throw error;
    }
  }

  async findAll(
    hasAssignedTodos?: boolean,
    hasCompletedTodos?: boolean,
  ): Promise<UserDocument[]> {
    const filter: any = {};

    let query = this.userModel.find(filter).select('-password -__v');

    query = query
      .populate({
        path: 'assignedTodos',
        select: 'title isCompleted', // اختر الحقول اللي عايزها من الـ todo
      })
      .populate({
        path: 'completedTodos',
        select: 'title isCompleted',
      })
      .populate({
        path: 'createdTodos',
        select: 'title isCompleted',
      });

    const users = (await query.exec()) as UserWithPopulatedTodos[];

    let filteredUsers = users;

    if (hasAssignedTodos !== undefined) {
      filteredUsers = filteredUsers.filter((user) =>
        hasAssignedTodos
          ? user.assignedTodos && user.assignedTodos.length > 0
          : !user.assignedTodos || user.assignedTodos.length === 0,
      );
    }
    if (hasCompletedTodos !== undefined) {
      filteredUsers = filteredUsers.filter((user) =>
        hasCompletedTodos
          ? user.completedTodos && user.completedTodos.length > 0
          : !user.completedTodos || user.completedTodos.length === 0,
      );
    }

    return filteredUsers;
  }

  async findOne(id: string | Types.ObjectId): Promise<UserDocument> {
    const user = await this.userModel
      .findById(id)
      .select('-password -__v')
      .populate('assignedTodos', 'title description isCompleted')
      .populate('completedTodos', 'title description isCompleted')
      .populate('createdTodos', 'title description isCompleted')
      .exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    return user;
  }

  async findOneByEmail(email: string): Promise<UserDocument | null> {
    // <--- هنا return type هو UserDocument | null
    const user = await this.userModel.findOne({ email }).exec();
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password -__v')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    return updatedUser;
  }

  // حذف مستخدم
  async remove(id: string): Promise<void> {
    const deletedUser = await this.userModel.findByIdAndDelete(id).exec();
    if (!deletedUser) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
  }

  async findOrCreateAdmin(
    email: string,
    passwordHash: string,
    fullName: string,
  ): Promise<UserDocument> {
    let adminUser = await this.userModel.findOne({ email }).exec();
    if (!adminUser) {
      adminUser = new this.userModel({
        email,
        password: passwordHash,
        fullName,
        role: UserRole.ADMIN,
      });
      await adminUser.save();
    }
    return adminUser;
  }
}
