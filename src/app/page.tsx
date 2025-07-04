"use client";

import { DaimoPayButton } from "@daimo/pay";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { normalize } from "viem/ens";
import { useEnsAddress } from "wagmi";
import { PoweredByPayFooter } from "@/components/powered-by-footer";
import { arbitrumUSDC, baseUSDC, optimismUSDC, polygonUSDC, worldchainUSDC } from "@daimo/pay-common";
import Image from "next/image";
import confetti from "canvas-confetti";

function SendPageContent() {
  const searchParams = useSearchParams();
  
  // Get URL parameters
  const address = searchParams.get('a'); // public address or ENS
  const chainId = searchParams.get('c'); // chain ID
  const name = searchParams.get('n'); // name
  const mode = searchParams.get('m') || 'black'; // mode: black or green, default to black

  // Check if address is an ENS name
  const isENS = address && (address.endsWith('.eth') || address.endsWith('.xyz') || address.endsWith('.com') || address.includes('.'));
  
  // Prioritize name parameter, fallback to ENS, error if pure address without name
  const displayName = name || (isENS ? address : null);

  // Color schemes
  const colorSchemes = {
    black: {
      background: '#444142',
      text: '#C3B7AD',
      textDark: '#A09284',
      accent: 'rgba(195, 183, 173, 0.1)',
      border: 'rgba(195, 183, 173, 0.2)',
      button: '#C3B7AD',
      buttonHover: '#D5C9BF',
      buttonText: '#444142'
    },
    green: {
      background: '#436A3D',
      text: '#FAE5D1', 
      textDark: '#BDF0BE',
      accent: 'rgba(250, 229, 209, 0.1)',
      border: 'rgba(250, 229, 209, 0.2)',
      button: '#FAE5D1',
      buttonHover: '#F5D5B8',
      buttonText: '#436A3D'
    },
    blue: {
      background: '#1E3A5F', // Deep navy blue
      text: '#B8D4E8', // Light ocean blue  
      textDark: '#7FB3D3', // Medium ocean blue
      accent: 'rgba(184, 212, 232, 0.1)', // Light ocean blue with low opacity
      border: 'rgba(184, 212, 232, 0.2)', // Light ocean blue border
      button: '#B8D4E8', // Light ocean blue button
      buttonHover: '#C8E0F2', // Lighter ocean blue on hover
      buttonText: '#1E3A5F' // Deep navy text on buttons
    }
  };

  const colors = colorSchemes[mode as keyof typeof colorSchemes] || colorSchemes.black;

  // Resolve ENS to actual address
  const { data: resolvedAddress, isLoading: isResolvingENS } = useEnsAddress({
    name: isENS ? normalize(address) : undefined,
    // ENS registry + Universal Resolver live on Ethereum mainnet.
    // Using mainnet ensures both on-chain & CCIP-read names resolve.
    chainId: 1,
  });

  // Use resolved address if available, otherwise use original address
  const finalAddress = isENS && resolvedAddress ? resolvedAddress : address;

  // Validate required parameters
  if (!address || !chainId || !displayName) {
  return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="text-center p-8 rounded-2xl border-2 relative" style={{ 
          backgroundColor: colors.accent, 
          borderColor: colors.border,
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)'
        }}>
          <h1 className="text-2xl font-bold mb-4" style={{ color: colors.text }}>Missing Parameters</h1>
          <p style={{ color: colors.text }}>
            {!displayName && address && !isENS 
              ? "Pure addresses require a name parameter (n=)"
              : "Please provide the required URL parameters:"
            }
          </p>
          <ul className="mt-4 text-left space-y-1" style={{ color: colors.text }}>
            <li>• a = address (public address or ENS name)</li>
            <li>• c = chain ID</li>
            <li>• n = name (required for pure addresses, optional for ENS)</li>
            <li>• m = mode (black, green, or blue, default: black)</li>
          </ul>
          <p className="mt-6 text-sm opacity-75" style={{ color: colors.text }}>
            Example: ?a=alice.eth&c=1&m=green or ?a=0x123...&c=1&n=Alice&m=blue
          </p>
        </div>
      </div>
    );
  }

  // Show loading while resolving ENS
  if (isENS && isResolvingENS) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mx-auto mb-6" style={{ borderColor: colors.text, borderTopColor: 'transparent' }}></div>
        </div>
      </div>
    );
  }

  // Check if ENS resolution failed
  if (isENS && !isResolvingENS && !resolvedAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="text-center p-8 rounded-2xl border-2 relative" style={{ 
          backgroundColor: colors.accent, 
          borderColor: colors.border,
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)'
        }}>
          <h1 className="text-2xl font-bold mb-4" style={{ color: colors.text }}>ENS Resolution Failed</h1>
          <p style={{ color: colors.text }}>Could not resolve {address} to an address.</p>
        </div>
      </div>
    );
  }

  const chainIdNumber = parseInt(chainId);
  
  // USDC token addresses for common chains
  const USDC_ADDRESSES = {
    10: optimismUSDC, // Optimism USDC
    137: polygonUSDC, // Polygon USDC
    42161: arbitrumUSDC, // Arbitrum USDC
    8453: baseUSDC, // Base USDC
    480: worldchainUSDC, // Worldchain USDC
  };

  const usdcToken = USDC_ADDRESSES[chainIdNumber as keyof typeof USDC_ADDRESSES];
  const usdcAddress = usdcToken?.token || "0x0000000000000000000000000000000000000000";

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6 relative" 
      style={{ 
        backgroundColor: colors.background
      }}
    >
      
      <div className="w-full max-w-md relative z-10">
        {/* Title Image and Subtitle */}
        <div className="text-center mb-12">
          <div className="mb-8 flex justify-center">
            <div 
              className="relative overflow-hidden w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56"
              style={{
                transform: 'rotate(-2deg)',
                filter: 'drop-shadow(3px 3px 8px rgba(0, 0, 0, 0.4))'
              }}
            >
              {/* Square frame background */}
              <div 
                className="absolute inset-0 rounded-lg"
                style={{
                  backgroundColor: colors.accent.replace('0.1', '0.15'),
                  border: `3px solid ${colors.text}50`
                }}
              ></div>
              
              <Image 
                src={mode === 'green' ? '/green.webp' : mode === 'blue' ? '/blue.webp' : '/black.webp'}
                alt="Daimo Cap Logo"
                width={200}
                height={200}
                className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] object-cover object-top rounded"
              />
              
              {/* Simple stitching effect around the frame */}
              <div 
                className="absolute inset-1 rounded-lg border-2"
                style={{
                  borderColor: `${colors.text}60`,
                  borderStyle: 'dashed'
                }}
              ></div>
            </div>
          </div>
          
          <div 
            className="p-6 rounded-2xl border-2 relative"
            style={{ 
              backgroundColor: colors.accent.replace('0.1', '0.08'), 
              borderColor: colors.border,
              boxShadow: `
                inset 0 1px 3px rgba(0, 0, 0, 0.2),
                0 4px 12px rgba(0, 0, 0, 0.15)
              `
            }}
          >
            {/* Fabric texture on card */}
            <div 
              className="absolute inset-0 rounded-2xl opacity-20"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 1px,
                    ${colors.accent} 1px,
                    ${colors.accent} 2px
                  )
                `
              }}
            ></div>
            
            <p className="text-lg leading-relaxed relative z-10 flex items-center gap-2 flex-wrap justify-center" style={{ color: colors.text }}>
             <span>This cap belongs to</span>
             </p>
             <span 
               className="font-bold text-xl px-2 py-1 rounded relative overflow-hidden"
               style={{ 
                 color: colors.buttonText,
                 backgroundColor: colors.button,
               }}
             >
               {/* Fabric texture overlay on name patch */}
               <span 
                 className="absolute inset-0 opacity-30"
                 style={{
                   backgroundImage: `
                     repeating-linear-gradient(
                       90deg,
                       transparent,
                       transparent 3px,
                       ${colors.buttonText}10 3px,
                       ${colors.buttonText}10 6px
                     ),
                     repeating-linear-gradient(
                       45deg,
                       transparent,
                       transparent 2px,
                       ${colors.buttonText}08 2px,
                       ${colors.buttonText}08 4px
                     )
                   `
                 }}
               ></span>
               
               {/* Stitching effect on name patch edges */}
               <span 
                 className="absolute inset-0.5 rounded border"
                 style={{
                   borderColor: `${colors.buttonText}20`,
                   borderStyle: 'dashed',
                   borderWidth: '1px'
                 }}
               ></span>
               
               <span className="relative z-10">{displayName}</span>
             </span>

          </div>
        </div>

        <DaimoPayButton.Custom
          appId={process.env.NEXT_PUBLIC_DAIMO_APP_ID || 'pay-demo'}
          intent={`Send Money to ${displayName}`}
          toChain={chainIdNumber}
          toAddress={finalAddress as `0x${string}`}
          toToken={usdcAddress as `0x${string}`}
          // No toUnits specified = deposit mode (user can choose amount)
          closeOnSuccess={true}
          resetOnSuccess={true}
          onPaymentCompleted={(payment) => {
            console.log('Payment completed:', payment);
            // Celebrate with confetti!
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: mode === 'green' 
                ? ['#436A3D', '#FAE5D1', '#BDF0BE', '#D2E8C8'] 
                : mode === 'blue'
                ? ['#1E3A5F', '#B8D4E8', '#7FB3D3', '#C8E0F2']
                : ['#444142', '#C3B7AD', '#D5C9BF', '#A09284']
            });
            // Add extra burst for celebration
            setTimeout(() => {
              confetti({
                particleCount: 50,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: mode === 'green' 
                  ? ['#436A3D', '#FAE5D1', '#BDF0BE'] 
                  : mode === 'blue'
                  ? ['#1E3A5F', '#B8D4E8', '#7FB3D3']
                  : ['#444142', '#C3B7AD', '#D5C9BF']
              });
            }, 200);
            setTimeout(() => {
              confetti({
                particleCount: 50,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: mode === 'green' 
                  ? ['#436A3D', '#FAE5D1', '#BDF0BE'] 
                  : mode === 'blue'
                  ? ['#1E3A5F', '#B8D4E8', '#7FB3D3']
                  : ['#444142', '#C3B7AD', '#D5C9BF']
              });
            }, 400);
          }}
          onPaymentStarted={(payment) => {
            console.log('Payment started:', payment);
          }}
        >
          {({ show }: { show: () => void }) => (
            <button
              onClick={show}
              className="group w-full font-bold py-6 px-8 rounded-2xl transition-all duration-300 text-lg flex items-center justify-center gap-3 border-2 shadow-lg transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
              style={{ 
                backgroundColor: colors.button,
                borderColor: colors.border.replace('0.2', '0.4'),
                color: colors.buttonText,
                boxShadow: `
                  0 8px 25px rgba(0, 0, 0, 0.2),
                  inset 0 1px 3px rgba(255, 255, 255, 0.1)
                `,
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.buttonHover;
                e.currentTarget.style.boxShadow = `
                  0 12px 35px rgba(0, 0, 0, 0.3),
                  inset 0 1px 3px rgba(255, 255, 255, 0.15)
                `;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.button;
                e.currentTarget.style.boxShadow = `
                  0 8px 25px rgba(0, 0, 0, 0.2),
                  inset 0 1px 3px rgba(255, 255, 255, 0.1)
                `;
              }}
            >
              {/* Fabric texture overlay on button */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `
                    repeating-linear-gradient(
                      90deg,
                      transparent,
                      transparent 3px,
                      ${colors.buttonText}10 3px,
                      ${colors.buttonText}10 6px
                    ),
                    repeating-linear-gradient(
                      45deg,
                      transparent,
                      transparent 2px,
                      ${colors.buttonText}08 2px,
                      ${colors.buttonText}08 4px
                    )
                  `
                }}
              ></div>
              
              {/* Stitching effect on button edges */}
              <div 
                className="absolute inset-1 rounded-xl border"
                style={{
                  borderColor: `${colors.buttonText}20`,
                  borderStyle: 'dashed',
                  borderWidth: '1px'
                }}
              ></div>
              
              <span className="text-xl relative z-10">💸</span>
              <span className="relative z-10">Send Money to {displayName}</span>
        </button>
      )}
    </DaimoPayButton.Custom>
        
        {/* Powered by */}
        <div className="mt-6">
          <PoweredByPayFooter 
            textColor={(mode === 'green' || mode === 'blue') ? colors.text : "#6B7280"}
            hoverColor={(mode === 'green' || mode === 'blue') ? colors.textDark : "#374151"}
          />
        </div>
      </div>
    </div>
  );
}

export default function SendPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#444142' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mx-auto" style={{ borderColor: '#C3B7AD', borderTopColor: 'transparent' }}></div>
          <p className="mt-6 text-xl" style={{ color: '#C3B7AD' }}>Loading Daimo Cap...</p>
        </div>
      </div>
    }>
      <SendPageContent />
    </Suspense>
  );
}
