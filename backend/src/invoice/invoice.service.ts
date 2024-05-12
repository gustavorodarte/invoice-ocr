import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Invoices, Prisma } from '@prisma/client';

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  async invoice(
    invoicesWhereUniqueInput: Prisma.InvoicesWhereUniqueInput,
  ): Promise<Invoices | null> {
    return this.prisma.invoices.findUnique({
      where: invoicesWhereUniqueInput,
    });
  }

  async createInvoice(data: Prisma.InvoicesCreateInput): Promise<Invoices> {
    return this.prisma.invoices.create({
      data,
    });
  }

  async invoices(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.InvoicesWhereUniqueInput;
    where?: Prisma.InvoicesWhereInput;
    orderBy?: Prisma.InvoicesOrderByWithRelationInput;
  }): Promise<Invoices[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.invoices.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }
}
