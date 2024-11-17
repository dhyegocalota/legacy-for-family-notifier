import * as dotenv from 'dotenv';

import { Config } from '@/config/config';
import { ConfigLoader, RegisterConfigLoader } from '@/config/loader';

@RegisterConfigLoader({
  name: 'env',
  build: () => new EnvConfigLoader(),
})
export class EnvConfigLoader implements ConfigLoader {
  static readonly ENV_NAME = 'CONFIG';

  constructor() {
    dotenv.config();
  }

  async load(): Promise<Config | null> {
    const config = process.env[EnvConfigLoader.ENV_NAME];

    if (!config) {
      return null;
    }

    return JSON.parse(config) as Config;
  }
}
