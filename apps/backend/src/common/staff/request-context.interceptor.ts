import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { requestContext } from './request-context';
import { StaffAccessService } from './staff-access.service';
import { ROLES_WITHOUT_COSTS, StoreRoleName } from './store-roles';

/** Fields with cost prices or profit. Removed from every reply for sales staff and technicians. */
const COST_FIELDS = new Set(['purchasePrice', 'costPrice', 'totalProfit', 'profitMargin', 'grossProfit', 'profit']);

function stripCosts(value: any, seen = new WeakSet<object>()): any {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date || Buffer.isBuffer(value)) return value;
  if (seen.has(value)) return value;
  seen.add(value);
  if (Array.isArray(value)) return value.map((v) => stripCosts(v, seen));
  const out: Record<string, any> = {};
  for (const [key, v] of Object.entries(value)) {
    if (COST_FIELDS.has(key)) continue;
    out[key] = stripCosts(v, seen);
  }
  return out;
}

/**
 * For every signed-in store request:
 *  - records who is asking and which branch they work in, so new records are filed
 *    under that branch and lists only show what they may see;
 *  - removes cost prices and profit from replies for sales staff and technicians.
 * Runs after the guards, so the signed-in user is known.
 */
@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  constructor(
    private readonly staff: StaffAccessService,
    private readonly prisma: PrismaService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    if (context.getType() !== 'http') return next.handle();
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user || user.role === 'ADMIN' || !user.businessId) return next.handle();

    const role = (user.storeRole || 'OWNER') as StoreRoleName;
    const mainBranchId = await this.staff.mainBranchId(user.businessId);

    // Staff tied to a branch only see that branch. Owners and unassigned managers see
    // everything, or one branch if they picked it in the branch switcher.
    let readBranchId: string | null = user.branchId || null;
    if (!readBranchId && (role === 'OWNER' || role === 'MANAGER')) {
      const picked = String(req.headers?.['x-branch-id'] || '').trim();
      if (picked) {
        const ok = await this.prisma.branch.findFirst({
          where: { id: picked, businessId: user.businessId },
          select: { id: true },
        });
        if (ok) readBranchId = ok.id;
      }
    }

    const ctx = {
      businessId: user.businessId,
      userId: user.id,
      storeRole: role,
      writeBranchId: user.branchId || readBranchId || mainBranchId,
      readBranchId,
    };

    const hideCosts = ROLES_WITHOUT_COSTS.includes(role);
    // Nest starts the route handler when the reply is subscribed to, so the
    // subscription itself must happen inside the context.
    return new Observable((subscriber) => {
      const sub = requestContext.run(ctx, () =>
        next
          .handle()
          .pipe(map((body) => (hideCosts ? stripCosts(body) : body)))
          .subscribe(subscriber),
      );
      return () => sub.unsubscribe();
    });
  }
}
