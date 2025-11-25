import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('request_analytics')
export class RequestAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  endpoint!: string;

  @Column({ type: 'varchar', length: 20 })
  @Index()
  chain!: string;

  @Column({ type: 'varchar', length: 66, nullable: true })
  contractAddress!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tokenId!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  @Index()
  apiKey!: string | null;

  @Column({ type: 'boolean', default: false })
  @Index()
  cacheHit!: boolean;

  @Column({ type: 'int', nullable: true })
  responseTime!: number | null; // in milliseconds

  @Column({ type: 'varchar', length: 10 })
  httpMethod!: string;

  @Column({ type: 'int' })
  statusCode!: number;

  @Column({ type: 'inet', nullable: true })
  ipAddress!: string | null;

  @CreateDateColumn()
  @Index()
  timestamp!: Date;
}
