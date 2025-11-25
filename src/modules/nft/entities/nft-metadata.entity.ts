import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export interface NftAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}

@Entity('nft_metadata')
@Index(['chain', 'contractAddress', 'tokenId'], { unique: true })
export class NftMetadata {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20 })
  @Index()
  chain!: string;

  @Column({ type: 'varchar', length: 66 })
  @Index()
  contractAddress!: string;

  @Column({ type: 'varchar', length: 100 })
  tokenId!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', nullable: true })
  image!: string | null;

  @Column({ type: 'text', nullable: true })
  imageUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  animationUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  externalUrl!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  attributes!: NftAttribute[] | null;

  @Column({ type: 'text', nullable: true })
  tokenUri!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  rawMetadata!: Record<string, any> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
