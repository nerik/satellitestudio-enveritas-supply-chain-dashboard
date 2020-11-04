import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { createSelector } from 'reselect';
import * as d3 from 'd3';
import { animated, Transition } from 'react-spring';
import { sum } from 'lodash';
import cs from 'classnames';
import ReactTooltip from 'react-tooltip';
import { BUCKET, BUCKETS } from '../constants';
import { OTHERS_ID } from '../constants';
import styles from './Sankey.module.css';

const BASE_HEIGHT = 450;
const BASE_WIDTH = 700;
const NODE_Y_SPACE = 8;

//  text  textMargin  node nodeMargin  links   nodeMargin   node  textMargin   text
const NODE_WIDTH = 60;
const TEXT_WIDTH = 60;
const TEXT_MARGIN = 100;
const NODE_MARGIN = 4;
const LINKS_WIDTH = BASE_WIDTH - NODE_WIDTH * 2 - TEXT_WIDTH * 2 - TEXT_MARGIN * 2 - NODE_MARGIN * 2;

const LEFT_X = TEXT_WIDTH + TEXT_MARGIN;
const LINKS_X = LEFT_X + NODE_WIDTH + NODE_MARGIN;
const RIGHT_X = LINKS_X + LINKS_WIDTH + NODE_MARGIN;
const TEXT_LEFT_X = RIGHT_X + NODE_WIDTH + TEXT_MARGIN; // eslint-disable-line no-unused-vars

const DRAW_LINK = (link, width) => {
  const y0 = link.sy + link.height / 2;
  const y1 = link.ty + link.height / 2;
  const x0 = 0;
  const x1 = width;
  const xi = d3.interpolateNumber(x0, x1);
  const x2 = xi(0.75);
  const x3 = xi(0.25);
  const d = `M${x0},${y0}C${x2},${y0} ${x3},${y1} ${x1},${y1}`;
  return d;
};

const getGradientId = (sFill, tFill) => `gradient-${sFill.substr(1)}-${tFill.substr(1)}`;

class Sankey extends Component {
  componentDidUpdate = () => {
    ReactTooltip.rebuild();
  }

  getCoords = (data) => {
    const nodesLeftTotalHeight = BASE_HEIGHT + (data.nodesLeft.length) * NODE_Y_SPACE;
    const nodesRightTotalHeight = BASE_HEIGHT + (data.nodesRight.length) * NODE_Y_SPACE;
    const nodesHeightsOffset = Math.abs(nodesLeftTotalHeight - nodesRightTotalHeight);

    let nodesCurrentY;
    const getNodesProps = (nodes, links) => nodes.map(node => {
      const nodeY = nodesCurrentY;
      const nodeHeight = BASE_HEIGHT * node.volume;
      nodesCurrentY += nodeHeight + NODE_Y_SPACE;

      const { bucket } = node;

      let fill;
      if (bucket === undefined) {
        console.warn('wrong volume/score bucket combination ', bucket);
        fill = '#ff0000';
      } else {
        fill = bucket.color;
      }

      return {
        id: node.id,
        opacity: node.opacity,
        y: nodeY,
        height: nodeHeight,
        fill,
        suppliersIds: node && node.suppliersIds
      };
    });
    nodesCurrentY = (nodesLeftTotalHeight < nodesRightTotalHeight) ? nodesHeightsOffset / 2 : 0;

    const nodesLeft = getNodesProps(data.nodesLeft, data.links);
    nodesCurrentY = (nodesLeftTotalHeight < nodesRightTotalHeight) ? 0 : nodesHeightsOffset / 2;
    const nodesRight = getNodesProps(data.nodesRight, data.links);

    const linksStartCurrentYsByNode = {};
    const linksTargetCurrentYsByNode = {};
    const links = data.links.map(link => {
      const linkHeight = BASE_HEIGHT * link.value;

      const sNodeId = link.nodeLeft.id;
      const tNodeId = link.nodeRight.id;

      const sNode = nodesLeft.find(n => n.id === sNodeId);
      const tNode = nodesRight.find(n => n.id === tNodeId);

      if (linksStartCurrentYsByNode[sNodeId] === undefined) {
        linksStartCurrentYsByNode[sNodeId] = sNode.y;
      };
      if (linksTargetCurrentYsByNode[tNodeId] === undefined) {
        linksTargetCurrentYsByNode[tNodeId] = tNode.y;
      };

      const sy = linksStartCurrentYsByNode[sNodeId];
      const ty = linksTargetCurrentYsByNode[tNodeId];

      linksStartCurrentYsByNode[sNodeId] += linkHeight;
      linksTargetCurrentYsByNode[tNodeId] += linkHeight;

      const sFill = sNode.fill;
      const tFill = tNode.fill;
      const stroke = (sFill === tFill) ? sFill : `url(#${getGradientId(sFill, tFill)})`;

      return {
        ...link,
        sy,
        ty,
        height: linkHeight,
        stroke
      };
    });

    return {
      totalHeight: Math.max(nodesLeftTotalHeight, nodesRightTotalHeight),
      nodesLeft,
      nodesRight,
      links
    };
  }

