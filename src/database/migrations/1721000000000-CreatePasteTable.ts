import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreatePasteTable1721000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'paste',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'creator_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'is_public',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            onUpdate: 'now()',
          },
        ],
      }),
      true,
    );

    // 添加外键约束
    await queryRunner.createForeignKey(
      'paste',
      new TableForeignKey({
        columnNames: ['creator_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );

    // 添加索引
    await queryRunner.createIndex(
      'paste',
      new TableIndex({
        name: 'IDX_PASTE_CREATOR',
        columnNames: ['creator_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('paste');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('creator_id') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('paste', foreignKey);
      }
      await queryRunner.dropIndex('paste', 'IDX_PASTE_CREATOR');
      await queryRunner.dropTable('paste');
    }
  }
} 