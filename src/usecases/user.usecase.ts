import { CreateUser, UpdateUser, UserRepositorySchema, User, ReplaceUser, LoginUser } from "types/user.interface.js";
import { UserRepository } from "repositories/user.repository.js";
import { compare, hash } from "bcrypt";

export class UserNotFoundError extends Error {
    constructor(id: string) {
        super(`No user found with id: ${id}`)
        this.name = "UserNotFoundError"
    }
}

export class UserUseCase {
    private userRepository: UserRepositorySchema;

    constructor() {
        this.userRepository = new UserRepository();
    }
    
    public async getUser(id: string): Promise<User> {
        const user = await this.userRepository.findUserById(id);
        
        if (!user) {
            throw new UserNotFoundError(id);
        }
        
        return user;
    }

    public async registerUser({ name, email, password }: CreateUser): Promise<User> {
        const userEmailAlreadyExists = await this.userRepository.findUserByEmail(email);
        
        if (userEmailAlreadyExists) {
            throw new Error("User already exists");
        }

        const hashedPassword = await hash(password, 10);
        
        const newUser = this.userRepository.createUser({ name, email, password: hashedPassword });

        return newUser;
    }
    
    public async updateUserAccount(id: string, partialUser: UpdateUser): Promise<User> {
        await this.getUser(id); // check if user exists

        const dataToUpdate = { ...partialUser };

        if (partialUser.password) {
            dataToUpdate.password = await hash(partialUser.password, 10);
        }

        const updatedUser = await this.userRepository.updateUser(id, dataToUpdate);
        
        return updatedUser;
    }

    public async replaceUserAccount(id: string, user: ReplaceUser): Promise<User> {
        await this.getUser(id);

        const replacedUser = await this.userRepository.updateUser(id, {
            ...user,
            password: await hash(user.password, 10)
        });
        
        return replacedUser;
    }

    public async removeUser(id: string): Promise<User> {
        await this.getUser(id);
        
        const userToRemove = await this.userRepository.deleteUser(id);
        
        return userToRemove;
    }

    public async listAllUsers(): Promise<Array<User>> {
        const usersArray = await this.userRepository.findAllUsers();

        return usersArray;
    }

    public async authenticateUser({ email, password }: LoginUser): Promise<User> {
        const user = await this.userRepository.findUserByEmail(email);
        
        if (!user) {
            throw new Error("Invalid user credentials");
        }
        
        const passwordMatch = await compare(password, user.password);
        
        if (!passwordMatch) {
            throw new Error("Invalid user credentials");
        }
        
        return user;
    }
}