  renderGradientDefs() {
    const gradients = [];
    const bucketIds = Object.keys(BUCKET);

    bucketIds.forEach(bucket1 => {
      bucketIds.forEach(bucket2 => {
        const color1 = BUCKETS[bucket1].color;
        const color2 = BUCKETS[bucket2].color;
        const id = getGradientId(color1, color2);
        if (color1 !== color2) {
          gradients.push(<linearGradient key={id} id={id}>
            <stop offset="0%" stopColor={color1}/>
            <stop offset="100%" stopColor={color2}/>
          </linearGradient>);
        }
      });
    });
    return <defs>{gradients}</defs>;
  }

  getSupplyScoreText(supplyId) {
    const su = this.props.data.nodesLeft.find(n => n.id === supplyId);
    const value = su.supplyUnits.length;
    const { label } = su.bucket;
    return <React.Fragment>
      <tspan className={styles.labelHighlight} dy={-5} x={-NODE_MARGIN * 2}>
        {`${value} supply units`}
      </tspan>
      <tspan dy={15} x={-NODE_MARGIN * 2}>
        {`have a ${label} score`}
      </tspan>
    </React.Fragment>;
  }

  getSupplyText(supplyId) {
    const su = this.props.data.nodesRight.find(n => n.id === supplyId);
    if (!su) return null;
    const isOthers = su.id === OTHERS_ID;
    return su && <React.Fragment>
      <tspan dy={5} className={cs({[styles.labelHighlight]: !isOthers})}>
        { isOthers
          ? 'Others'
          : su.id || su.label
        }
      </tspan>
    </React.Fragment>;
  }

  // Using a selector to avoid computing this in all mouse movements
  getLinkTooltip = (linkId) => {
    const { data, totalVolume } = this.props;
    const currentLink = data.links.find(l => l.id === linkId);
    if (!currentLink) return null;
    return <p><span className="highlight">{currentLink.nodeLeft.label}</span> supplied
      <span className="highlight"> {Math.round(currentLink.value * totalVolume)}</span> tons
      to <span className="highlight">{currentLink.nodeRight.label}</span>.</p>;
  }

  getSupplyUnitTooltip = (supplyUnitId) => {
    const { data } = this.props;
    const { nodesLeft } = data;
    const su = nodesLeft.find(n => n.id === supplyUnitId);
    if (!su) return null;

    return <ul className={`highlight ${styles.supplyUnitTooltip}`}>{su.supplyUnits.map(s => (<li key={s.id}>{s.label}</li>))}</ul>;
  }

  // Using a selector to avoid computing this in all mouse movements
  getSupplierTooltip = createSelector([(supplierId) => supplierId], (supplierId) => {
    const { data, totalVolume } = this.props;
    const { nodesLeft, nodesRight, links } = data;
    const su = nodesRight.find(n => n.id === supplierId);
    if (!su) return null;
    const linksFromSuppliers = links.filter(link => link.nodeRight.id === su.id);
    const supplyUnitsOfSupplierGroups = linksFromSuppliers.map(link => link.nodeLeft.id);
    const totalSupplierVolume = sum(linksFromSuppliers.map(link => link.value));
    const nodesLeftFromSuppliers = nodesLeft.filter(n => supplyUnitsOfSupplierGroups.includes(n.id));
    const totalSupplyUnits = sum(nodesLeftFromSuppliers.map(group => group.supplyUnits.length));
    const supplier = su.id === OTHERS_ID
      ? `${su.suppliersIds.length} suppliers`
      : su.id;
    return <p>
      <span className="highlight">{supplier}</span> accounts for <span className="highlight">{(su.volume * 100).toFixed(2)}%</span> of the blend.
      These <span className="highlight">{Math.round(totalSupplierVolume*totalVolume)}</span> tons of coffee are sourced from
      <span className="highlight"> {totalSupplyUnits}</span> supply units with an average score of <span className="highlight">{Math.round(su.value*100)}</span>.
    </p>;
  })

  renderLeftTexts(nodeCoords) {
    return (nodeCoords.map((s, i) =>
      <text
        key={s.id + i}
        x={-100}
        y={s.y + s.height / 2}
        className={styles.label}
        textAnchor="end"
      >
        {this.getSupplyScoreText(s.id)}
      </text>
    ));
  }

