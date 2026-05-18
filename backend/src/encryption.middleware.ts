import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class DecryptionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.body && req.body.payload) {
      const key = process.env.ENCRYPTION_KEY || 'default_key';
      try {
        const bytes = CryptoJS.AES.decrypt(req.body.payload, key);
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
        if (decryptedString) {
          req.body = JSON.parse(decryptedString);
        }
      } catch (err) {
        console.error('Decryption failed on backend', err);
        // We leave req.body as is if decryption fails
      }
    }
    next();
  }
}
