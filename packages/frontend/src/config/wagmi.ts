import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';
import { http } from 'viem';

const alchemyId = import.meta.env.VITE_ALCHEMY_ID;
const projectId = import.meta.env.VITE_WALLETCONNECT_ID ?? 'zenithdao_dev_placeholder';

export const wagmiConfig = getDefaultConfig({
  appName: 'ZenithDAO',
  projectId,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(
      alchemyId ? `https://eth-sepolia.g.alchemy.com/v2/${alchemyId}` : undefined,
    ),
  },
  ssr: false,
});

export const CHAIN = sepolia;
