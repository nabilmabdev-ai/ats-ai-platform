import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(private readonly auditService: AuditService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const method = req.method;

        // Only audit mutations
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            const user = req.user;
            const url = req.url;
            const body = req.body;

            return next.handle().pipe(
                tap(() => {
                    // Success only
                    this.auditService.log(
                        user?.id || null,
                        `${method} ${url}`,
                        'API', // Basic target for now
                        { body: method !== 'DELETE' ? body : undefined } // Don't log ID only bodies?
                    );
                }),
            );
        }

        return next.handle();
    }
}
