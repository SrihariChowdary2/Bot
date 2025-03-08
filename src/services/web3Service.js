// Web3 initialization and utility functions

// Check if Web3 provider (MetaMask) is available
export const initializeWeb3 = () => {
  if (typeof window !== 'undefined' && !window.ethereum) {
    console.log('Web3 provider not detected, defining a mock provider for development');
    // Define a mock ethereum provider for development
    window.ethereum = {
      isMetaMask: true,
      request: async ({ method, params }) => {
        console.log(`Mock ethereum provider: ${method}`, params);
        throw new Error('Please install MetaMask to use this feature');
      },
      on: (eventName) => {
        console.log(`Mock ethereum event listener: ${eventName}`);
        return () => {};
      },
      removeListener: () => {}
    };
  }

  return window.ethereum;
};

// Request account access
export const requestAccount = async () => {
  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    return { success: true, account: accounts[0] };
  } catch (error) {
    console.error('Error requesting account access:', error);
    return { success: false, error: error.message };
  }
};

// Check if MetaMask is installed
export const isMetaMaskInstalled = () => {
  return typeof window !== 'undefined' && window.ethereum?.isMetaMask;
};