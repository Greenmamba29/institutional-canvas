// LithiumBuy - Institutional Mock Data
// Realistic commodities trading data for battery metals

export interface Supplier {
  id: string;
  name: string;
  country: string;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  trustScore: number;
  totalVolume: number;
  activeListings: number;
  joinedDate: string;
  specialties: string[];
}

export interface Listing {
  id: string;
  supplierId: string;
  supplierName: string;
  commodity: string;
  grade: string;
  purity: string;
  volume: number;
  unit: string;
  pricePerUnit: number;
  currency: string;
  incoterms: string;
  origin: string;
  deliveryPort: string;
  availableDate: string;
  status: 'active' | 'reserved' | 'sold';
  certifications: string[];
  minOrder: number;
}

export interface RFQ {
  id: string;
  buyerId: string;
  buyerCompany: string;
  commodity: string;
  grade: string;
  requiredPurity: string;
  volume: number;
  unit: string;
  targetPrice: number;
  currency: string;
  deliveryLocation: string;
  requiredDeliveryDate: string;
  status: 'open' | 'closed' | 'awarded';
  bidsCount: number;
  createdAt: string;
  expiresAt: string;
}

export interface Bid {
  id: string;
  rfqId: string;
  auctionId?: string;
  supplierId: string;
  supplierName: string;
  pricePerUnit: number;
  currency: string;
  volume: number;
  unit: string;
  totalValue: number;
  deliveryDate: string;
  status: 'active' | 'won' | 'lost' | 'withdrawn';
  submittedAt: string;
  notes?: string;
}

export interface Auction {
  id: string;
  title: string;
  commodity: string;
  lots: AuctionLot[];
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'live' | 'ended';
  totalVolume: number;
  totalValue: number;
  participantsCount: number;
}

export interface AuctionLot {
  id: string;
  auctionId: string;
  lotNumber: number;
  commodity: string;
  grade: string;
  volume: number;
  unit: string;
  startingBid: number;
  currentBid: number;
  bidIncrement: number;
  leadingBidder: string;
  bidsCount: number;
  origin: string;
}

export interface PriceIndicator {
  commodity: string;
  spotPrice: number;
  change24h: number;
  changePercent: number;
  high52w: number;
  low52w: number;
  volume24h: number;
  unit: string;
  currency: string;
  lastUpdated: string;
}

// SUPPLIERS
export const suppliers: Supplier[] = [
  {
    id: 'SUP001',
    name: 'Albemarle Corporation',
    country: 'United States',
    verificationStatus: 'verified',
    trustScore: 98,
    totalVolume: 125000,
    activeListings: 12,
    joinedDate: '2022-03-15',
    specialties: ['Lithium Hydroxide', 'Lithium Carbonate']
  },
  {
    id: 'SUP002',
    name: 'Ganfeng Lithium Co.',
    country: 'China',
    verificationStatus: 'verified',
    trustScore: 95,
    totalVolume: 180000,
    activeListings: 18,
    joinedDate: '2022-01-10',
    specialties: ['Battery-Grade Lithium', 'Lithium Metal']
  },
  {
    id: 'SUP003',
    name: 'SQM Chile',
    country: 'Chile',
    verificationStatus: 'verified',
    trustScore: 97,
    totalVolume: 210000,
    activeListings: 8,
    joinedDate: '2021-11-22',
    specialties: ['Lithium Carbonate', 'Technical Grade']
  },
  {
    id: 'SUP004',
    name: 'Pilbara Minerals',
    country: 'Australia',
    verificationStatus: 'verified',
    trustScore: 94,
    totalVolume: 95000,
    activeListings: 6,
    joinedDate: '2023-02-08',
    specialties: ['Spodumene Concentrate']
  },
  {
    id: 'SUP005',
    name: 'Livent Corporation',
    country: 'United States',
    verificationStatus: 'pending',
    trustScore: 88,
    totalVolume: 45000,
    activeListings: 4,
    joinedDate: '2023-06-14',
    specialties: ['Lithium Hydroxide', 'High-Purity Lithium']
  }
];

