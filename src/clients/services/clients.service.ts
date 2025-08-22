import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Client } from "../entities/client.entity";

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>
  ) {}

  async getClient(id: string): Promise<Client | null> {
    return this.clientRepository.findOne({
      where: { id, isActive: true },
    });
  }
}
