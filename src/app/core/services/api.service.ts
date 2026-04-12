import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

export interface ApiResponse<T> {
  statusCode: number;
  intOpCode: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly BASE_URL = 'http://localhost:3000';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authService.getToken()}`,
    });
  }

  private getDeleteHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`,
    });
  }

  // ── USERS ─────────────────────────────────────────────────

  getUsers(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.BASE_URL}/users`, { headers: this.getHeaders() });
  }

  getUserById(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.BASE_URL}/users/${id}`, { headers: this.getHeaders() });
  }

  createUser(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.BASE_URL}/users`, data, { headers: this.getHeaders() });
  }

  updateUser(id: string, data: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.BASE_URL}/users/${id}`, data, { headers: this.getHeaders() });
  }

  deleteUser(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.BASE_URL}/users/${id}`, { headers: this.getDeleteHeaders() });
  }

  // ── GROUPS ────────────────────────────────────────────────

  getGroups(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.BASE_URL}/groups`, { headers: this.getHeaders() });
  }

  getGroupsByUser(userId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.BASE_URL}/groups/user/${userId}`, { headers: this.getHeaders() });
  }

  getGroupById(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.BASE_URL}/groups/${id}`, { headers: this.getHeaders() });
  }

  createGroup(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.BASE_URL}/groups`, data, { headers: this.getHeaders() });
  }

  updateGroup(id: number, data: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.BASE_URL}/groups/${id}`, data, { headers: this.getHeaders() });
  }

  deleteGroup(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.BASE_URL}/groups/${id}`, { headers: this.getDeleteHeaders() });
  }

  addMember(groupId: number, userId: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.BASE_URL}/groups/${groupId}/members`, { usuario_id: userId }, { headers: this.getHeaders() });
  }

  removeMember(groupId: number, userId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.BASE_URL}/groups/${groupId}/members/${userId}`, { headers: this.getDeleteHeaders() });
  }

  getGroupPermissions(groupId: number, userId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.BASE_URL}/groups/${groupId}/permissions/${userId}`, { headers: this.getHeaders() });
  }

  updateGroupPermissions(groupId: number, data: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.BASE_URL}/groups/${groupId}/permissions`, data, { headers: this.getHeaders() });
  }

  getAllPermissions(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.BASE_URL}/permissions`, { headers: this.getHeaders() });
  }

  // ── TICKETS ───────────────────────────────────────────────

  getTicketsByGroup(groupId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.BASE_URL}/tickets/group/${groupId}`, { headers: this.getHeaders() });
  }

  getTicketsByUser(userId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.BASE_URL}/tickets/user/${userId}`, { headers: this.getHeaders() });
  }

  getTicketStats(groupId: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.BASE_URL}/tickets/stats/${groupId}`, { headers: this.getHeaders() });
  }

  getTicketById(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.BASE_URL}/tickets/${id}`, { headers: this.getHeaders() });
  }

  createTicket(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.BASE_URL}/tickets`, data, { headers: this.getHeaders() });
  }

  updateTicket(id: number, data: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.BASE_URL}/tickets/${id}`, data, { headers: this.getHeaders() });
  }

  updateTicketStatus(id: number, estado: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.BASE_URL}/tickets/${id}/status`, { estado }, { headers: this.getHeaders() });
  }

  deleteTicket(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.BASE_URL}/tickets/${id}`, { headers: this.getDeleteHeaders() });
  }

  addComment(ticketId: number, mensaje: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.BASE_URL}/tickets/${ticketId}/comments`, { mensaje }, { headers: this.getHeaders() });
  }

  getComments(ticketId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.BASE_URL}/tickets/${ticketId}/comments`, { headers: this.getHeaders() });
  }
}