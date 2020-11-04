import * as d3 from 'd3';
import { MODES } from '../bivariateCone/BivariateCone';
import { BUCKETS_BY_INDEX, BUCKETS_BY_SCORE, BUCKETS_BY_VOLUME } from '../constants';

export const BASE_HEIGHT = 620;
export const BASE_WIDTH = 795;

const projection = d3.geoMercator()
  .scale(2250)
  .translate([BASE_WIDTH * 4.8, BASE_HEIGHT * 1.3]);
export const geoPath = d3.geoPath().projection(projection);

export const getBucketByDimension = (scoreBucket = {}, volumeBucket = {}, dimension) => {
  let bucket = {};
  if (dimension === MODES.score) {
    bucket = BUCKETS_BY_SCORE[scoreBucket.bucketIndex];
  } else if (dimension === MODES.volume) {
    bucket = BUCKETS_BY_VOLUME[volumeBucket.bucketIndex];
  } else {
    bucket = BUCKETS_BY_INDEX[volumeBucket.bucketIndex][scoreBucket.bucketIndex];
  }
  return bucket;
};
