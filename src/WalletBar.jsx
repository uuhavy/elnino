import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';

function shortAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function WalletBar({ big = false }) {
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const baseConnector =
    connectors.find((connector) =>
      connector.name.toLowerCase().includes('base')
    ) || connectors[0];

  const connectButtonStyle = {
    border: 0,
    borderRadius: '999px',
    padding: big ? '17px 30px' : '9px 12px',
    color: 'white',
    background:
      'radial-gradient(circle at top left, rgba(255,255,255,0.35), transparent 30%), linear-gradient(135deg, #0052ff, #38bdf8)',
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderStyle: 'solid',
    borderWidth: 1,
    cursor: 'pointer',
    fontSize: big ? 17 : 12,
    fontWeight: 900,
    boxShadow: big
      ? '0 22px 55px rgba(0, 82, 255, 0.48)'
      : '0 12px 28px rgba(0, 82, 255, 0.28)',
    minWidth: big ? 240 : 'auto',
  };

  const softButtonStyle = {
    border: 0,
    borderRadius: '999px',
    padding: '9px 12px',
    color: 'white',
    background: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'solid',
    borderWidth: 1,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 800,
  };

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    borderRadius: '999px',
    padding: '9px 12px',
    color: 'rgba(255,255,255,0.9)',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255,255,255,0.1)',
    fontSize: 12,
    fontWeight: 800,
  };

  if (!isConnected) {
    return (
      <button
        style={connectButtonStyle}
        onClick={() => connect({ connector: baseConnector, chainId: base.id })}
        disabled={isPending}
      >
        {isPending ? 'Connecting...' : '🔵 Connect Base Wallet'}
      </button>
    );
  }

  return (
    <>
      <span style={badgeStyle}>🔵 {shortAddress(address)}</span>

      {chain?.id !== base.id && (
        <button
          style={connectButtonStyle}
          onClick={() => switchChain({ chainId: base.id })}
          disabled={isSwitching}
        >
          {isSwitching ? 'Switching...' : 'Switch to Base'}
        </button>
      )}

      <button style={softButtonStyle} onClick={() => disconnect()}>
        Disconnect
      </button>
    </>
  );
}