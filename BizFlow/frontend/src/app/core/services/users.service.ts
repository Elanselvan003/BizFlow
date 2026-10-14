import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { UserAccount, ApiResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private api = inject(ApiService);

  getUsers(): Observable<ApiResponse<UserAccount[]>> {
    return this.api.get<UserAccount[]>('/users');
  }

  updateUserStatus(userId: string, status: 'active' | 'deactivated'): Observable<ApiResponse<UserAccount>> {
    return this.api.put<UserAccount>(`/users/${userId}/status`, { status });
  }
}
