import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';
import classnames from 'classnames';
import * as d3 from 'd3';
import { animated, Transition } from 'react-spring';
import styles from './BivariateCone.module.css';
import { getBivariateBucketIndex } from '../utils';

export const MODES = {
  bivariate: 'bivariate',
  score: 'score',
  volume: 'volume',
};

const RADIUS = 176;
const TOTAL_ANGLE = Math.PI / 2;
const MARGIN_TOP = 27;
const MARGIN_LEFT = 11;

const START_ANGLE = (Math.PI - TOTAL_ANGLE) / 2 + TOTAL_ANGLE;
const END_ANGLE = (Math.PI - TOTAL_ANGLE) / 2;
const ANGLE_OFFSET = (END_ANGLE - START_ANGLE) / 5;
const RADIUS_OFFSET = RADIUS / 3;
const WIDTH = Math.sqrt(2*RADIUS*RADIUS-(2*RADIUS*RADIUS*Math.cos(TOTAL_ANGLE)));

const ANGLE_SCALES = [
  d3.scaleLinear().range([START_ANGLE, START_ANGLE + ANGLE_OFFSET]),
  d3.scaleLinear().range([START_ANGLE + ANGLE_OFFSET, START_ANGLE + ANGLE_OFFSET*2]),
  d3.scaleLinear().range([START_ANGLE + ANGLE_OFFSET*2, START_ANGLE + ANGLE_OFFSET*3]),
  d3.scaleLinear().range([START_ANGLE + ANGLE_OFFSET*3, START_ANGLE + ANGLE_OFFSET*4]),
  d3.scaleLinear().range([START_ANGLE + ANGLE_OFFSET*4, END_ANGLE])
];

const RADIUS_SCALES = [
  d3.scaleLinear().range([0, RADIUS_OFFSET]),
  d3.scaleLinear().range([RADIUS_OFFSET, RADIUS_OFFSET*2]),
  d3.scaleLinear().range([RADIUS_OFFSET*2, RADIUS])
];

