import React from 'react';
import { render } from 'react-dom';
import { applyMiddleware, combineReducers, compose, createStore } from 'redux';
import { connectRoutes } from 'redux-first-router';
import querySerializer from 'qs';
import { Provider } from 'react-redux';
import registerServiceWorker from './registerServiceWorker';
import './index.css';

import AppReducer from './app/AppReducer';
import AppContainer from './app/AppContainer';

const routesMap = {
  HOME: '/',
};
const routesOptions = {
  basename: process.env.NODE_ENV === 'development' ? '/' : 'supply-chain/central-america-2017/',
  querySerializer
};

const { reducer, middleware, enhancer } = connectRoutes(routesMap, routesOptions);

// This middleware allows rewriting selectively URL params
// without having to know all of them
const includeExistingQueryMiddleware = ({ getState }) => next => (action) => {
  const routesActions = Object.keys(routesMap);
  const newAction = { ...action };

  // check if action type matches a route type
  const isRouterAction = routesActions.includes(action.type);

  // replaceQuery allows full rewriting of URL params
  if (isRouterAction && action.replaceQuery !== 'true') {
    const currentQuery = getState().location.query;
    newAction.query = {
      ...currentQuery,
      ...action.query
    };
  }
  next(newAction);
};

const rootReducer = combineReducers({ app: AppReducer, location: reducer });
const middlewares = applyMiddleware(includeExistingQueryMiddleware, middleware);
const composeEnhancers =
  typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
      stateSanitizer: (state) => ({ ...state, geoms: 'NOT_SERIALIZED' })
    })
    : compose;
const enhancers = composeEnhancers(enhancer, middlewares);

const store = createStore(rootReducer, {}, enhancers);

render(
  <Provider store={store} >
    <AppContainer />
  </Provider>,
  document.getElementById('root')
);

registerServiceWorker();