// LISTINGS
export const listings: Listing[] = [
  {
    id: 'LST001',
    supplierId: 'SUP001',
    supplierName: 'Albemarle Corporation',
    commodity: 'Lithium Hydroxide Monohydrate',
    grade: 'Battery Grade',
    purity: '≥56.5% LiOH',
    volume: 500,
    unit: 'MT',
    pricePerUnit: 24500,
    currency: 'USD',
    incoterms: 'CIF',
    origin: 'United States',
    deliveryPort: 'Rotterdam',
    availableDate: '2024-02-15',
    status: 'active',
    certifications: ['ISO 9001', 'IATF 16949'],
    minOrder: 100
  },
  {
    id: 'LST002',
    supplierId: 'SUP002',
    supplierName: 'Ganfeng Lithium Co.',
    commodity: 'Lithium Carbonate',
    grade: 'Battery Grade',
    purity: '≥99.5% Li₂CO₃',
    volume: 1200,
    unit: 'MT',
    pricePerUnit: 18200,
    currency: 'USD',
    incoterms: 'FOB',
    origin: 'China',
    deliveryPort: 'Shanghai',
    availableDate: '2024-01-28',
    status: 'active',
    certifications: ['ISO 14001', 'ISO 9001'],
    minOrder: 200
  },
  {
    id: 'LST003',
    supplierId: 'SUP003',
    supplierName: 'SQM Chile',
    commodity: 'Lithium Carbonate',
    grade: 'Technical Grade',
    purity: '≥99.0% Li₂CO₃',
    volume: 800,
    unit: 'MT',
    pricePerUnit: 15800,
    currency: 'USD',
    incoterms: 'CIF',
    origin: 'Chile',
    deliveryPort: 'Hamburg',
    availableDate: '2024-02-01',
    status: 'active',
    certifications: ['ISO 9001'],
    minOrder: 150
  },
  {
    id: 'LST004',
    supplierId: 'SUP004',
    supplierName: 'Pilbara Minerals',
    commodity: 'Spodumene Concentrate',
    grade: 'SC6.0',
    purity: '6.0% Li₂O',
    volume: 5000,
    unit: 'DMT',
    pricePerUnit: 2850,
    currency: 'USD',
    incoterms: 'FOB',
    origin: 'Australia',
    deliveryPort: 'Port Hedland',
    availableDate: '2024-01-20',
    status: 'active',
    certifications: ['ISO 14001'],
    minOrder: 500
  },
  {
    id: 'LST005',
    supplierId: 'SUP001',
    supplierName: 'Albemarle Corporation',
    commodity: 'Lithium Hydroxide Monohydrate',
    grade: 'Premium Battery Grade',
    purity: '≥57.0% LiOH',
    volume: 300,
    unit: 'MT',
    pricePerUnit: 26800,
    currency: 'USD',
    incoterms: 'DDP',
    origin: 'United States',
    deliveryPort: 'Antwerp',
    availableDate: '2024-03-01',
    status: 'reserved',
    certifications: ['ISO 9001', 'IATF 16949', 'ISO 14001'],
    minOrder: 50
  },
  {
    id: 'LST006',
    supplierId: 'SUP002',
    supplierName: 'Ganfeng Lithium Co.',
    commodity: 'Lithium Metal',
    grade: 'High Purity',
    purity: '≥99.9% Li',
    volume: 25,
    unit: 'MT',
    pricePerUnit: 89500,
    currency: 'USD',
    incoterms: 'CIF',
    origin: 'China',
    deliveryPort: 'Busan',
    availableDate: '2024-02-10',
    status: 'active',
    certifications: ['ISO 9001'],
    minOrder: 5
  }
];

// RFQs
export const rfqs: RFQ[] = [
  {
    id: 'RFQ001',
    buyerId: 'BUY001',
    buyerCompany: 'Tesla Gigafactory Nevada',
    commodity: 'Lithium Hydroxide Monohydrate',
    grade: 'Battery Grade',
    requiredPurity: '≥56.5% LiOH',
    volume: 2500,
    unit: 'MT',
    targetPrice: 24000,
    currency: 'USD',
    deliveryLocation: 'Sparks, Nevada',
    requiredDeliveryDate: '2024-Q2',
    status: 'open',
    bidsCount: 4,
    createdAt: '2024-01-10T09:00:00Z',
    expiresAt: '2024-01-25T23:59:59Z'
  },
  {
    id: 'RFQ002',
    buyerId: 'BUY002',
    buyerCompany: 'CATL Europe',
    commodity: 'Lithium Carbonate',
    grade: 'Battery Grade',
    requiredPurity: '≥99.5% Li₂CO₃',
    volume: 5000,
    unit: 'MT',
    targetPrice: 17500,
    currency: 'USD',
    deliveryLocation: 'Erfurt, Germany',
    requiredDeliveryDate: '2024-Q1',
    status: 'open',
    bidsCount: 7,
    createdAt: '2024-01-08T14:30:00Z',
    expiresAt: '2024-01-20T23:59:59Z'
  },
  {
    id: 'RFQ003',
    buyerId: 'BUY003',
    buyerCompany: 'SK On Hungary',
    commodity: 'Spodumene Concentrate',
    grade: 'SC6.0+',
    requiredPurity: '≥6.0% Li₂O',
    volume: 10000,
    unit: 'DMT',
    targetPrice: 2700,
    currency: 'USD',
    deliveryLocation: 'Komarom, Hungary',
    requiredDeliveryDate: '2024-H1',
    status: 'open',
    bidsCount: 3,
    createdAt: '2024-01-12T11:15:00Z',
    expiresAt: '2024-01-30T23:59:59Z'
  },
  {
    id: 'RFQ004',
    buyerId: 'BUY004',
    buyerCompany: 'Panasonic Energy',
    commodity: 'Lithium Hydroxide Monohydrate',
    grade: 'Premium Battery Grade',
    requiredPurity: '≥57.0% LiOH',
    volume: 1500,
    unit: 'MT',
    targetPrice: 26000,
    currency: 'USD',
    deliveryLocation: 'Osaka, Japan',
    requiredDeliveryDate: '2024-Q2',
    status: 'awarded',
    bidsCount: 5,
    createdAt: '2024-01-02T08:00:00Z',
    expiresAt: '2024-01-15T23:59:59Z'
  }
];

