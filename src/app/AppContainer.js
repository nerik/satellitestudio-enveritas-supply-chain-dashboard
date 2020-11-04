import { connect } from 'react-redux';
import App from './App';
import { getParcelsByCountryAndBlend } from './selectors';
import { getDynamicTexts } from './AppSelectors';
import { back } from 'redux-first-router';
import { createSelector } from 'reselect';

const isCorrectPassword = (state) => state.app.correctPassword;
const checkErrors = createSelector(
  [isCorrectPassword, getParcelsByCountryAndBlend],
  (correctPassword, parcels) => {
    return !correctPassword || !parcels.length;
  });

const mapStateToProps = state => {
  const hasError = checkErrors(state);
  let error;
  if (hasError) {
    const type = isCorrectPassword(state) ? 'nodata' : 'password';
    error = {
      type,
      msg: type === 'nodata'
        ? 'No data to display for current selection 🤷‍♂️'
        : 'Invalid password. Refresh to try again.'
    };
  }
  return {
    error,
    texts: !hasError && getDynamicTexts(state)
  };
};

const mapDispatchToProps = () => ({
  goBack: () => back(),
  refresh: () => window.location.reload()
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
