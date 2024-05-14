import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma.service';
import { Invoice, Prisma } from '@prisma/client';

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  async invoice(
    invoiceWhereUniqueInput: Prisma.InvoiceWhereUniqueInput,
  ): Promise<Invoice | null> {
    return this.prisma.invoice.findUnique({
      where: invoiceWhereUniqueInput,
    });
  }

  async createInvoice(data: Prisma.InvoiceCreateInput): Promise<Invoice> {
    return this.prisma.invoice.create({
      data,
    });
  }

  async invoices(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.InvoiceWhereUniqueInput;
    where?: Prisma.InvoiceWhereInput;
    orderBy?: Prisma.InvoiceOrderByWithRelationInput;
  }): Promise<Invoice[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.invoice.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }
}
