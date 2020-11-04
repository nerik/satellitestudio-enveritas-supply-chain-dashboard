import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import cx from 'classnames';
import styles from './ScoreWheel.module.css';
import { animated, Spring } from 'react-spring';
import { BUCKETS } from '../constants';
import { defaultFilters } from '../app/selectors';
import ReactTooltip from 'react-tooltip';

const BASE_WIDTH = 400;
const BASE_HEIGHT = 400;

const PI2 = 2 * Math.PI;
const NUM_PILLARS = 3;
const PILLAR_MARGIN_ANGLE = 0.01 * PI2;
const BAR_MARGIN_ANGLE = 0.002 * PI2;
const START_ANGLE = -0.18;

const INNER_RADIUS = 0.12;

const COLORS = [
  BUCKETS.VERY_BAD.color,
  BUCKETS.BAD.color,
  BUCKETS.GOOD.color,
  BUCKETS.VERY_GOOD.color
];
const INNER_RADIUS_PX = INNER_RADIUS * BASE_HEIGHT;
const OUTER_RADIUS_MAX_PX = 0.5 * BASE_HEIGHT;
const INNER_OUTER_THICKNESS = OUTER_RADIUS_MAX_PX - INNER_RADIUS_PX;
const RING_THICKNESS = INNER_OUTER_THICKNESS / 4;

// TODO MEMOIZE
function getFilteredStandards(data) {
  if (!data) return null;
  const filteredData =
    (data &&
      data.filter &&
      data.filter((standard) => standard.pillar !== undefined)) ||
    [];
  const sortedData = [...filteredData];
  sortedData.sort((a, b) => {
    if (a.pillar === b.pillar) {
      // sort by id
      return a.id < b.id ? -1 : 1;
    }
    // follows pillar order in https://www.enveritas.org/library/standards/#/
    return a.pillar > b.pillar ? -1 : 1;
  });
  return sortedData;
}

class ScoreWheel extends Component {
  componentWillMount() {
    const { data } = this.props;
    const standards = getFilteredStandards(data.standardsScores);

    // Angles calculations
    const numBars = standards.length;
    const numBarMargins = numBars - NUM_PILLARS;
    const totalBarsAngle =
      PI2 -
      NUM_PILLARS * PILLAR_MARGIN_ANGLE -
      numBarMargins * BAR_MARGIN_ANGLE;
    const barAngle = totalBarsAngle / numBars;

    let currentAngle = START_ANGLE;
    let currentPillar;
    const pillarsAngles = [];
    const angles = standards.map((standard) => {
      if (currentPillar !== standard.pillar) {
        currentPillar = standard.pillar;
        pillarsAngles.push({
          startAngle: currentAngle,
          endAngle: currentAngle + PILLAR_MARGIN_ANGLE
        });
        currentAngle += PILLAR_MARGIN_ANGLE;
      } else {
        currentAngle += BAR_MARGIN_ANGLE;
      }
      const startAngle = currentAngle;
      currentAngle += barAngle;
      const endAngle = currentAngle;

      return {
        startAngle,
        endAngle
      };
    });

    // create d3 generators for standards bars and pillars bars (the white separators)
    this.standardsArc = d3
      .arc()
      .startAngle((d) => angles[d.index] && angles[d.index].startAngle)
      .endAngle((d) => angles[d.index] && angles[d.index].endAngle)
      .innerRadius(INNER_RADIUS_PX);

    this.standardsAvgArc = d3
      .arc()
      .startAngle((d) => angles[d.index] && angles[d.index].startAngle)
      .endAngle((d) => angles[d.index] && angles[d.index].endAngle)
      .innerRadius((d) => d.innerRadius)
      .outerRadius((d) => d.outerRadius);

    this.pillarsArc = d3
      .arc()
      .startAngle((i) => pillarsAngles[i] && pillarsAngles[i].startAngle)
      .endAngle((i) => pillarsAngles[i] && pillarsAngles[i].endAngle)
      .innerRadius(INNER_RADIUS_PX)
      .outerRadius(OUTER_RADIUS_MAX_PX);
  }

  componentDidUpdate = () => {
    ReactTooltip.rebuild();
  };

  isStandardPillar = (pillar) => {
    const { currentPillar } = this.props;
    return currentPillar === defaultFilters.pillar || currentPillar === pillar;
  };

  getBarStyle = (d, index) => {
    const value = d.localBucketValue;
    const outerRadius =
      0.1 +
      INNER_RADIUS_PX +
      d.bucketIndex * RING_THICKNESS +
      value * RING_THICKNESS;

    const isStandardPillar = this.isStandardPillar(d.pillar);
    return {
      fill: isStandardPillar ? COLORS[d.bucketIndex] : '#4C525F',
      d: this.standardsArc({ index, outerRadius }),
      fillOpacity: isStandardPillar ? 1 : 0.15
    };
  };

  getReferenceBarStyle = (d, index) => {
    const value = d.localBucketValue < 0.1 ? 0.1 : d.localBucketValue;
    const radius =
      0.1 +
      INNER_RADIUS_PX +
      d.bucketIndex * RING_THICKNESS +
      value * RING_THICKNESS;
    const standardValue = this.props.data.standardsScores.find(
      (s) => s.id === d.id
    ).localBucketValue;
    return {
      fill: 'none',
      stroke: value < standardValue ? '#fff' : '#4C525F',
      strokeWidth: 3,
      strokeDasharray: '0, 11',
      strokeLinecap: 'round',
      d: this.standardsAvgArc({
        index,
        innerRadius: radius,
        outerRadius: radius
      }),
      fillOpacity: 1
    };
  };