// BIDS
export const bids: Bid[] = [
  {
    id: 'BID001',
    rfqId: 'RFQ001',
    supplierId: 'SUP001',
    supplierName: 'Albemarle Corporation',
    pricePerUnit: 23800,
    currency: 'USD',
    volume: 2500,
    unit: 'MT',
    totalValue: 59500000,
    deliveryDate: '2024-04-15',
    status: 'active',
    submittedAt: '2024-01-11T10:30:00Z',
    notes: 'Can deliver in two shipments if needed'
  },
  {
    id: 'BID002',
    rfqId: 'RFQ001',
    supplierId: 'SUP002',
    supplierName: 'Ganfeng Lithium Co.',
    pricePerUnit: 23500,
    currency: 'USD',
    volume: 2500,
    unit: 'MT',
    totalValue: 58750000,
    deliveryDate: '2024-05-01',
    status: 'active',
    submittedAt: '2024-01-12T14:20:00Z'
  },
  {
    id: 'BID003',
    rfqId: 'RFQ001',
    supplierId: 'SUP005',
    supplierName: 'Livent Corporation',
    pricePerUnit: 24200,
    currency: 'USD',
    volume: 2500,
    unit: 'MT',
    totalValue: 60500000,
    deliveryDate: '2024-04-01',
    status: 'active',
    submittedAt: '2024-01-13T09:45:00Z',
    notes: 'Premium quality, faster delivery'
  },
  {
    id: 'BID004',
    rfqId: 'RFQ002',
    supplierId: 'SUP002',
    supplierName: 'Ganfeng Lithium Co.',
    pricePerUnit: 17200,
    currency: 'USD',
    volume: 5000,
    unit: 'MT',
    totalValue: 86000000,
    deliveryDate: '2024-02-28',
    status: 'active',
    submittedAt: '2024-01-09T16:00:00Z'
  },
  {
    id: 'BID005',
    rfqId: 'RFQ002',
    supplierId: 'SUP003',
    supplierName: 'SQM Chile',
    pricePerUnit: 17400,
    currency: 'USD',
    volume: 5000,
    unit: 'MT',
    totalValue: 87000000,
    deliveryDate: '2024-02-15',
    status: 'active',
    submittedAt: '2024-01-10T11:30:00Z'
  },
  {
    id: 'BID006',
    rfqId: 'RFQ004',
    supplierId: 'SUP001',
    supplierName: 'Albemarle Corporation',
    pricePerUnit: 25500,
    currency: 'USD',
    volume: 1500,
    unit: 'MT',
    totalValue: 38250000,
    deliveryDate: '2024-04-30',
    status: 'won',
    submittedAt: '2024-01-03T10:00:00Z'
  }
];