const BivariateBackground = React.memo(function({ mode, title, onBucketHighlight, children }) {
  if (mode === MODES.bivariate) {
      return (
      <g fill="none" onMouseLeave={() => onBucketHighlight(null)}>
        <path fill="#979797" fillRule="nonzero" d="M270.2 72l-3.4-9.5-6.2 6.5 9.6 3zm-5.8-6.3c-35-32-80.6-50.2-129-50.2A190.2 190.2 0 0 0 .3 71.2l.8.7a190.5 190.5 0 0 1 134.1-55.4c48.3 0 93.7 18 128.4 50l.7-.8z" opacity=".3"/>
        <text
          fill="#8A93A5"
          fontSize="13"
          fontWeight="400"
          transform="translate(0 -3)"
          textAnchor="middle"
        >
          <tspan x="140" y="13" textAnchor="middle" >{title} score</tspan>
        </text>
        <text fill="#8A93A5" fontSize="13" fontWeight="400" transform="rotate(-45 174.6 194.6)">
          <tspan x="137.4" y="202.6">coffee volume</tspan>
        </text>
        <path fill="#979797" fillRule="nonzero" d="M270 86l-9.5 3.1 6.4 6.4L270 86zM145 211.9L264.4 92.3l.3-.3-.7-.7-.3.3L144 211.1l-.3.4.7.7.4-.3z" opacity=".3"/>
        <g fillRule="nonzero" stroke="#F2F5F4" strokeWidth="2">
          <path fill="#EBE0DE" onMouseEnter={() => onBucketHighlight(0)} d="M136 206l42.5-42.6a59.9 59.9 0 0 0-85 0L136 206z"/>
          <path fill="#F6B1A0" onMouseEnter={() => onBucketHighlight(1)} d="M93.4 163.4l-43-42.5a120.2 120.2 0 0 1 67-34.3l9.4 59.8a60 60 0 0 0-33.4 17z"/>
          <path fill="#D1C1BD" onMouseEnter={() => onBucketHighlight(2)} d="M126.7 146.4l-9.3-59.8a112.9 112.9 0 0 1 36.8-.1l-9.2 59.8a60.6 60.6 0 0 0-18.3.1z"/>
          <path fill="#B5E1E8" onMouseEnter={() => onBucketHighlight(3)} d="M145 146.4l9.1-60a118.6 118.6 0 0 1 67.3 33.8l-43 43a59.9 59.9 0 0 0-33.4-16.8z"/>
          <path fill="#99454D" onMouseEnter={() => onBucketHighlight(4)} d="M50.5 121L8.4 79.2c6.5-6.8 13.6-13 21.5-18.7 7.8-5.7 16.2-10.8 25.4-15.3L81.9 98a121 121 0 0 0-31.4 23z"/>
          <path fill="#D29581" onMouseEnter={() => onBucketHighlight(5)} d="M81.9 98L55.3 45.3a205.6 205.6 0 0 1 53-17l9.2 58.3c-12.6 2-24.6 5.9-35.6 11.4z"/>
          <path fill="#9F8985" onMouseEnter={() => onBucketHighlight(6)} d="M117.5 86.6l-9.1-58.3a189.2 189.2 0 0 1 54.7 0l-8.8 58.2a121.6 121.6 0 0 0-36.8 0z"/>
          <path fill="#6DADC2" onMouseEnter={() => onBucketHighlight(7)} d="M154.2 86.5l9-58.2c9.2 1.2 18.5 3.4 27.7 6.4 9.2 3 18.3 6.8 27.3 11.5l-26.9 52.2c-11.4-5.9-23.9-10-37-12z"/>
          <path fill="#3A5894" onMouseEnter={() => onBucketHighlight(8)} d="M191.3 98.4l26.9-52.2c8.2 4.7 16 9.8 23.4 15.2 7.5 5.5 14.5 11.4 21 17.7l-41.3 41.2a121 121 0 0 0-30-22z"/>
          {children}
        </g>
      </g>
    );
  } else if (mode === MODES.volume) {
    return (
      <g fill="none" onMouseLeave={() => onBucketHighlight(null)}>
        <text fill="#8A93A5" fontSize="13" fontWeight="400" transform="rotate(-45 189.4 183.6)">
          <tspan x="135.4" y="189.6">purchased volume</tspan>
        </text>
        <path fill="#979797" fillRule="nonzero" d="M270 88l-9.5 3.1 6.4 6.4L270 88zM145 213.9L264.4 94.3l.3-.3-.7-.7-.3.3L144 213.1l-.3.4.7.7.4-.3z" opacity=".3"/>
        <path fill="#786561" onMouseEnter={() => onBucketHighlight(2)} fillRule="nonzero" stroke="#F2F5F4" strokeWidth="2" d="M136.4 208L262.8 80A177 177 0 0 0 10 80l126.4 128z"/>
        <path fill="#B8A5A1" onMouseEnter={() => onBucketHighlight(1)} fillRule="nonzero" stroke="#F2F5F4" strokeWidth="2" d="M136 208l87.3-88.4a122.3 122.3 0 0 0-174.6 0L136 208z"/>
        <path fill="#EBE0DE" onMouseEnter={() => onBucketHighlight(0)} fillRule="nonzero" stroke="#F2F5F4" strokeWidth="2" d="M135.7 208l45.2-45.3a63.6 63.6 0 0 0-90.3 0l45.1 45.3z"/>
        {children}
      </g>
    );
  } else if (mode === MODES.score) {
    return (
      <g onMouseLeave={() => onBucketHighlight(null)}>
        <path fill="#979797" fillRule="nonzero" d="M263.272 64.198C228.614 32.387 183.348 14.5 135.2 14.5A190.5 190.5 0 0 0 1.1 69.9l-.8-.7a190.2 190.2 0 0 1 135.1-55.7c48.24 0 93.697 18.08 128.651 49.882L266.8 60.5l3.4 9.5-9.6-3 2.672-2.802z" opacity=".3"/>
        <text fill="#8A93A5" fontFamily="Helvetica" fontSize="13" transform="translate(0 -6)">
          <tspan x="121.105" y="13">score</tspan>
        </text>
        <g stroke="#F2F5F4">
          <path fill="#99454D" onMouseEnter={() => onBucketHighlight(0)} strokeLinecap="round" strokeLinejoin="round" d="M8.4 77.2c6.5-6.8 13.6-13 21.5-18.7 7.8-5.7 16.2-10.8 25.4-15.3L136 204 8.4 77.2z"/>
          <path fill="#F6B1A0" onMouseEnter={() => onBucketHighlight(1)} d="M55.3 43.3a205.6 205.6 0 0 1 53-17L136 204 55.3 43.3z"/>
          <path fill="#D1C1BD" onMouseEnter={() => onBucketHighlight(2)} d="M136 204L108.4 26.3a189.2 189.2 0 0 1 54.7 0L136 204z"/>
          <path fill="#B5E1E8" onMouseEnter={() => onBucketHighlight(3)} d="M163.2 26.3c9.2 1.2 18.5 3.4 27.7 6.4 9.2 3 18.3 6.8 27.3 11.5L136 204l27.2-177.7z"/>
          <path fill="#3A5894" onMouseEnter={() => onBucketHighlight(4)} d="M218.2 44.2c8.2 4.7 16 9.8 23.4 15.2 7.5 5.5 14.5 11.4 21 17.7L136 204l82.2-159.8z"/>
        </g>
        {children}
      </g>
    );
  } else {
    console.error('wrong bivariate code mode', mode);
    return null;
  }
});

