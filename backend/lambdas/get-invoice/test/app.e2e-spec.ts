import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { GetInvoiceModule } from './../src/get-invoice.module';
import { InvoiceService } from '/opt/invoice';
import { handler } from '../src/main';

describe('GetInvoiceHandler (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [GetInvoiceModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    const invoiceService = app.get(InvoiceService);

    await invoiceService.createInvoice({
      title: 'invoice-1',
      content: {
        lines: ['line 1', 'line2'],
      },
    });

    await invoiceService.createInvoice({
      title: 'invoice-2',
      content: {
        lines: ['line 1', 'line2'],
      },
    });

    await app.init();
  });

  it('#handler)', async () => {
    const mockContext = {} as any;
    const mockCallback = {} as any;

    const result = await handler({}, mockContext, mockCallback);
    expect(result).toStrictEqual({
      body: [
        {
          title: 'invoice-1',
          content: {
            lines: ['line 1', 'line2'],
          },
        },
        {
          title: 'invoice-2',
          content: {
            lines: ['line 1', 'line2'],
          },
        },
      ],
      statusCode: 200,
    });
  });
});
