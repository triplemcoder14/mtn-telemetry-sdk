import { MTNOTel, setProviderBuilder } from './mtno-tel';
import { buildProviders } from './providers.native';

setProviderBuilder(buildProviders);

export { MTNOTel };

export type { OTelRNOptions, NavigationContainerLike } from './types';
