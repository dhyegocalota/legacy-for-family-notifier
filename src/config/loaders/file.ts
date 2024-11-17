import * as fs from 'fs';

import { Config } from '@/config/config';
import { ConfigLoader, RegisterConfigLoader } from '@/config/loader';

@RegisterConfigLoader({
  name: 'file',
  build: ({ configFilePath }) =>
    new FileConfigLoader({
      filePath: configFilePath,
    }),
})
export class FileConfigLoader implements ConfigLoader {
  readonly filePath?: string;

  constructor({ filePath }: FileConfigLoaderOptions) {
    this.filePath = filePath;
  }

  async load(): Promise<Config | null> {
    if (!this.filePath || !fs.existsSync(this.filePath)) {
      return null;
    }

    const configFile = fs.readFileSync(this.filePath, 'utf8');
    return JSON.parse(configFile) as Config;
  }
}

export interface FileConfigLoaderOptions {
  filePath?: string;
}
