import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService { // Fixed: Changed from CustomersService to CustomerService
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    // Check if email already exists
    const existingCustomer = await this.customerRepository.findOne({
      where: { email: createCustomerDto.email },
    });

    if (existingCustomer) {
      throw new ConflictException('Email already exists');
    }

    // Map DTO properties to entity properties
    const customerData = {
      firstName: createCustomerDto.firstName,
      lastName: createCustomerDto.lastName,
      email: createCustomerDto.email,
      phone: createCustomerDto.phoneNumber, // Map phoneNumber → phone
      address: createCustomerDto.address,
    };

    const customer = this.customerRepository.create(customerData);
    return await this.customerRepository.save(customer);
  }

  async findAll(): Promise<Customer[]> {
    return await this.customerRepository.find({
      relations: ['rentals', 'reservations'],
    });
  }

  async findOne(id: number): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id }, // Fixed: changed from customerId to id
      relations: ['rentals', 'reservations'],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);

    // Check if email is being updated and if it already exists
    if (updateCustomerDto.email && updateCustomerDto.email !== customer.email) {
      const existingCustomer = await this.customerRepository.findOne({
        where: { email: updateCustomerDto.email },
      });

      if (existingCustomer) {
        throw new ConflictException('Email already exists');
      }
    }

    // Map DTO properties to entity properties
    if (updateCustomerDto.firstName !== undefined) customer.firstName = updateCustomerDto.firstName;
    if (updateCustomerDto.lastName !== undefined) customer.lastName = updateCustomerDto.lastName;
    if (updateCustomerDto.email !== undefined) customer.email = updateCustomerDto.email;
    if (updateCustomerDto.phoneNumber !== undefined) customer.phone = updateCustomerDto.phoneNumber; // Map phoneNumber → phone
    if (updateCustomerDto.address !== undefined) customer.address = updateCustomerDto.address;
    
    return await this.customerRepository.save(customer);
  }

  async remove(id: number): Promise<void> {
    const customer = await this.findOne(id);
    await this.customerRepository.remove(customer);
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return await this.customerRepository.findOne({
      where: { email },
    });
  }
}