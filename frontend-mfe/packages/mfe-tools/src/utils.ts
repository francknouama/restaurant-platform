export const MFE_PORTS = {
  SHELL: 3000,
  MENU: 3001,
  ORDERS: 3002,
  KITCHEN: 3003,
  RESERVATIONS: 3004,
  INVENTORY: 3005,
} as const;

export const MFE_NAMES = {
  SHELL: 'shell',
  MENU: 'menuMfe',
  ORDERS: 'ordersMfe',
  KITCHEN: 'kitchenMfe',
  RESERVATIONS: 'reservationsMfe',
  INVENTORY: 'inventoryMfe',
} as const;

export const getRemoteEntry = (port: number, isDevelopment = true) => {
  const host = isDevelopment ? 'localhost' : process.env.MFE_HOST || 'localhost';
  return `http://${host}:${port}/remoteEntry.js`;
};

export const getAllRemotes = (isDevelopment = true) => ({
  [MFE_NAMES.MENU]: getRemoteEntry(MFE_PORTS.MENU, isDevelopment),
  [MFE_NAMES.ORDERS]: getRemoteEntry(MFE_PORTS.ORDERS, isDevelopment),
  [MFE_NAMES.KITCHEN]: getRemoteEntry(MFE_PORTS.KITCHEN, isDevelopment),
  [MFE_NAMES.RESERVATIONS]: getRemoteEntry(MFE_PORTS.RESERVATIONS, isDevelopment),
  [MFE_NAMES.INVENTORY]: getRemoteEntry(MFE_PORTS.INVENTORY, isDevelopment),
});