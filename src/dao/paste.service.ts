import { Paste } from '@/models/Paste';
import { User } from '@/models/User';
import { AppDataSource } from '@/database/connection';
import { Repository } from 'typeorm';

export class PasteService {
  private pasteRepository: Repository<Paste>;

  constructor() {
    this.pasteRepository = AppDataSource.getRepository(Paste);
  }

  /**
   * 创建并保存剪贴板内容
   * @param data 剪贴板数据
   * @returns 保存的剪贴板对象
   */
  async createPaste(data: { 
    content: string; 
    creatorId: number; 
    isPublic: boolean;
    contentType?: 'text' | 'image';
  }): Promise<Paste> {
    try {
      const paste = new Paste();
      paste.content = data.content;
      paste.creator = { id: data.creatorId } as User;
      paste.isPublic = data.isPublic;
      paste.contentType = data.contentType || 'text';

      return await this.pasteRepository.save(paste);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取用户创建的所有剪贴板内容
   * @param userId 用户ID
   * @returns 该用户的剪贴板内容列表
   */
  async getUserPastes(userId: number): Promise<Paste[]> {
    return await this.pasteRepository.find({
      where: { creator: { id: userId } },
      order: { createdAt: 'DESC' },
      relations: ['creator']
    });
  }

  /**
   * 获取所有公开的剪贴板内容
   * @returns 公开的剪贴板内容列表
   */
  async getPublicPastes(): Promise<Paste[]> {
    return await this.pasteRepository.find({
      where: { isPublic: true },
      order: { createdAt: 'DESC' },
      relations: ['creator']
    });
  }

  /**
   * 根据ID获取剪贴板内容
   * @param id 剪贴板ID
   * @returns 剪贴板对象
   */
  async getPasteById(id: number): Promise<Paste | null> {
    return await this.pasteRepository.findOne({
      where: { id },
      relations: ['creator']
    });
  }

  /**
   * 更新剪贴板内容
   * @param id 剪贴板ID
   * @param data 更新数据
   * @returns 更新后的剪贴板对象
   */
  async updatePaste(id: number, data: {
    content?: string;
    isPublic?: boolean;
    contentType?: 'text' | 'image';
  }): Promise<Paste | null> {
    const result = await this.pasteRepository.update(id, data);
    if (result.affected === 0) {
      return null;
    }
    return this.getPasteById(id);
  }

  /**
   * 删除剪贴板内容
   * @param id 剪贴板ID
   * @returns 是否删除成功
   */
  async deletePaste(id: number): Promise<boolean> {
    const result = await this.pasteRepository.delete(id);
    return result.affected === 1;
  }

  /**
   * 检查用户是否有权限操作该剪贴板
   * @param pasteId 剪贴板ID
   * @param userId 用户ID
   * @returns 是否有权限
   */
  async hasPermission(pasteId: number, userId: number): Promise<boolean> {
    const paste = await this.getPasteById(pasteId);
    if (!paste) return false;
    return paste.creator.id === userId;
  }
} 