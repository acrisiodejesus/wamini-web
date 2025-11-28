import apiClient from '../client';
import type {
  Negotiation,
  Message,
  CreateNegotiationData,
  SendMessageData,
  ApiResponse,
  PaginatedResponse,
  PaginationParams
} from '../types';

export const negotiationsService = {
  /**
   * Get all user negotiations
   */
  async getNegotiations(pagination?: PaginationParams): Promise<PaginatedResponse<Negotiation>> {
    const params = pagination;
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Negotiation>>>('/negotiations', { params });
    return response.data.data;
  },

  /**
   * Get single negotiation by ID
   */
  async getNegotiation(id: number): Promise<Negotiation> {
    const response = await apiClient.get<ApiResponse<Negotiation>>(`/negotiations/${id}`);
    return response.data.data;
  },

  /**
   * Create new negotiation (start chat about a product)
   */
  async createNegotiation(data: CreateNegotiationData): Promise<Negotiation> {
    const response = await apiClient.post<ApiResponse<Negotiation>>('/negotiations', data);
    return response.data.data;
  },

  /**
   * Get messages for a negotiation
   */
  async getMessages(negotiationId: number, pagination?: PaginationParams): Promise<PaginatedResponse<Message>> {
    const params = pagination;
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Message>>>(
      `/negotiations/${negotiationId}/messages`,
      { params }
    );
    return response.data.data;
  },

  /**
   * Send message in a negotiation
   */
  async sendMessage(negotiationId: number, data: SendMessageData): Promise<Message> {
    const response = await apiClient.post<ApiResponse<Message>>(
      `/negotiations/${negotiationId}/messages`,
      data
    );
    return response.data.data;
  },

  /**
   * Update negotiation status
   */
  async updateNegotiationStatus(
    id: number,
    status: 'active' | 'closed' | 'completed'
  ): Promise<Negotiation> {
    const response = await apiClient.patch<ApiResponse<Negotiation>>(`/negotiations/${id}`, { status });
    return response.data.data;
  },

  /**
   * Delete negotiation
   */
  async deleteNegotiation(id: number): Promise<void> {
    await apiClient.delete(`/negotiations/${id}`);
  },
};
