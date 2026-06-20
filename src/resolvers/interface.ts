import type { InstanceData } from '../types';

export interface IDataResolver {
  resolve(): Promise<InstanceData[]>;
}