// AUCTIONS
export const auctions: Auction[] = [
  {
    id: 'AUC001',
    title: 'Weekly Lithium Spot Auction - Week 3',
    commodity: 'Lithium Compounds',
    lots: [
      {
        id: 'LOT001',
        auctionId: 'AUC001',
        lotNumber: 1,
        commodity: 'Lithium Hydroxide Monohydrate',
        grade: 'Battery Grade',
        volume: 200,
        unit: 'MT',
        startingBid: 4600000,
        currentBid: 4920000,
        bidIncrement: 50000,
        leadingBidder: 'Tesla Inc.',
        bidsCount: 8,
        origin: 'Chile'
      },
      {
        id: 'LOT002',
        auctionId: 'AUC001',
        lotNumber: 2,
        commodity: 'Lithium Carbonate',
        grade: 'Battery Grade',
        volume: 350,
        unit: 'MT',
        startingBid: 6125000,
        currentBid: 6475000,
        bidIncrement: 75000,
        leadingBidder: 'CATL',
        bidsCount: 12,
        origin: 'Argentina'
      },
      {
        id: 'LOT003',
        auctionId: 'AUC001',
        lotNumber: 3,
        commodity: 'Lithium Carbonate',
        grade: 'Technical Grade',
        volume: 500,
        unit: 'MT',
        startingBid: 7500000,
        currentBid: 7650000,
        bidIncrement: 50000,
        leadingBidder: 'LG Energy',
        bidsCount: 5,
        origin: 'China'
      }
    ],
    startTime: '2024-01-18T14:00:00Z',
    endTime: '2024-01-18T16:00:00Z',
    status: 'live',
    totalVolume: 1050,
    totalValue: 19045000,
    participantsCount: 28
  },
  {
    id: 'AUC002',
    title: 'Weekly Lithium Spot Auction - Week 4',
    commodity: 'Lithium Compounds',
    lots: [
      {
        id: 'LOT004',
        auctionId: 'AUC002',
        lotNumber: 1,
        commodity: 'Spodumene Concentrate',
        grade: 'SC6.0',
        volume: 2000,
        unit: 'DMT',
        startingBid: 5400000,
        currentBid: 5400000,
        bidIncrement: 100000,
        leadingBidder: '-',
        bidsCount: 0,
        origin: 'Australia'
      },
      {
        id: 'LOT005',
        auctionId: 'AUC002',
        lotNumber: 2,
        commodity: 'Lithium Hydroxide Monohydrate',
        grade: 'Premium Grade',
        volume: 150,
        unit: 'MT',
        startingBid: 4020000,
        currentBid: 4020000,
        bidIncrement: 50000,
        leadingBidder: '-',
        bidsCount: 0,
        origin: 'United States'
      }
    ],
    startTime: '2024-01-25T14:00:00Z',
    endTime: '2024-01-25T16:00:00Z',
    status: 'upcoming',
    totalVolume: 2150,
    totalValue: 9420000,
    participantsCount: 0
  }
];

// PRICE INDICATORS
export const priceIndicators: PriceIndicator[] = [
  {
    commodity: 'Lithium Carbonate (Recycled)',
    spotPrice: 16500,
    change24h: 150,
    changePercent: 0.92,
    high52w: 65000,
    low52w: 12000,
    volume24h: 1200,
    unit: 'MT',
    currency: 'USD',
    lastUpdated: '2024-01-18T15:30:00Z'
  },
  {
    commodity: 'Black Mass (High Ni/Li)',
    spotPrice: 8200,
    change24h: 450,
    changePercent: 5.8,
    high52w: 12000,
    low52w: 4500,
    volume24h: 8500,
    unit: 'MT',
    currency: 'USD',
    lastUpdated: '2024-01-18T15:30:00Z'
  },
  {
    commodity: 'Lithium Hydroxide (Battery)',
    spotPrice: 24350,
    change24h: 280,
    changePercent: 1.16,
    high52w: 78000,
    low52w: 18500,
    volume24h: 4250,
    unit: 'MT',
    currency: 'USD',
    lastUpdated: '2024-01-18T15:30:00Z'
  },
  {
    commodity: 'Lithium Carbonate (Battery)',
    spotPrice: 17850,
    change24h: -120,
    changePercent: -0.67,
    high52w: 72000,
    low52w: 14200,
    volume24h: 6800,
    unit: 'MT',
    currency: 'USD',
    lastUpdated: '2024-01-18T15:30:00Z'
  },
  {
    commodity: 'Spodumene Concentrate (SC6)',
    spotPrice: 2780,
    change24h: 45,
    changePercent: 1.64,
    high52w: 8200,
    low52w: 1850,
    volume24h: 12500,
    unit: 'DMT',
    currency: 'USD',
    lastUpdated: '2024-01-18T15:30:00Z'
  },
  {
    commodity: 'Lithium Metal (99.9%)',
    spotPrice: 92500,
    change24h: 1200,
    changePercent: 1.31,
    high52w: 145000,
    low52w: 78000,
    volume24h: 85,
    unit: 'MT',
    currency: 'USD',
    lastUpdated: '2024-01-18T15:30:00Z'
  }
];

// Dashboard Stats
export const dashboardStats = {
  buyer: {
    openRfqs: 3,
    activeBids: 12,
    watchedListings: 8,
    pendingOrders: 2,
    totalSpend: 156750000,
    avgSavings: 4.2
  },
  supplier: {
    activeListings: 6,
    pendingRfqs: 5,
    activeBids: 8,
    wonBids: 14,
    totalRevenue: 89500000,
    winRate: 68
  },
  admin: {
    totalUsers: 1247,
    verifiedSuppliers: 89,
    pendingVerifications: 12,
    activeAuctions: 2,
    totalVolume: 45680000,
    flaggedTransactions: 3
  }
};

// Format helpers
export const formatCurrency = (value: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export const formatVolume = (value: number, unit: string): string => {
  return `${new Intl.NumberFormat('en-US').format(value)} ${unit}`;
};

export const formatPercent = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};
