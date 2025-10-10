import { DebugLog } from '@/models/DebugLog';
import { AppDataSource } from '@/database/connection';
import { Repository } from 'typeorm';

export class DebugService {
  private debugLogRepository: Repository<DebugLog>;

  constructor() {
    this.debugLogRepository = AppDataSource.getRepository(DebugLog);
  }

  async createDebugLog(content: Record<string, any>, creatorId: string): Promise<DebugLog> {
    const debugLog = new DebugLog();
    debugLog.content = content;
    debugLog.creator = creatorId;
    return await this.debugLogRepository.save(debugLog);
  }

  async getDebugLogs(page: number = 1, pageSize: number = 10): Promise<{ data: DebugLog[]; total: number; page: number; pageSize: number }> {
    const [data, total] = await this.debugLogRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: {
        createdAt: 'DESC'
      }
    });

    return {
      data,
      total,
      page,
      pageSize,
    };
  }
}