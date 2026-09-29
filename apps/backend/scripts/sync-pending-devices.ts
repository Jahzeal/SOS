import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const pendingInvoices = await prisma.sale.findMany({
    where: { paymentStatus: 'PENDING' },
    include: { items: true },
  });

  console.log(`Found ${pendingInvoices.length} pending invoices.`);

  for (const inv of pendingInvoices) {
    const devIds = inv.items
      .filter((i) => i.phoneRecordId)
      .map((i) => i.phoneRecordId as string);

    if (devIds.length > 0) {
      const updated = await prisma.phoneRecord.updateMany({
        where: { id: { in: devIds } },
        data: { status: 'IN_STOCK' },
      });
      console.log(`Invoice ${inv.invoiceNumber}: restored ${updated.count} devices to IN_STOCK.`);
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
