import { Config, validateConfig } from '@/config/config';

export interface ConfigLoader {
  load(): Promise<Config | null>;
}

export type ConfigLoaderBuilderOptions = {
  configFilePath?: string;
};

export type ConfigLoaderBuilder = (
  options: ConfigLoaderBuilderOptions,
) => ConfigLoader;

const configLoaders: Map<string, ConfigLoaderBuilder> = new Map();

export const loadConfig = async (
  options: ConfigLoaderBuilderOptions,
): Promise<Config> => {
  for (const loader of configLoaders.values()) {
    const config = await loader(options).load();

    if (config) {
      return validateConfig(config);
    }
  }

  throw new Error('No config loader found');
};

export const RegisterConfigLoader = ({
  name,
  build,
}: {
  name: string;
  build: ConfigLoaderBuilder;
}) => {
  return (_: Function) => {
    if (configLoaders.has(name)) {
      throw new Error(`Loader with name ${name} already registered`);
    }

    configLoaders.set(name, build);
  };
};
