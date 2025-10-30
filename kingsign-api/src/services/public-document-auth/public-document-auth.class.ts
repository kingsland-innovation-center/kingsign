import { Id, NullableId, Paginated, Params, ServiceMethods } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { BadRequest, Forbidden } from '@feathersjs/errors';
import jwt, { SignOptions } from 'jsonwebtoken';

const TOKEN_PURPOSE = {
  PUBLIC_SIGNING: 'public-signing'
} as const;

type TokenPurpose = typeof TOKEN_PURPOSE[keyof typeof TOKEN_PURPOSE];

interface TokenPayload {
  documentId: string;
  contactId: string;
  sub: string;
  purpose: TokenPurpose;
  aud: string;
  exp?: number;
  iss: string;
}

// Simplified type for JWT expiration times
type JwtExpiresIn = number | `${number}${'s' | 'm' | 'h' | 'd'}`;

interface GenerateTokenData {
  documentId: string;
  contactId: string;
  sub: string;
  aud: string;
  expiresIn?: JwtExpiresIn;
  iss: string;
}

interface ServiceOptions {
  secret: string;
  expiresIn?: JwtExpiresIn;
}

interface TokenResponse {
  token: string;
}

export class PublicDocumentAuth implements ServiceMethods<any> {
  app: Application;
  options: ServiceOptions;

  constructor (options: Partial<ServiceOptions> = {}, app: Application) {
    if (!options.secret) {
      throw new Error('JWT secret is required');
    }
    this.options = {
      expiresIn: '7d',
      ...options as ServiceOptions
    };
    this.app = app;
  }

  private async generateToken(data: GenerateTokenData): Promise<TokenResponse> {
    const { documentId, contactId, sub, aud, expiresIn, iss } = data;
    
    if (!documentId) {
      throw new BadRequest('Document ID is required');
    }

    if (!contactId) {
      throw new BadRequest('Contact ID is required');
    }

    if (!sub) {
      throw new BadRequest('User ID (sub) is required');
    }

    const payload: TokenPayload = {
      documentId,
      contactId,
      sub,
      aud,
      iss,
      purpose: TOKEN_PURPOSE.PUBLIC_SIGNING,
    };

    const signOptions: SignOptions = {};
    
    // Set expiresIn if provided, otherwise use default
    if (expiresIn !== undefined) {
      signOptions.expiresIn = expiresIn;
    } else if (this.options.expiresIn !== undefined) {
      signOptions.expiresIn = this.options.expiresIn;
    }

    const token = jwt.sign(payload, this.options.secret, signOptions);

    this.verify(token);
    return { token };
  }

  async create (data: GenerateTokenData | GenerateTokenData[], params?: Params): Promise<TokenResponse | TokenResponse[]> {
    if (!params?.authentication?.accessToken) {
      throw new Forbidden('No access token provided');
    }

    // Decode the access token to get the sub
    const decodedToken = jwt.decode(params.authentication.accessToken) as { sub: string, aud: string, iss: string };
    if (!decodedToken?.sub || !decodedToken?.aud || !decodedToken?.iss) {
      throw new Forbidden('Invalid access token: missing sub or aud or iss claim');
    }

    const userId = decodedToken.sub;
    const aud = decodedToken.aud;
    const iss = decodedToken.iss;

    if (Array.isArray(data)) {
      // Add the userId to each token request
      const tokens = await Promise.all(data.map(current => this.generateToken({
        ...current,
        sub: userId,
        aud,
        iss
      })));
      return tokens;
    }

    // Add the userId to the single token request
    return this.generateToken({
      ...data,
      sub: userId,
      iss,
      aud
    });
  }

  async verify (token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.options.secret) as TokenPayload;
      console.log('decoded', decoded);
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Forbidden('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Forbidden('Invalid token');
      }
      throw error;
    }
  }

  // These methods are not needed for token generation/verification
  async find (params?: Params): Promise<any[] | Paginated<any>> {
    throw new BadRequest('Method not allowed');
  }

  async get (id: Id, params?: Params): Promise<any> {
    throw new BadRequest('Method not allowed');
  }

  async update (id: NullableId, data: any, params?: Params): Promise<any> {
    throw new BadRequest('Method not allowed');
  }

  async patch (id: NullableId, data: any, params?: Params): Promise<any> {
    throw new BadRequest('Method not allowed');
  }

  async remove (id: NullableId, params?: Params): Promise<any> {
    throw new BadRequest('Method not allowed');
  }
}
