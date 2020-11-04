export const DYNAMIC_TEXT = {
  STATIC: 'static',
  DYNAMIC: 'dynamic',
  MENU: 'menu',
  BREAK: 'break',
};

export const SCOREWHEEL_BUCKET_CONFIG = { country: null, blend: null, pillar: null, buckets: [0.1, 0.5, 0.9] };

// Minimun requirements id
export const MMR_ID = 'mr';
export const OTHERS_ID = 'others';
export const PAGE_ITEMS = 10;

// TODO: full labels, ie "high volume, very good score" ?
export const BUCKETS = {
  HIGH_VOLUME_VERY_GOOD: { label: 'very good', color: '#3A5894' },
  HIGH_VOLUME_GOOD: { label: 'good', color: '#59ADC2' },
  HIGH_VOLUME_AVERAGE: { label: 'average', color: '#9F8985' },
  HIGH_VOLUME_BAD: { label: 'bad', color: '#D29581' },
  HIGH_VOLUME_VERY_BAD: { label: 'very bad', color: '#99454D' },
  MID_VOLUME_GOOD: { label: 'good', color: '#B5E1E8' },
  MID_VOLUME_AVERAGE: { label: 'average', color: '#D1C1BD' },
  MID_VOLUME_BAD: { label: 'bad', color: '#F6B1A0' },
  HIGH_VOLUME: { label: 'high volume', color: '#786561' },
  MID_VOLUME: { label: 'mid volume', color: '#B8A5A1' },
  LOW_VOLUME: { label: 'all', color: '#EBE0DE' },
  NA: { label: 'N/A', color: '#D9DDDE' }
};

export const BUCKETS_BY_INDEX = [
  [
    BUCKETS.LOW_VOLUME,
    BUCKETS.LOW_VOLUME,
    BUCKETS.LOW_VOLUME,
    BUCKETS.LOW_VOLUME,
    BUCKETS.LOW_VOLUME
  ],
  [
    BUCKETS.MID_VOLUME_BAD,
    BUCKETS.MID_VOLUME_BAD,
    BUCKETS.MID_VOLUME_AVERAGE,
    BUCKETS.MID_VOLUME_GOOD,
    BUCKETS.MID_VOLUME_GOOD,
  ],
  [
    BUCKETS.HIGH_VOLUME_VERY_BAD,
    BUCKETS.HIGH_VOLUME_BAD,
    BUCKETS.HIGH_VOLUME_AVERAGE,
    BUCKETS.HIGH_VOLUME_GOOD,
    BUCKETS.HIGH_VOLUME_VERY_GOOD
  ]
];

BUCKETS.VERY_GOOD = BUCKETS.HIGH_VOLUME_VERY_GOOD;
BUCKETS.GOOD = BUCKETS.MID_VOLUME_GOOD;
BUCKETS.AVERAGE = BUCKETS.MID_VOLUME_AVERAGE;
BUCKETS.BAD = BUCKETS.MID_VOLUME_BAD;
BUCKETS.VERY_BAD = BUCKETS.HIGH_VOLUME_VERY_BAD;

export const BUCKETS_BY_SCORE = [
  BUCKETS.VERY_BAD,
  BUCKETS.BAD,
  BUCKETS.AVERAGE,
  BUCKETS.GOOD,
  BUCKETS.VERY_GOOD,
];

export const BUCKETS_BY_VOLUME = [
  BUCKETS.LOW_VOLUME,
  BUCKETS.MID_VOLUME,
  BUCKETS.HIGH_VOLUME,
];

export const BUCKET = {
  HIGH_VOLUME_VERY_GOOD: 'HIGH_VOLUME_VERY_GOOD',
  HIGH_VOLUME_GOOD: 'HIGH_VOLUME_GOOD',
  HIGH_VOLUME_AVERAGE: 'HIGH_VOLUME_AVERAGE',
  HIGH_VOLUME_BAD: 'HIGH_VOLUME_BAD',
  HIGH_VOLUME_VERY_BAD: 'HIGH_VOLUME_VERY_BAD',
  MID_VOLUME_GOOD: 'MID_VOLUME_GOOD',
  MID_VOLUME_AVERAGE: 'MID_VOLUME_AVERAGE',
  MID_VOLUME_BAD: 'MID_VOLUME_BAD',
  HIGH_VOLUME: 'HIGH_VOLUME',
  MID_VOLUME: 'MID_VOLUME',
  LOW_VOLUME: 'LOW_VOLUME',
  NA: 'NA'
};
