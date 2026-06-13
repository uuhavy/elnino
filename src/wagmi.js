import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { baseAccount } from 'wagmi/connectors';

export const config = createConfig({
  chains: [base],

  multiInjectedProviderDiscovery: false,

  connectors: [
    baseAccount({
      appName: 'Elnino Bubble Hunt',
    }),
  ],

  transports: {
    [base.id]: http(),
  },
});