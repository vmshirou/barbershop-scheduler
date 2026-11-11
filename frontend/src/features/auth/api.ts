import { apiRequest } from '../../api/client';
import type { User } from '../../types/domain';

export interface Token {
    access_token: string;
    token_type?: string;
}

export interface UserSend {
    phone_number: string;
    password: string;

}

export interface LoginResponse {
  token: Token
  user: User;
} 

export async function login(u: UserSend): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    headers: {
      // OAuth2PasswordRequestForm espera form-urlencoded, no JSON
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      username: u.phone_number,
      password: u.password,
    }).toString(),
  });
}