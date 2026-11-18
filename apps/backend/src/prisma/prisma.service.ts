import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { requestContext } from '../common/staff/request-context';

/** Records that belong to a branch. */
const BRANCH_MODELS = new Set(['PhoneRecord', 'Sale', 'RepairTicket', 'Quote', 'TradeIn']);
const READ_ACTIONS = new Set([
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'findUnique',
  'findUniqueOrThrow',
  'count',
  'aggregate',
  'groupBy',
]);

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();

    /**
     * Branches, applied in one place instead of in every page's code:
     *  - a new phone, sale, repair or quote is filed under the branch of the person creating it;
     *  - someone who works in one branch only sees that branch's records.
     * Outside a signed-in store request (public pages, scripts) nothing changes.
     */
    this.$use(async (params, next) => {
      const ctx = requestContext.get();
      if (!ctx || !params.model || !BRANCH_MODELS.has(params.model)) return next(params);

      // Only when the record is created with plain ids (businessId), which is how every
      // service here creates these; mixing in a relation object would be rejected by Prisma.
      if (
        params.action === 'create' &&
        params.args?.data &&
        params.args.data.branchId === undefined &&
        !params.args.data.branch &&
        !params.args.data.business
      ) {
        params.args.data.branchId = ctx.writeBranchId;
      } else if (params.action === 'createMany' && Array.isArray(params.args?.data)) {
        params.args.data = params.args.data.map((row: any) =>
          row.branchId === undefined ? { ...row, branchId: ctx.writeBranchId } : row,
        );
      }

      if (ctx.readBranchId && READ_ACTIONS.has(params.action)) {
        params.args = params.args || {};
        const where = params.args.where || {};
        if (where.branchId === undefined) {
          params.args.where = { ...where, branchId: ctx.readBranchId };
        }
      }

      return next(params);
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