class BivariateCone extends Component {
  getPointCoords = (scoreBucket) => {
    if (!scoreBucket) {
      console.warn('No scoreBucket provided for bivariate cone', this.props);
      return {};
    }

    const { volumeBuckets, mode } = this.props;

    const scoreBucketIndex = mode === MODES.volume
      ? Math.round((ANGLE_SCALES.length - 1) / 2) // we want to position them in the middle when volume mode
      : scoreBucket.bucket.bucketIndex;

    const volumeBucket = volumeBuckets.find(v => v.id === scoreBucket.id);
    const volumeBucketIndex = mode === MODES.score
      ? RADIUS_SCALES.length -1 // we want to position it in the latest bucket when score mode
      : volumeBucket.bucket.bucketIndex;

    const angleScale = ANGLE_SCALES[scoreBucketIndex];
    const radiusScale = RADIUS_SCALES[volumeBucketIndex];

    const localScoreBucketValue = mode === MODES.volume
      ? 0.5 // using the center of the bucket
      : scoreBucket.bucket.localBucketValue;
    const localVolumeBucketValue = mode === MODES.score
      ? 0.5
      : volumeBucket.bucket.localBucketValue;

    const angle = angleScale(localScoreBucketValue);
    const radius = radiusScale(localVolumeBucketValue);

    const cx = radius * Math.cos(angle);
    const cy = - radius * Math.sin(angle);
    return { cx, cy, r: 4 };
  }

  renderDefs() {
    return (<defs>
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feOffset result="offOut" in="SourceAlpha" dx="0" dy="1.5" />
        <feGaussianBlur result="blurOut" in="offOut" stdDeviation="1" />
        <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.4"/>
        </feComponentTransfer>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in="SourceGraphic"></feMergeNode>
        </feMerge>
      </filter>
    </defs>);
  }