  getStandardTooltip = (standardId) => {
    const standards = getFilteredStandards(this.props.data.standardsScores);
    const standard = standards.find((s) => s.id === standardId);
    if (!standard) return '';
    const replaceQuotes = (text) => text.replace(/"/g, '');
    return (
      <div className={styles.standardTooltip}>
        <div className={styles.standardTooltipHeader}>
          <span className="primary">{replaceQuotes(standard.label)}</span>
          <span className="primary">{Math.round(standard.value * 100)}</span>
        </div>
        {standard.criteria && (
          <ul>
            {standard.criteria.map((c) => (
              <li key={c.id}>- {replaceQuotes(c.label)}.</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  render() {
    const { data, mini, showPillars, currentPillar } = this.props;
    const standards = getFilteredStandards(data.standardsScores);
    const countryStandards = getFilteredStandards(data.countryStandardsScores);
    const score =
      currentPillar === defaultFilters.pillar
        ? data && data.overallScore
        : data && data.pillarsScores[currentPillar];
    const overallScore = (score && Math.round(100 * score)) || 0;

    const centerTransform = {
      transform: `translate(${BASE_WIDTH / 2}px, ${BASE_HEIGHT / 2}px)`
    };

    return (
      <div className={styles.ScoreWheel}>
        <Spring key="text" to={{ overallScore }}>
          {(style) => (
            <span
              key="overall"
              className={cx(styles.mainScore, { [styles.mainScoreMini]: mini })}
            >
              {Math.round(style.overallScore)}
            </span>
          )}
        </Spring>
        {showPillars && (
          <Fragment>
            <span
              key="eco"
              className={`${styles.pillarLabel} ${styles.economic}`}
            >
              Economic{' '}
              <span className={styles.pillarScore}>
                {Math.round(100 * data.pillarsScores.eco)}
              </span>
            </span>
            <span
              key="soc"
              className={`${styles.pillarLabel} ${styles.social}`}
            >
              Social{' '}
              <span className={styles.pillarScore}>
                {Math.round(100 * data.pillarsScores.soc)}
              </span>
            </span>
            <span
              key="env"
              className={`${styles.pillarLabel} ${styles.environmental}`}
            >
              Environmental{' '}
              <span className={styles.pillarScore}>
                {Math.round(100 * data.pillarsScores.env)}
              </span>
            </span>
          </Fragment>
        )}
        <svg
          viewBox={`0 0 ${BASE_WIDTH} ${BASE_HEIGHT}`}
          className={styles.plot}
        >
          <defs>
            <radialGradient id="RadialGradient1">
              <stop offset="0%" stopColor="#f2f5f4" stopOpacity={1} />
              <stop offset="100%" stopColor="#fff" stopOpacity={0} />
            </radialGradient>
          </defs>

          <g style={centerTransform}>
            <circle className={styles.bgCircle} r={BASE_HEIGHT / 2} />
            <circle className={styles.fgCircle} r={INNER_RADIUS_PX} />
            {[1, 2, 3].map((i) => (
              <circle
                key={i}
                className={styles.ring}
                r={INNER_RADIUS_PX + i * RING_THICKNESS}
              />
            ))}

            <g className={styles.pillarSeparations}>
              {[0, 1, 2].map((i) => {
                const d = this.pillarsArc(i);
                return <path key={i} d={d} />;
              })}
            </g>
            <g>
              {standards &&
                standards.map((d, i) => {
                  const style = this.getBarStyle(d, i);
                  return (
                    <Spring key={i} native delay={mini ? 0 : i * 50} to={style}>
                      {(s) => (
                        <animated.path
                          data-delay-hide={50}
                          data-for="scoreWheelTooltip"
                          data-tip={d.id}
                          data-tip-disable={
                            mini || !this.isStandardPillar(d.pillar)
                          }
                          style={s}
                          d={s.d}
                          fill={s.fill}
                        />
                      )}
                    </Spring>
                  );
                })}
              {countryStandards &&
                countryStandards.map((d, i) => {
                  const style = this.getReferenceBarStyle(d, i);
                  return (
                    <Spring key={i} native to={style}>
                      {(s) => <animated.path style={s} d={s.d} />}
                    </Spring>
                  );
                })}
            </g>
            <circle
              fill="url(#RadialGradient1)"
              r={BASE_HEIGHT / 3}
              className={styles.radialGradient}
            />
          </g>
        </svg>
        {!mini && (
          <ReactTooltip
            id="scoreWheelTooltip"
            getContent={this.getStandardTooltip}
            type={'light'}
          />
        )}
      </div>
    );
  }
}

ScoreWheel.propTypes = {
  // Selected pillar
  currentPillar: PropTypes.string,
  data: PropTypes.shape({
    standardsScores: PropTypes.arrayOf(
      PropTypes.shape({
        // id of a Standard
        id: PropTypes.string.isRequired,
        // id of Standard's parent Pillar
        pillar: PropTypes.string,
        // index of the score bucket, should be an integer between 0 and 3 (there are 4 rings)
        bucketIndex: PropTypes.number.isRequired,
        // the relative value inside the bucket, must be a float between 0 and 1
        localBucketValue: PropTypes.number.isRequired
      })
    )
  }).isRequired,
  // Reduced version of it
  mini: PropTypes.bool,
  showPillars: PropTypes.bool
};

ScoreWheel.defaultProps = {
  currentPillar: 'all',
  mini: false,
  showPillars: false
};

export default ScoreWheel;