  renderRightTexts(nodeCoords) {
    return (nodeCoords.map((s, i) =>
      <text
        key={s.id + i}
        x={60 + NODE_MARGIN * 2}
        y={s.y + s.height / 2}
        className={styles.label}
        textAnchor="start"
      >
        {this.getSupplyText(s.id)}
      </text>
    ));
  }

  renderNodes(nodeCoords, exitX, columnId) {
    const { onNodeHighlight } = this.props;
    return (<Transition
      native
      items={nodeCoords}
      keys={nodeCoords.map(d => d.id)}
      from={{ x: exitX, fillOpacity: 0 }}
      leave={{ x: exitX, fillOpacity: 0 }}
      enter={d => ({ y: d.y, height: d.height, fill: d.fill, x: 0, fillOpacity: d.opacity })}
      update={d => ({ y: d.y, height: d.height, fill: d.fill, x: 0, fillOpacity: d.opacity })}>
        {nodeCoords.map(d => s => {
          return <animated.rect
            data-for={columnId}
            data-tip={d.id}
            style={s} x={s.x}
            width={NODE_WIDTH} y={s.y}
            height={s.height}
            onMouseEnter={() => onNodeHighlight(d, columnId)}
            onMouseLeave={() => onNodeHighlight(undefined, columnId)}
            />;
        })}
    </Transition>);
  }

  renderLinks(links) {
    const { onLinkHighlight } = this.props;
    return (<Transition
      native
      items={links}
      keys={links.map((d, i) => d.id + i)}
      from={{ strokeOpacity: 0, strokeWidth: 0 }}
      leave={{ strokeOpacity: 0 }}
      enter={d => ({ d: DRAW_LINK(d, LINKS_WIDTH), strokeWidth: Math.max(1, d.height), strokeOpacity: d.opacity })}
      update={d => ({ d: DRAW_LINK(d, LINKS_WIDTH), strokeWidth: Math.max(1, d.height), strokeOpacity: d.opacity })}>
        {links.map(link => s =>
          <animated.path
            // Note: Spring crashes when trying to interpolate SVG gradients strings
            // The workaround is to bypass Spring interpolated values and inject the final value directly
            stroke={link.stroke}
            style={s}
            d={s.d}
            data-tip={link.id}
            data-for="sankeyLinks"
            onMouseEnter={() => onLinkHighlight(link)}
            onMouseLeave={() => onLinkHighlight(undefined)}
          />
        )}
    </Transition>);
  }

  render() {
    const { data } = this.props;
    const coords = this.getCoords(data);
    //  text  textMargin  node nodeMargin  links   nodeMargin   node  textMargin   text
    return <React.Fragment>
      <svg height={coords.totalHeight} width={BASE_WIDTH}>
        {this.renderGradientDefs()}
        <g style={{ transform: `translate(${LEFT_X}px, 0px)` }}>
          {this.renderNodes(coords.nodesLeft, -100, 'supplyUnits')}
          {this.renderLeftTexts(coords.nodesLeft)}
        </g>

        <g className={styles.links} style={{ transform: `translate(${LINKS_X}px, 0px)` }}>
          {this.renderLinks(coords.links)}
        </g>

        <g style={{ transform: `translate(${RIGHT_X}px, 0px)` }}>
          {this.renderNodes(coords.nodesRight, NODE_WIDTH, 'suppliers')}
          {this.renderRightTexts(coords.nodesRight)}
        </g>
      </svg>
      <ReactTooltip
        type={'light'}
        id='supplyUnits'
        getContent={this.getSupplyUnitTooltip}
      />
      <ReactTooltip
        type={'light'}
        id='suppliers'
        getContent={this.getSupplierTooltip}
      />
      <ReactTooltip
        type={'light'}
        id='sankeyLinks'
        getContent={this.getLinkTooltip}
      />
      </React.Fragment>;
  }
}

const nodesShape = PropTypes.shape({
  id: PropTypes.string,
  volume: PropTypes.number,
  bucket: PropTypes.shape({
    label: PropTypes.string,
    color: PropTypes.string,
  }),
});

Sankey.propTypes = {
  data: PropTypes.shape({
    nodesLeft: PropTypes.arrayOf(nodesShape),
    nodesRight: PropTypes.arrayOf(nodesShape),
    links: PropTypes.arrayOf(PropTypes.shape({
      nodeLeft: PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
      }),
      nodeRight: PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string,
      }),
      value: PropTypes.number,
    }))
  }).isRequired,
  totalVolume: PropTypes.number.isRequired,
  onLinkHighlight: PropTypes.func.isRequired,
  onNodeHighlight: PropTypes.func.isRequired
};

export default Sankey;
