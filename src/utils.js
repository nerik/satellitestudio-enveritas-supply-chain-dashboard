const BIVARIATE_INDEXES = [
  [0, 0, 0, 0, 0],
  [1, 1, 2, 3, 3],
  [4, 5, 6, 7, 8],
];

export const matchesWithHighlightedBuckets = (mode, highlightBucket, bucketIndexes) => {
  let isHighlighted = false;
  if (mode === 'volume') {
    isHighlighted = highlightBucket === bucketIndexes.volume;
  } else if (mode === 'score') {
    isHighlighted = highlightBucket === bucketIndexes.score;
  } else {
    const bucketIndex = getBivariateBucketIndex(bucketIndexes);
    isHighlighted = highlightBucket === bucketIndex;
  }
  return isHighlighted;
};

export const getBivariateBucketIndex = ({ score, volume }) => {
  return BIVARIATE_INDEXES[volume][score];
};
