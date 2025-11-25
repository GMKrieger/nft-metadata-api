import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('nft_collection')
@Index(['chain', 'contractAddress'], { unique: true })
export class NftCollection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20 })
  @Index()
  chain!: string;

  @Column({ type: 'varchar', length: 66 })
  @Index()
  contractAddress!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  symbol!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  totalSupply!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  contractType!: string | null; // ERC721, ERC1155, etc.

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
