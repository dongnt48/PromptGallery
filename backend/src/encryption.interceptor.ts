import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class EncryptionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        // Only encrypt objects/arrays. Primitive types or buffers are skipped.
        if (data && typeof data === 'object' && !Buffer.isBuffer(data)) {
          const key = process.env.ENCRYPTION_KEY || 'default_key';
          try {
            const jsonString = JSON.stringify(data);
            const encryptedData = CryptoJS.AES.encrypt(jsonString, key).toString();
            return { payload: encryptedData };
          } catch (err) {
            console.error('Encryption failed on backend', err);
            return data;
          }
        }
        return data;
      }),
    );
  }
}