  render() {
    const { scoreBuckets, volumeBuckets, mode, title, highlightedItems, onBucketHighlight, onPointHighlight } = this.props;

    let highlightedScoreBucket;
    if (highlightedItems !== null) {
      highlightedScoreBucket = scoreBuckets.find(s => highlightedItems.includes(s.id));
      if (highlightedScoreBucket) {
        const pt = this.getPointCoords(highlightedScoreBucket);
        highlightedScoreBucket = {
          ...highlightedScoreBucket,
          ...pt
        };
      }
    };

    return (
      <React.Fragment>
        <svg
          className={styles.BivariateCone}
          style={{ height: RADIUS + MARGIN_TOP * 2, width: WIDTH + MARGIN_LEFT * 2}}
        >
          {this.renderDefs()}
          <BivariateBackground mode={mode} title={title} onBucketHighlight={onBucketHighlight}>
            <g style={{ transform: `translate(${MARGIN_LEFT}px, ${MARGIN_TOP}px)` }}>
              <g style={{ transform: `translate(${WIDTH/2}px, ${RADIUS}px)` }} className={styles.points}
                onMouseLeave={() => {
                  onPointHighlight({ id: undefined });
                  ReactTooltip.hide();
                }}
              >
                <Transition
                  native
                  items={scoreBuckets}
                  keys={scoreBuckets.map(d => d.key || d.id)}
                  from={{ r: 0 }}
                  leave={{ r: 0 }}
                  enter={this.getPointCoords}
                  update={this.getPointCoords}>
                    {scoreBuckets.map(d => s =>
                      <animated.circle
                        data-for="bivariateCone"
                        data-tip={d.label}
                        cx={s.cx}
                        cy={s.cy}
                        r={s.r}
                        onMouseEnter={() => {
                          onPointHighlight(d);
                          let bucketIndex;
                          const volumeBucket = volumeBuckets.find(v => v.id === d.id);
                          if (mode === MODES.volume) {
                            bucketIndex = volumeBucket.bucket.bucketIndex;
                          } else if (mode === MODES.score) {
                            bucketIndex = d.bucket.bucketIndex;
                          } else {
                            const buckets = {
                              score: d.bucket.bucketIndex,
                              volume: volumeBucket.bucket.bucketIndex
                            };
                            bucketIndex = getBivariateBucketIndex(buckets);
                          }
                          if (bucketIndex !== null) {
                            onBucketHighlight(bucketIndex);
                          }
                        }}
                        className={classnames({
                          [styles.pointBlurred]: d.blurred,
                          [styles.highlighted]: highlightedItems && highlightedItems.includes(d.id)
                        })}
                      />
                    )}
                </Transition>
                  {highlightedScoreBucket !== undefined && <circle
                    data-for="bivariateCone"
                    data-tip={highlightedScoreBucket.label}
                    cx={highlightedScoreBucket.cx}
                    cy={highlightedScoreBucket.cy}
                    className={styles.highlighted}
                  />}
              </g>
            </g>
          </BivariateBackground>
        </svg>
        <ReactTooltip className="highlight" id="bivariateCone" type={'light'}/>
      </React.Fragment>
    );
  }
}

BivariateCone.propTypes = {
  // Whether the component represent volume and score, ot them separated
  mode: PropTypes.oneOf(Object.values(MODES)),
  // String to show as title of the graph
  title: PropTypes.string.isRequired,
  scoreBuckets: PropTypes.arrayOf(PropTypes.shape({
    // a Supply Unit id
    id: PropTypes.string.isRequired,
    bucket: PropTypes.shape({
      // index of the score bucket, should be an integer between 0 and 4 (there are 5 "slices")
      bucketIndex: PropTypes.number.isRequired,
      // the relative value inside the bucket, must be a float between 0 and 1
      localBucketValue: PropTypes.number.isRequired,
    })
  })).isRequired,
  volumeBuckets: PropTypes.arrayOf(PropTypes.shape({
    // a Supply Unit id
    id: PropTypes.string.isRequired,
    bucket: PropTypes.shape({
      // index of the volume bucket, should be an integer between 0 and 2 (there are 3 "rings")
      bucketIndex: PropTypes.number.isRequired,
      // the relative value inside the bucket, must be a float between 0 and 1
      localBucketValue: PropTypes.number.isRequired,
    })
  })).isRequired,
  highlightedItems: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
  onPointHighlight: PropTypes.func.isRequired,
  onBucketHighlight: PropTypes.func.isRequired,
};

BivariateCone.defaultProps = {
  mode: MODES.bivariate,
  highlightedItems: null
};

export default BivariateCone;
