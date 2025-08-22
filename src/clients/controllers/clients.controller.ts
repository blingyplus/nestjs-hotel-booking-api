import { Controller, Get, Param, NotFoundException } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ClientsService } from "../services/clients.service";

@ApiTags("clients")
@Controller("clients")
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get(":id")
  @ApiOperation({
    summary: "Get client by ID",
    description: "Retrieves client information by their unique ID",
  })
  @ApiResponse({
    status: 200,
    description: "Client found successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Client not found",
  })
  async getClient(@Param("id") id: string) {
    const client = await this.clientsService.getClient(id);
    if (!client) {
      throw new NotFoundException("Client not found");
    }
    return client;
  }
}
