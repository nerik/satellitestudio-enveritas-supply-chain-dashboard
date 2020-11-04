import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import styles from './DynamicText.module.css';
import { DYNAMIC_TEXT } from '../constants';
import FragmentMenu from './FragmentMenuContainer';

// An object defining the text fragment, composed of a type (STATIC, DYNAMIC or MENU) and
// - for menus: an id (reference to an app wide filter) or an array of id, label tuples
// - for non interactive texts: a value
const FragmentType = PropTypes.shape({
  type: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]),
  id: PropTypes.string
}).isRequired;

class Fragment extends Component {
  render() {
    const { textFragment } = this.props;
    if (textFragment.type === DYNAMIC_TEXT.BREAK) return <br />;

    return textFragment.type === DYNAMIC_TEXT.MENU
      ? <FragmentMenu menu={textFragment} />
      : <span className={cx(styles.fragment, {
        [styles.static]: textFragment.type === DYNAMIC_TEXT.STATIC,
        [styles.dynamic]: textFragment.type === DYNAMIC_TEXT.DYNAMIC,
      })}>{textFragment.value}</span>;
  }
}
Fragment.propTypes = {
  textFragment: FragmentType // eslint-disable-line react/require-default-props
};

class DynamicText extends Component {
  render() {
    const { textFragments } = this.props;

    return (
      <div className={styles.DynamicText}>
        {textFragments && textFragments.map((textFragment, i) => <Fragment key={i} textFragment={textFragment} />)}
      </div>
    );
  }
}

DynamicText.propTypes = {
  // An array of text fragments (see Fragment component)
  textFragments: PropTypes.arrayOf(FragmentType).isRequired
};

export default DynamicText;
